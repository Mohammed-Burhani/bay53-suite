"use client";

import { toast } from "sonner";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Download, Send, GitBranch, CalendarClock, Link2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCRMSalesDocsStore } from "@/lib/stores/crm-sales-docs-store";
import { StatusBadge } from "@/components/bay53crm/shared/StatusBadge";
import { formatCurrency, formatDate } from "@/lib/bay53crm/constants";
import {
  QUOTATION_STATUSES,
  QUOTATION_STATUS_COLORS,
  SELLER,
  calcQuotationTotals,
  daysUntil,
  lineAmount,
  type QuotationStatus,
} from "@/lib/bay53crm/sales-docs";

interface QuotationDetailSheetProps {
  quotationId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const PENDING: QuotationStatus[] = ["Draft", "Sent", "Under Negotiation"];

export function QuotationDetailSheet({ quotationId, open, onOpenChange }: QuotationDetailSheetProps) {
  const quotation = useCRMSalesDocsStore((s) => s.quotations.find((q) => q.id === quotationId));
  const enquiries = useCRMSalesDocsStore((s) => s.enquiries);
  const updateQuotation = useCRMSalesDocsStore((s) => s.updateQuotation);
  const updateEnquiry = useCRMSalesDocsStore((s) => s.updateEnquiry);

  if (!quotation) return null;

  const totals = calcQuotationTotals(quotation);
  const validity = daysUntil(quotation.validUntil);
  const isPending = PENDING.includes(quotation.status);

  const handleStatusChange = (status: QuotationStatus) => {
    updateQuotation(quotation.id, { status });
    // Keep the linked enquiry in sync with the outcome
    const enquiry = quotation.enquiryNo && enquiries.find((e) => e.enquiryNo === quotation.enquiryNo);
    if (enquiry && (status === "Accepted" || status === "Rejected")) {
      updateEnquiry(enquiry.id, {
        status: status === "Accepted" ? "Converted" : "Closed",
        activities: [...enquiry.activities, { date: new Date().toISOString().slice(0, 10), by: quotation.preparedBy, note: `${quotation.quotationNo} marked ${status}.` }],
      });
    }
    toast.success(`${quotation.quotationNo} marked as ${status}`);
  };

  const handleRevise = () => {
    const rev = quotation.revision + 1;
    updateQuotation(quotation.id, {
      revision: rev,
      status: "Draft",
      revisions: [...quotation.revisions, { rev, date: new Date().toISOString().slice(0, 10), by: quotation.preparedBy, note: "Revision created for customer changes" }],
    });
    toast.success(`Revision R${rev} created`);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-3xl overflow-y-auto">
        <SheetHeader className="p-0 pr-8">
          <p className="text-xs font-medium text-muted-foreground">
            {quotation.quotationNo} · Rev {quotation.revision} · {formatDate(quotation.date)}
          </p>
          <SheetTitle className="leading-snug">{quotation.title}</SheetTitle>
        </SheetHeader>

        <div className="space-y-5 pb-6">
          {/* Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <StatusBadge label={quotation.status} colors={QUOTATION_STATUS_COLORS[quotation.status]} className="text-sm px-3 py-1" />
            <div className="flex flex-wrap gap-2">
              <Select value={quotation.status} onValueChange={(v) => handleStatusChange(v as QuotationStatus)}>
                <SelectTrigger className="h-8 w-[160px] text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {QUOTATION_STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button variant="outline" size="sm" onClick={handleRevise}>
                <GitBranch className="h-3.5 w-3.5 mr-1" />Revise
              </Button>
              <Button variant="outline" size="sm" onClick={() => toast.info("PDF download will be available in the full release")}>
                <Download className="h-3.5 w-3.5 mr-1" />PDF
              </Button>
              {quotation.status === "Draft" && (
                <Button size="sm" onClick={() => { handleStatusChange("Sent"); toast.success(`Emailed to ${quotation.email}`); }}>
                  <Send className="h-3.5 w-3.5 mr-1" />Send
                </Button>
              )}
            </div>
          </div>

          {isPending && (
            <div
              className={cn(
                "flex items-center gap-2 rounded-lg border px-3 py-2 text-xs",
                validity < 0 ? "border-red-200 bg-red-50 text-red-700" : validity <= 7 ? "border-amber-200 bg-amber-50 text-amber-700" : "bg-muted/30 text-muted-foreground"
              )}
            >
              <CalendarClock className="h-4 w-4 shrink-0" />
              {validity < 0
                ? `Validity lapsed on ${formatDate(quotation.validUntil)} — revise or mark as expired`
                : `Valid until ${formatDate(quotation.validUntil)} (${validity} day(s) left)`}
            </div>
          )}

          {/* Document preview */}
          <div className="rounded-lg border bg-background shadow-sm">
            {/* Letterhead */}
            <div className="flex flex-wrap items-start justify-between gap-4 border-b p-5">
              <div>
                <p className="text-base font-bold">{SELLER.name}</p>
                <p className="max-w-xs text-xs text-muted-foreground">{SELLER.address}</p>
                <p className="text-xs text-muted-foreground">GSTIN: {SELLER.gstin} · {SELLER.phone}</p>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold tracking-widest text-primary">QUOTATION</p>
                <table className="ml-auto mt-1 text-xs">
                  <tbody>
                    <tr><td className="pr-3 text-muted-foreground">No.</td><td className="font-medium">{quotation.quotationNo}{quotation.revision > 0 && ` / R${quotation.revision}`}</td></tr>
                    <tr><td className="pr-3 text-muted-foreground">Date</td><td>{formatDate(quotation.date)}</td></tr>
                    <tr><td className="pr-3 text-muted-foreground">Valid Until</td><td>{formatDate(quotation.validUntil)}</td></tr>
                    {quotation.enquiryNo && (
                      <tr><td className="pr-3 text-muted-foreground">Enquiry Ref</td><td>{quotation.enquiryNo}</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Bill to */}
            <div className="grid gap-4 border-b p-5 text-xs sm:grid-cols-2">
              <div>
                <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Bill To</p>
                <p className="text-sm font-semibold">{quotation.customerName}</p>
                <p className="text-muted-foreground">{quotation.billingAddress}</p>
                {quotation.gstin && <p className="text-muted-foreground">GSTIN: {quotation.gstin}</p>}
              </div>
              <div>
                <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Kind Attention</p>
                <p className="text-sm font-medium">{quotation.contactPerson}</p>
                <p className="text-muted-foreground">{quotation.email}</p>
                <p className="text-muted-foreground">{quotation.phone}</p>
                <p className="text-muted-foreground">Place of supply: {quotation.customerState}</p>
              </div>
            </div>

            <div className="px-5 pt-4 text-xs">
              <span className="text-muted-foreground">Subject: </span>
              <span className="font-medium">{quotation.title}</span>
            </div>

            {/* Items */}
            <div className="overflow-x-auto p-5">
              <table className="w-full min-w-[600px] text-xs">
                <thead>
                  <tr className="border-y bg-muted/40 text-muted-foreground">
                    <th className="px-2 py-2 text-left font-medium">#</th>
                    <th className="px-2 py-2 text-left font-medium">Description</th>
                    <th className="px-2 py-2 text-left font-medium">HSN/SAC</th>
                    <th className="px-2 py-2 text-right font-medium">Qty</th>
                    <th className="px-2 py-2 text-right font-medium">Rate</th>
                    <th className="px-2 py-2 text-right font-medium">Disc</th>
                    <th className="px-2 py-2 text-right font-medium">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {quotation.items.map((item, idx) => (
                    <tr key={item.id} className="border-b">
                      <td className="px-2 py-2 text-muted-foreground">{idx + 1}</td>
                      <td className="px-2 py-2">{item.description}</td>
                      <td className="px-2 py-2 text-muted-foreground">{item.hsn}</td>
                      <td className="px-2 py-2 text-right whitespace-nowrap">{item.qty.toLocaleString("en-IN")} {item.unit}</td>
                      <td className="px-2 py-2 text-right tabular-nums">{formatCurrency(item.rate)}</td>
                      <td className="px-2 py-2 text-right">{item.discount ? `${item.discount}%` : "—"}</td>
                      <td className="px-2 py-2 text-right font-medium tabular-nums">{formatCurrency(lineAmount(item))}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Totals */}
              <div className="mt-4 flex justify-end">
                <div className="w-full max-w-xs space-y-1 text-xs">
                  <div className="flex justify-between"><span className="text-muted-foreground">Sub Total</span><span className="tabular-nums">{formatCurrency(totals.subtotal)}</span></div>
                  {totals.extraDiscount > 0 && (
                    <div className="flex justify-between text-green-700"><span>Special Discount ({quotation.additionalDiscount}%)</span><span className="tabular-nums">− {formatCurrency(totals.extraDiscount)}</span></div>
                  )}
                  {quotation.freight > 0 && (
                    <div className="flex justify-between"><span className="text-muted-foreground">Freight & Packing</span><span className="tabular-nums">{formatCurrency(quotation.freight)}</span></div>
                  )}
                  <div className="flex justify-between border-t pt-1"><span className="text-muted-foreground">Taxable Value</span><span className="tabular-nums">{formatCurrency(totals.taxable)}</span></div>
                  {totals.interState ? (
                    <div className="flex justify-between"><span className="text-muted-foreground">IGST @ {quotation.gstRate}%</span><span className="tabular-nums">{formatCurrency(totals.tax)}</span></div>
                  ) : (
                    <>
                      <div className="flex justify-between"><span className="text-muted-foreground">CGST @ {quotation.gstRate / 2}%</span><span className="tabular-nums">{formatCurrency(totals.tax / 2)}</span></div>
                      <div className="flex justify-between"><span className="text-muted-foreground">SGST @ {quotation.gstRate / 2}%</span><span className="tabular-nums">{formatCurrency(totals.tax / 2)}</span></div>
                    </>
                  )}
                  <div className="flex justify-between border-t pt-1.5 text-sm font-bold"><span>Grand Total</span><span className="tabular-nums">{formatCurrency(totals.grandTotal)}</span></div>
                </div>
              </div>
            </div>

            {/* Terms */}
            <div className="border-t p-5 text-xs space-y-2">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Terms & Conditions</p>
              <ol className="list-decimal space-y-1 pl-4">
                <li><span className="font-medium">Payment:</span> {quotation.paymentTerms}</li>
                <li><span className="font-medium">Delivery:</span> {quotation.deliveryPeriod}</li>
                <li><span className="font-medium">Warranty:</span> {quotation.warranty}</li>
                <li><span className="font-medium">Taxes:</span> GST @ {quotation.gstRate}% as applicable, included above.</li>
                <li><span className="font-medium">Validity:</span> This offer is valid until {formatDate(quotation.validUntil)}.</li>
              </ol>
              {quotation.notes && (
                <p className="rounded-md bg-muted/30 p-2"><span className="font-medium">Note: </span>{quotation.notes}</p>
              )}
              <div className="flex justify-end pt-6">
                <div className="text-right">
                  <p className="font-medium">For {SELLER.name}</p>
                  <p className="mt-8 border-t pt-1 text-muted-foreground">{quotation.preparedBy} · Authorised Signatory</p>
                </div>
              </div>
            </div>
          </div>

          {quotation.enquiryNo && (
            <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Link2 className="h-3.5 w-3.5" />Raised against enquiry {quotation.enquiryNo}
            </p>
          )}

          {/* Revision history */}
          <div className="border-t pt-4 space-y-3">
            <h4 className="text-sm font-semibold">Revision History</h4>
            <ol className="relative space-y-3 border-l pl-4">
              {[...quotation.revisions].reverse().map((r, i) => (
                <li key={`${r.rev}-${i}`} className="relative">
                  <span className={cn("absolute -left-[21px] top-1 h-2.5 w-2.5 rounded-full border-2 border-background", i === 0 ? "bg-primary" : "bg-muted-foreground/40")} />
                  <p className="text-sm"><span className="font-medium">R{r.rev}</span> — {r.note}</p>
                  <p className="text-[11px] text-muted-foreground">{formatDate(r.date)} · {r.by}</p>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
