"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Printer,
  Loader2,
  AlertCircle,
  RefreshCw,
  Store,
  ShieldCheck,
  ReceiptText,
} from "lucide-react";
import { format } from "date-fns";
import { formatCurrency } from "@/lib/store";
import { useInvoiceById } from "@/lib/hooks/useInvoices";
import type {
  InvoiceSearchItem,
  InvoiceDetail,
  InvoiceDetailItem,
} from "@/lib/types/invoice.types";

interface InvoicePreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** invCode of the selected row */
  invCode: number | null;
  /** invoice type to send to /Invoice/GetById */
  invType: number;
  /** the clicked row — used for instant header data and as a fallback */
  fallback?: InvoiceSearchItem | null;
}

// ---------------------------------------------------------------------------
// Defensive field accessors.
// The exact /Invoice/GetById response shape is finalized later, so we read
// through several likely key names and gracefully fall back to the row data
// we already have. When the real shape is known, these key lists are the only
// thing that may need tightening.
// ---------------------------------------------------------------------------
type AnyRecord = Record<string, unknown> | null | undefined;

function pickStr(...sources: Array<{ obj: AnyRecord; keys: string[] }>): string | null {
  for (const { obj, keys } of sources) {
    if (!obj) continue;
    for (const k of keys) {
      const v = (obj as Record<string, unknown>)[k];
      if (v !== undefined && v !== null && String(v).trim() !== "") return String(v);
    }
  }
  return null;
}

function pickNum(...sources: Array<{ obj: AnyRecord; keys: string[] }>): number | null {
  for (const { obj, keys } of sources) {
    if (!obj) continue;
    for (const k of keys) {
      const v = (obj as Record<string, unknown>)[k];
      if (typeof v === "number" && !Number.isNaN(v)) return v;
      if (typeof v === "string" && v.trim() !== "" && !Number.isNaN(Number(v))) {
        return Number(v);
      }
    }
  }
  return null;
}

function extractItems(detail: InvoiceDetail | undefined): InvoiceDetailItem[] {
  if (!detail) return [];
  const candidates = [
    "items",
    "itemList",
    "invoiceItems",
    "invoiceDetails",
    "details",
    "lineItems",
    "productList",
    "invItems",
    "invoiceItemList",
  ];
  for (const key of candidates) {
    const v = (detail as Record<string, unknown>)[key];
    if (Array.isArray(v) && v.length > 0) return v as InvoiceDetailItem[];
  }
  return [];
}

function safeDate(value: string | null | undefined, pattern = "dd MMM yyyy"): string {
  if (!value) return "—";
  try {
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return String(value);
    return format(d, pattern);
  } catch {
    return String(value);
  }
}

// Indian-format amount in words (handles lakh / crore + paise).
function numberToIndianWords(input: number): string {
  if (!isFinite(input)) return "";
  const rupees = Math.floor(Math.abs(input));
  const paise = Math.round((Math.abs(input) - rupees) * 100);

  const a = [
    "", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine",
    "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen",
    "Seventeen", "Eighteen", "Nineteen",
  ];
  const b = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];

  const two = (n: number): string =>
    n < 20 ? a[n] : `${b[Math.floor(n / 10)]}${n % 10 ? " " + a[n % 10] : ""}`;
  const three = (n: number): string => {
    const h = Math.floor(n / 100);
    const r = n % 100;
    return `${h ? a[h] + " Hundred" + (r ? " " : "") : ""}${r ? two(r) : ""}`;
  };
  const convert = (n: number): string => {
    if (n === 0) return "Zero";
    let res = "";
    const crore = Math.floor(n / 10000000);
    n %= 10000000;
    const lakh = Math.floor(n / 100000);
    n %= 100000;
    const thousand = Math.floor(n / 1000);
    n %= 1000;
    if (crore) res += `${convert(crore)} Crore `;
    if (lakh) res += `${two(lakh)} Lakh `;
    if (thousand) res += `${two(thousand)} Thousand `;
    if (n) res += three(n);
    return res.trim();
  };

  let words = `${convert(rupees)} Rupees`;
  if (paise > 0) words += ` and ${two(paise)} Paise`;
  return `${words} Only`;
}

export function InvoicePreviewDialog({
  open,
  onOpenChange,
  invCode,
  invType,
  fallback,
}: InvoicePreviewDialogProps) {
  const { data, isLoading, isError, error, refetch, isFetching } = useInvoiceById(
    invCode,
    invType,
    open
  );

  const detail = data;
  const row = fallback ?? null;

  const handlePrint = () => {
    if (typeof window !== "undefined") window.print();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[92vh] w-full max-w-3xl flex-col gap-0 overflow-hidden p-0 sm:max-w-3xl">
        <DialogHeader className="flex flex-row items-center justify-between space-y-0 border-b px-5 py-3 pr-12 print:hidden">
          <div className="flex items-center gap-2">
            <ReceiptText className="h-4 w-4 text-primary" />
            <DialogTitle className="text-base">Invoice Preview</DialogTitle>
          </div>
          <DialogDescription className="sr-only">
            A printable bill view of the selected invoice.
          </DialogDescription>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="h-8 gap-1.5"
              onClick={handlePrint}
              disabled={isLoading || isError}
            >
              <Printer className="h-3.5 w-3.5" />
              Print
            </Button>
          </div>
        </DialogHeader>

        <ScrollArea className="flex-1">
          <div data-invoice-print className="bg-white text-zinc-900">
            {isLoading ? (
              <BillSkeleton />
            ) : isError ? (
              <BillError
                message={(error as Error)?.message || "Failed to load invoice."}
                onRetry={() => refetch()}
                retrying={isFetching}
              />
            ) : (
              <Bill detail={detail} row={row} />
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------
// The bill itself
// ---------------------------------------------------------------------------
function Bill({
  detail,
  row,
}: {
  detail: InvoiceDetail | undefined;
  row: InvoiceSearchItem | null;
}) {
  const d = detail as AnyRecord;
  const r = row as AnyRecord;

  // Header
  const companyName = pickStr({ obj: d, keys: ["companyName", "compName", "firmName"] });
  const companyAddress = pickStr({ obj: d, keys: ["companyAddress", "compAddress"] });
  const companyGST = pickStr({ obj: d, keys: ["companyGST", "compGST", "companyGstNo"] });
  const companyPhone = pickStr({ obj: d, keys: ["companyPhone", "compPhone", "phone"] });
  const companyEmail = pickStr({ obj: d, keys: ["companyEmail", "compEmail", "email"] });

  const billNo =
    pickStr({ obj: d, keys: ["bill_No", "billNo"] }, { obj: r, keys: ["bill_No"] }) ?? "—";
  const invoiceNo = pickStr(
    { obj: d, keys: ["invoiceNo"] },
    { obj: r, keys: ["invoiceNo"] }
  );
  const billDate = pickStr(
    { obj: d, keys: ["date", "invoiceDate", "billDate"] },
    { obj: r, keys: ["date"] }
  );
  const spName = pickStr({ obj: d, keys: ["spName", "stockPlace"] }, { obj: r, keys: ["spName"] });

  // Party
  const partyName = pickStr(
    { obj: d, keys: ["partyName", "ledgerName", "party"] },
    { obj: r, keys: ["partyName"] }
  );
  const partyAddress = pickStr({ obj: d, keys: ["partyAddress", "billingAddress", "address"] });
  const partyGST = pickStr(
    { obj: d, keys: ["partyGST", "gstNo", "gstin", "partyGstNo"] },
    { obj: r, keys: ["gstNo"] }
  );
  const shipToName = pickStr(
    { obj: d, keys: ["shipToName"] },
    { obj: r, keys: ["shipToName"] }
  );
  const shipToAddress = pickStr({ obj: d, keys: ["shipToAddress", "shippingAddress", "shipAdd"] });

  // Payment / refs
  const recBy = pickStr({ obj: d, keys: ["recBy", "paymentMode"] }, { obj: r, keys: ["recBy"] });
  const irn = pickStr({ obj: d, keys: ["irn"] }, { obj: r, keys: ["irn"] });
  const poNumber = pickStr({ obj: d, keys: ["poNumber"] }, { obj: r, keys: ["poNumber"] });
  const note = pickStr(
    { obj: d, keys: ["note", "remark", "narration", "notes"] },
    { obj: r, keys: ["note", "remark"] }
  );
  const isAuthorized =
    (d?.["isAuthorized"] as boolean | undefined) ??
    (r?.["isAuthorized"] as boolean | undefined) ??
    false;

  // Items
  const items = extractItems(detail);

  // Totals (fall back to the row's grandTotal)
  const subTotal = pickNum({
    obj: d,
    keys: ["item_SubTotal", "subTotal", "subtotal", "grossAmount", "totalBeforeTax"],
  });
  const totalDiscount = pickNum({ obj: d, keys: ["totalDiscount", "discount", "discountTotal"] });
  const taxableAmount = pickNum({ obj: d, keys: ["taxableAmount", "taxable", "netTaxable"] });
  const cgst = pickNum({ obj: d, keys: ["cgst", "cgstAmount", "cgstTotal"] });
  const sgst = pickNum({ obj: d, keys: ["sgst", "sgstAmount", "sgstTotal"] });
  const igst = pickNum({ obj: d, keys: ["igst", "igstAmount", "igstTotal"] });
  const roundOff = pickNum({ obj: d, keys: ["roundOff", "rounding", "roundOFF"] });
  const grandTotal =
    pickNum(
      { obj: d, keys: ["grandTotal", "netAmount", "invoiceTotal", "totalAmount"] },
      { obj: r, keys: ["grandTotal"] }
    ) ?? 0;

  return (
    <div className="px-7 py-7 text-sm leading-relaxed">
      {/* Top accent + header */}
      <div className="h-1.5 -mx-7 -mt-7 mb-6 bg-primary" />

      <div className="flex items-start justify-between gap-6">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary/10 text-primary">
              <Store className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <h2 className="truncate text-lg font-semibold tracking-tight text-zinc-900">
                {companyName ?? spName ?? "Tax Invoice"}
              </h2>
              {(companyAddress || spName) && (
                <p className="truncate text-xs text-zinc-500">
                  {companyAddress ?? `Branch: ${spName}`}
                </p>
              )}
            </div>
          </div>
          <div className="mt-2 space-y-0.5 text-xs text-zinc-500">
            {companyGST && (
              <p>
                <span className="text-zinc-400">GSTIN:</span>{" "}
                <span className="font-medium text-zinc-700">{companyGST}</span>
              </p>
            )}
            {(companyPhone || companyEmail) && (
              <p>
                {companyPhone}
                {companyPhone && companyEmail ? " · " : ""}
                {companyEmail}
              </p>
            )}
          </div>
        </div>

        <div className="shrink-0 text-right">
          <p className="text-xs font-semibold uppercase tracking-wide text-zinc-400">
            Tax Invoice
          </p>
          <p className="mt-0.5 font-mono text-base font-semibold text-zinc-900">{billNo}</p>
          <dl className="mt-2 space-y-0.5 text-xs text-zinc-500">
            {invoiceNo && (
              <div className="flex justify-end gap-2">
                <dt className="text-zinc-400">Invoice No</dt>
                <dd className="font-medium tabular-nums text-zinc-700">{invoiceNo}</dd>
              </div>
            )}
            <div className="flex justify-end gap-2">
              <dt className="text-zinc-400">Date</dt>
              <dd className="font-medium text-zinc-700">{safeDate(billDate)}</dd>
            </div>
            {spName && (
              <div className="flex justify-end gap-2">
                <dt className="text-zinc-400">Stock Place</dt>
                <dd className="font-medium text-zinc-700">{spName}</dd>
              </div>
            )}
          </dl>
          <div className="mt-2 flex justify-end">
            {isAuthorized ? (
              <Badge className="gap-1 border-transparent bg-emerald-100 text-emerald-700 hover:bg-emerald-100">
                <ShieldCheck className="h-3 w-3" />
                Authorized
              </Badge>
            ) : (
              <Badge variant="outline" className="border-amber-300 text-amber-700">
                Pending
              </Badge>
            )}
          </div>
        </div>
      </div>

      {/* Bill To / Ship To */}
      <div className="mt-6 grid grid-cols-1 gap-px overflow-hidden rounded-lg border border-zinc-200 bg-zinc-200 sm:grid-cols-2">
        <PartyBlock
          label="Bill To"
          name={partyName}
          address={partyAddress}
          gst={partyGST}
        />
        <PartyBlock
          label="Ship To"
          name={shipToName ?? partyName}
          address={shipToAddress ?? partyAddress}
          gst={null}
        />
      </div>

      {/* Meta chips */}
      {(recBy || poNumber || irn) && (
        <div className="mt-4 flex flex-wrap gap-2 text-xs">
          {recBy && <MetaChip label="Payment" value={recBy} />}
          {poNumber && <MetaChip label="PO No" value={poNumber} />}
          {irn && <MetaChip label="IRN" value={irn} mono />}
        </div>
      )}

      {/* Items table */}
      <div className="mt-5 overflow-hidden rounded-lg border border-zinc-200">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="bg-zinc-50 text-left text-xs uppercase tracking-wide text-zinc-500">
              <th className="w-10 px-3 py-2 text-center font-semibold">#</th>
              <th className="px-3 py-2 font-semibold">Description</th>
              <th className="px-3 py-2 text-center font-semibold">HSN</th>
              <th className="px-3 py-2 text-right font-semibold">Qty</th>
              <th className="px-3 py-2 text-right font-semibold">Rate</th>
              <th className="px-3 py-2 text-right font-semibold">Disc</th>
              <th className="px-3 py-2 text-right font-semibold">Tax%</th>
              <th className="px-3 py-2 text-right font-semibold">Amount</th>
            </tr>
          </thead>
          <tbody>
            {items.length > 0 ? (
              items.map((item, i) => {
                const it = item as AnyRecord;
                const desc = pickStr({
                  obj: it,
                  keys: [
                    "itemName", "item_Name", "productName", "description",
                    "particulars", "name", "item",
                  ],
                });
                const hsn = pickStr({ obj: it, keys: ["hsn", "hsnCode", "hsn_Code", "hsnSac"] });
                const qty = pickNum({ obj: it, keys: ["qty", "quantity", "qnty", "billQty"] });
                const unit = pickStr({ obj: it, keys: ["unit", "unitName", "uom"] });
                const rate = pickNum({ obj: it, keys: ["rate", "price", "unitRate", "saleRate"] });
                const disc = pickNum({ obj: it, keys: ["discount", "discountAmount", "disc"] });
                const taxPer = pickNum({
                  obj: it,
                  keys: ["taxPer", "gstPer", "gst", "taxPercent", "taxRate"],
                });
                const amount = pickNum({
                  obj: it,
                  keys: ["amount", "total", "netAmount", "lineTotal", "totalAmount", "value"],
                });
                return (
                  <tr key={i} className="border-t border-zinc-100 align-top">
                    <td className="px-3 py-2.5 text-center text-zinc-500 tabular-nums">{i + 1}</td>
                    <td className="px-3 py-2.5 font-medium text-zinc-800">{desc ?? "—"}</td>
                    <td className="px-3 py-2.5 text-center text-zinc-500 tabular-nums">
                      {hsn ?? "—"}
                    </td>
                    <td className="px-3 py-2.5 text-right tabular-nums text-zinc-700">
                      {qty !== null ? qty : "—"}
                      {unit ? <span className="text-zinc-400"> {unit}</span> : null}
                    </td>
                    <td className="px-3 py-2.5 text-right tabular-nums text-zinc-700">
                      {rate !== null ? formatCurrency(rate) : "—"}
                    </td>
                    <td className="px-3 py-2.5 text-right tabular-nums text-zinc-700">
                      {disc ? formatCurrency(disc) : "—"}
                    </td>
                    <td className="px-3 py-2.5 text-right tabular-nums text-zinc-700">
                      {taxPer !== null ? `${taxPer}%` : "—"}
                    </td>
                    <td className="px-3 py-2.5 text-right font-medium tabular-nums text-zinc-900">
                      {amount !== null ? formatCurrency(amount) : "—"}
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={8} className="px-3 py-10 text-center text-sm text-zinc-500">
                  No line items available for this invoice.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Totals */}
      <div className="mt-5 flex flex-col gap-5 sm:flex-row sm:justify-between">
        <div className="max-w-xs space-y-3 text-xs">
          <div>
            <p className="font-semibold uppercase tracking-wide text-zinc-400">
              Amount in words
            </p>
            <p className="mt-1 font-medium text-zinc-700">
              {numberToIndianWords(grandTotal)}
            </p>
          </div>
          {note && (
            <div>
              <p className="font-semibold uppercase tracking-wide text-zinc-400">Note</p>
              <p className="mt-1 text-zinc-600">{note}</p>
            </div>
          )}
        </div>

        <div className="w-full sm:w-72">
          <dl className="space-y-1.5 text-sm">
            {subTotal !== null && <TotalRow label="Sub Total" value={subTotal} />}
            {totalDiscount ? (
              <TotalRow label="Discount" value={-totalDiscount} className="text-emerald-600" />
            ) : null}
            {taxableAmount !== null && <TotalRow label="Taxable Amount" value={taxableAmount} />}
            {cgst ? <TotalRow label="CGST" value={cgst} muted /> : null}
            {sgst ? <TotalRow label="SGST" value={sgst} muted /> : null}
            {igst ? <TotalRow label="IGST" value={igst} muted /> : null}
            {roundOff ? <TotalRow label="Round Off" value={roundOff} muted /> : null}
            <div className="mt-2 flex items-center justify-between rounded-md bg-primary px-3 py-2.5 text-primary-foreground">
              <span className="text-sm font-semibold">Grand Total</span>
              <span className="text-base font-bold tabular-nums">
                {formatCurrency(grandTotal)}
              </span>
            </div>
          </dl>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-7 flex items-end justify-between gap-6 border-t border-dashed border-zinc-200 pt-4">
        <p className="max-w-sm text-xs text-zinc-400">
          This is a computer-generated invoice and does not require a physical signature.
        </p>
        <div className="text-right">
          <div className="h-10" />
          <p className="border-t border-zinc-300 pt-1 text-xs font-medium text-zinc-600">
            Authorized Signatory
          </p>
        </div>
      </div>

      <p className="mt-4 text-center text-xs font-medium text-zinc-400">
        Thank you for your business
      </p>
    </div>
  );
}

function PartyBlock({
  label,
  name,
  address,
  gst,
}: {
  label: string;
  name: string | null;
  address: string | null;
  gst: string | null;
}) {
  return (
    <div className="bg-white p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-zinc-400">{label}</p>
      <p className="mt-1 font-semibold text-zinc-900">{name ?? "—"}</p>
      {address && <p className="mt-0.5 text-xs leading-relaxed text-zinc-600">{address}</p>}
      {gst && (
        <p className="mt-1 text-xs text-zinc-500">
          <span className="text-zinc-400">GSTIN:</span>{" "}
          <span className="font-medium text-zinc-700">{gst}</span>
        </p>
      )}
    </div>
  );
}

function MetaChip({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-md border border-zinc-200 bg-zinc-50 px-2.5 py-1">
      <span className="text-zinc-400">{label}:</span>
      <span className={mono ? "font-mono text-zinc-700" : "font-medium text-zinc-700"}>
        {value}
      </span>
    </span>
  );
}

function TotalRow({
  label,
  value,
  muted,
  className,
}: {
  label: string;
  value: number;
  muted?: boolean;
  className?: string;
}) {
  return (
    <div className={`flex items-center justify-between ${className ?? ""}`}>
      <span className={muted ? "text-xs text-zinc-500" : "text-zinc-600"}>{label}</span>
      <span className={`tabular-nums ${muted ? "text-xs text-zinc-600" : "text-zinc-800"}`}>
        {formatCurrency(value)}
      </span>
    </div>
  );
}

function BillSkeleton() {
  return (
    <div className="px-7 py-7">
      <div className="h-1.5 -mx-7 -mt-7 mb-6 bg-zinc-200" />
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-6 w-48 animate-pulse rounded bg-zinc-200" />
          <div className="h-3 w-32 animate-pulse rounded bg-zinc-100" />
        </div>
        <div className="space-y-2 text-right">
          <div className="ml-auto h-5 w-32 animate-pulse rounded bg-zinc-200" />
          <div className="ml-auto h-3 w-24 animate-pulse rounded bg-zinc-100" />
        </div>
      </div>
      <div className="mt-6 grid grid-cols-2 gap-3">
        <div className="h-20 animate-pulse rounded-lg bg-zinc-100" />
        <div className="h-20 animate-pulse rounded-lg bg-zinc-100" />
      </div>
      <div className="mt-5 space-y-2">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-9 animate-pulse rounded bg-zinc-100" />
        ))}
      </div>
      <div className="mt-5 flex justify-end">
        <div className="h-28 w-72 animate-pulse rounded-lg bg-zinc-100" />
      </div>
      <div className="mt-6 flex items-center justify-center gap-2 text-sm text-zinc-400">
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading invoice…
      </div>
    </div>
  );
}

function BillError({
  message,
  onRetry,
  retrying,
}: {
  message: string;
  onRetry: () => void;
  retrying: boolean;
}) {
  return (
    <div className="flex flex-col items-center justify-center px-7 py-16 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-red-500">
        <AlertCircle className="h-6 w-6" />
      </div>
      <p className="mt-4 font-medium text-zinc-800">Couldn&apos;t load this invoice</p>
      <p className="mt-1 max-w-sm text-sm text-zinc-500">{message}</p>
      <Button variant="outline" size="sm" className="mt-4 gap-1.5" onClick={onRetry} disabled={retrying}>
        {retrying ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <RefreshCw className="h-3.5 w-3.5" />
        )}
        Try again
      </Button>
    </div>
  );
}
