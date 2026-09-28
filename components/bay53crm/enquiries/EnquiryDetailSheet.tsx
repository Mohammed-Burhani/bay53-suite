"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Building2, Mail, Phone, MapPin, Paperclip, FileText, User, CalendarClock } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCRMSalesDocsStore } from "@/lib/stores/crm-sales-docs-store";
import { StatusBadge } from "@/components/bay53crm/shared/StatusBadge";
import { formatCurrency, formatDate } from "@/lib/bay53crm/constants";
import {
  ENQUIRY_STATUSES,
  ENQUIRY_STATUS_COLORS,
  PRIORITY_COLORS,
  daysUntil,
  type EnquiryStatus,
} from "@/lib/bay53crm/sales-docs";

interface EnquiryDetailSheetProps {
  enquiryId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreateQuotation: (enquiryNo: string) => void;
}

function Field({ label, children, className }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={className}>
      <span className="text-muted-foreground text-xs">{label}</span>
      <div className="font-medium">{children || "—"}</div>
    </div>
  );
}

export function EnquiryDetailSheet({ enquiryId, open, onOpenChange, onCreateQuotation }: EnquiryDetailSheetProps) {
  const enquiry = useCRMSalesDocsStore((s) => s.enquiries.find((e) => e.id === enquiryId));
  const updateEnquiry = useCRMSalesDocsStore((s) => s.updateEnquiry);
  const [note, setNote] = useState("");

  if (!enquiry) return null;

  const due = daysUntil(enquiry.responseDue);
  const isOpen = enquiry.status === "New" || enquiry.status === "In Progress";

  const handleStatusChange = (status: EnquiryStatus) => {
    updateEnquiry(enquiry.id, {
      status,
      activities: [
        ...enquiry.activities,
        { date: new Date().toISOString().slice(0, 10), by: enquiry.assignedTo, note: `Status changed to ${status}` },
      ],
    });
    toast.success(`Status updated to ${status}`);
  };

  const handleAddNote = () => {
    if (!note.trim()) return;
    updateEnquiry(enquiry.id, {
      activities: [...enquiry.activities, { date: new Date().toISOString().slice(0, 10), by: enquiry.assignedTo, note: note.trim() }],
    });
    setNote("");
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
        <SheetHeader className="p-0 pr-8">
          <p className="text-xs font-medium text-muted-foreground">{enquiry.enquiryNo} · {formatDate(enquiry.date)}</p>
          <SheetTitle className="leading-snug">{enquiry.subject}</SheetTitle>
        </SheetHeader>

        <div className="space-y-5 pb-6">
          {/* Status + actions */}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <StatusBadge label={enquiry.status} colors={ENQUIRY_STATUS_COLORS[enquiry.status]} className="text-sm px-3 py-1" />
              <StatusBadge label={`${enquiry.priority} priority`} colors={PRIORITY_COLORS[enquiry.priority]} className="px-2.5 py-1" />
            </div>
            <div className="flex gap-2">
              <Select value={enquiry.status} onValueChange={(v) => handleStatusChange(v as EnquiryStatus)}>
                <SelectTrigger className="h-8 w-[140px] text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {ENQUIRY_STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {enquiry.quotationNo ? (
                <Badge variant="outline" className="h-8 gap-1 px-2.5 text-xs">
                  <FileText className="h-3.5 w-3.5" />{enquiry.quotationNo}
                </Badge>
              ) : (
                <Button size="sm" disabled={enquiry.status === "Closed"} onClick={() => onCreateQuotation(enquiry.enquiryNo)}>
                  <FileText className="h-3.5 w-3.5 mr-1" />Create Quotation
                </Button>
              )}
            </div>
          </div>

          {/* Response due banner */}
          {isOpen && (
            <div
              className={cn(
                "flex items-center gap-2 rounded-lg border px-3 py-2 text-xs",
                due < 0 ? "border-red-200 bg-red-50 text-red-700" : due <= 2 ? "border-amber-200 bg-amber-50 text-amber-700" : "bg-muted/30 text-muted-foreground"
              )}
            >
              <CalendarClock className="h-4 w-4 shrink-0" />
              Response due {formatDate(enquiry.responseDue)}
              {" — "}
              {due < 0 ? `${Math.abs(due)} day(s) overdue` : due === 0 ? "today" : `${due} day(s) left`}
            </div>
          )}

          {/* Customer */}
          <div className="rounded-lg border p-3 space-y-3">
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted">
                <Building2 className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-sm">{enquiry.customerName}</p>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <User className="h-3 w-3" />{enquiry.contactPerson}{enquiry.designation && ` · ${enquiry.designation}`}
                </p>
              </div>
            </div>
            <div className="grid gap-2 text-xs sm:grid-cols-2">
              <a href={`tel:${enquiry.phone}`} className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground">
                <Phone className="h-3.5 w-3.5" />{enquiry.phone}
              </a>
              <a href={`mailto:${enquiry.email}`} className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground truncate">
                <Mail className="h-3.5 w-3.5 shrink-0" /><span className="truncate">{enquiry.email}</span>
              </a>
              <span className="flex items-center gap-1.5 text-muted-foreground sm:col-span-2">
                <MapPin className="h-3.5 w-3.5" />{enquiry.projectLocation} · {enquiry.customerState}
              </span>
            </div>
          </div>

          {/* Enquiry info */}
          <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-3">
            <Field label="Estimated Value">{formatCurrency(enquiry.estimatedValue)}</Field>
            <Field label="Region">{enquiry.regionId}</Field>
            <Field label="Vertical">{enquiry.vertical}</Field>
            <Field label="Source">{enquiry.source}</Field>
            <Field label="Assigned To">{enquiry.assignedTo}</Field>
            <Field label="Consultant">{enquiry.consultant}</Field>
          </div>

          <div>
            <span className="text-muted-foreground text-xs">Scope of Work</span>
            <div className="mt-1 flex flex-wrap gap-1.5">
              {enquiry.disciplines.map((d) => (
                <Badge key={d} variant="secondary" className="text-xs">{d}</Badge>
              ))}
            </div>
          </div>

          {/* Requirements */}
          {enquiry.requirements.length > 0 && (
            <div className="space-y-1.5">
              <span className="text-muted-foreground text-xs">Requirement Summary</span>
              <div className="rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="h-8 text-xs">Item</TableHead>
                      <TableHead className="h-8 text-xs">Discipline</TableHead>
                      <TableHead className="h-8 text-xs text-right">Qty</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {enquiry.requirements.map((r, i) => (
                      <TableRow key={i}>
                        <TableCell className="py-1.5 text-xs">{r.item}</TableCell>
                        <TableCell className="py-1.5 text-xs text-muted-foreground">{r.discipline}</TableCell>
                        <TableCell className="py-1.5 text-xs text-right whitespace-nowrap">{r.qty.toLocaleString("en-IN")} {r.unit}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}

          {enquiry.details && (
            <div>
              <span className="text-muted-foreground text-xs">Details</span>
              <p className="text-sm mt-0.5">{enquiry.details}</p>
            </div>
          )}

          {/* Attachments */}
          <div>
            <span className="text-muted-foreground text-xs">Attachments</span>
            {enquiry.attachments.length === 0 ? (
              <p className="text-xs text-muted-foreground mt-1">No attachments</p>
            ) : (
              <div className="mt-1 flex flex-wrap gap-2">
                {enquiry.attachments.map((a) => (
                  <button
                    key={a}
                    type="button"
                    onClick={() => toast.info(`${a} — preview available in the full release`)}
                    className="flex items-center gap-1.5 rounded-md border bg-muted/20 px-2 py-1 text-xs hover:bg-muted"
                  >
                    <Paperclip className="h-3 w-3" />{a}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Activity timeline */}
          <div className="border-t pt-4 space-y-3">
            <h4 className="text-sm font-semibold">Activity</h4>
            <div className="flex gap-2">
              <Textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Add a note or follow-up…"
                className="min-h-[60px] text-sm"
              />
              <Button size="sm" className="self-end" onClick={handleAddNote} disabled={!note.trim()}>Add</Button>
            </div>
            <ol className="relative space-y-3 border-l pl-4">
              {[...enquiry.activities].reverse().map((a, i) => (
                <li key={i} className="relative">
                  <span className={cn("absolute -left-[21px] top-1 h-2.5 w-2.5 rounded-full border-2 border-background", i === 0 ? "bg-primary" : "bg-muted-foreground/40")} />
                  <p className="text-sm">{a.note}</p>
                  <p className="text-[11px] text-muted-foreground">{formatDate(a.date)} · {a.by}</p>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
