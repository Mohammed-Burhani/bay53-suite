"use client";

import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  ArrowLeft,
  Save,
  Loader2,
  Plus,
  Trash2,
  ChevronDown,
  ChevronRight,
  GripVertical,
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { useInvoiceCreate, useInvoiceById, useTncSearch, useExtraChargeSearch } from "@/lib/hooks/useInvoices";
import { useStockPlaces, useItemSearch, useLedgersByGroup } from "@/lib/hooks/useReports";
import { LedgerSearchInput } from "@/components/reports/LedgerSearchInput";
import type { Item } from "@/lib/types/reports.types";
import type { InvoiceDetail, InvoiceCreateExtraCharge, InvoiceCreatePayload } from "@/lib/types/invoice.types";
import type { Tnc, ExtraCharge } from "@/lib/types/master.types";
import { getValidationIssues } from "@/lib/invoice-validation";
import { auth } from "@/lib/auth";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

// ═══════════════════════════════════════════════════════════════════
//  TYPES matching the curl POST /Invoice/Create payload
// ═══════════════════════════════════════════════════════════════════

interface LineItem {
  tempId: string;
  // Core
  item_ID: number;
  itemName: string;
  sno: number;
  // Quantities & rates
  std_Qty: number;
  conv_Qty: number;
  conv_Unit: number;
  std_Rate: number;
  conv_Rate: number;
  cost_Rate: number;
  // Discounts
  discount1: number;
  discount2: number;
  discount3: number;
  rateDiscount: number;
  amount: number; // taxable after discounts
  // GST
  vatPer: number;
  cgstPercent: number;
  cgstAmount: number;
  sgstPercent: number;
  sgstAmount: number;
  igstPercent: number;
  igstAmount: number;
  // Descriptions
  mfrItemName: string;
  itemDescription: string;
  // Weights & logistics
  vehicleWeigth: number;
  emptyBoxWeigth: number;
  totalWeigth: number;
  emptyBoxes: number;
  rackId: number;
  // Stock
  inventoryMoved: number;
  currentStck: number;
  conversion: number;
  // Sub-details
  invoiceItemSubDetail: ItemSubDetail[];
}

interface ItemSubDetail {
  id: number;
  sessionId: string;
  subDetId: number;
  invDetId: number;
  new0_Against1: boolean;
  qty: number;
  effect: number;
  invCode: number;
  refName: string;
  invType: number;
  subDetIdRef: number;
  conversion: number;
}

interface ExtraChargeRow {
  tempId: string;
  extra_Charge_ID: number;
  taxType: number;
  perVal: number;
  charges: number;
  cstPer: number;
  vatPer: number;
  amount: number;
  effectOnTotal: number;
  vatAssessValue: number;
  taxEffect: boolean;
}

interface TncRow {
  tempId: string;
  tncID: number;
}

interface FooterNoteRow {
  tempId: string;
  title: string;
  note: string;
}

// ═══════════════════════════════════════════════════════════════════
//  HELPERS
// ═══════════════════════════════════════════════════════════════════

const nowISO = () => new Date().toISOString();
const todayStr = () => format(new Date(), "yyyy-MM-dd");

// Edit-prefill helpers: coerce unknown API values into form-shaped strings.
function editStr(v: unknown): string {
  if (v === null || v === undefined) return "";
  return String(v);
}
// API dates arrive ISO-ish ("2026-06-01T11:00:03.1"); the date inputs want "yyyy-MM-dd".
function editDate(v: unknown): string {
  if (v === null || v === undefined || v === "") return "";
  try {
    const d = new Date(String(v));
    return Number.isNaN(d.getTime()) ? "" : format(d, "yyyy-MM-dd");
  } catch {
    return "";
  }
}

function emptyLineItem(tempId: string): LineItem {
  return {
    tempId, item_ID: 0, itemName: "", sno: 0,
    std_Qty: 1, conv_Qty: 1, conv_Unit: 0, std_Rate: 0, conv_Rate: 0, cost_Rate: 0,
    discount1: 0, discount2: 0, discount3: 0, rateDiscount: 0, amount: 0,
    vatPer: 0, cgstPercent: 0, cgstAmount: 0, sgstPercent: 0, sgstAmount: 0,
    igstPercent: 0, igstAmount: 0,
    mfrItemName: "", itemDescription: "",
    vehicleWeigth: 0, emptyBoxWeigth: 0, totalWeigth: 0, emptyBoxes: 0, rackId: 0,
    inventoryMoved: 0, currentStck: 0, conversion: 1,
    invoiceItemSubDetail: [],
  };
}

function calcNetAmount(qty: number, rate: number, d1: number, d2: number, d3: number): number {
  const gross = qty * rate;
  const afterD1 = gross - (gross * d1) / 100;
  const afterD2 = afterD1 - (afterD1 * d2) / 100;
  const afterD3 = afterD2 - (afterD2 * d3) / 100;
  return Math.round(afterD3 * 100) / 100;
}

// Recompute a line item's taxable amount + GST split (intra-state: CGST+SGST half each)
function applyAmounts(li: LineItem): LineItem {
  const net = calcNetAmount(li.std_Qty, li.std_Rate, li.discount1, li.discount2, li.discount3);
  li.amount = net;
  const gstTotal = Math.round((net * li.vatPer) / 100 * 100) / 100;
  li.cgstPercent = li.vatPer / 2;
  li.sgstPercent = li.vatPer / 2;
  li.igstPercent = 0;
  li.cgstAmount = Math.round(gstTotal / 2 * 100) / 100;
  li.sgstAmount = Math.round(gstTotal / 2 * 100) / 100;
  li.igstAmount = 0;
  // When there's no conversion unit, the backend stores & validates the conversion
  // qty/rate/factor as equal to the standard ones (confirmed from /Invoice/GetById).
  if (li.conv_Unit === 0) {
    li.conv_Qty = li.std_Qty;
    li.conv_Rate = li.std_Rate;
    li.conversion = 1;
  }
  return li;
}

// One stock-movement entry per line, as stored by the backend for valid invoices:
// { qty: <line qty>, effect: -1 (out), new0_Against1: false (fresh movement), conversion: 1 }.
function buildStockSubDetail(li: LineItem, invType: number): ItemSubDetail[] {
  const existing = (li.invoiceItemSubDetail ?? []).filter((sd) => sd.qty > 0);
  if (existing.length > 0) {
    return existing; // edit mode — send back the restored entries
  }
  return [{
    id: 0, sessionId: "",
    subDetId: 0, invDetId: 0,
    new0_Against1: false,
    qty: li.std_Qty,
    effect: -1, // sales/challan: stock out
    invCode: 0, refName: "",
    invType,
    subDetIdRef: 0,
    conversion: li.conversion || 1,
  }];
}

// ═══════════════════════════════════════════════════════════════════
//  ITEM SEARCH COMBOBOX (reused)
// ═══════════════════════════════════════════════════════════════════

function ItemSearchCell({
  value, onSelect,
}: {
  value: number; onSelect: (item: Item) => void;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  // Debounced server-side search — fires /Item/Search with `name` = typed characters
  const { data: results = [], isFetching } = useItemSearch(search);
  const hasSearch = search.trim().length > 0;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" role="combobox" aria-expanded={open}
          className="w-[220px] justify-between font-normal text-left h-9">
          {selectedItem ? <span className="truncate">{selectedItem.name}</span>
            : <span className="text-muted-foreground">Search item...</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[420px] p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput placeholder="Search by name, HSN, code..." value={search} onValueChange={setSearch} />
          <CommandList>
            {!hasSearch ? (
              <CommandEmpty>Type to search...</CommandEmpty>
            ) : results.length === 0 ? (
              <CommandEmpty>
                {isFetching ? (
                  <Loader2 className="mx-auto h-4 w-4 animate-spin" />
                ) : (
                  "No items found."
                )}
              </CommandEmpty>
            ) : (
              <CommandGroup className="max-h-[250px] overflow-auto">
                {results.map((item) => (
                  <CommandItem key={item.item_ID} value={`${item.name} ${item.item_ID}`}
                    onSelect={() => { setSelectedItem(item); onSelect(item); setOpen(false); setSearch(""); }}>
                    <Check className={cn("mr-2 h-4 w-4 shrink-0", value === item.item_ID ? "opacity-100" : "opacity-0")} />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">{item.name}</div>
                      <div className="flex gap-2 text-[10px] text-muted-foreground">
                        {item.hsnNo && <span>HSN: {item.hsnNo}</span>}
                        {item.std_Unit && <span>Unit: {item.std_Unit}</span>}
                        {item.std_Sell_Rate > 0 && <span>Rate: ₹{item.std_Sell_Rate}</span>}
                      </div>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

// ═══════════════════════════════════════════════════════════════════
//  TNC SEARCH COMBOBOX (for Terms & Conditions dropdown)
// ═══════════════════════════════════════════════════════════════════

function TncSearchCell({
  value, onSelect,
}: {
  value: number; onSelect: (tnc: Tnc) => void;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedTnc, setSelectedTnc] = useState<Tnc | null>(null);
  const { data: results = [], isFetching } = useTncSearch(search);
  const hasSearch = search.trim().length > 0;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" role="combobox" aria-expanded={open}
          className="w-full justify-between font-normal text-left h-9">
          {selectedTnc ? <span className="truncate">{selectedTnc.name}</span>
            : <span className="text-muted-foreground">Search TNC...</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[420px] p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput placeholder="Search TNC..." value={search} onValueChange={setSearch} />
          <CommandList>
            {!hasSearch ? (
              <CommandEmpty>Type to search TNC...</CommandEmpty>
            ) : results.length === 0 ? (
              <CommandEmpty>
                {isFetching ? (
                  <Loader2 className="mx-auto h-4 w-4 animate-spin" />
                ) : (
                  "No TNC found."
                )}
              </CommandEmpty>
            ) : (
              <CommandGroup className="max-h-[250px] overflow-auto">
                {results.map((tnc) => (
                  <CommandItem key={tnc.tncID} value={`${tnc.name} ${tnc.tncID}`}
                    onSelect={() => { setSelectedTnc(tnc); onSelect(tnc); setOpen(false); setSearch(""); }}>
                    <Check className={cn("mr-2 h-4 w-4 shrink-0", value === tnc.tncID ? "opacity-100" : "opacity-0")} />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">{tnc.name}</div>
                      {tnc.description && <div className="text-[10px] text-muted-foreground truncate">{tnc.description}</div>}
                      <div className="text-[10px] text-muted-foreground">ID: {tnc.tncID}</div>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

// ═══════════════════════════════════════════════════════════════════
//  EXTRA CHARGE SEARCH COMBOBOX (for Extra Charges dropdown)
// ═══════════════════════════════════════════════════════════════════

function ExtraChargeSearchCell({
  value, onSelect,
}: {
  value: number; onSelect: (ec: ExtraCharge) => void;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedEC, setSelectedEC] = useState<ExtraCharge | null>(null);
  const { data: results = [], isFetching } = useExtraChargeSearch(search);
  const hasSearch = search.trim().length > 0;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" role="combobox" aria-expanded={open}
          className="w-full justify-between font-normal text-left h-9">
          {selectedEC ? <span className="truncate">{selectedEC.name}</span>
            : <span className="text-muted-foreground">Search Extra Charge...</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[420px] p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput placeholder="Search Extra Charge..." value={search} onValueChange={setSearch} />
          <CommandList>
            {!hasSearch ? (
              <CommandEmpty>Type to search Extra Charge...</CommandEmpty>
            ) : results.length === 0 ? (
              <CommandEmpty>
                {isFetching ? (
                  <Loader2 className="mx-auto h-4 w-4 animate-spin" />
                ) : (
                  "No Extra Charges found."
                )}
              </CommandEmpty>
            ) : (
              <CommandGroup className="max-h-[250px] overflow-auto">
                {results.map((ec) => (
                  <CommandItem key={ec.extraCharges_ID} value={`${ec.name} ${ec.extraCharges_ID}`}
                    onSelect={() => { setSelectedEC(ec); onSelect(ec); setOpen(false); setSearch(""); }}>
                    <Check className={cn("mr-2 h-4 w-4 shrink-0", value === ec.extraCharges_ID ? "opacity-100" : "opacity-0")} />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">{ec.name}</div>
                      <div className="flex gap-2 text-[10px] text-muted-foreground">
                        {ec.taxPercent !== undefined && <span>Tax: {ec.taxPercent}%</span>}
                        {ec.vatPercent !== undefined && <span>VAT: {ec.vatPercent}%</span>}
                        <span>ID: {ec.extraCharges_ID}</span>
                      </div>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

// ═══════════════════════════════════════════════════════════════════
//  PROPS
// ═══════════════════════════════════════════════════════════════════

interface InvoiceCreateFormProps {
  invType: number;
  title: string;
  backUrl: string;
  /** When set, the form loads this invoice via GetById, prefills every field, and updates (not creates) on save. */
  editInvCode?: number;
}

// ═══════════════════════════════════════════════════════════════════
//  MAIN FORM
// ═══════════════════════════════════════════════════════════════════

export function InvoiceCreateForm({ invType, title, backUrl, editInvCode }: InvoiceCreateFormProps) {
  const router = useRouter();
  const createMutation = useInvoiceCreate();

  // Master data
  const { data: stockPlaces = [], isLoading: loadingSp } = useStockPlaces();
  const { data: allLedgers = [], isLoading: loadingLedgers } = useLedgersByGroup();

  // Edit mode: fetch the invoice once and prefill all fields (see effect below).
  const {
    data: editDetail,
    isLoading: loadingEdit,
    isError: editError,
  } = useInvoiceById(editInvCode, invType, !!editInvCode);

  // ── Section 1: Basic Info ─────────────────────────────────────
  const [date, setDate] = useState(todayStr());
  const [billNo, setBillNo] = useState("");
  const [invoiceNo, setInvoiceNo] = useState<number>(0);
  // Stock place id. null = nothing picked yet. The API returns sp_ID = 0 for real
  // stock places, so 0 is a VALID selection — only null blocks submit.
  const [spCode, setSpCode] = useState<number | null>(null);
  const [gstType, setGstType] = useState<number>(0);
  const [useInCompany, setUseInCompany] = useState(true);
  const [projectSiteId, setProjectSiteId] = useState<number>(0);

  // ── Section 2: Party ─────────────────────────────────────────
  const [selectedLedgerIds, setSelectedLedgerIds] = useState<number[]>([]);
  const [selectedLedgers, setSelectedLedgers] = useState<
    Array<{ ledger_id: number; name: string; group: string | null }>
  >([]);
  const [partyName, setPartyName] = useState("");
  const [partyAddress, setPartyAddress] = useState("");
  const [shipToName, setShipToName] = useState("");
  const [shipToAddress, setShipToAddress] = useState("");
  const [attenTo, setAttenTo] = useState("");
  const [stateCode, setStateCode] = useState<number>(0);

  // Auto-fill party name/address from ledger
  useEffect(() => {
    if (selectedLedgers.length > 0) {
      const l = selectedLedgers[0];
      setPartyName(l.name);
      const full = allLedgers.find((x) => x.ledger_id === l.ledger_id);
      setPartyAddress(full?.address || "");
    } else { setPartyName(""); setPartyAddress(""); }
  }, [selectedLedgers, allLedgers]);

  // ── Edit prefill: map /Invoice/GetById detail back into the form state ──
  // Runs once, after BOTH the detail and the ledger master data have loaded.
  const prefilledRef = useRef(false);
  useEffect(() => {
    if (!editInvCode || !editDetail || !editDetail.id || prefilledRef.current) return;
    if (loadingLedgers) return; // wait so the party ledger name resolves

    const d = editDetail;
    const ledger = allLedgers.find((l) => l.ledger_id === d.ledger_ID);

    // Section 1: Basic Info
    setDate(editDate(d.date) || todayStr());
    setBillNo(editStr(d.bill_No));
    setInvoiceNo(d.invoiceNo || 0);
    setSpCode(d.spCode ?? null);
    setGstType(Number((d as any).gstType ?? d.taxableType ?? 0));
    setUseInCompany(d.useInCompany !== false);
    setProjectSiteId(Number((d as any).projectSiteId ?? 0));

    // Section 2: Party (party name/address auto-fill from the ledger below)
    setSelectedLedgerIds(d.ledger_ID ? [d.ledger_ID] : []);
    setSelectedLedgers(
      ledger
        ? [{ ledger_id: ledger.ledger_id, name: ledger.name, group: ledger.group ?? null }]
        : d.ledger_ID
          ? [{ ledger_id: d.ledger_ID, name: editStr(d.partyName), group: null }]
          : []
    );
    setShipToName(editStr(d.shipToName));
    setShipToAddress(editStr(d.shipToAddress));
    setAttenTo(editStr(d.attenTo));
    setStateCode(Number((d as any).state ?? 0));

    // Section 3: References
    setRefNo(editStr(d.refNo));
    setRefDate(editDate(d.refDate));
    setOrderNo(editStr(d.orderNo));
    setOrderDate(editDate(d.orderDate));
    setYourRefNo(editStr(d.yourRefNo));
    setYourRefDate(editDate(d.yourRefDate));
    setPoNumber(editStr(d.poNumber));
    setOtherRefNo(editStr(d.otherRefNo));
    setOtherRefDate(editDate(d.otherRefDate));
    setSubject(editStr(d.subject));
    setNote(editStr(d.note));

    // Section 4: Items — keep the exact amounts/GST split from the API
    const items = Array.isArray(d.invoiceItemDetail) ? d.invoiceItemDetail : [];
    setLineItems(items.map((li, i) => ({
      tempId: `edit_${i}`,
      item_ID: li.item_ID,
      itemName: editStr(li.mfrItemName ?? li.itemDescription),
      sno: li.sno || i + 1,
      std_Qty: li.std_Qty, conv_Qty: li.conv_Qty, conv_Unit: li.conv_Unit,
      std_Rate: li.std_Rate, conv_Rate: li.conv_Rate, cost_Rate: li.cost_Rate,
      discount1: li.discount1, discount2: li.discount2, discount3: li.discount3,
      rateDiscount: li.rateDiscount,
      amount: li.amount,
      vatPer: li.vatPer,
      cgstPercent: li.cgstPercent, cgstAmount: li.cgstAmount,
      sgstPercent: li.sgstPercent, sgstAmount: li.sgstAmount,
      igstPercent: li.igstPercent, igstAmount: li.igstAmount,
      mfrItemName: editStr(li.mfrItemName), itemDescription: editStr(li.itemDescription),
      vehicleWeigth: li.vehicleWeigth, emptyBoxWeigth: li.emptyBoxWeigth,
      totalWeigth: li.totalWeigth, emptyBoxes: li.emptyBoxes, rackId: li.rackId ?? 0,
      inventoryMoved: li.inventoryMoved, currentStck: li.currentStck, conversion: li.conversion,
      invoiceItemSubDetail: (li.invoiceItemSubDetail ?? []).map((sd) => ({
        id: sd.id ?? 0, sessionId: sd.sessionId ?? "",
        subDetId: sd.subDetId, invDetId: sd.invDetId, new0_Against1: sd.new0_Against1,
        qty: sd.qty, effect: sd.effect, invCode: sd.invCode,
        refName: editStr(sd.refName), invType: sd.invType, subDetIdRef: sd.subDetIdRef ?? 0,
        conversion: sd.conversion,
      })),
    })));

    // Section 5: Extra charges — restore only additive charges (effectOnTotal 1).
    // GST ledger postings (ids 6/7/8) are recomputed fresh from the line items on save.
    const charges = Array.isArray(d.invoiceExtraCharges) ? d.invoiceExtraCharges : [];
    setExtraCharges(charges.filter((c) => c.effectOnTotal === 1 && ![6, 7, 8].includes(c.extra_Charge_ID)).map((c, i) => ({
      tempId: `edit_ec_${i}`,
      extra_Charge_ID: c.extra_Charge_ID, taxType: c.taxType, perVal: c.perVal,
      charges: c.charges, cstPer: c.cstPer, vatPer: c.vatPer, amount: c.amount,
      effectOnTotal: c.effectOnTotal, vatAssessValue: c.vatAssessValue, taxEffect: c.taxEffect,
    })));

    // Section 6: TNC
    const tncArr = Array.isArray(d.invoiceTncMap) ? (d.invoiceTncMap as any[]) : [];
    setTncList(tncArr.map((t, i) => ({ tempId: `edit_tnc_${i}`, tncID: Number(t?.tncID ?? t?.id ?? 0) })));

    // Section 7: Footer notes
    const fnArr = Array.isArray(d.footerXML) ? (d.footerXML as any[]) : [];
    setFooterNotes(fnArr.map((f, i) => ({ tempId: `edit_fn_${i}`, title: editStr(f?.title), note: editStr(f?.note) })));

    // Section 8: Financial
    setRecBy(editStr(d.recBy));
    setDueDays(d.dueDays ?? 0);
    setRoundOff(d.roundOff ?? 0);
    setProfit(d.profit ?? 0);
    setProfitPer(Number((d as any).profitPer ?? 0));
    setRecAmt(Number((d as any).recAmt ?? 0));
    setBillStatus(Number((d as any).billStatus ?? 0));
    setPrecision(Number((d as any).precision ?? 0));

    prefilledRef.current = true;
  }, [editInvCode, editDetail, allLedgers, loadingLedgers]);

  // ── Section 3: References ─────────────────────────────────────
  const [refNo, setRefNo] = useState("");
  const [refDate, setRefDate] = useState("");
  const [orderNo, setOrderNo] = useState("");
  const [orderDate, setOrderDate] = useState("");
  const [yourRefNo, setYourRefNo] = useState("");
  const [yourRefDate, setYourRefDate] = useState("");
  const [poNumber, setPoNumber] = useState("");
  const [otherRefNo, setOtherRefNo] = useState("");
  const [otherRefDate, setOtherRefDate] = useState("");
  const [subject, setSubject] = useState("");
  const [note, setNote] = useState("");

  // ── Section 4: Items ─────────────────────────────────────────
  const [lineItems, setLineItems] = useState<LineItem[]>([]);
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  const toggleItemExpand = (id: string) => {
    setExpandedItems((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const addLineItem = useCallback(() => {
    setLineItems((prev) => [...prev, emptyLineItem(`item_${Date.now()}_${prev.length}`)]);
  }, []);

  const removeLineItem = useCallback((tempId: string) => {
    setLineItems((prev) => prev.filter((li) => li.tempId !== tempId));
  }, []);

  const updateLineItem = useCallback((tempId: string, patch: Partial<LineItem>) => {
    setLineItems((prev) =>
      prev.map((li) => li.tempId !== tempId ? li : applyAmounts({ ...li, ...patch }))
    );
  }, []);

  // When an item is picked from the search dropdown, auto-fill its defaults
  const handleItemSelect = useCallback((tempId: string, item: Item) => {
    setLineItems((prev) =>
      prev.map((li) =>
        li.tempId !== tempId ? li : applyAmounts({
          ...li,
          item_ID: item.item_ID,
          itemName: item.name,
          std_Rate: item.std_Sell_Rate || 0,
          vatPer: item.vatPer || 0,
          discount1: 0, discount2: 0, discount3: 0,
        })
      )
    );
  }, []);

  // ── Section 5: Extra Charges ─────────────────────────────────
  const [extraCharges, setExtraCharges] = useState<ExtraChargeRow[]>([]);
  const addExtraCharge = () =>
    setExtraCharges((p) => [...p, { tempId: `ec_${Date.now()}_${p.length}`, extra_Charge_ID: 0, taxType: 0, perVal: 0, charges: 0, cstPer: 0, vatPer: 0, amount: 0, effectOnTotal: 0, vatAssessValue: 0, taxEffect: true }]);
  const removeExtraCharge = (id: string) =>
    setExtraCharges((p) => p.filter((r) => r.tempId !== id));
  const updateExtraCharge = (id: string, patch: Partial<ExtraChargeRow>) =>
    setExtraCharges((p) => p.map((r) => r.tempId === id ? { ...r, ...patch } : r));

  // Auto-calculate amount for charges based on type/percent when totals change
  useEffect(() => {
    const itemSubTotal = lineItems.reduce((s, li) => s + li.amount, 0);
    if (itemSubTotal === 0) return;
    
    setExtraCharges((prev) =>
      prev.map((ec) => {
        let calculatedAmount = 0;
        
        // Percent-based charge: apply perVal% to item subtotal
        if (ec.perVal > 0) {
          calculatedAmount = (itemSubTotal * ec.perVal) / 100;
        }
        // Fixed amount from dropdown selection
        else if (ec.charges > 0) {
          calculatedAmount = ec.charges;
        }
        // CST/VAT based - apply rate to taxable + GST
        else if (ec.cstPer > 0) {
          const gstTotal = lineItems.reduce((s, li) => s + li.cgstAmount + li.sgstAmount + li.igstAmount, 0);
          calculatedAmount = ((itemSubTotal + gstTotal) * ec.cstPer) / 100;
        } else if (ec.vatPer > 0) {
          const gstTotal = lineItems.reduce((s, li) => s + li.cgstAmount + li.sgstAmount + li.igstAmount, 0);
          calculatedAmount = ((itemSubTotal + gstTotal) * ec.vatPer) / 100;
        }
        
        const roundedAmount = Math.round(calculatedAmount * 100) / 100;
        return { ...ec, amount: roundedAmount, charges: roundedAmount };
      })
    );
  }, [lineItems]);

  // ── Section 6: TNC ───────────────────────────────────────────
  const [tncList, setTncList] = useState<TncRow[]>([]);
  const addTnc = () => setTncList((p) => [...p, { tempId: `tnc_${Date.now()}_${p.length}`, tncID: 0 }]);
  const removeTnc = (id: string) => setTncList((p) => p.filter((r) => r.tempId !== id));
  const updateTnc = (id: string, patch: Partial<TncRow>) =>
    setTncList((p) => p.map((r) => r.tempId === id ? { ...r, ...patch } : r));

  // ── Section 7: Footer Notes ──────────────────────────────────
  const [footerNotes, setFooterNotes] = useState<FooterNoteRow[]>([]);
  const addFooterNote = () => setFooterNotes((p) => [...p, { tempId: `fn_${Date.now()}_${p.length}`, title: "", note: "" }]);
  const removeFooterNote = (id: string) => setFooterNotes((p) => p.filter((r) => r.tempId !== id));
  const updateFooterNote = (id: string, patch: Partial<FooterNoteRow>) =>
    setFooterNotes((p) => p.map((r) => r.tempId === id ? { ...r, ...patch } : r));

  // ── Section 8: Financial Settings ────────────────────────────
  const [recBy, setRecBy] = useState("");
  const [recAmt, setRecAmt] = useState(0);
  const [dueDays, setDueDays] = useState(0);
  const [billStatus, setBillStatus] = useState(0);
  const [roundOff, setRoundOff] = useState(0);
  const [profit, setProfit] = useState(0);
  const [profitPer, setProfitPer] = useState(0);
  const [isMaxVAT, setIsMaxVAT] = useState(true);
  const [isRoundOff, setIsRoundOff] = useState(true);
  const [precision, setPrecision] = useState(0);

  // Collapsible state for advanced sections
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showExtraCharges, setShowExtraCharges] = useState(false);
  const [showTnc, setShowTnc] = useState(false);
  const [showFooter, setShowFooter] = useState(false);

  // ── Totals ───────────────────────────────────────────────────
  const totals = useMemo(() => {
    const itemSubTotal = lineItems.reduce((s, li) => s + li.amount, 0);
    let cgst = 0, sgst = 0, igst = 0;
    lineItems.forEach((li) => { cgst += li.cgstAmount; sgst += li.sgstAmount; igst += li.igstAmount; });
    // extra_SubTotal = only user-selected extra charges (freight, packing, etc)
    // GST is already included in line item amounts, not counted as extra charges
    const userAdditive = extraCharges.filter((ec) => ec.extra_Charge_ID > 0 && ec.effectOnTotal === 1).reduce((s, ec) => s + ec.amount, 0);
    const extraSubTotal = userAdditive;
    const ecTotal = extraCharges.reduce((s, ec) => s + ec.amount, 0);
    // Backend might expect grandTotal = taxable + extra + roundOff (GST separate)
    // OR grandTotal = taxable + GST + extra + roundOff
    // Try without GST first - backend may calculate GST internally from item amounts
    const grandTotal = itemSubTotal + extraSubTotal + roundOff;
    return { itemSubTotal, extraSubTotal, cgst, sgst, igst, ecTotal, grandTotal };
  }, [lineItems, extraCharges, roundOff]);

  // ── Validation ───────────────────────────────────────────────
  // GLOBAL_RULES (lib/invoice-validation.ts) apply to every invoice type by
  // default; INVOICE_TYPE_VALIDATION_OVERRIDES lets a specific invType disable
  // rules that don't apply to it (e.g. Quotation/Enquiry have no payment yet)
  // or add its own local-only rules.
  const validationIssues = useMemo(
    () =>
      getValidationIssues({
        invType,
        selectedLedgerIds,
        spCode,
        billNo,
        recBy,
        recAmt,
        lineItems,
      }),
    [invType, selectedLedgerIds, spCode, billNo, recBy, recAmt, lineItems]
  );
  const isValid = validationIssues.length === 0;

  // ── Submit ───────────────────────────────────────────────────
  const handleSubmit = useCallback(async () => {
    if (!isValid) {
      toast.error(validationIssues[0] ?? "Please fix the errors below");
      return;
    }
    const sessionId = auth.getSessionId();
    if (!sessionId) { toast.error("Session expired"); return; }

    // Build item details — only include non-zero sub-details
    const itemDetails = lineItems.map((li, idx) => ({
      id: 0, sessionId: "", invDetID: 0, invCode: 0, sno: idx + 1,
      item_ID: li.item_ID, sp_Code: spCode ?? 0,
      mfrItemName: li.mfrItemName, invType,
      std_Qty: li.std_Qty, conv_Qty: li.conv_Qty, conv_Unit: li.conv_Unit,
      std_Rate: li.std_Rate, conv_Rate: li.conv_Rate,
      vatPer: li.vatPer,
      discount1: li.discount1, discount2: li.discount2, discount3: li.discount3,
      amount: li.amount, cost_Rate: li.cost_Rate,
      itemDescription: li.itemDescription,
      inventoryMoved: li.inventoryMoved, rateDiscount: li.rateDiscount,
      cgstPercent: li.cgstPercent, cgstAmount: li.cgstAmount,
      sgstPercent: li.sgstPercent, sgstAmount: li.sgstAmount,
      igstPercent: li.igstPercent, igstAmount: li.igstAmount,
      vehicleWeigth: li.vehicleWeigth, emptyBoxWeigth: li.emptyBoxWeigth,
      totalWeigth: li.totalWeigth, emptyBoxes: li.emptyBoxes, rackId: li.rackId,
      invoiceItemSubDetail: buildStockSubDetail(li, invType).map((sd) => ({ ...sd, sessionId: "" })),
      currentStck: li.currentStck, conversion: li.conversion || 1,
    }));

    // User-entered extra charges only (freight, packing, discounts, etc)
    // GST is NOT sent as extra charges - it's already in line item amounts
    // Only send additive charges (effectOnTotal === 1) to match extra_SubTotal calculation
    const ec = extraCharges
      .filter((r) => r.extra_Charge_ID > 0 && r.effectOnTotal === 1) // only selected additive charges
      .map((r) => ({
        id: 0, sessionId: "", extra_Charge_ID: r.extra_Charge_ID,
        taxType: r.taxType, perVal: r.perVal, charges: r.charges,
        cstPer: r.cstPer, vatPer: r.vatPer, amount: r.amount,
        effectOnTotal: r.effectOnTotal, vatAssessValue: r.vatAssessValue, taxEffect: r.taxEffect,
      }));

    const tnc = tncList.map((r) => ({ id: 0, sessionId: "", tncID: r.tncID }));
    const footer = footerNotes.map((r) => ({ title: r.title, note: r.note }));

    const payload: Omit<InvoiceCreatePayload, "sessionId"> = {
      id: editInvCode ?? 0,
      ledger_ID: selectedLedgerIds[0] || 0,
      project_Ledger_ID: null,
      inv_Type: invType,
      invoiceNo,
      bill_No: billNo,
      date: new Date(date).toISOString(),
      spCode: spCode ?? 0,
      dueDays,
      item_SubTotal: totals.itemSubTotal,
      extra_SubTotal: totals.extraSubTotal,
      roundOff,
      grandTotal: totals.grandTotal,
      profit,
      recBy,
      billType: 0, // TODO: add UI field if needed
      salesLedger: 0, // TODO: add UI field if needed
      purchaseLedger: 0, // TODO: add UI field if needed
      taxableType: gstType, 
      roundedBill: isRoundOff,
      salesman: null,
      isSalesAllowed: true,
      refNo,
      refDate: refDate ? new Date(refDate).toISOString() : nowISO(),
      orderNo,
      orderDate: orderDate ? new Date(orderDate).toISOString() : nowISO(),
      projectSiteId,
      invoiceItemDetail: itemDetails,
      invoiceExtraCharges: ec,
      invoiceTncMap: tnc,
      footerXML: footer,
      shipToName,
      shipToAddress,
      attenTo,
      subject,
      isRoundOff,
      precision,
      state: stateCode,
    };

    createMutation.mutate(payload, {
      onSuccess: (data) => {
        toast.success(
          editInvCode
            ? `${title} updated! Bill: ${data.bill_No}`
            : `${title} created! Bill: ${data.bill_No}`
        );
        router.push(backUrl);
      },
      onError: (err) => { toast.error(`Failed: ${err}`); console.error(err); },
    });
  }, [
    isValid, validationIssues, invType, spCode, selectedLedgerIds, gstType, invoiceNo, billNo, date, useInCompany,
    projectSiteId, refNo, refDate, orderNo, orderDate, yourRefNo, yourRefDate, poNumber,
    otherRefNo, otherRefDate, subject, note, lineItems, extraCharges, tncList, footerNotes,
    totals, roundOff, shipToName, shipToAddress, partyName, partyAddress, attenTo,
    recBy, recAmt, dueDays, isMaxVAT, isRoundOff, precision, profit, profitPer, billStatus,
    stateCode, title, backUrl, router, createMutation, editInvCode,
  ]);

  // ══════════════════════════════════════════════════════════════
  //  RENDER
  // ══════════════════════════════════════════════════════════════

  // Edit mode: block the form until the invoice is loaded (and prefilled).
  if (editInvCode) {
    if (editError) {
      return (
        <div className="flex flex-col items-center gap-3 p-16">
          <p className="font-medium text-destructive">Failed to load the {title.toLowerCase()}.</p>
          <Button variant="outline" onClick={() => router.push(backUrl)}>Go back</Button>
        </div>
      );
    }
    if (loadingEdit || !editDetail) {
      return (
        <div className="flex flex-col items-center justify-center gap-3 p-16 text-muted-foreground">
          <Loader2 className="h-6 w-6 animate-spin" />
          <p>Loading {title.toLowerCase()} for editing…</p>
        </div>
      );
    }
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.push(backUrl)}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
          <p className="text-sm text-muted-foreground">
            {editInvCode ? `Edit ${title.toLowerCase()}` : `Create a new ${title.toLowerCase()}`}
          </p>
        </div>
        {lineItems.length > 0 && (
          <Badge variant="secondary">{lineItems.length} item{lineItems.length > 1 ? "s" : ""}</Badge>
        )}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
        {/* ═══ LEFT COLUMN ════════════════════════════════════════ */}
        <div className="space-y-6">

          {/* ─── Section 1: Basic Info ──────────────────────── */}
          <Card className="py-5">
            <CardHeader><CardTitle className="text-base">Basic Info</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-4">
                <div className="space-y-1.5">
                  <Label>Date *</Label>
                  <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="h-9" />
                </div>
                <div className="space-y-1.5">
                  <Label>Bill No. *</Label>
                  <Input placeholder="Auto" value={billNo} onChange={(e) => setBillNo(e.target.value)} className="h-9" />
                </div>
                <div className="space-y-1.5">
                  <Label>Invoice No. (0=auto)</Label>
                  <Input type="number" min={0} value={invoiceNo} onChange={(e) => setInvoiceNo(parseInt(e.target.value) || 0)} className="h-9" />
                </div>
                <div className="space-y-1.5">
                  <Label>GST Type</Label>
                  <Select value={gstType.toString()} onValueChange={(v) => setGstType(Number(v))}>
                    <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">Regular</SelectItem>
                      <SelectItem value="1">Composition</SelectItem>
                      <SelectItem value="2">Unregistered</SelectItem>
                      <SelectItem value="3">SEZ</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-1.5">
                  <Label>Stock Place *</Label>
                  <Select value={spCode === null ? "" : spCode.toString()} onValueChange={(v) => setSpCode(Number(v))} disabled={loadingSp}>
                    <SelectTrigger className="h-9"><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>
                      {stockPlaces.map((sp) => (
                        <SelectItem key={sp.sp_ID} value={sp.sp_ID.toString()}>{sp.code} - {sp.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Project Site ID</Label>
                  <Input type="number" min={0} value={projectSiteId} onChange={(e) => setProjectSiteId(parseInt(e.target.value) || 0)} className="h-9" />
                </div>
                <div className="flex items-end space-x-2 pb-1.5">
                  <Checkbox id="useInCompany" checked={useInCompany} onCheckedChange={(v) => setUseInCompany(v === true)} />
                  <Label htmlFor="useInCompany" className="cursor-pointer">Use In Company</Label>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* ─── Section 2: Party ───────────────────────────── */}
          <Card className="py-5">
            <CardHeader><CardTitle className="text-base">Party</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <LedgerSearchInput
                selectedLedgerIds={selectedLedgerIds}
                onLedgerIdsChange={setSelectedLedgerIds}
                selectedLedgers={selectedLedgers}
                onSelectedLedgersChange={setSelectedLedgers}
                label="Party (Ledger)" placeholder="Search and select party..."
                groups={null} multiSelect={false} required
              />
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-1.5">
                  <Label>Party Name</Label>
                  <Input value={partyName} onChange={(e) => setPartyName(e.target.value)} className="h-9" />
                </div>
                <div className="space-y-1.5">
                  <Label>Ship To</Label>
                  <Input placeholder="Name" value={shipToName} onChange={(e) => setShipToName(e.target.value)} className="h-9" />
                </div>
                <div className="space-y-1.5">
                  <Label>Attention To</Label>
                  <Input placeholder="Attention" value={attenTo} onChange={(e) => setAttenTo(e.target.value)} className="h-9" />
                </div>
                <div className="space-y-1.5 sm:col-span-2">
                  <Label>Party Address</Label>
                  <Input value={partyAddress} onChange={(e) => setPartyAddress(e.target.value)} className="h-9" />
                </div>
                <div className="space-y-1.5">
                  <Label>State Code</Label>
                  <Input type="number" min={0} value={stateCode} onChange={(e) => setStateCode(parseInt(e.target.value) || 0)} className="h-9" />
                </div>
                <div className="space-y-1.5 sm:col-span-2">
                  <Label>Ship To Address</Label>
                  <Input placeholder="Address" value={shipToAddress} onChange={(e) => setShipToAddress(e.target.value)} className="h-9" />
                </div>
                <div className="space-y-1.5">
                  <Label>Subject</Label>
                  <Input placeholder="Subject" value={subject} onChange={(e) => setSubject(e.target.value)} className="h-9" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* ─── Section 3: References (collapsible) ────────── */}
          <Collapsible open={showAdvanced} onOpenChange={setShowAdvanced}>
            <Card>
              <CollapsibleTrigger asChild>
                <CardHeader className="cursor-pointer hover:bg-muted/30 transition-colors py-5">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">References</CardTitle>
                    <ChevronDown className={cn("h-4 w-4 transition-transform", showAdvanced && "rotate-180")} />
                  </div>
                </CardHeader>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <CardContent className="space-y-4 border-t pt-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <Label>Ref No.</Label>
                      <Input value={refNo} onChange={(e) => setRefNo(e.target.value)} className="h-9" />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Ref Date</Label>
                      <Input type="date" value={refDate} onChange={(e) => setRefDate(e.target.value)} className="h-9" />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Order No.</Label>
                      <Input value={orderNo} onChange={(e) => setOrderNo(e.target.value)} className="h-9" />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Order Date</Label>
                      <Input type="date" value={orderDate} onChange={(e) => setOrderDate(e.target.value)} className="h-9" />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Your Ref No.</Label>
                      <Input value={yourRefNo} onChange={(e) => setYourRefNo(e.target.value)} className="h-9" />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Your Ref Date</Label>
                      <Input type="date" value={yourRefDate} onChange={(e) => setYourRefDate(e.target.value)} className="h-9" />
                    </div>
                    <div className="space-y-1.5">
                      <Label>PO Number</Label>
                      <Input value={poNumber} onChange={(e) => setPoNumber(e.target.value)} className="h-9" />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Other Ref No.</Label>
                      <Input value={otherRefNo} onChange={(e) => setOtherRefNo(e.target.value)} className="h-9" />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Other Ref Date</Label>
                      <Input type="date" value={otherRefDate} onChange={(e) => setOtherRefDate(e.target.value)} className="h-9" />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Note</Label>
                    <Textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} />
                  </div>
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>

          {/* ─── Section 4: Items ───────────────────────────── */}
          <Card className="py-5">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">Items</CardTitle>
              <Button variant="outline" size="sm" onClick={addLineItem}>
                <Plus className="h-4 w-4 mr-1" /> Add Item
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              {lineItems.length === 0 ? (
                <div className="py-12 text-center text-sm text-muted-foreground">No items added.</div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[36px]" />
                        <TableHead className="w-[220px]">Item</TableHead>
                        <TableHead className="w-[56px] text-center">Qty</TableHead>
                        <TableHead className="w-[56px] text-center">Conv</TableHead>
                        <TableHead className="w-[80px] text-right">Rate</TableHead>
                        <TableHead className="w-[56px] text-right">Disc%</TableHead>
                        <TableHead className="w-[56px] text-right">GST%</TableHead>
                        <TableHead className="w-[80px] text-right">Amount</TableHead>
                        <TableHead className="w-[36px]" />
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {lineItems.map((li) => (
                        <FragmentRow key={li.tempId}>
                          {/* Main row */}
                          <TableRow>
                            <TableCell className="py-1">
                              <Button variant="ghost" size="icon" className="h-7 w-7"
                                onClick={() => toggleItemExpand(li.tempId)}>
                                {expandedItems.has(li.tempId)
                                  ? <ChevronDown className="h-3.5 w-3.5" />
                                  : <ChevronRight className="h-3.5 w-3.5" />}
                              </Button>
                            </TableCell>
                            <TableCell className="py-1">
                              <ItemSearchCell value={li.item_ID}
                                onSelect={(item) => handleItemSelect(li.tempId, item)} />
                            </TableCell>
                            <TableCell className="py-1">
                              <Input type="number" min={0} step="any"
                                value={li.std_Qty || ""}
                                onChange={(e) => updateLineItem(li.tempId, { std_Qty: parseFloat(e.target.value) || 0 })}
                                className="h-9 w-full text-center" />
                            </TableCell>
                            <TableCell className="py-1">
                              <Input type="number" min={0} step="any"
                                value={li.conv_Qty || ""}
                                onChange={(e) => updateLineItem(li.tempId, { conv_Qty: parseFloat(e.target.value) || 0 })}
                                className="h-9 w-full text-center" />
                            </TableCell>
                            <TableCell className="py-1">
                              <Input type="number" min={0} step="any"
                                value={li.std_Rate || ""}
                                onChange={(e) => updateLineItem(li.tempId, { std_Rate: parseFloat(e.target.value) || 0 })}
                                className="h-9 w-full text-right" />
                            </TableCell>
                            <TableCell className="py-1">
                              <Input type="number" min={0} max={100} step="any"
                                value={li.discount1 || ""}
                                onChange={(e) => updateLineItem(li.tempId, { discount1: parseFloat(e.target.value) || 0 })}
                                className="h-9 w-full text-right" />
                            </TableCell>
                            <TableCell className="py-1">
                              <Select value={li.vatPer.toString()}
                                onValueChange={(v) => updateLineItem(li.tempId, { vatPer: Number(v) })}>
                                <SelectTrigger className="h-9 w-[56px]"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                  {[0, 5, 12, 18, 28].map((r) => (
                                    <SelectItem key={r} value={r.toString()}>{r}%</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </TableCell>
                            <TableCell className="py-1 text-right font-mono text-sm">{li.amount.toFixed(2)}</TableCell>
                            <TableCell className="py-1">
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive/70 hover:text-destructive"
                                onClick={() => removeLineItem(li.tempId)}>
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                          {/* Expanded sub-fields */}
                          {expandedItems.has(li.tempId) && (
                            <TableRow>
                              <TableCell colSpan={9} className="bg-muted/20 p-3">
                                <div className="grid gap-3 sm:grid-cols-4">
                                  <div className="space-y-1">
                                    <Label className="text-xs">Mfr Item Name</Label>
                                    <Input value={li.mfrItemName}
                                      onChange={(e) => updateLineItem(li.tempId, { mfrItemName: e.target.value })}
                                      className="h-8 text-xs" />
                                  </div>
                                  <div className="space-y-1">
                                    <Label className="text-xs">Conv. Unit</Label>
                                    <Input type="number" min={0} value={li.conv_Unit || ""}
                                      onChange={(e) => updateLineItem(li.tempId, { conv_Unit: parseFloat(e.target.value) || 0 })}
                                      className="h-8 text-xs" />
                                  </div>
                                  <div className="space-y-1">
                                    <Label className="text-xs">Conv. Rate</Label>
                                    <Input type="number" min={0} step="any" value={li.conv_Rate || ""}
                                      onChange={(e) => updateLineItem(li.tempId, { conv_Rate: parseFloat(e.target.value) || 0 })}
                                      className="h-8 text-xs" />
                                  </div>
                                  <div className="space-y-1">
                                    <Label className="text-xs">Cost Rate</Label>
                                    <Input type="number" min={0} step="any" value={li.cost_Rate || ""}
                                      onChange={(e) => updateLineItem(li.tempId, { cost_Rate: parseFloat(e.target.value) || 0 })}
                                      className="h-8 text-xs" />
                                  </div>
                                  <div className="space-y-1">
                                    <Label className="text-xs">Discount 2%</Label>
                                    <Input type="number" min={0} max={100} step="any" value={li.discount2 || ""}
                                      onChange={(e) => updateLineItem(li.tempId, { discount2: parseFloat(e.target.value) || 0 })}
                                      className="h-8 text-xs" />
                                  </div>
                                  <div className="space-y-1">
                                    <Label className="text-xs">Discount 3%</Label>
                                    <Input type="number" min={0} max={100} step="any" value={li.discount3 || ""}
                                      onChange={(e) => updateLineItem(li.tempId, { discount3: parseFloat(e.target.value) || 0 })}
                                      className="h-8 text-xs" />
                                  </div>
                                  <div className="space-y-1">
                                    <Label className="text-xs">Rate Discount</Label>
                                    <Input type="number" min={0} step="any" value={li.rateDiscount || ""}
                                      onChange={(e) => updateLineItem(li.tempId, { rateDiscount: parseFloat(e.target.value) || 0 })}
                                      className="h-8 text-xs" />
                                  </div>
                                  <div className="space-y-1">
                                    <Label className="text-xs">Inventory Moved</Label>
                                    <Input type="number" min={0} value={li.inventoryMoved || ""}
                                      onChange={(e) => updateLineItem(li.tempId, { inventoryMoved: parseFloat(e.target.value) || 0 })}
                                      className="h-8 text-xs" />
                                  </div>
                                  <div className="space-y-1">
                                    <Label className="text-xs">Vehicle Weight</Label>
                                    <Input type="number" min={0} step="any" value={li.vehicleWeigth || ""}
                                      onChange={(e) => updateLineItem(li.tempId, { vehicleWeigth: parseFloat(e.target.value) || 0 })}
                                      className="h-8 text-xs" />
                                  </div>
                                  <div className="space-y-1">
                                    <Label className="text-xs">Empty Box Wt.</Label>
                                    <Input type="number" min={0} step="any" value={li.emptyBoxWeigth || ""}
                                      onChange={(e) => updateLineItem(li.tempId, { emptyBoxWeigth: parseFloat(e.target.value) || 0 })}
                                      className="h-8 text-xs" />
                                  </div>
                                  <div className="space-y-1">
                                    <Label className="text-xs">Total Weight</Label>
                                    <Input type="number" min={0} step="any" value={li.totalWeigth || ""}
                                      onChange={(e) => updateLineItem(li.tempId, { totalWeigth: parseFloat(e.target.value) || 0 })}
                                      className="h-8 text-xs" />
                                  </div>
                                  <div className="space-y-1">
                                    <Label className="text-xs">Empty Boxes</Label>
                                    <Input type="number" min={0} value={li.emptyBoxes || ""}
                                      onChange={(e) => updateLineItem(li.tempId, { emptyBoxes: parseFloat(e.target.value) || 0 })}
                                      className="h-8 text-xs" />
                                  </div>
                                  <div className="space-y-1">
                                    <Label className="text-xs">Rack ID</Label>
                                    <Input type="number" min={0} value={li.rackId || ""}
                                      onChange={(e) => updateLineItem(li.tempId, { rackId: parseFloat(e.target.value) || 0 })}
                                      className="h-8 text-xs" />
                                  </div>
                                  <div className="sm:col-span-3 space-y-1">
                                    <Label className="text-xs">Item Description</Label>
                                    <Input value={li.itemDescription}
                                      onChange={(e) => updateLineItem(li.tempId, { itemDescription: e.target.value })}
                                      className="h-8 text-xs" />
                                  </div>
                                </div>
                              </TableCell>
                            </TableRow>
                          )}
                        </FragmentRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>

          {/* ─── Section 5: Extra Charges (collapsible) ─────── */}
          <Collapsible open={showExtraCharges} onOpenChange={setShowExtraCharges}>
            <Card>
              <CollapsibleTrigger asChild>
                <CardHeader className="cursor-pointer hover:bg-muted/30 transition-colors py-5">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">Extra Charges ({extraCharges.length})</CardTitle>
                    <ChevronDown className={cn("h-4 w-4 transition-transform", showExtraCharges && "rotate-180")} />
                  </div>
                </CardHeader>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <CardContent className="border-t pt-4 space-y-3">
                  {extraCharges.map((ec) => (
                    <div key={ec.tempId} className="flex flex-wrap items-end gap-2 p-2 border rounded-md">
                      <div className="space-y-1 w-[200px]">
                        <Label className="text-xs">Charge</Label>
                        <ExtraChargeSearchCell
                          value={ec.extra_Charge_ID}
                          onSelect={(sel) => {
                            const amt = sel.fixedAmount ?? 0;
                            updateExtraCharge(ec.tempId, {
                              extra_Charge_ID: sel.extraCharges_ID,
                              taxType: Number(sel.taxType ?? sel.tax_Type ?? 0),
                              perVal: sel.taxPercent ?? 0,
                              vatPer: 0, // not in API response for these charges
                              cstPer: 0, // not in API response
                              charges: amt, // sync with amount
                              amount: amt,
                              effectOnTotal: sel.isPositiveEffect ? 1 : 0,
                              vatAssessValue: 0,
                              taxEffect: sel.vatEffect ?? true,
                            });
                          }}
                        />
                      </div>
                      <div className="space-y-1 w-[80px]">
                        <Label className="text-xs">Tax Type</Label>
                        <Input type="number" min={0} value={ec.taxType || ""}
                          onChange={(e) => updateExtraCharge(ec.tempId, { taxType: parseFloat(e.target.value) || 0 })}
                          className="h-8" />
                      </div>
                      <div className="space-y-1 w-[70px]">
                        <Label className="text-xs">Per%</Label>
                        <Input type="number" min={0} step="any" value={ec.perVal || ""}
                          onChange={(e) => updateExtraCharge(ec.tempId, { perVal: parseFloat(e.target.value) || 0 })}
                          className="h-8" />
                      </div>
                      <div className="space-y-1 w-[80px]">
                        <Label className="text-xs">Amount</Label>
                        <Input type="number" value={ec.amount || ""} readOnly disabled
                          className="h-8 bg-muted" title="Auto-calculated" />
                      </div>
                      <div className="space-y-1 w-[70px]">
                        <Label className="text-xs">CST%</Label>
                        <Input type="number" min={0} step="any" value={ec.cstPer || ""}
                          onChange={(e) => updateExtraCharge(ec.tempId, { cstPer: parseFloat(e.target.value) || 0 })}
                          className="h-8" />
                      </div>
                      <div className="space-y-1 w-[70px]">
                        <Label className="text-xs">VAT%</Label>
                        <Input type="number" min={0} step="any" value={ec.vatPer || ""}
                          onChange={(e) => updateExtraCharge(ec.tempId, { vatPer: parseFloat(e.target.value) || 0 })}
                          className="h-8" />
                      </div>
                      <div className="space-y-1 w-[70px]">
                        <Label className="text-xs">Eff. Total</Label>
                        <Input type="number" min={0} value={ec.effectOnTotal || ""}
                          onChange={(e) => updateExtraCharge(ec.tempId, { effectOnTotal: parseFloat(e.target.value) || 0 })}
                          className="h-8" />
                      </div>
                      <div className="flex items-end pb-1 gap-2">
                        <div className="flex items-center gap-1.5">
                          <Checkbox id={`taxEffect_${ec.tempId}`} checked={ec.taxEffect}
                            onCheckedChange={(v) => updateExtraCharge(ec.tempId, { taxEffect: v === true })} />
                          <Label htmlFor={`taxEffect_${ec.tempId}`} className="text-xs cursor-pointer">Tax</Label>
                        </div>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive/70"
                          onClick={() => removeExtraCharge(ec.tempId)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  ))}
                  <Button variant="outline" size="sm" onClick={addExtraCharge}>
                    <Plus className="h-3.5 w-3.5 mr-1" /> Add Extra Charge
                  </Button>
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>

          {/* ─── Section 6: TNC (collapsible) ───────────────── */}
          <Collapsible open={showTnc} onOpenChange={setShowTnc}>
            <Card>
              <CollapsibleTrigger asChild>
                <CardHeader className="cursor-pointer hover:bg-muted/30 transition-colors py-5">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">Terms & Conditions ({tncList.length})</CardTitle>
                    <ChevronDown className={cn("h-4 w-4 transition-transform", showTnc && "rotate-180")} />
                  </div>
                </CardHeader>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <CardContent className="border-t pt-4 space-y-2">
                  {tncList.map((t) => (
                    <div key={t.tempId} className="flex items-end gap-2">
                      <div className="space-y-1 flex-1">
                        <Label className="text-xs">TNC</Label>
                        <TncSearchCell
                          value={t.tncID}
                          onSelect={(sel) => updateTnc(t.tempId, { tncID: sel.tncID })}
                        />
                      </div>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive/70"
                        onClick={() => removeTnc(t.tempId)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  ))}
                  <Button variant="outline" size="sm" onClick={addTnc}>
                    <Plus className="h-3.5 w-3.5 mr-1" /> Add TNC
                  </Button>
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>

          {/* ─── Section 7: Footer Notes (collapsible) ──────── */}
          <Collapsible open={showFooter} onOpenChange={setShowFooter}>
            <Card>
              <CollapsibleTrigger asChild>
                <CardHeader className="cursor-pointer hover:bg-muted/30 transition-colors py-5">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">Footer Notes ({footerNotes.length})</CardTitle>
                    <ChevronDown className={cn("h-4 w-4 transition-transform", showFooter && "rotate-180")} />
                  </div>
                </CardHeader>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <CardContent className="border-t pt-4 space-y-2">
                  {footerNotes.map((fn) => (
                    <div key={fn.tempId} className="flex items-end gap-2">
                      <div className="space-y-1 flex-1">
                        <Label className="text-xs">Title</Label>
                        <Input value={fn.title} onChange={(e) => updateFooterNote(fn.tempId, { title: e.target.value })} className="h-8" />
                      </div>
                      <div className="space-y-1 flex-[2]">
                        <Label className="text-xs">Note</Label>
                        <Input value={fn.note} onChange={(e) => updateFooterNote(fn.tempId, { note: e.target.value })} className="h-8" />
                      </div>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive/70"
                        onClick={() => removeFooterNote(fn.tempId)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  ))}
                  <Button variant="outline" size="sm" onClick={addFooterNote}>
                    <Plus className="h-3.5 w-3.5 mr-1" /> Add Footer Note
                  </Button>
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>

        </div>

        {/* ═══ RIGHT COLUMN — Summary ═════════════════════════════ */}
        <div className="space-y-6">
          <Card className="py-5">
            <CardHeader><CardTitle className="text-base">Summary</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Item Subtotal</span>
                <span className="font-mono">₹{totals.itemSubTotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">CGST</span>
                <span className="font-mono">₹{totals.cgst.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">SGST</span>
                <span className="font-mono">₹{totals.sgst.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">IGST</span>
                <span className="font-mono">₹{totals.igst.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Extra Charges</span>
                <span className="font-mono">₹{totals.extraSubTotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm items-center">
                <span className="text-muted-foreground">Round Off</span>
                <Input type="number" step="any" value={roundOff}
                  onChange={(e) => setRoundOff(parseFloat(e.target.value) || 0)}
                  className="h-7 w-24 font-mono text-right" />
              </div>
              <Separator />
              <div className="flex justify-between font-semibold">
                <span>Grand Total</span>
                <span className="font-mono text-lg">₹{totals.grandTotal.toFixed(2)}</span>
              </div>
            </CardContent>
          </Card>

          {/* Financial toggles */}
          <Card className="py-5">
            <CardHeader><CardTitle className="text-base">Financials</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center gap-2">
                  <Checkbox id="isMaxVAT" checked={isMaxVAT} onCheckedChange={(v) => setIsMaxVAT(v === true)} />
                  <Label htmlFor="isMaxVAT" className="text-xs cursor-pointer">Max VAT</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox id="isRoundOff" checked={isRoundOff} onCheckedChange={(v) => setIsRoundOff(v === true)} />
                  <Label htmlFor="isRoundOff" className="text-xs cursor-pointer">Round Off</Label>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Precision</Label>
                  <Input type="number" min={0} max={4} value={precision}
                    onChange={(e) => setPrecision(parseInt(e.target.value) || 0)} className="h-8" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Bill Status</Label>
                  <Select value={billStatus.toString()} onValueChange={(v) => setBillStatus(Number(v))}>
                    <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">Open</SelectItem>
                      <SelectItem value="1">Confirmed</SelectItem>
                      <SelectItem value="2">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Profit</Label>
                  <Input type="number" step="any" value={profit}
                    onChange={(e) => setProfit(parseFloat(e.target.value) || 0)} className="h-8" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Profit %</Label>
                  <Input type="number" step="any" value={profitPer}
                    onChange={(e) => setProfitPer(parseFloat(e.target.value) || 0)} className="h-8" />
                </div>
              </div>
              <Separator />
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Rec. By *</Label>
                  <Input value={recBy} onChange={(e) => setRecBy(e.target.value)} className="h-8" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Rec. Amt *</Label>
                  <Input type="number" step="any" value={recAmt}
                    onChange={(e) => setRecAmt(parseFloat(e.target.value) || 0)} className="h-8" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Due Days</Label>
                  <Input type="number" min={0} value={dueDays}
                    onChange={(e) => setDueDays(parseInt(e.target.value) || 0)} className="h-8" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Button className="w-full gap-2 h-11 text-base"
            onClick={handleSubmit} disabled={createMutation.isPending || !isValid}>
            {createMutation.isPending ? (
              <><Loader2 className="h-4 w-4 animate-spin" /> {editInvCode ? "Updating..." : "Creating..."}</>
            ) : (
              <><Save className="h-4 w-4" /> {editInvCode ? `Update ${title}` : `Create ${title}`}</>
            )}
          </Button>
          {!isValid && !createMutation.isPending && validationIssues.length > 0 && (
            <div className="space-y-0.5 px-1 text-xs text-destructive">
              {validationIssues.map((issue) => (
                <p key={issue}>• {issue}</p>
              ))}
            </div>
          )}
          <Button variant="outline" className="w-full" onClick={() => router.push(backUrl)}>Cancel</Button>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
//  FragmentRow helper — allows adjacent TableRows without a wrapper
// ═══════════════════════════════════════════════════════════════════
function FragmentRow({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

// ═══════════════════════════════════════════════════════════════════
//  Separator (inline)
// ═══════════════════════════════════════════════════════════════════
function Separator() {
  return <div className="border-t" />;
}
