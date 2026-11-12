"use client";

import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { StageBadge } from "@/components/bay53crm/shared/StageBadge";
import { EmptyRecords, RecordHeader } from "@/components/bay53crm/shared/RecordParts";
import { useQuotations } from "@/lib/bay53crm/api/queries";
import { formatCurrency, formatDate } from "@/lib/bay53crm/constants";
import { enquiryQuoteRefs, quoteAmount, type EnquiryRow } from "@/lib/bay53crm/enquiries";
import { reportStage } from "@/lib/bay53crm/reports";

interface EnquiryDetailSheetProps {
  row: EnquiryRow;
  userName: (userId?: string) => string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EnquiryDetailSheet({ row, userName, open, onOpenChange }: EnquiryDetailSheetProps) {
  // The quotation list answers for one enquiry at a time, by its number.
  const { data, isLoading, isError, error } = useQuotations({ enquiry: String(row.id) }, { enabled: open });
  const quotations = data?.quotations ?? [];
  const reportRefs = enquiryQuoteRefs(row);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="break-words pr-6">{row.enquiryNo}</SheetTitle>
          <SheetDescription className="sr-only">Enquiry details, its leads and quotations</SheetDescription>
        </SheetHeader>

        <div className="space-y-6 px-4 pb-6">
          <section className="space-y-3">
            <RecordHeader title="Leads" count={row.leads.length} />
            {row.leads.length === 0 && <EmptyRecords>No lead is linked to this enquiry</EmptyRecords>}
            {row.leads.map((lead, index) => (
              <div key={`${lead.particulars}-${index}`} className="space-y-2 rounded-lg border p-3 text-sm">
                <div className="flex items-start justify-between gap-2">
                  <p className="font-medium break-words">{lead.particulars}</p>
                  <StageBadge stage={reportStage(lead.stage)} />
                </div>
                <p className="text-xs text-muted-foreground break-words">{lead.customer}</p>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div>
                    <span className="text-muted-foreground">Value</span>
                    <p className="font-medium">{formatCurrency(lead.value)}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Assigned to</span>
                    <p>{userName(lead.assignedTo) || "-"}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Lead date</span>
                    <p>{formatDate(lead.leadDate)}</p>
                  </div>
                </div>
                {(lead.companyRegion || lead.customerState) && (
                  <p className="text-xs text-muted-foreground">{[lead.companyRegion, lead.customerState].filter(Boolean).join(" · ")}</p>
                )}
              </div>
            ))}
          </section>

          <section className="space-y-3">
            <RecordHeader title="Quotations" count={quotations.length} />
            {isLoading && <EmptyRecords>Loading quotations...</EmptyRecords>}
            {isError && (
              <p className="text-sm text-destructive">Could not load the quotations: {error instanceof Error ? error.message : "unknown error"}</p>
            )}
            {!isLoading && !isError && quotations.length === 0 && <EmptyRecords>No quotations for this enquiry</EmptyRecords>}
            {quotations.map((q) => (
              <div key={q.id} className="flex items-center justify-between gap-2 rounded-lg border p-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium" title={q.refno}>{q.refno}</p>
                  <p className="text-xs text-muted-foreground">{quoteAmount(q.totalValue, q.currency)}</p>
                </div>
                {q.isLatest && <Badge variant="outline" className="border-green-200 bg-green-50 text-[10px] text-green-700">Latest</Badge>}
              </div>
            ))}
            {/* References on the leads that the quotation list did not return, so none is hidden. */}
            {reportRefs
              .filter((ref) => !quotations.some((q) => q.refno === ref))
              .map((ref) => (
                <div key={ref} className="rounded-lg border border-dashed p-3 text-sm">
                  <p className="truncate font-medium" title={ref}>{ref}</p>
                  <p className="text-xs text-muted-foreground">Reference noted on the lead</p>
                </div>
              ))}
          </section>
        </div>
      </SheetContent>
    </Sheet>
  );
}
