"use client";

import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { IndianRupee, Trophy, BarChart3, Layers, FileText, Flame, Snowflake, Sun, SlidersHorizontal, Download, RotateCcw } from "lucide-react";
import { Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ComposedChart, Line, Legend, Cell } from "recharts";
import { useAllCrmUsers, useFinancialYears, useLeads } from "@/lib/bay53crm/api/queries";
import type { CrmFinancialYear, CrmLeadListItem, CrmUserRef } from "@/lib/bay53crm/api";
import { useCRMFiltersStore } from "@/lib/stores/crm-filters-store";
import { formatCurrency, formatCompactCurrency } from "@/lib/bay53crm/constants";
import {
  filterPipeline,
  findFinancialYear,
  fyValue,
  groupTotals,
  leadsByStage,
  MONTH_LABELS,
  NO_PIPELINE_FILTERS,
  pipelineFiltersActive,
  sumValue,
  type GroupTotal,
  type PipelineFilters,
} from "@/lib/bay53crm/dashboard";
import { distinct, LEAD_STAGES, listStageLabel, stageChartColor } from "@/lib/bay53crm/leads";
import { exportToExcel } from "@/lib/utils/report-export";
import { CompactStat, FilterSelect } from "./DashboardWidgets";

const NO_YEARS: CrmFinancialYear[] = [];
const NO_LEADS: CrmLeadListItem[] = [];
const NO_USERS: CrmUserRef[] = [];

const ALL = "all";
const TOP_OPPORTUNITIES = 5;
const TOOLTIP_STYLE = { borderRadius: 8, border: "1px solid var(--border)", fontSize: 12 };
const VALUE_NAME = "Value (Rupees)";

const asOption = (value: string) => ({ label: value, value });

const MAX_TICK_CHARS = 14;
/** Axis labels are cut short so neighbours do not overlap; the tooltip still shows the full name. */
const shortLabel = (name: string) => (name.length > MAX_TICK_CHARS ? `${name.slice(0, MAX_TICK_CHARS - 1)}…` : name);

const AXIS_LABELS = { interval: 0, angle: -25, textAnchor: "end", height: 70 } as const;

const stageStats = (leads: CrmLeadListItem[], label: string) => {
  const inStage = leads.filter((l) => listStageLabel(l.stage) === label);
  return { count: inStage.length, value: sumValue(inStage) };
};

interface GroupChartProps {
  title: string;
  icon: React.ReactNode;
  data: GroupTotal[];
  barColor: string;
}

/** Value bars with the share of the total value as a line, for one grouping of the pipeline. */
function GroupChart({ title, icon, data, barColor }: GroupChartProps) {
  return (
    <Card className="shadow-sm border-0 ring-1 ring-border/50">
      <CardHeader className="pb-2 border-b bg-muted/10">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">{icon}{title}</CardTitle>
        <p className="text-[11px] text-muted-foreground">Value (Rupees) and % of Total Value</p>
      </CardHeader>
      <CardContent className="p-4">
        {data.length === 0 ? (
          <p className="py-16 text-center text-sm text-muted-foreground">No opportunities match the current filters</p>
        ) : (
          <ResponsiveContainer width="100%" height={240}>
            <ComposedChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" strokeOpacity={0.4} />
              <XAxis dataKey="name" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} tickFormatter={shortLabel} {...AXIS_LABELS} />
              <YAxis yAxisId="value" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} tickFormatter={(v) => formatCompactCurrency(v)} width={60} />
              <YAxis yAxisId="pct" orientation="right" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} tickFormatter={(v) => `${v}%`} />
              <Tooltip
                contentStyle={TOOLTIP_STYLE}
                formatter={(v: number | undefined, name: string | undefined) => (name === VALUE_NAME ? formatCompactCurrency(v ?? 0) : `${v ?? 0}%`)}
              />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar yAxisId="value" dataKey="value" name={VALUE_NAME} fill={barColor} radius={[4, 4, 0, 0]} />
              <Line yAxisId="pct" type="monotone" dataKey="pct" name="% of Total Value" stroke="var(--foreground)" strokeWidth={2} dot={{ r: 4 }} />
            </ComposedChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}

export function UserReportsView() {
  const { selectedFY, setSelectedFY } = useCRMFiltersStore();
  const { data: years = NO_YEARS } = useFinancialYears();
  const fy = findFinancialYear(years, selectedFY);

  // The same year-scoped lead list the dashboard uses, so the two screens share one request.
  const { data: leads = NO_LEADS, isLoading, isError, error } = useLeads(
    { fromDate: fy?.fromDate, toDate: fy?.toDate, isArchive: false },
    { enabled: !!fy }
  );
  const { data: users = NO_USERS } = useAllCrmUsers();

  const [filters, setFilters] = useState<PipelineFilters>(NO_PIPELINE_FILTERS);
  const setFilter = (key: keyof PipelineFilters) => (value: string) =>
    setFilters((f) => ({ ...f, [key]: value === ALL ? "" : value }));
  const shown = (key: keyof PipelineFilters) => filters[key] || ALL;

  const filtered = useMemo(() => filterPipeline(leads, filters), [leads, filters]);
  const activeFilterCount = Object.values(filters).filter(Boolean).length;

  const regionOptions = useMemo(() => distinct(leads.map((l) => l.companyRegion)).map(asOption), [leads]);
  const stateOptions = useMemo(() => distinct(leads.map((l) => l.customerState)).map(asOption), [leads]);
  const stageOptions = useMemo(() => LEAD_STAGES.map((s) => asOption(s.label)), []);
  const ownerOptions = useMemo(
    () =>
      distinct(leads.map((l) => l.assignTo)).map((userName) => ({
        label: users.find((u) => u.userName === userName)?.fullName ?? userName,
        value: userName,
      })),
    [leads, users]
  );
  const monthOptions = useMemo(() => MONTH_LABELS.map(asOption), []);

  const kpis = useMemo(
    () => ({
      total: { count: filtered.length, value: sumValue(filtered) },
      tender: stageStats(filtered, "Tender"),
      hot: stageStats(filtered, "Hot Lead"),
      warm: stageStats(filtered, "Warm Lead"),
      cold: stageStats(filtered, "Cold Lead"),
    }),
    [filtered]
  );

  const stageData = useMemo(() => leadsByStage(filtered), [filtered]);
  const regionData = useMemo(() => groupTotals(filtered, (l) => l.companyRegion), [filtered]);
  const stateData = useMemo(() => groupTotals(filtered, (l) => l.customerState), [filtered]);
  const topOpportunities = useMemo(
    () => [...filtered].sort((a, b) => b.value - a.value).slice(0, TOP_OPPORTUNITIES),
    [filtered]
  );

  const ownerName = (userName?: string) => users.find((u) => u.userName === userName)?.fullName ?? userName ?? "";

  const handleExport = () =>
    exportToExcel(
      filtered.map((l) => ({
        particulars: l.title,
        customer: l.customer,
        region: l.companyRegion ?? "",
        customerState: l.customerState ?? "",
        stage: listStageLabel(l.stage),
        value: l.value,
        assignedTo: ownerName(l.assignTo),
      })),
      [
        { key: "particulars", label: "Particulars" },
        { key: "customer", label: "Customer" },
        { key: "region", label: "Region" },
        { key: "customerState", label: "Customer State" },
        { key: "stage", label: "Stage" },
        { key: "value", label: "Value (Rupees)" },
        { key: "assignedTo", label: "Assigned To" },
      ],
      "opportunity-pipeline"
    );

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* ===== HEADER ===== */}
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-lime-600 via-green-600 to-emerald-700 p-6">
        <div className="relative flex items-center justify-between">
          <div className="space-y-1">
            <h1 className="text-2xl font-bold tracking-tight text-white">User Reports &amp; Dashboard</h1>
            <p className="text-sm text-white/80">{fy ? fy.title : "Loading"} · Opportunity pipeline analytics</p>
          </div>
          <Select value={fy ? fyValue(fy) : ""} onValueChange={setSelectedFY}>
            <SelectTrigger
              aria-label="Financial year"
              className="w-[160px] bg-white/15 border-white/20 text-white placeholder:text-white/60 [&_.lucide-chevron-down]:text-white/60"
            >
              <SelectValue placeholder="Financial year" />
            </SelectTrigger>
            <SelectContent>
              {years.map((y) => (
                <SelectItem key={fyValue(y)} value={fyValue(y)}>{y.title}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {isError && (
        <p className="text-sm text-destructive">
          Could not load the pipeline{error instanceof Error ? `: ${error.message}` : ""}.
        </p>
      )}

      {/* ===== Opportunity Pipeline Analytics ===== */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold tracking-tight">Opportunity Pipeline Analytics</h2>
            <p className="text-xs text-muted-foreground">
              {isLoading ? "Loading opportunities..." : `${filtered.length} opportunities matching current filters`}
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={handleExport} disabled={filtered.length === 0}>
            <Download className="h-4 w-4 mr-1.5" />
            Export
          </Button>
        </div>

        {/* Filter Bar */}
        <Card className="shadow-sm border-0 ring-1 ring-border/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <SlidersHorizontal className="h-4 w-4 text-muted-foreground" />
                Filters
                {activeFilterCount > 0 && (
                  <Badge variant="secondary" className="text-[11px]">{activeFilterCount} active</Badge>
                )}
              </div>
              {pipelineFiltersActive(filters) && (
                <Button variant="ghost" size="sm" className="h-8 text-xs" onClick={() => setFilters(NO_PIPELINE_FILTERS)}>
                  <RotateCcw className="h-3 w-3 mr-1" />
                  Clear all
                </Button>
              )}
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
              <FilterSelect label="Region" value={shown("region")} onChange={setFilter("region")} options={regionOptions} />
              <FilterSelect label="Customer State" value={shown("state")} onChange={setFilter("state")} options={stateOptions} />
              <FilterSelect label="Assigned To" value={shown("assignTo")} onChange={setFilter("assignTo")} options={ownerOptions} />
              <FilterSelect label="Stage" value={shown("stage")} onChange={setFilter("stage")} options={stageOptions} />
              <FilterSelect label="Month" value={shown("month")} onChange={setFilter("month")} options={monthOptions} />
            </div>
          </CardContent>
        </Card>

        {/* Pipeline KPI Cards */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          <CompactStat icon={Layers} label="Total Pipeline" value={formatCompactCurrency(kpis.total.value)} sub={`${kpis.total.count} Opportunities`} color="blue" />
          <CompactStat icon={FileText} label="Tender Pipeline" value={formatCompactCurrency(kpis.tender.value)} sub={`${kpis.tender.count} Opportunities`} color="purple" />
          <CompactStat icon={Flame} label="Hot Leads" value={formatCompactCurrency(kpis.hot.value)} sub={`${kpis.hot.count} Opportunities`} color="amber" />
          <CompactStat icon={Sun} label="Warm Leads" value={formatCompactCurrency(kpis.warm.value)} sub={`${kpis.warm.count} Opportunities`} color="red" />
          <CompactStat icon={Snowflake} label="Cold Leads" value={formatCompactCurrency(kpis.cold.value)} sub={`${kpis.cold.count} Opportunities`} color="teal" />
        </div>

        {/* Pipeline Combo Charts */}
        <div className="grid gap-6 lg:grid-cols-3">
          <Card className="shadow-sm border-0 ring-1 ring-border/50">
            <CardHeader className="pb-2 border-b bg-muted/10">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Layers className="h-4 w-4 text-[var(--chart-1)]" />
                Pipeline by Stage
              </CardTitle>
              <p className="text-[11px] text-muted-foreground">Count of Opportunities &amp; Values</p>
            </CardHeader>
            <CardContent className="p-4">
              {stageData.length === 0 ? (
                <p className="py-16 text-center text-sm text-muted-foreground">No opportunities match the current filters</p>
              ) : (
                <ResponsiveContainer width="100%" height={240}>
                  <ComposedChart data={stageData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" strokeOpacity={0.4} />
                    <XAxis dataKey="stage" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} tickFormatter={shortLabel} {...AXIS_LABELS} />
                    <YAxis yAxisId="value" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} tickFormatter={(v) => formatCompactCurrency(v)} width={60} />
                    <YAxis yAxisId="count" orientation="right" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} allowDecimals={false} />
                    <Tooltip
                      contentStyle={TOOLTIP_STYLE}
                      formatter={(v: number | undefined, name: string | undefined) => (name === VALUE_NAME ? formatCompactCurrency(v ?? 0) : (v ?? 0))}
                    />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Bar yAxisId="value" dataKey="value" name={VALUE_NAME} radius={[4, 4, 0, 0]}>
                      {stageData.map((entry) => (
                        <Cell key={entry.stage} fill={entry.color} />
                      ))}
                    </Bar>
                    <Line yAxisId="count" type="monotone" dataKey="count" name="No. of Opportunities" stroke="var(--foreground)" strokeWidth={2} dot={{ r: 4 }} />
                  </ComposedChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          <GroupChart title="Pipeline by Region" icon={<BarChart3 className="h-4 w-4 text-[var(--chart-4)]" />} data={regionData} barColor="var(--chart-4)" />
          <GroupChart title="Value by Customer State" icon={<IndianRupee className="h-4 w-4 text-emerald-500" />} data={stateData} barColor="#10b981" />
        </div>

        {/* Top Highest Value Opportunities */}
        <Card className="shadow-sm border-0 ring-1 ring-border/50">
          <CardHeader className="pb-2 border-b bg-muted/10">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Trophy className="h-4 w-4 text-amber-500" />
              Top {TOP_OPPORTUNITIES} Highest Value Opportunities
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10">#</TableHead>
                  <TableHead>Particulars</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Region</TableHead>
                  <TableHead>Customer State</TableHead>
                  <TableHead>Stage</TableHead>
                  <TableHead className="text-right">Value (Rupees)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {topOpportunities.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-sm text-muted-foreground py-8">
                      {isLoading ? "Loading opportunities..." : "No opportunities match the current filters"}
                    </TableCell>
                  </TableRow>
                )}
                {topOpportunities.map((opp, i) => {
                  const stage = listStageLabel(opp.stage);
                  return (
                    <TableRow key={opp.id}>
                      <TableCell className="text-muted-foreground">{i + 1}</TableCell>
                      <TableCell className="font-medium">{opp.title}</TableCell>
                      <TableCell>{opp.customer}</TableCell>
                      <TableCell>{opp.companyRegion}</TableCell>
                      <TableCell>{opp.customerState}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-[10px]" style={{ borderColor: stageChartColor(stage), color: stageChartColor(stage) }}>
                          {stage}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-semibold">{formatCurrency(opp.value)}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
