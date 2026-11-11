"use client";

import { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { TablePagination } from "@/components/ui/table-pagination";
import { MultiSelectCheckbox } from "@/components/bay53crm/shared/MultiSelectCheckbox";
import { useLeadActivityReport } from "@/lib/bay53crm/api/queries";
import type { CrmLeadActivityReportRow } from "@/lib/bay53crm/api";
import { formatDate } from "@/lib/bay53crm/constants";
import {
  contactNameOf,
  EMPTY_LEAD_ACTIVITY_CRITERIA,
  toLeadActivityParams,
  type LeadActivityCriteria,
} from "@/lib/bay53crm/reports";
import { exportToExcel, exportToPDF, printTable } from "@/lib/utils/report-export";
import { ReportFrame, ReportStateRow, type ReportTab } from "./ReportFrame";
import { useReportOptions } from "./useReportOptions";
import { usePagedRows } from "./usePagedRows";

const NO_ROWS: CrmLeadActivityReportRow[] = [];

export function LeadActivityReport() {
  const { users } = useReportOptions();

  const [tab, setTab] = useState<ReportTab>("criteria");
  const [criteria, setCriteria] = useState<LeadActivityCriteria>(EMPTY_LEAD_ACTIVITY_CRITERIA);
  // The criteria the report was last run with; null until "View Report" is clicked.
  const [applied, setApplied] = useState<LeadActivityCriteria | null>(null);

  const params = useMemo(() => toLeadActivityParams(applied ?? EMPTY_LEAD_ACTIVITY_CRITERIA), [applied]);
  const { data, isFetching, error } = useLeadActivityReport(params, { enabled: applied !== null });
  // Newest first.
  const rows = useMemo(() => [...(data ?? NO_ROWS)].sort((a, b) => b.date.localeCompare(a.date)), [data]);
  const { paged, pagination } = usePagedRows(rows);

  const set = (patch: Partial<LeadActivityCriteria>) => setCriteria((c) => ({ ...c, ...patch }));
  const run = () => {
    setApplied(criteria);
    setTab("report");
  };

  const userName = (userId?: string | null) => users.find((u) => u.value === userId)?.label ?? userId ?? "";
  const exportRows = rows.map((r) => ({
    date: formatDate(r.date),
    lead: r.title,
    contact: contactNameOf(r.contactName),
    discussion: r.discussion ?? "",
    doneBy: userName(r.doneBy),
  }));
  const headers = [
    { key: "date", label: "Date" },
    { key: "lead", label: "Lead Title" },
    { key: "contact", label: "Contact" },
    { key: "discussion", label: "Notes" },
    { key: "doneBy", label: "Done By" },
  ];

  return (
    <ReportFrame
      title="Lead Activity Report"
      subtitle={applied ? `${rows.length} activities` : "Choose the criteria to run the report"}
      tab={tab}
      onTabChange={setTab}
      count={applied ? rows.length : null}
      isRunning={isFetching}
      onRun={run}
      onCsv={() => exportToExcel(exportRows, headers, "lead-activity-report")}
      onPdf={() => exportToPDF(exportRows, headers, "Lead Activity Report", "lead-activity-report")}
      onPrint={() => printTable(exportRows, headers, "Lead Activity Report")}
      criteria={
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="la-from">Date From</Label>
            <Input id="la-from" type="date" value={criteria.fromDate} onChange={(e) => set({ fromDate: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="la-to">Date To</Label>
            <Input id="la-to" type="date" value={criteria.toDate} onChange={(e) => set({ toDate: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label>Assigned To</Label>
            <MultiSelectCheckbox options={users} selected={criteria.assignedTos} onChange={(assignedTos) => set({ assignedTos })} />
          </div>
        </div>
      }
    >
      <Card>
        <div className="overflow-auto max-h-[65vh]">
          <Table>
            <TableHeader>
              <TableRow className="sticky top-0 bg-background z-10">
                <TableHead>Date</TableHead>
                <TableHead>Lead Title</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Notes</TableHead>
                <TableHead>Done By</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paged.map((r, i) => (
                <TableRow key={i}>
                  <TableCell className="text-xs whitespace-nowrap">{formatDate(r.date)}</TableCell>
                  <TableCell className="font-medium text-xs max-w-[240px]">{r.title}</TableCell>
                  <TableCell className="text-xs max-w-[160px]">{contactNameOf(r.contactName)}</TableCell>
                  <TableCell className="text-xs max-w-[360px] whitespace-pre-wrap break-words">{r.discussion}</TableCell>
                  <TableCell className="text-xs">{userName(r.doneBy)}</TableCell>
                </TableRow>
              ))}
              {rows.length === 0 && (
                <ReportStateRow
                  colSpan={5}
                  isIdle={applied === null}
                  isLoading={isFetching}
                  error={error}
                  emptyMessage="No activities match the criteria"
                />
              )}
            </TableBody>
          </Table>
        </div>
        {rows.length > 0 && <TablePagination {...pagination} />}
      </Card>
    </ReportFrame>
  );
}
