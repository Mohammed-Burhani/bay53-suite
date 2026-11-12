"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { EmptyRecords, RecordHeader } from "@/components/bay53crm/shared/RecordParts";
import { useEnquiries, useQuotations, useUpdateLeadEnquiry } from "@/lib/bay53crm/api/queries";
import type { CrmLead } from "@/lib/bay53crm/api";
import { quoteAmount } from "@/lib/bay53crm/enquiries";
import { tolerateNotification } from "@/lib/bay53crm/save";

/** The enquiry a lead is linked to, the quotations raised for it, and a picker to link another of the customer's. */
export function LeadEnquiry({ lead }: { lead: CrmLead }) {
  const hasEnquiry = lead.enquiryId !== undefined && lead.enquiryId !== null;
  const { data: enquiries = [], isLoading: loadingEnquiries } = useEnquiries({ clientDetailId: lead.customerRef });
  // The quotation list filters by the enquiry's number, not its reference text.
  const { data: quotations, isLoading: loadingQuotations } = useQuotations(
    { enquiry: String(lead.enquiryId) },
    { enabled: hasEnquiry }
  );
  const updateEnquiry = useUpdateLeadEnquiry();
  const [chosen, setChosen] = useState("");

  const current = enquiries.find((e) => e.id === String(lead.enquiryId));
  const rows = quotations?.quotations ?? [];

  const link = async () => {
    if (!chosen) return;
    try {
      await tolerateNotification(updateEnquiry.mutateAsync({ leadId: lead.id, enquiryId: Number(chosen) }));
      toast.success("Enquiry linked");
      setChosen("");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not link the enquiry");
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <RecordHeader title="Linked enquiry" />
        {hasEnquiry ? (
          <p className="text-sm font-medium break-words">{current?.enquiryNo ?? `Enquiry ${lead.enquiryId}`}</p>
        ) : (
          <EmptyRecords>This lead is not linked to an enquiry</EmptyRecords>
        )}
      </div>

      <div className="space-y-2 rounded-lg border border-dashed p-3">
        <Label className="text-xs">{hasEnquiry ? "Link a different enquiry" : "Link an enquiry"}</Label>
        <Select value={chosen} onValueChange={setChosen} disabled={loadingEnquiries || enquiries.length === 0}>
          <SelectTrigger className="h-9" aria-label="Enquiry">
            <SelectValue placeholder={enquiries.length === 0 && !loadingEnquiries ? "This customer has no enquiries" : "Select an enquiry"} />
          </SelectTrigger>
          <SelectContent>
            {enquiries.map((e) => (
              <SelectItem key={e.id} value={e.id}>{e.enquiryNo}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="flex justify-end">
          <Button size="sm" onClick={link} disabled={!chosen || chosen === String(lead.enquiryId) || updateEnquiry.isPending}>
            {updateEnquiry.isPending ? "Linking..." : "Link"}
          </Button>
        </div>
      </div>

      {hasEnquiry && (
        <div className="space-y-2">
          <RecordHeader title="Quotations" count={rows.length} />
          {loadingQuotations && <EmptyRecords>Loading quotations...</EmptyRecords>}
          {!loadingQuotations && rows.length === 0 && <EmptyRecords>No quotations for this enquiry</EmptyRecords>}
          {rows.map((q) => (
            <div key={q.id} className="flex items-center justify-between gap-2 rounded-lg border p-2.5">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium" title={q.refno}>{q.refno}</p>
                <p className="text-xs text-muted-foreground">{quoteAmount(q.totalValue, q.currency)}</p>
              </div>
              {q.isLatest && <Badge variant="outline" className="border-green-200 bg-green-50 text-[10px] text-green-700">Latest</Badge>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
