"use client";

import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  IndianRupee, Trophy, BarChart3, Layers, FileText, Flame, Snowflake,
  SlidersHorizontal, Download, RotateCcw,
} from "lucide-react";
import { Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ComposedChart, Line, Legend, Cell } from "recharts";
import { useCRMLeads, useCRMMasterValues } from "@/lib/hooks/useCRM";
import { useCRMFiltersStore } from "@/lib/stores/crm-filters-store";
import { formatCurrency, formatCompactCurrency, STAGE_COLORS, getFinancialYears } from "@/lib/bay53crm/constants";
import { exportToExcel } from "@/lib/utils/report-export";
import type { LeadStage, CRMLead } from "@/lib/bay53crm/types";
import { CompactStat, FilterSelect } from "./DashboardWidgets";

const ALL_STAGES: LeadStage[] = ["Cold Lead", "Hot Lead", "Tender", "Tender Won", "Tender Lost", "Won", "Lost"];

const MONTHS = ["Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec", "Jan", "Feb", "Mar"];

export function UserReportsView() {
  const { selectedFY, setSelectedFY } = useCRMFiltersStore();
  const { data: leads = [] } = useCRMLeads();
  const { data: regions = [] } = useCRMMasterValues("region");
  const { data: verticals = [] } = useCRMMasterValues("vertical");
  const { data: customerStates = [] } = useCRMMasterValues("customer_state");
  const { data: assignedTosList = [] } = useCRMMasterValues("assigned_to");
  const { data: sourcesList = [] } = useCRMMasterValues("lead_source");

  // ===== Opportunity Pipeline filter state =====
  const [pipelineRegion, setPipelineRegion] = useState("all");
  const [pipelineCustomerState, setPipelineCustomerState] = useState("all");
  const [pipelineVertical, setPipelineVertical] = useState("all");
  const [pipelineAssignedTo, setPipelineAssignedTo] = useState("all");
  const [pipelineStage, setPipelineStage] = useState("all");
  const [pipelineSource, setPipelineSource] = useState("all");
  const [pipelineMonth, setPipelineMonth] = useState("all");

  // Filter leads by current FY
  const fy = getFinancialYears().find((y) => y.value === selectedFY) || getFinancialYears()[2];

  const filteredLeads = useMemo(() => {
    return leads.filter((l) => l.date >= fy.startDate && l.date <= fy.endDate);
  }, [leads, fy]);

  const monthPrefixMap = useMemo(() => {
    const map: Record<string, string> = {};
    MONTHS.forEach((label, i) => {
      const m = (3 + i) % 12 + 1;
      const year = m >= 4 ? Number(fy.value.split("-")[0]) : Number(fy.value.split("-")[1]);
      map[label] = `${year}-${String(m).padStart(2, "0")}`;
    });
    return map;
  }, [fy]);

  const pipelineFilteredLeads = useMemo(() => {
    return filteredLeads.filter((l) => {
      if (pipelineRegion !== "all" && l.regionId !== pipelineRegion) return false;
      if (pipelineCustomerState !== "all" && l.customerState !== pipelineCustomerState) return false;
      if (pipelineVertical !== "all" && l.vertical !== pipelineVertical) return false;
      if (pipelineAssignedTo !== "all" && l.assignedTo !== pipelineAssignedTo) return false;
      if (pipelineStage !== "all" && l.stage !== pipelineStage) return false;
      if (pipelineSource !== "all" && l.source !== pipelineSource) return false;
      if (pipelineMonth !== "all" && !l.date.startsWith(monthPrefixMap[pipelineMonth])) return false;
      return true;
    });
  }, [filteredLeads, pipelineRegion, pipelineCustomerState, pipelineVertical, pipelineAssignedTo, pipelineStage, pipelineSource, pipelineMonth, monthPrefixMap]);

  const activePipelineFilterCount = [
    pipelineRegion, pipelineCustomerState, pipelineVertical,
    pipelineAssignedTo, pipelineStage, pipelineSource, pipelineMonth,
  ].filter((v) => v !== "all").length;

  const pipelineFiltersActive = activePipelineFilterCount > 0;

  const clearPipelineFilters = () => {
    setPipelineRegion("all"); setPipelineCustomerState("all"); setPipelineVertical("all");
    setPipelineAssignedTo("all"); setPipelineStage("all"); setPipelineSource("all"); setPipelineMonth("all");
  };

  const pipelineKpis = useMemo(() => {
    const activeLeads = pipelineFilteredLeads.filter((l) => l.status === "active");
    const tenderLeads = pipelineFilteredLeads.filter((l) => l.stage === "Tender");
    const hotLeadsArr = pipelineFilteredLeads.filter((l) => l.stage === "Hot Lead");
    const coldLeadsArr = pipelineFilteredLeads.filter((l) => l.stage === "Cold Lead");
    const wonArr = pipelineFilteredLeads.filter((l) => l.stage === "Won" || l.stage === "Tender Won");
    return {
      totalCount: activeLeads.length, totalValue: activeLeads.reduce((s, l) => s + l.value, 0),
      tenderCount: tenderLeads.length, tenderValue: tenderLeads.reduce((s, l) => s + l.value, 0),
      hotCount: hotLeadsArr.length, hotValue: hotLeadsArr.reduce((s, l) => s + l.value, 0),
      coldCount: coldLeadsArr.length, coldValue: coldLeadsArr.reduce((s, l) => s + l.value, 0),
      wonCount: wonArr.length, wonValue: wonArr.reduce((s, l) => s + l.value, 0),
    };
  }, [pipelineFilteredLeads]);

  const stageComboData = useMemo(() => {
    const stages: LeadStage[] = ["Tender", "Hot Lead", "Cold Lead", "Won"];
    return stages
      .map((stage) => {
        const stageLeads = pipelineFilteredLeads.filter((l) => l.stage === stage);
        return {
          stage, value: stageLeads.reduce((s, l) => s + l.value, 0), count: stageLeads.length,
          fill: STAGE_COLORS[stage]?.chart || "#9ca3af",
        };
      })
      .sort((a, b) => b.value - a.value);
  }, [pipelineFilteredLeads]);

  const verticalComboData = useMemo(() => {
    const map = new Map<string, { value: number; count: number }>();
    pipelineFilteredLeads.forEach((l) => {
      const entry = map.get(l.vertical) || { value: 0, count: 0 };
      entry.value += l.value; entry.count += 1;
      map.set(l.vertical, entry);
    });
    const total = pipelineFilteredLeads.reduce((s, l) => s + l.value, 0) || 1;
    return Array.from(map.entries())
      .map(([vertical, d]) => ({ vertical, value: d.value, count: d.count, pct: Math.round((d.value / total) * 1000) / 10 }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);
  }, [pipelineFilteredLeads]);

  const stateComboData = useMemo(() => {
    const map = new Map<string, { value: number; count: number }>();
    pipelineFilteredLeads.forEach((l) => {
      const entry = map.get(l.customerState) || { value: 0, count: 0 };
      entry.value += l.value; entry.count += 1;
      map.set(l.customerState, entry);
    });
    const total = pipelineFilteredLeads.reduce((s, l) => s + l.value, 0) || 1;
    return Array.from(map.entries())
      .map(([state, d]) => ({ state, value: d.value, count: d.count, pct: Math.round((d.value / total) * 1000) / 10 }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);
  }, [pipelineFilteredLeads]);

  const regionNameOf = (regionId: string) => regions.find((r) => r.code === regionId || r.name === regionId)?.name || regionId;

  const topOpportunities = useMemo(() => {
    return [...pipelineFilteredLeads].sort((a, b) => b.value - a.value).slice(0, 5);
  }, [pipelineFilteredLeads]);

  const handleExportPipeline = () => {
    exportToExcel(
      pipelineFilteredLeads.map((l: CRMLead) => ({
        particulars: l.title,
        vertical: l.vertical,
        customer: l.customerName,
        region: regionNameOf(l.regionId),
        customerState: l.customerState,
        stage: l.stage,
        value: l.value,
        assignedTo: l.assignedTo,
      })),
      [
        { key: "particulars", label: "Particulars" },
        { key: "vertical", label: "Vertical" },
        { key: "customer", label: "Customer" },
        { key: "region", label: "Region" },
        { key: "customerState", label: "Customer State" },
        { key: "stage", label: "Stage" },
        { key: "value", label: "Value (Rupees)" },
        { key: "assignedTo", label: "Assigned To" },
      ],
      "opportunity-pipeline"
    );
  };

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* ===== HEADER ===== */}
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-lime-600 via-green-600 to-emerald-700 p-6">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMiIvPjwvZz48L2c+PC9zdmc+')] opacity-30" />
        <div className="relative flex items-center justify-between">
          <div className="space-y-1">
            <h1 className="text-2xl font-bold tracking-tight text-white">User Reports &amp; Dashboard</h1>
            <p className="text-sm text-white/80">
              {fy.label} · Opportunity pipeline analytics
            </p>
          </div>
          <Select value={selectedFY} onValueChange={setSelectedFY}>
            <SelectTrigger className="w-[160px] bg-white/15 border-white/20 text-white placeholder:text-white/60 [&_.lucide-chevron-down]:text-white/60">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {getFinancialYears().map((y) => (
                <SelectItem key={y.value} value={y.value}>{y.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* ===== Opportunity Pipeline Analytics ===== */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold tracking-tight">Opportunity Pipeline Analytics</h2>
            <p className="text-xs text-muted-foreground">{pipelineFilteredLeads.length} opportunities matching current filters</p>
          </div>
          <Button variant="outline" size="sm" onClick={handleExportPipeline}>
            <Download className="h-4 w-4 mr-1.5" />
            Export
          </Button>
        </div>

        {/* Filter Bar */}
        <Card className="shadow-sm border-0 ring-1 ring-border/50 overflow-hidden gap-0 py-0">
          <div className="flex items-center justify-between gap-2 border-b bg-muted/20 px-4 py-3">
            <div className="flex items-center gap-2.5">
              <div className="flex h-7 w-7 items-center justify-center rounded-md bg-[var(--report-accent-bg)]">
                <SlidersHorizontal className="h-3.5 w-3.5 text-[var(--report-accent)]" />
              </div>
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Filters</span>
              {activePipelineFilterCount > 0 && (
                <Badge className="h-5 rounded-full border-0 bg-[var(--report-accent)] px-2 text-[10px] font-semibold text-white">
                  {activePipelineFilterCount} active
                </Badge>
              )}
            </div>
            {pipelineFiltersActive && (
              <Button variant="ghost" size="sm" className="h-7 text-xs text-muted-foreground hover:text-foreground" onClick={clearPipelineFilters}>
                <RotateCcw className="h-3 w-3 mr-1" />
                Clear Filters
              </Button>
            )}
          </div>
          <CardContent className="p-4">
            <div className="grid grid-cols-2 gap-x-4 gap-y-4 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-7">
              <FilterSelect
                label="Region" value={pipelineRegion} onChange={setPipelineRegion}
                options={regions.map((r) => ({ label: r.name, value: r.code || r.name }))}
              />
              <FilterSelect
                label="Customer State" value={pipelineCustomerState} onChange={setPipelineCustomerState}
                options={customerStates.map((s) => ({ label: s.name, value: s.name }))}
              />
              <FilterSelect
                label="Vertical" value={pipelineVertical} onChange={setPipelineVertical}
                options={verticals.map((v) => ({ label: v.name, value: v.name }))}
              />
              <FilterSelect
                label="Assigned To" value={pipelineAssignedTo} onChange={setPipelineAssignedTo}
                options={assignedTosList.map((a) => ({ label: a.name, value: a.name }))}
              />
              <FilterSelect
                label="Stage" value={pipelineStage} onChange={setPipelineStage}
                options={ALL_STAGES.map((s) => ({ label: s, value: s }))}
              />
              <FilterSelect
                label="Source" value={pipelineSource} onChange={setPipelineSource}
                options={sourcesList.map((s) => ({ label: s.name, value: s.name }))}
              />
              <FilterSelect
                label="Month" value={pipelineMonth} onChange={setPipelineMonth}
                options={MONTHS.map((m) => ({ label: m, value: m }))}
              />
            </div>
          </CardContent>
        </Card>

        {/* Pipeline KPI Cards */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          <CompactStat
            icon={Layers} label="Total Pipeline" value={formatCompactCurrency(pipelineKpis.totalValue)}
            sub={`${pipelineKpis.totalCount} Opportunities`} color="blue"
          />
          <CompactStat
            icon={FileText} label="Tender Pipeline" value={formatCompactCurrency(pipelineKpis.tenderValue)}
            sub={`${pipelineKpis.tenderCount} Opportunities`} color="purple"
          />
          <CompactStat
            icon={Flame} label="Hot Leads" value={formatCompactCurrency(pipelineKpis.hotValue)}
            sub={`${pipelineKpis.hotCount} Opportunities`} color="amber"
          />
          <CompactStat
            icon={Snowflake} label="Cold Leads" value={formatCompactCurrency(pipelineKpis.coldValue)}
            sub={`${pipelineKpis.coldCount} Opportunities`} color="teal"
          />
          <CompactStat
            icon={Trophy} label="Won Business" value={formatCompactCurrency(pipelineKpis.wonValue)}
            sub={`${pipelineKpis.wonCount} Opportunities`} color="green"
          />
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
              <ResponsiveContainer width="100%" height={240}>
                <ComposedChart data={stageComboData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" strokeOpacity={0.4} />
                  <XAxis dataKey="stage" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                  <YAxis yAxisId="value" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} tickFormatter={(v) => formatCompactCurrency(v)} width={60} />
                  <YAxis yAxisId="count" orientation="right" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{ borderRadius: 8, border: "1px solid var(--border)", fontSize: 12 }}
                    formatter={(v: number | undefined, name: string | undefined) => (name === "Value (Rupees)" ? formatCompactCurrency(v ?? 0) : (v ?? 0))}
                  />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar yAxisId="value" dataKey="value" name="Value (Rupees)" radius={[4, 4, 0, 0]}>
                    {stageComboData.map((entry) => (
                      <Cell key={entry.stage} fill={entry.fill} />
                    ))}
                  </Bar>
                  <Line yAxisId="count" type="monotone" dataKey="count" name="No. of Opportunities" stroke="var(--foreground)" strokeWidth={2} dot={{ r: 4 }} />
                </ComposedChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="shadow-sm border-0 ring-1 ring-border/50">
            <CardHeader className="pb-2 border-b bg-muted/10">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-[var(--chart-4)]" />
                Pipeline by Vertical
              </CardTitle>
              <p className="text-[11px] text-muted-foreground">Value (Rupees) and % of Total Value</p>
            </CardHeader>
            <CardContent className="p-4">
              <ResponsiveContainer width="100%" height={240}>
                <ComposedChart data={verticalComboData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" strokeOpacity={0.4} />
                  <XAxis dataKey="vertical" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} interval={0} angle={-15} textAnchor="end" height={50} />
                  <YAxis yAxisId="value" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} tickFormatter={(v) => formatCompactCurrency(v)} width={60} />
                  <YAxis yAxisId="pct" orientation="right" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} tickFormatter={(v) => `${v}%`} />
                  <Tooltip
                    contentStyle={{ borderRadius: 8, border: "1px solid var(--border)", fontSize: 12 }}
                    formatter={(v: number | undefined, name: string | undefined) => (name === "Value (Rupees)" ? formatCompactCurrency(v ?? 0) : `${v ?? 0}%`)}
                  />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar yAxisId="value" dataKey="value" name="Value (Rupees)" fill="var(--chart-4)" radius={[4, 4, 0, 0]} />
                  <Line yAxisId="pct" type="monotone" dataKey="pct" name="% of Total Value" stroke="var(--foreground)" strokeWidth={2} dot={{ r: 4 }} />
                </ComposedChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="shadow-sm border-0 ring-1 ring-border/50">
            <CardHeader className="pb-2 border-b bg-muted/10">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <IndianRupee className="h-4 w-4 text-emerald-500" />
                Value by Customer State
              </CardTitle>
              <p className="text-[11px] text-muted-foreground">Value (Rupees) and % of Total Value</p>
            </CardHeader>
            <CardContent className="p-4">
              <ResponsiveContainer width="100%" height={240}>
                <ComposedChart data={stateComboData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" strokeOpacity={0.4} />
                  <XAxis dataKey="state" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} interval={0} angle={-15} textAnchor="end" height={50} />
                  <YAxis yAxisId="value" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} tickFormatter={(v) => formatCompactCurrency(v)} width={60} />
                  <YAxis yAxisId="pct" orientation="right" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} tickFormatter={(v) => `${v}%`} />
                  <Tooltip
                    contentStyle={{ borderRadius: 8, border: "1px solid var(--border)", fontSize: 12 }}
                    formatter={(v: number | undefined, name: string | undefined) => (name === "Value (Rupees)" ? formatCompactCurrency(v ?? 0) : `${v ?? 0}%`)}
                  />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar yAxisId="value" dataKey="value" name="Value (Rupees)" fill="#10b981" radius={[4, 4, 0, 0]} />
                  <Line yAxisId="pct" type="monotone" dataKey="pct" name="% of Total Value" stroke="var(--foreground)" strokeWidth={2} dot={{ r: 4 }} />
                </ComposedChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Top 5 Highest Value Opportunities */}
        <Card className="shadow-sm border-0 ring-1 ring-border/50">
          <CardHeader className="pb-2 border-b bg-muted/10">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Trophy className="h-4 w-4 text-amber-500" />
              Top 5 Highest Value Opportunities
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10">#</TableHead>
                  <TableHead>Particulars</TableHead>
                  <TableHead>Vertical</TableHead>
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
                    <TableCell colSpan={8} className="text-center text-sm text-muted-foreground py-8">
                      No opportunities match the current filters
                    </TableCell>
                  </TableRow>
                )}
                {topOpportunities.map((opp, i) => (
                  <TableRow key={opp.id}>
                    <TableCell className="text-muted-foreground">{i + 1}</TableCell>
                    <TableCell className="font-medium">{opp.title}</TableCell>
                    <TableCell>{opp.vertical}</TableCell>
                    <TableCell>{opp.customerName}</TableCell>
                    <TableCell>{regionNameOf(opp.regionId)}</TableCell>
                    <TableCell>{opp.customerState}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-[10px]" style={{ borderColor: STAGE_COLORS[opp.stage]?.chart, color: STAGE_COLORS[opp.stage]?.chart }}>
                        {opp.stage}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-semibold">{formatCurrency(opp.value)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
