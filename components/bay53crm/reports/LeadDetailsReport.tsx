"use client";

import { useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { MultiSelectCheckbox } from "@/components/bay53crm/shared/MultiSelectCheckbox";
import { StageBadge } from "@/components/bay53crm/shared/StageBadge";
import { useLeadDetailsReport } from "@/lib/bay53crm/api/queries";
import type { CrmLeadDetailsReportRow } from "@/lib/bay53crm/api";
import { formatCurrency, formatDate } from "@/lib/bay53crm/constants";
import { ALL_STAGES, distinct } from "@/lib/bay53crm/leads";
import {
  EMPTY_LEAD_DETAILS_CRITERIA,
  filterLeadDetailRows,
  reportStage,
  reportText,
  toLeadDetailsParams,
  type LeadDetailsCriteria,
} from "@/lib/bay53crm/reports";
import { exportToExcel, exportToPDF, printTable } from "@/lib/utils/report-export";
import { ReportFrame, ReportStateRow, type ReportTab } from "./ReportFrame";
import { useReportOptions } from "./useReportOptions";
import { usePagedRows } from "./usePagedRows";
import { TablePagination } from "@/components/ui/table-pagination";

const NO_ROWS: CrmLeadDetailsReportRow[] = [];
const ALL = "all";
const STAGE_OPTIONS = ALL_STAGES.map((s) => ({ label: s.label, value: String(s.id) }));

export function LeadDetailsReport() {
  const { regions, states, users } = useReportOptions();

  const [tab, setTab] = useState<ReportTab>("criteria");
  const [criteria, setCriteria] = useState<LeadDetailsCriteria>(EMPTY_LEAD_DETAILS_CRITERIA);
  // The criteria the report was last run with; null until "View Report" is clicked.
  const [applied, setApplied] = useState<LeadDetailsCriteria | null>(null);
  // Status and source have no lookup, so they filter the returned rows by their text.
  const [status, setStatus] = useState(ALL);
  const [source, setSource] = useState(ALL);

  const params = useMemo(() => toLeadDetailsParams(applied ?? EMPTY_LEAD_DETAILS_CRITERIA), [applied]);
  const { data: rows = NO_ROWS, isFetching, error } = useLeadDetailsReport(params, { enabled: applied !== null });

  const statusOptions = useMemo(() => distinct(rows.map((r) => reportText(r.status))), [rows]);
  const sourceOptions = useMemo(() => distinct(rows.map((r) => reportText(r.source))), [rows]);
  // Customer, status and source are applied here: the server matches the customer only exactly and has no status or
  // source names.
  const shown = useMemo(
    () =>
      filterLeadDetailRows(rows, applied?.customer ?? "").filter(
        (r) => (status === ALL || reportText(r.status) === status) && (source === ALL || reportText(r.source) === source)
      ),
    [rows, applied, status, source]
  );
  const totalValue = useMemo(() => shown.reduce((sum, r) => sum + r.value, 0), [shown]);
  const { paged, pagination } = usePagedRows(shown);

  const set = (patch: Partial<LeadDetailsCriteria>) => setCriteria((c) => ({ ...c, ...patch }));
  const run = () => {
    setStatus(ALL);
    setSource(ALL);
    setApplied(criteria);
    setTab("report");
  };

  const userName = (userId?: string) => users.find((u) => u.value === userId)?.label ?? userId ?? "";
  const exportRows = shown.map((r) => ({
    region: r.companyRegion ?? "",
    title: r.particulars,
    customer: r.customer,
    state: r.customerState ?? "",
    stage: reportStage(r.stage),
    value: r.value,
    date: formatDate(r.leadDate),
    assignedTo: userName(r.assignedTo),
    source: reportText(r.source),
    status: reportText(r.status),
  }));

  const handleCsv = () =>
    exportToExcel(
      exportRows,
      [
        { key: "region", label: "Region" },
        { key: "title", label: "Title" },
        { key: "customer", label: "Customer" },
        { key: "state", label: "State" },
        { key: "stage", label: "Stage" },
        { key: "value", label: "Value" },
        { key: "date", label: "Date" },
        { key: "assignedTo", label: "Assigned To" },
        { key: "source", label: "Source" },
        { key: "status", label: "Status" },
      ],
      "lead-details-report"
    );
  const handlePdf = () =>
    exportToPDF(
      exportRows,
      [
        { key: "region", label: "Region" },
        { key: "title", label: "Title" },
        { key: "customer", label: "Customer" },
        { key: "stage", label: "Stage" },
        { key: "value", label: "Value" },
        { key: "date", label: "Date" },
        { key: "assignedTo", label: "Assigned To" },
      ],
      "Lead Details Report",
      "lead-details-report"
    );
  const handlePrint = () =>
    printTable(
      exportRows,
      [
        { key: "region", label: "Region" },
        { key: "title", label: "Title" },
        { key: "customer", label: "Customer" },
        { key: "stage", label: "Stage" },
        { key: "value", label: "Value" },
        { key: "date", label: "Date" },
      ],
      "Lead Details Report"
    );

  return (
    <ReportFrame
      title="Lead Details Report"
      subtitle={applied ? `${shown.length} leads · ${formatCurrency(totalValue)}` : "Choose the criteria to run the report"}
      tab={tab}
      onTabChange={setTab}
      count={applied ? shown.length : null}
      isRunning={isFetching}
      onRun={run}
      onCsv={handleCsv}
      onPdf={handlePdf}
      onPrint={handlePrint}
      criteria={
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="ld-from">Date From</Label>
              <Input id="ld-from" type="date" value={criteria.fromDate} onChange={(e) => set({ fromDate: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ld-to">Date To</Label>
              <Input id="ld-to" type="date" value={criteria.toDate} onChange={(e) => set({ toDate: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ld-customer">Customer</Label>
              <Input
                id="ld-customer"
                value={criteria.customer}
                onChange={(e) => set({ customer: e.target.value })}
                placeholder="Search customer..."
              />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-2">
              <Label>Region</Label>
              <MultiSelectCheckbox options={regions} selected={criteria.regions} onChange={(regions) => set({ regions })} />
            </div>
            <div className="space-y-2">
              <Label>Customer State</Label>
              <MultiSelectCheckbox options={states} selected={criteria.states} onChange={(states) => set({ states })} />
            </div>
            <div className="space-y-2">
              <Label>Stage</Label>
              <MultiSelectCheckbox options={STAGE_OPTIONS} selected={criteria.stageIds} onChange={(stageIds) => set({ stageIds })} />
            </div>
            <div className="space-y-2">
              <Label>Assigned To</Label>
              <MultiSelectCheckbox options={users} selected={criteria.assignedTos} onChange={(assignedTos) => set({ assignedTos })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ld-min">Worth Min</Label>
              <Input id="ld-min" type="number" value={criteria.worthMin} onChange={(e) => set({ worthMin: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ld-max">Worth Max</Label>
              <Input id="ld-max" type="number" value={criteria.worthMax} onChange={(e) => set({ worthMax: e.target.value })} />
            </div>
          </div>
        </>
      }
    >
      <div className="space-y-3">
        {rows.length > 0 && (
          <Card>
            <CardContent className="p-3 flex flex-wrap items-center gap-2">
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger aria-label="Status" className="h-8 w-[160px]"><SelectValue placeholder="Status" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL}>All statuses</SelectItem>
                  {statusOptions.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={source} onValueChange={setSource}>
                <SelectTrigger aria-label="Source" className="h-8 w-[160px]"><SelectValue placeholder="Source" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL}>All sources</SelectItem>
                  {sourceOptions.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>
        )}
        <Card>
          <div className="overflow-auto max-h-[65vh]">
            <Table>
              <TableHeader>
                <TableRow className="sticky top-0 bg-background z-10">
                  <TableHead>Region</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>State</TableHead>
                  <TableHead>Stage</TableHead>
                  <TableHead className="text-right">Value</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Assigned To</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paged.map((r, i) => (
                  <TableRow key={i}>
                    <TableCell className="text-xs">{r.companyRegion}</TableCell>
                    <TableCell className="font-medium text-xs max-w-[200px] truncate" title={r.particulars}>{r.particulars}</TableCell>
                    <TableCell className="text-xs">{r.customer}</TableCell>
                    <TableCell className="text-xs">{r.customerState}</TableCell>
                    <TableCell><StageBadge stage={reportStage(r.stage)} /></TableCell>
                    <TableCell className="text-right text-xs">{formatCurrency(r.value)}</TableCell>
                    <TableCell className="text-xs">{formatDate(r.leadDate)}</TableCell>
                    <TableCell className="text-xs">{userName(r.assignedTo)}</TableCell>
                    <TableCell className="text-xs">{reportText(r.source)}</TableCell>
                    <TableCell className="text-xs">{reportText(r.status)}</TableCell>
                  </TableRow>
                ))}
                {shown.length === 0 && (
                  <ReportStateRow
                    colSpan={10}
                    isIdle={applied === null}
                    isLoading={isFetching}
                    error={error}
                    emptyMessage="No leads match the criteria"
                  />
                )}
              </TableBody>
            </Table>
          </div>
          {shown.length > 0 && <TablePagination {...pagination} />}
        </Card>
      </div>
    </ReportFrame>
  );
}
