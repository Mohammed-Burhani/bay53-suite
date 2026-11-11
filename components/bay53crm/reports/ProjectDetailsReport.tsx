"use client";

import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { MultiSelectCheckbox } from "@/components/bay53crm/shared/MultiSelectCheckbox";
import { useCampaignDetailsReport, useMasterValues } from "@/lib/bay53crm/api/queries";
import type { CrmCampaignDetailsReportRow, CrmMasterValue } from "@/lib/bay53crm/api";
import { formatDate } from "@/lib/bay53crm/constants";
import { APPROVAL_MASTER_VALUE_TYPE, PROJECT_STATUSES } from "@/lib/bay53crm/projects";
import {
  consultantOf,
  EMPTY_PROJECT_REPORT_CRITERIA,
  filterProjectReportRows,
  reportStatusColors,
  reportText,
  toProjectReportParams,
  type ProjectReportCriteria,
} from "@/lib/bay53crm/reports";
import { exportToExcel, exportToPDF, printTable } from "@/lib/utils/report-export";
import { ReportFrame, ReportStateRow, type ReportTab } from "./ReportFrame";
import { useReportOptions } from "./useReportOptions";
import { usePagedRows } from "./usePagedRows";
import { TablePagination } from "@/components/ui/table-pagination";

const NO_ROWS: CrmCampaignDetailsReportRow[] = [];
const NO_APPROVALS: CrmMasterValue[] = [];
const ALL = "all";
const STATUS_OPTIONS = PROJECT_STATUSES.map((s) => ({ label: s.label, value: String(s.id) }));

export function ProjectDetailsReport() {
  const { users } = useReportOptions();
  const { data: masterValues = NO_APPROVALS } = useMasterValues({ type: APPROVAL_MASTER_VALUE_TYPE });
  const approvals = useMemo(() => masterValues.filter((m) => m.isPublished), [masterValues]);

  const [tab, setTab] = useState<ReportTab>("criteria");
  const [criteria, setCriteria] = useState<ProjectReportCriteria>(EMPTY_PROJECT_REPORT_CRITERIA);
  // The criteria the report was last run with; null until "View Report" is clicked.
  const [applied, setApplied] = useState<ProjectReportCriteria | null>(null);

  const params = useMemo(() => toProjectReportParams(applied ?? EMPTY_PROJECT_REPORT_CRITERIA), [applied]);
  const { data: rows = NO_ROWS, isFetching, error } = useCampaignDetailsReport(params, { enabled: applied !== null });
  // The report cannot filter by assignee, so that part of the criteria is applied here.
  const shown = useMemo(() => filterProjectReportRows(rows, applied?.assignedTos ?? []), [rows, applied]);
  const { paged, pagination } = usePagedRows(shown);

  const set = (patch: Partial<ProjectReportCriteria>) => setCriteria((c) => ({ ...c, ...patch }));
  const run = () => {
    setApplied(criteria);
    setTab("report");
  };

  const userName = (userId?: string) => users.find((u) => u.value === userId)?.label ?? userId ?? "";
  const exportRows = shown.map((r) => ({
    name: r.campaignName,
    consultant: consultantOf(r.campaignDescription),
    brandApproval: r.campaignType,
    contractors: r.contractorDetails ?? "",
    status: reportText(r.status),
    assignedTo: userName(r.assignTo),
    start: r.startDate ? formatDate(r.startDate) : "",
    end: r.endDate ? formatDate(r.endDate) : "",
    leads: r.total,
    won: r.won,
    lost: r.lost,
  }));

  const handleCsv = () =>
    exportToExcel(
      exportRows,
      [
        { key: "name", label: "Name" },
        { key: "consultant", label: "Consultant" },
        { key: "brandApproval", label: "Brand Approval" },
        { key: "contractors", label: "Contractors" },
        { key: "status", label: "Status" },
        { key: "assignedTo", label: "Assigned To" },
        { key: "start", label: "Start" },
        { key: "end", label: "End" },
        { key: "leads", label: "Leads" },
        { key: "won", label: "Won" },
        { key: "lost", label: "Lost" },
      ],
      "project-details-report"
    );
  const handlePdf = () =>
    exportToPDF(
      exportRows,
      [
        { key: "name", label: "Name" },
        { key: "consultant", label: "Consultant" },
        { key: "brandApproval", label: "Brand Approval" },
        { key: "status", label: "Status" },
        { key: "assignedTo", label: "Assigned To" },
        { key: "leads", label: "Leads" },
      ],
      "Project Details Report",
      "project-details-report"
    );
  const handlePrint = () =>
    printTable(
      exportRows,
      [
        { key: "name", label: "Name" },
        { key: "consultant", label: "Consultant" },
        { key: "status", label: "Status" },
        { key: "assignedTo", label: "Assigned To" },
      ],
      "Project Details Report"
    );

  return (
    <ReportFrame
      title="Project Details Report"
      subtitle={applied ? `${shown.length} projects` : "Choose the criteria to run the report"}
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
              <Label>Status</Label>
              <MultiSelectCheckbox options={STATUS_OPTIONS} selected={criteria.statusIds} onChange={(statusIds) => set({ statusIds })} />
            </div>
            <div className="space-y-2">
              <Label>Brand Approval</Label>
              <Select value={criteria.campaignTypeId || ALL} onValueChange={(v) => set({ campaignTypeId: v === ALL ? "" : v })}>
                <SelectTrigger aria-label="Brand approval"><SelectValue placeholder="All" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL}>All</SelectItem>
                  {approvals.map((a) => <SelectItem key={a.id} value={String(a.id)}>{a.text}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Assigned To</Label>
              <MultiSelectCheckbox options={users} selected={criteria.assignedTos} onChange={(assignedTos) => set({ assignedTos })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pd-consultant">Consultant</Label>
              <Input
                id="pd-consultant"
                value={criteria.consultant}
                onChange={(e) => set({ consultant: e.target.value })}
                placeholder="Search consultant..."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pd-from">Start Date From</Label>
              <Input id="pd-from" type="date" value={criteria.fromDate} onChange={(e) => set({ fromDate: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pd-to">Start Date To</Label>
              <Input id="pd-to" type="date" value={criteria.toDate} onChange={(e) => set({ toDate: e.target.value })} />
            </div>
          </div>
        </>
      }
    >
      <Card>
        <div className="overflow-auto max-h-[65vh]">
          <Table>
            <TableHeader>
              <TableRow className="sticky top-0 bg-background z-10">
                <TableHead>Name</TableHead>
                <TableHead>Consultant</TableHead>
                <TableHead>Brand Approval</TableHead>
                <TableHead>Contractors</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Assigned To</TableHead>
                <TableHead>Start</TableHead>
                <TableHead>End</TableHead>
                <TableHead className="text-right">Leads</TableHead>
                <TableHead className="text-right">Won</TableHead>
                <TableHead className="text-right">Lost</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paged.map((r, i) => (
                <TableRow key={i}>
                  <TableCell className="font-medium text-xs max-w-[220px] truncate" title={r.campaignName}>{r.campaignName}</TableCell>
                  <TableCell className="text-xs max-w-[180px] truncate" title={r.campaignDescription}>{consultantOf(r.campaignDescription)}</TableCell>
                  <TableCell><Badge variant="outline" className="text-[10px]">{r.campaignType}</Badge></TableCell>
                  <TableCell className="text-xs max-w-[160px] truncate" title={r.contractorDetails}>{r.contractorDetails}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={reportStatusColors(r.status)}>{reportText(r.status)}</Badge>
                  </TableCell>
                  <TableCell className="text-xs">{userName(r.assignTo)}</TableCell>
                  <TableCell className="text-xs">{r.startDate ? formatDate(r.startDate) : ""}</TableCell>
                  <TableCell className="text-xs">{r.endDate ? formatDate(r.endDate) : ""}</TableCell>
                  <TableCell className="text-right text-xs">{r.total}</TableCell>
                  <TableCell className="text-right text-xs">{r.won}</TableCell>
                  <TableCell className="text-right text-xs">{r.lost}</TableCell>
                </TableRow>
              ))}
              {shown.length === 0 && (
                <ReportStateRow
                  colSpan={11}
                  isIdle={applied === null}
                  isLoading={isFetching}
                  error={error}
                  emptyMessage="No projects match the criteria"
                />
              )}
            </TableBody>
          </Table>
        </div>
        {shown.length > 0 && <TablePagination {...pagination} />}
      </Card>
    </ReportFrame>
  );
}
