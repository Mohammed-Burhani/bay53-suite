"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Plus, Trash2, Building2, FileText, Package, ScrollText, Link2 } from "lucide-react";
import { useCRMMasterValues } from "@/lib/hooks/useCRM";
import { useCRMSalesDocsStore } from "@/lib/stores/crm-sales-docs-store";
import { formatCurrency } from "@/lib/bay53crm/constants";
import {
  DEFAULT_TERMS,
  UNITS,
  addDays,
  calcQuotationTotals,
  lineAmount,
  newLineItem,
  type CRMEnquiry,
  type QuotationLineItem,
  type QuotationStatus,
} from "@/lib/bay53crm/sales-docs";

interface QuotationFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  prefillEnquiryNo?: string | null;
}

const today = () => new Date().toISOString().slice(0, 10);

const emptyForm = () => ({
  enquiryNo: "",
  customerName: "",
  contactPerson: "",
  email: "",
  phone: "",
  gstin: "",
  billingAddress: "",
  customerState: "",
  regionId: "",
  title: "",
  preparedBy: "",
  date: today(),
  validUntil: addDays(today(), 30),
  additionalDiscount: 0,
  freight: 0,
  gstRate: 18,
  ...DEFAULT_TERMS,
  notes: "",
});

type FormState = ReturnType<typeof emptyForm>;

function Section({ icon: Icon, title, children, action }: { icon: React.ElementType; title: string; children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2 border-b pb-1.5">
        <div className="flex items-center gap-2">
          <Icon className="h-4 w-4 text-muted-foreground" />
          <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{title}</h4>
        </div>
        {action}
      </div>
      {children}
    </div>
  );
}

function formFromEnquiry(e: CRMEnquiry): Partial<FormState> {
  return {
    enquiryNo: e.enquiryNo,
    customerName: e.customerName,
    contactPerson: e.contactPerson,
    email: e.email,
    phone: e.phone,
    customerState: e.customerState,
    regionId: e.regionId,
    title: e.subject,
    preparedBy: e.assignedTo,
  };
}

function itemsFromEnquiry(e?: CRMEnquiry): QuotationLineItem[] {
  if (!e || e.requirements.length === 0) return [newLineItem()];
  return e.requirements.map((r) => newLineItem({ description: r.item, qty: r.qty, unit: r.unit }));
}

export function QuotationFormDialog({ open, onOpenChange, prefillEnquiryNo }: QuotationFormDialogProps) {
  const { enquiries, addQuotation, updateEnquiry } = useCRMSalesDocsStore();
  const { data: regions = [] } = useCRMMasterValues("region");
  const { data: assignedTos = [] } = useCRMMasterValues("assigned_to");
  const { data: states = [] } = useCRMMasterValues("customer_state");

  // Parent remounts this dialog (via key) for each new quotation, so initial state is the reset
  const prefill = prefillEnquiryNo ? enquiries.find((e) => e.enquiryNo === prefillEnquiryNo) : undefined;
  const [form, setForm] = useState<FormState>(() => ({ ...emptyForm(), ...(prefill ? formFromEnquiry(prefill) : {}) }));
  const [items, setItems] = useState<QuotationLineItem[]>(() => itemsFromEnquiry(prefill));

  const linkableEnquiries = useMemo(
    () => enquiries.filter((e) => !e.quotationNo && e.status !== "Closed" && e.status !== "Converted"),
    [enquiries]
  );

  const applyEnquiry = (enquiryNo: string) => {
    const enquiry = enquiries.find((e) => e.enquiryNo === enquiryNo);
    if (!enquiry) {
      setForm((f) => ({ ...f, enquiryNo: "" }));
      return;
    }
    setForm((f) => ({ ...f, ...formFromEnquiry(enquiry) }));
    if (enquiry.requirements.length > 0) setItems(itemsFromEnquiry(enquiry));
  };

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => setForm((f) => ({ ...f, [key]: value }));

  const updateItem = (id: string, patch: Partial<QuotationLineItem>) =>
    setItems((rows) => rows.map((r) => (r.id === id ? { ...r, ...patch } : r)));

  const totals = calcQuotationTotals({ ...form, items });
  const validItems = items.filter((i) => i.description.trim());
  const isValid = form.customerName.trim() && form.title.trim() && validItems.length > 0;

  const handleSave = (status: QuotationStatus) => {
    if (!isValid) return;
    const quotation = addQuotation({
      ...form,
      enquiryNo: form.enquiryNo || undefined,
      customerName: form.customerName.trim(),
      title: form.title.trim(),
      revision: 0,
      status,
      items: validItems,
      revisions: [{ rev: 0, date: form.date, by: form.preparedBy || "Admin", note: status === "Draft" ? "Draft prepared" : "Initial submission" }],
    });
    if (form.enquiryNo) {
      const enquiry = enquiries.find((e) => e.enquiryNo === form.enquiryNo);
      if (enquiry) {
        updateEnquiry(enquiry.id, {
          status: "Quoted",
          quotationNo: quotation.quotationNo,
          activities: [...enquiry.activities, { date: form.date, by: form.preparedBy || enquiry.assignedTo, note: `Quotation ${quotation.quotationNo} ${status === "Draft" ? "drafted" : "submitted"}.` }],
        });
      }
    }
    toast.success(`Quotation ${quotation.quotationNo} ${status === "Draft" ? "saved as draft" : "created & marked as sent"}`);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-5xl">
        <DialogHeader>
          <DialogTitle>Create New Quotation</DialogTitle>
          <DialogDescription>
            {form.enquiryNo ? `Linked to enquiry ${form.enquiryNo}. ` : ""}Line totals, discounts and GST are calculated automatically.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 max-h-[68vh] overflow-y-auto pr-2">
          {/* Link enquiry */}
          <div className="flex flex-wrap items-end gap-3 rounded-lg border border-dashed bg-muted/20 p-3">
            <div className="flex-1 min-w-[240px] space-y-2">
              <Label className="flex items-center gap-1.5"><Link2 className="h-3.5 w-3.5" />Reference Enquiry</Label>
              <Select value={form.enquiryNo || "none"} onValueChange={(v) => applyEnquiry(v === "none" ? "" : v)}>
                <SelectTrigger className="bg-background"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No enquiry (direct quotation)</SelectItem>
                  {form.enquiryNo && !linkableEnquiries.some((e) => e.enquiryNo === form.enquiryNo) && (
                    <SelectItem value={form.enquiryNo}>{form.enquiryNo}</SelectItem>
                  )}
                  {linkableEnquiries.map((e) => (
                    <SelectItem key={e.id} value={e.enquiryNo}>{e.enquiryNo} — {e.customerName}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <p className="text-xs text-muted-foreground pb-2">Selecting an enquiry fills customer details and items.</p>
          </div>

          <Section icon={Building2} title="Bill To">
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label>Customer Name *</Label>
                <Input value={form.customerName} onChange={(e) => set("customerName", e.target.value)} placeholder="Company name" />
              </div>
              <div className="space-y-2">
                <Label>Contact Person</Label>
                <Input value={form.contactPerson} onChange={(e) => set("contactPerson", e.target.value)} placeholder="Contact name" />
              </div>
              <div className="space-y-2">
                <Label>GSTIN</Label>
                <Input value={form.gstin} onChange={(e) => set("gstin", e.target.value.toUpperCase())} placeholder="29ABCDE1234F1Z5" maxLength={15} />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input type="email" value={form.email} onChange={(e) => set("email", e.target.value)} placeholder="name@company.com" />
              </div>
              <div className="space-y-2">
                <Label>Phone</Label>
                <Input value={form.phone} onChange={(e) => set("phone", e.target.value)} placeholder="+91 98xxx xxxxx" />
              </div>
              <div className="space-y-2">
                <Label>State (Place of Supply)</Label>
                <Select value={form.customerState} onValueChange={(v) => set("customerState", v)}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    {states.map((s) => (
                      <SelectItem key={s.id} value={s.name}>{s.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2 sm:col-span-3">
                <Label>Billing Address</Label>
                <Textarea value={form.billingAddress} onChange={(e) => set("billingAddress", e.target.value)} placeholder="Street, area, city – PIN" className="min-h-[56px]" />
              </div>
            </div>
          </Section>

          <Section icon={FileText} title="Quotation Details">
            <div className="grid gap-4 sm:grid-cols-4">
              <div className="space-y-2 sm:col-span-2">
                <Label>Title / Subject *</Label>
                <Input value={form.title} onChange={(e) => set("title", e.target.value)} placeholder="e.g. Supply & installation of VRF system" />
              </div>
              <div className="space-y-2">
                <Label>Prepared By</Label>
                <Select value={form.preparedBy} onValueChange={(v) => set("preparedBy", v)}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    {assignedTos.map((a) => (
                      <SelectItem key={a.id} value={a.name}>{a.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Region</Label>
                <Select value={form.regionId} onValueChange={(v) => set("regionId", v)}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    {regions.map((r) => (
                      <SelectItem key={r.id} value={r.code || r.name}>{r.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Quotation Date</Label>
                <Input type="date" value={form.date} onChange={(e) => set("date", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Valid Until</Label>
                <Input type="date" value={form.validUntil} onChange={(e) => set("validUntil", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>GST Rate</Label>
                <Select value={String(form.gstRate)} onValueChange={(v) => set("gstRate", Number(v))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {[0, 5, 12, 18, 28].map((r) => (
                      <SelectItem key={r} value={String(r)}>{r}%</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Tax Type</Label>
                <Input
                  readOnly
                  value={form.customerState ? (totals.interState ? "IGST (inter-state)" : "CGST + SGST (intra-state)") : "Select state"}
                  className="bg-muted/40 text-muted-foreground"
                />
              </div>
            </div>
          </Section>

          <Section
            icon={Package}
            title="Line Items"
            action={
              <Button variant="outline" size="sm" className="h-7" onClick={() => setItems((rows) => [...rows, newLineItem()])}>
                <Plus className="h-3.5 w-3.5 mr-1" />Add Item
              </Button>
            }
          >
            <div className="overflow-x-auto rounded-lg border">
              <table className="w-full min-w-[820px] text-xs">
                <thead className="bg-muted/40 text-muted-foreground">
                  <tr>
                    <th className="w-8 px-2 py-2 text-left font-medium">#</th>
                    <th className="px-2 py-2 text-left font-medium">Description *</th>
                    <th className="w-24 px-2 py-2 text-left font-medium">HSN/SAC</th>
                    <th className="w-20 px-2 py-2 text-left font-medium">Qty</th>
                    <th className="w-24 px-2 py-2 text-left font-medium">Unit</th>
                    <th className="w-28 px-2 py-2 text-left font-medium">Rate (₹)</th>
                    <th className="w-20 px-2 py-2 text-left font-medium">Disc %</th>
                    <th className="w-32 px-2 py-2 text-right font-medium">Amount</th>
                    <th className="w-10" />
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, idx) => (
                    <tr key={item.id} className="border-t">
                      <td className="px-2 py-1.5 text-muted-foreground">{idx + 1}</td>
                      <td className="px-1 py-1.5">
                        <Input className="h-8 text-xs" value={item.description} onChange={(e) => updateItem(item.id, { description: e.target.value })} placeholder="Item / service description" />
                      </td>
                      <td className="px-1 py-1.5">
                        <Input className="h-8 text-xs" value={item.hsn} onChange={(e) => updateItem(item.id, { hsn: e.target.value })} placeholder="8415" />
                      </td>
                      <td className="px-1 py-1.5">
                        <Input className="h-8 text-xs" type="number" min={0} value={item.qty} onChange={(e) => updateItem(item.id, { qty: Number(e.target.value) })} />
                      </td>
                      <td className="px-1 py-1.5">
                        <Select value={item.unit} onValueChange={(v) => updateItem(item.id, { unit: v })}>
                          <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {UNITS.map((u) => (
                              <SelectItem key={u} value={u}>{u}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </td>
                      <td className="px-1 py-1.5">
                        <Input className="h-8 text-xs" type="number" min={0} value={item.rate} onChange={(e) => updateItem(item.id, { rate: Number(e.target.value) })} />
                      </td>
                      <td className="px-1 py-1.5">
                        <Input className="h-8 text-xs" type="number" min={0} max={100} value={item.discount} onChange={(e) => updateItem(item.id, { discount: Number(e.target.value) })} />
                      </td>
                      <td className="px-2 py-1.5 text-right font-medium tabular-nums">{formatCurrency(lineAmount(item))}</td>
                      <td className="px-1 py-1.5">
                        <Button
                          variant="ghost" size="icon" className="h-7 w-7 text-destructive"
                          disabled={items.length === 1}
                          onClick={() => setItems((rows) => rows.filter((r) => r.id !== item.id))}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Totals */}
            <div className="flex justify-end">
              <div className="w-full max-w-sm space-y-1.5 rounded-lg border bg-muted/20 p-3 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">Gross Amount</span><span className="tabular-nums">{formatCurrency(totals.gross)}</span></div>
                {totals.lineDiscount > 0 && (
                  <div className="flex justify-between text-green-700"><span>Line Discounts</span><span className="tabular-nums">− {formatCurrency(totals.lineDiscount)}</span></div>
                )}
                <div className="flex items-center justify-between gap-2">
                  <span className="text-muted-foreground">Additional Discount %</span>
                  <Input type="number" min={0} max={100} className="h-7 w-20 text-right text-xs" value={form.additionalDiscount} onChange={(e) => set("additionalDiscount", Number(e.target.value))} />
                </div>
                {totals.extraDiscount > 0 && (
                  <div className="flex justify-between text-green-700"><span>Additional Discount</span><span className="tabular-nums">− {formatCurrency(totals.extraDiscount)}</span></div>
                )}
                <div className="flex items-center justify-between gap-2">
                  <span className="text-muted-foreground">Freight & Packing (₹)</span>
                  <Input type="number" min={0} className="h-7 w-28 text-right text-xs" value={form.freight} onChange={(e) => set("freight", Number(e.target.value))} />
                </div>
                <div className="flex justify-between border-t pt-1.5"><span className="text-muted-foreground">Taxable Value</span><span className="tabular-nums">{formatCurrency(totals.taxable)}</span></div>
                {totals.interState ? (
                  <div className="flex justify-between"><span className="text-muted-foreground">IGST @ {form.gstRate}%</span><span className="tabular-nums">{formatCurrency(totals.tax)}</span></div>
                ) : (
                  <>
                    <div className="flex justify-between"><span className="text-muted-foreground">CGST @ {form.gstRate / 2}%</span><span className="tabular-nums">{formatCurrency(totals.tax / 2)}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">SGST @ {form.gstRate / 2}%</span><span className="tabular-nums">{formatCurrency(totals.tax / 2)}</span></div>
                  </>
                )}
                <div className="flex justify-between border-t pt-1.5 text-base font-bold"><span>Grand Total</span><span className="tabular-nums">{formatCurrency(totals.grandTotal)}</span></div>
              </div>
            </div>
          </Section>

          <Section icon={ScrollText} title="Terms & Conditions">
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label>Payment Terms</Label>
                <Textarea value={form.paymentTerms} onChange={(e) => set("paymentTerms", e.target.value)} className="min-h-[64px] text-xs" />
              </div>
              <div className="space-y-2">
                <Label>Delivery Period</Label>
                <Textarea value={form.deliveryPeriod} onChange={(e) => set("deliveryPeriod", e.target.value)} className="min-h-[64px] text-xs" />
              </div>
              <div className="space-y-2">
                <Label>Warranty</Label>
                <Textarea value={form.warranty} onChange={(e) => set("warranty", e.target.value)} className="min-h-[64px] text-xs" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Notes / Exclusions</Label>
              <Textarea value={form.notes} onChange={(e) => set("notes", e.target.value)} placeholder="e.g. Civil works, scaffolding and power supply in client scope" className="min-h-[64px]" />
            </div>
          </Section>
        </div>

        <DialogFooter className="items-center sm:justify-between">
          <p className="text-sm text-muted-foreground">
            {validItems.length} item(s) · <span className="font-semibold text-foreground">{formatCurrency(totals.grandTotal)}</span>
          </p>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button variant="secondary" onClick={() => handleSave("Draft")} disabled={!isValid}>Save as Draft</Button>
            <Button onClick={() => handleSave("Sent")} disabled={!isValid}>Save & Mark Sent</Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
