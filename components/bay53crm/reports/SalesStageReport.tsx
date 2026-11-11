"use client";

import { useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { MultiSelectCheckbox } from "@/components/bay53crm/shared/MultiSelectCheckbox";
import { useSalesStageStatusReport } from "@/lib/bay53crm/api/queries";
import type { CrmSalesStageStatusReportRow } from "@/lib/bay53crm/api";
import { formatCurrency } from "@/lib/bay53crm/constants";
import {
  EMPTY_SALES_STAGE_CRITERIA,
  summariseByStage,
  summariseByUser,
  toSalesStageParams,
  type SalesStageCriteria,
} from "@/lib/bay53crm/reports";
import { exportToExcel, exportToPDF } from "@/lib/utils/report-export";
import { ReportFrame, ReportStateRow, type ReportTab } from "./ReportFrame";
import { useReportOptions } from "./useReportOptions";

const NO_ROWS: CrmSalesStageStatusReportRow[] = [];

export function SalesStageReport() {
  const { regions, users } = useReportOptions();

  const [tab, setTab] = useState<ReportTab>("criteria");
  const [criteria, setCriteria] = useState<SalesStageCriteria>(EMPTY_SALES_STAGE_CRITERIA);
  // The criteria the report was last run with; null until "View Report" is clicked.
  const [applied, setApplied] = useState<SalesStageCriteria | null>(null);

  const params = useMemo(() => toSalesStageParams(applied ?? EMPTY_SALES_STAGE_CRITERIA), [applied]);
  const { data: rows = NO_ROWS, isFetching, error } = useSalesStageStatusReport(params, { enabled: applied !== null });

  const byStage = useMemo(() => summariseByStage(rows), [rows]);
  const byUser = useMemo(() => summariseByUser(rows), [rows]);
  const totalLeads = byStage.reduce((sum, s) => sum + s.leads, 0);
  const totalValue = byStage.reduce((sum, s) => sum + s.value, 0);

  const set = (patch: Partial<SalesStageCriteria>) => setCriteria((c) => ({ ...c, ...patch }));
  const run = () => {
    setApplied(criteria);
    setTab("report");
  };

  const userName = (userId: string) => users.find((u) => u.value === userId)?.label ?? userId;
  const exportRows = byStage.map((s) => ({ stage: s.label, leads: s.leads, value: s.value }));
  const exportHeaders = [
    { key: "stage", label: "Stage" },
    { key: "leads", label: "Leads" },
    { key: "value", label: "Total Value" },
  ];

  return (
    <ReportFrame
      title="Sales Stage Status Report"
      subtitle={applied ? `${totalLeads} leads · ${formatCurrency(totalValue)}` : "Choose the criteria to run the report"}
      tab={tab}
      onTabChange={setTab}
      count={applied ? totalLeads : null}
      isRunning={isFetching}
      onRun={run}
      onCsv={() => exportToExcel(exportRows, exportHeaders, "sales-stage-report")}
      onPdf={() => exportToPDF(exportRows, exportHeaders, "Sales Stage Report", "sales-stage-report")}
      criteria={
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-2">
            <Label htmlFor="ss-from">Date From</Label>
            <Input id="ss-from" type="date" value={criteria.fromDate} onChange={(e) => set({ fromDate: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="ss-to">Date To</Label>
            <Input id="ss-to" type="date" value={criteria.toDate} onChange={(e) => set({ toDate: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label>Region</Label>
            <MultiSelectCheckbox options={regions} selected={criteria.regions} onChange={(regions) => set({ regions })} />
          </div>
          <div className="space-y-2">
            <Label>Sales Manager</Label>
            <MultiSelectCheckbox options={users} selected={criteria.assignedTos} onChange={(assignedTos) => set({ assignedTos })} />
          </div>
        </div>
      }
    >
      <div className="space-y-6">
        {byStage.length > 0 && (
          <Card>
            <CardContent className="p-4">
              <h3 className="text-sm font-semibold mb-3">Stage Distribution</h3>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={byStage}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="leads" name="Leads" radius={[4, 4, 0, 0]}>
                    {byStage.map((s) => (
                      <Cell key={s.stageId} fill={s.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Stage</TableHead>
                <TableHead className="text-right">Leads</TableHead>
                <TableHead className="text-right">Total Value</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {byStage.map((row) => (
                <TableRow key={row.stageId}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: row.color }} />
                      <span className="font-medium">{row.label}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">{row.leads}</TableCell>
                  <TableCell className="text-right">{formatCurrency(row.value)}</TableCell>
                </TableRow>
              ))}
              {byStage.length === 0 && (
                <ReportStateRow
                  colSpan={3}
                  isIdle={applied === null}
                  isLoading={isFetching}
                  error={error}
                  emptyMessage="No leads match the criteria"
                />
              )}
              {byStage.length > 0 && (
                <TableRow className="font-bold border-t-2">
                  <TableCell>Total</TableCell>
                  <TableCell className="text-right">{totalLeads}</TableCell>
                  <TableCell className="text-right">{formatCurrency(totalValue)}</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </Card>

        {byUser.length > 0 && (
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Sales Manager</TableHead>
                  <TableHead className="text-right">Leads</TableHead>
                  <TableHead className="text-right">Total Value</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {byUser.map((u) => (
                  <TableRow key={u.user}>
                    <TableCell className="font-medium">{userName(u.user)}</TableCell>
                    <TableCell className="text-right">{u.leads}</TableCell>
                    <TableCell className="text-right">{formatCurrency(u.value)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        )}
      </div>
    </ReportFrame>
  );
}
