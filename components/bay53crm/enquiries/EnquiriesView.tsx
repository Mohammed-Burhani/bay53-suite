"use client";

import { useMemo, useState } from "react";
import { Eye, FileText, Link2, Search, Unlink, FileCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { TablePagination } from "@/components/ui/table-pagination";
import { CompactStat, FilterSelect } from "@/components/bay53crm/dashboard/DashboardWidgets";
import { StageBadge } from "@/components/bay53crm/shared/StageBadge";
import { usePagedRows } from "@/components/bay53crm/reports/usePagedRows";
import { useAllCrmUsers, useEnquiries, useLeadDetailsReport } from "@/lib/bay53crm/api/queries";
import type { CrmEnquiryRef, CrmLeadDetailsReportRow } from "@/lib/bay53crm/api";
import { formatCurrency } from "@/lib/bay53crm/constants";
import {
  buildEnquiryRows,
  distinctSorted,
  enquiryFiltersActive,
  enquiryQuoteRefs,
  filterEnquiryRows,
  NO_ENQUIRY_FILTERS,
  summariseEnquiries,
  type EnquiryFilters,
  type EnquiryRow,
  type LinkFilter,
} from "@/lib/bay53crm/enquiries";
import { reportStage } from "@/lib/bay53crm/reports";
import { useDebouncedValue } from "@/lib/hooks/useDebouncedValue";
import { EnquiryDetailSheet } from "./EnquiryDetailSheet";

// With no customer, Common/EnquiryList returns every enquiry; the lead report ties them to customers, leads and quotes.
const ALL = {};
const NO_ENQUIRIES: CrmEnquiryRef[] = [];
const NO_REPORT: CrmLeadDetailsReportRow[] = [];

const LINK_OPTIONS: { label: string; value: LinkFilter }[] = [
  { label: "Linked to a lead", value: "linked" },
  { label: "Not linked", value: "unlinked" },
];

const count = (n: number) => n.toLocaleString("en-IN");

export function EnquiriesView() {
  const enquiriesQuery = useEnquiries(ALL);
  const reportQuery = useLeadDetailsReport(ALL);
  const { data: users = [] } = useAllCrmUsers();

  const [filters, setFilters] = useState<EnquiryFilters>(NO_ENQUIRY_FILTERS);
  const search = useDebouncedValue(filters.search);
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const enquiries = enquiriesQuery.data ?? NO_ENQUIRIES;
  const reportRows = reportQuery.data ?? NO_REPORT;
  const isLoading = enquiriesQuery.isLoading || reportQuery.isLoading;
  const error = enquiriesQuery.error ?? reportQuery.error;

  const rows = useMemo(() => buildEnquiryRows(enquiries, reportRows), [enquiries, reportRows]);
  const summary = useMemo(() => summariseEnquiries(rows), [rows]);
  const shown = useMemo(() => filterEnquiryRows(rows, { ...filters, search }), [rows, filters, search]);
  const { paged, pagination } = usePagedRows(shown);

  const userName = (userId?: string) => users.find((u) => u.userName === userId)?.fullName ?? userId ?? "";
  const assigneeOptions = useMemo(
    () => distinctSorted(reportRows.filter((r) => r.enquiryId).map((r) => r.assignedTo)).map((value) => ({ value, label: userName(value) })),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- userName is derived from users
    [reportRows, users]
  );
  const stageOptions = useMemo(
    () => distinctSorted(reportRows.filter((r) => r.enquiryId).map((r) => reportStage(r.stage))).map((value) => ({ value, label: value })),
    [reportRows]
  );

  const set = (patch: Partial<EnquiryFilters>) => setFilters((f) => ({ ...f, ...patch }));
  const active = enquiryFiltersActive(filters);
  const selected: EnquiryRow | null = selectedId === null ? null : (rows.find((r) => r.id === selectedId) ?? null);

  return (
    <div className="flex flex-col gap-6 p-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Enquiries &amp; Quotations</h1>
        <p className="text-sm text-muted-foreground">
          {isLoading ? "Loading..." : `${count(shown.length)} of ${count(rows.length)} enquiries`}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <CompactStat icon={FileText} label="Enquiries" value={count(summary.total)} color="blue" />
        <CompactStat icon={Link2} label="Linked to a lead" value={count(summary.linked)} color="green" />
        <CompactStat icon={Unlink} label="Not linked" value={count(summary.unlinked)} color="amber" />
        <CompactStat icon={FileCheck} label="With a quotation" value={count(summary.quoted)} color="purple" />
      </div>

      <Card>
        <CardContent className="space-y-3 p-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-1.5 min-w-0 sm:col-span-2 lg:col-span-1">
              <label htmlFor="enquiry-search" className="text-[11px] font-medium text-muted-foreground">Search</label>
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="enquiry-search"
                  placeholder="Enquiry no, customer, lead or quotation"
                  className="h-9 pl-8"
                  value={filters.search}
                  onChange={(e) => set({ search: e.target.value })}
                />
              </div>
            </div>
            <FilterSelect label="Link status" value={filters.link} onChange={(v) => set({ link: v as LinkFilter })} options={LINK_OPTIONS} />
            <FilterSelect label="Assigned to" value={filters.assignedTo || "all"} onChange={(v) => set({ assignedTo: v === "all" ? "" : v })} options={assigneeOptions} />
            <FilterSelect label="Stage" value={filters.stage || "all"} onChange={(v) => set({ stage: v === "all" ? "" : v })} options={stageOptions} />
          </div>
          {active && (
            <div className="flex justify-end">
              <Button variant="ghost" size="sm" onClick={() => setFilters(NO_ENQUIRY_FILTERS)}>Clear all</Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <div className="overflow-auto max-h-[60vh]">
          <Table>
            <TableHeader>
              <TableRow className="sticky top-0 bg-background z-10">
                <TableHead>Enquiry</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Lead</TableHead>
                <TableHead>Stage</TableHead>
                <TableHead>Assigned To</TableHead>
                <TableHead className="text-right">Value</TableHead>
                <TableHead>Quotations</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>View</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paged.map((row) => {
                const lead = row.leads[0];
                const extra = row.leads.length - 1;
                const quotes = enquiryQuoteRefs(row).length;
                return (
                  <TableRow key={row.id}>
                    <TableCell className="font-medium text-xs max-w-[260px] truncate" title={row.enquiryNo}>{row.enquiryNo}</TableCell>
                    <TableCell className="text-xs max-w-[220px] truncate" title={lead?.customer}>{lead?.customer}</TableCell>
                    <TableCell className="text-xs max-w-[200px] truncate" title={lead?.particulars}>
                      {lead?.particulars}
                      {extra > 0 && <span className="ml-1 text-muted-foreground">+{extra} more</span>}
                    </TableCell>
                    <TableCell>{lead && <StageBadge stage={reportStage(lead.stage)} />}</TableCell>
                    <TableCell className="text-xs">{lead && userName(lead.assignedTo)}</TableCell>
                    <TableCell className="text-right text-xs">
                      {lead && formatCurrency(row.leads.reduce((sum, l) => sum + l.value, 0))}
                    </TableCell>
                    <TableCell className="text-xs">{quotes > 0 ? `${quotes} quotation${quotes > 1 ? "s" : ""}` : ""}</TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={lead ? "border-green-200 bg-green-50 text-[10px] text-green-700" : "text-[10px] text-muted-foreground"}
                      >
                        {lead ? "Linked" : "Not linked"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon" className="h-7 w-7" aria-label={`View enquiry ${row.enquiryNo}`} onClick={() => setSelectedId(row.id)}>
                        <Eye className="h-3.5 w-3.5" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
              {(isLoading || error || shown.length === 0) && (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                    {isLoading
                      ? "Loading enquiries..."
                      : error
                        ? `Could not load enquiries: ${error instanceof Error ? error.message : "unknown error"}`
                        : "No enquiries match the filters"}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
        {shown.length > 0 && <TablePagination {...pagination} />}
      </Card>

      {selected && (
        <EnquiryDetailSheet row={selected} userName={userName} open onOpenChange={(open) => !open && setSelectedId(null)} />
      )}
    </div>
  );
}
