"use client";

import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Bell, CheckCircle2, TrendingUp, TrendingDown, Users, IndianRupee, Target, Trophy, BarChart3, Activity, Percent, DollarSign, Layers, Eye, EyeOff, X, PieChart as PieChartIcon, FileText } from "lucide-react";
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line,
} from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { useCRMLeads, useCRMNotifications, useCRMCompanyConfig } from "@/lib/hooks/useCRM";
import { useCRMFiltersStore } from "@/lib/stores/crm-filters-store";
import { formatCurrency, STAGE_COLORS, getFinancialYears } from "@/lib/bay53crm/constants";
import { getLeadsByStage, getLeadsBySource } from "@/lib/bay53crm/data";
import type { LeadStage } from "@/lib/bay53crm/types";
import { cn } from "@/lib/utils";

const ALL_STAGES: LeadStage[] = ["Cold Lead", "Hot Lead", "Tender", "Tender Won", "Tender Lost", "Won", "Lost"];

// Colors palette for charts
const CHART_COLORS = [
  "var(--chart-1)", "var(--chart-3)", "var(--chart-4)",
  "var(--chart-2)", "var(--chart-5)", "var(--chart-1)",
  "var(--chart-4)", "var(--chart-3)", "var(--chart-5)", "var(--chart-2)",
];

// Month labels
const MONTHS = ["Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec", "Jan", "Feb", "Mar"];

const FOCUS_STAGES: LeadStage[] = ["Cold Lead", "Hot Lead", "Tender", "Tender Won", "Won"];

export function DashboardView() {
  const { selectedFY, setSelectedFY } = useCRMFiltersStore();
  const { data: leads = [] } = useCRMLeads();
  const { data: notifications = [] } = useCRMNotifications();
  const { data: companyConfig } = useCRMCompanyConfig();

  const [showNotifications, setShowNotifications] = useState(true);
  const [dismissedNotifs, setDismissedNotifs] = useState<Set<string>>(new Set());

  // Filter leads by current FY
  const fy = getFinancialYears().find((y) => y.value === selectedFY) || getFinancialYears()[2];

  const filteredLeads = useMemo(() => {
    return leads.filter((l) => l.date >= fy.startDate && l.date <= fy.endDate);
  }, [leads, fy]);

  // ===== KPI Calculations =====
  const kpis = useMemo(() => {
    const totalLeads = filteredLeads.length;
    const openLeads = filteredLeads.filter((l) => l.status === "active").length;
    const wonLeads = filteredLeads.filter((l) => l.stage === "Won" || l.stage === "Tender Won");
    const lostLeads = filteredLeads.filter((l) => l.stage === "Lost" || l.stage === "Tender Lost");
    const hotLeads = filteredLeads.filter((l) => l.stage === "Hot Lead");
    const tenders = filteredLeads.filter((l) => l.stage === "Tender" || l.stage === "Tender Won");
    const wonValue = wonLeads.reduce((sum, l) => sum + l.value, 0);
    const lostValue = lostLeads.reduce((sum, l) => sum + l.value, 0);
    const totalWonLost = wonLeads.length + lostLeads.length;
    const winRate = totalWonLost > 0 ? Math.round((wonLeads.length / totalWonLost) * 100) : 0;
    const avgDealSize = wonLeads.length > 0 ? Math.round(wonValue / wonLeads.length) : 0;
    const pendingLeads = filteredLeads.filter((l) => l.status === "active" && l.stage !== "Won" && l.stage !== "Tender Won");
    const yearlyTarget = companyConfig?.yearlyTargetRevenue || 0;
    const monthlyTarget = yearlyTarget / 12;
    const targetAttained = yearlyTarget > 0 ? Math.min(100, Math.round((wonValue / yearlyTarget) * 100)) : 0;

    return {
      totalLeads, openLeads, wonLeads: wonLeads.length, lostLeads: lostLeads.length,
      wonValue, lostValue, winRate, avgDealSize, pendingLeads: pendingLeads.length,
      hotLeads: hotLeads.length, tenders: tenders.length,
      monthlyTarget, yearlyTarget, targetAttained,
    };
  }, [filteredLeads, companyConfig]);

  // ===== Charts Data =====

  const leadsByStage = useMemo(() => getLeadsByStage(filteredLeads), [filteredLeads]);
  const leadsBySource = useMemo(() => getLeadsBySource(filteredLeads), [filteredLeads]);

  const stageChartConfig = useMemo(() => {
    const config: Record<string, { label: string; color: string }> = {};
    ALL_STAGES.forEach((s) => { config[s] = { label: s, color: STAGE_COLORS[s].chart }; });
    return config;
  }, []);

  // Monthly trend data
  const monthlyTrend = useMemo(() => {
    const monthData = MONTHS.map((label, i) => {
      const monthOffset = i; // Apr = index 0
      const m = (3 + monthOffset) % 12 + 1; // Apr=4, May=5, ..., Mar=3
      const year = m >= 4 ? Number(fy.value.split("-")[0]) : Number(fy.value.split("-")[1]);
      const prefix = `${year}-${String(m).padStart(2, "0")}`;
      const monthLeads = filteredLeads.filter((l) => l.date.startsWith(prefix));
      const monthWon = monthLeads.filter((l) => l.stage === "Won" || l.stage === "Tender Won");
      const monthValue = monthWon.reduce((s, l) => s + l.value, 0);
      return { label, leads: monthLeads.length, won: monthWon.length, value: monthValue, target: kpis.monthlyTarget };
    });
    return monthData;
  }, [filteredLeads, kpis.monthlyTarget, fy]);

  // Revenue by month (for bar chart)
  const revenueChart = useMemo(() => {
    return monthlyTrend.map((m) => ({
      label: m.label,
      actual: m.value,
      target: Math.round(kpis.monthlyTarget),
    }));
  }, [monthlyTrend, kpis.monthlyTarget]);

  // Conversion funnel
  const funnelData = useMemo(() => {
    return FOCUS_STAGES.map((stage) => {
      const count = filteredLeads.filter((l) => l.stage === stage).length;
      const value = filteredLeads.filter((l) => l.stage === stage).reduce((s, l) => s + l.value, 0);
      return { stage, count, value, fill: STAGE_COLORS[stage]?.chart || "#9ca3af" };
    });
  }, [filteredLeads]);

  const funnelMax = Math.max(...funnelData.map((d) => d.count), 1);

  // Assigned performance
  const assignedPerf = useMemo(() => {
    const map = new Map<string, { leads: number; won: number; value: number }>();
    filteredLeads.forEach((l) => {
      const entry = map.get(l.assignedTo) || { leads: 0, won: 0, value: 0 };
      entry.leads++;
      if (l.stage === "Won" || l.stage === "Tender Won") { entry.won++; entry.value += l.value; }
      map.set(l.assignedTo, entry);
    });
    return Array.from(map.entries())
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);
  }, [filteredLeads]);

  const activeNotifications = useMemo(() => {
    return notifications.filter((n) => !dismissedNotifs.has(n.id)).slice(0, 6);
  }, [notifications, dismissedNotifs]);

  const dismissNotif = (id: string) => {
    setDismissedNotifs((prev) => new Set(prev).add(id));
  };

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* ===== HEADER ===== */}
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-lime-600 via-green-600 to-emerald-700 p-6">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMiIvPjwvZz48L2c+PC9zdmc+')] opacity-30" />
        <div className="relative flex items-center justify-between">
          <div className="space-y-1">
            <h1 className="text-2xl font-bold tracking-tight text-white">CRM Dashboard</h1>
            <p className="text-sm text-white/80">
              {fy.label} · Real-time sales performance overview
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

      {/* ===== ROW 1: Compact Top Stats ===== */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        <CompactStat
          icon={Users} label="Total Leads" value={String(kpis.totalLeads)}
          trend={kpis.totalLeads > 0 ? "+" + kpis.totalLeads : "0"}
          trendUp={true} color="blue"
        />
        <CompactStat
          icon={Activity} label="Open Leads" value={String(kpis.openLeads)}
          sub={`${kpis.hotLeads} hot`} color="amber"
        />
        <CompactStat
          icon={Trophy} label="Orders Won" value={String(kpis.wonLeads)}
          sub={formatCurrency(kpis.wonValue)} color="green"
        />
        <CompactStat
          icon={AlertTriangle} label="Orders Lost" value={String(kpis.lostLeads)}
          sub={formatCurrency(kpis.lostValue)} color="red" trendDown
        />
        <CompactStat
          icon={Percent} label="Win Rate" value={`${kpis.winRate}%`}
          sub={`${kpis.wonLeads} won / ${kpis.wonLeads + kpis.lostLeads} closed`} color="purple"
        />
        <CompactStat
          icon={DollarSign} label="Avg Deal Size" value={formatCurrency(kpis.avgDealSize)}
          sub="Won deals only" color="teal"
        />
      </div>

      {/* ===== ROW 2: Main Charts Row (3 cols) ===== */}
      <div className="grid gap-6 lg:grid-cols-12">
        {/* Monthly Trend - Line Chart */}
        <Card className="lg:col-span-4 shadow-sm border-0 ring-1 ring-border/50">
          <CardHeader className="pb-2 border-b bg-muted/10">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-[var(--chart-1)]" />
              Monthly Lead Trend
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={monthlyTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" strokeOpacity={0.4} />
                <XAxis dataKey="label" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{ borderRadius: 8, border: "1px solid var(--border)", fontSize: 12 }}
                  labelFormatter={(label) => `${label}`}
                />
                <Line type="monotone" dataKey="leads" name="Leads" stroke="var(--chart-1)" strokeWidth={2.5} dot={{ r: 3 }} activeDot={{ r: 5 }} />
                <Line type="monotone" dataKey="won" name="Won" stroke="var(--chart-2)" strokeWidth={2} dot={{ r: 2 }} strokeDasharray="4 3" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Revenue Target vs Actual - Bar Chart */}
        <Card className="lg:col-span-4 shadow-sm border-0 ring-1 ring-border/50">
          <CardHeader className="pb-2 border-b bg-muted/10">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <IndianRupee className="h-4 w-4 text-emerald-500" />
              Revenue: Target vs Actual
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={revenueChart}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" strokeOpacity={0.4} />
                <XAxis dataKey="label" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} tickFormatter={(v) => `₹${(v / 100000).toFixed(0)}L`} />
                <Tooltip
                  contentStyle={{ borderRadius: 8, border: "1px solid var(--border)", fontSize: 12 }}
                />
                <Bar dataKey="target" name="Target" fill="#94a3b8" radius={[3, 3, 0, 0]} opacity={0.5} />
                <Bar dataKey="actual" name="Actual" fill="#10b981" radius={[3, 3, 0, 0]}>
                  {revenueChart.map((entry, i) => (
                    <Cell key={i} fill={entry.actual >= entry.target ? "#10b981" : "#f59e0b"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Sales Pipeline / Funnel */}
        <Card className="lg:col-span-4 shadow-sm border-0 ring-1 ring-border/50">
          <CardHeader className="pb-2 border-b bg-muted/10">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Layers className="h-4 w-4 text-[var(--chart-1)]" />
              Sales Pipeline
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 space-y-3">
            {funnelData.map((item) => {
              const pct = funnelMax > 0 ? (item.count / funnelMax) * 100 : 0;
              return (
                <div key={item.stage} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.fill }} />
                      <span className="font-medium">{item.stage}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-bold">{item.count}</span>
                      <span className="text-muted-foreground w-20 text-right">{formatCurrency(item.value)}</span>
                    </div>
                  </div>
                  <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${Math.max(pct, 3)}%`, backgroundColor: item.fill }}
                    />
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>

      {/* ===== ROW 3: KPI Achievement + Target Rings ===== */}
      <div className="grid gap-6 lg:grid-cols-12">
        {/* Win Rate Ring */}
        <Card className="lg:col-span-3 shadow-sm border-0 ring-1 ring-border/50">
          <CardContent className="p-5 flex flex-col items-center justify-center">
            <div className="relative w-28 h-28 mb-3">
              <svg className="w-28 h-28 -rotate-90" viewBox="0 0 120 120">
                <circle cx="60" cy="60" r="50" fill="none" stroke="var(--border)" strokeWidth="10" />
                <circle cx="60" cy="60" r="50" fill="none" stroke={kpis.winRate >= 50 ? "#22c55e" : "#f59e0b"} strokeWidth="10"
                  strokeDasharray={`${2 * Math.PI * 50}`}
                  strokeDashoffset={`${2 * Math.PI * 50 * (1 - kpis.winRate / 100)}`}
                  strokeLinecap="round"
                  className="transition-all duration-1000"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center flex-col">
                <span className="text-2xl font-bold">{kpis.winRate}%</span>
                <span className="text-[10px] text-muted-foreground">Win Rate</span>
              </div>
            </div>
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1"><CheckCircle2 className="h-3 w-3 text-green-500" />{kpis.wonLeads} Won</span>
              <span className="flex items-center gap-1"><X className="h-3 w-3 text-red-400" />{kpis.lostLeads} Lost</span>
            </div>
          </CardContent>
        </Card>

        {/* Target Attainment Ring */}
        <Card className="lg:col-span-3 shadow-sm border-0 ring-1 ring-border/50">
          <CardContent className="p-5 flex flex-col items-center justify-center">
            <div className="relative w-28 h-28 mb-3">
              <svg className="w-28 h-28 -rotate-90" viewBox="0 0 120 120">
                <circle cx="60" cy="60" r="50" fill="none" stroke="var(--border)" strokeWidth="10" />
                <circle cx="60" cy="60" r="50" fill="none" stroke={kpis.targetAttained >= 75 ? "#22c55e" : kpis.targetAttained >= 40 ? "#f59e0b" : "#ef4444"} strokeWidth="10"
                  strokeDasharray={`${2 * Math.PI * 50}`}
                  strokeDashoffset={`${2 * Math.PI * 50 * (1 - kpis.targetAttained / 100)}`}
                  strokeLinecap="round"
                  className="transition-all duration-1000"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center flex-col">
                <span className="text-2xl font-bold">{kpis.targetAttained}%</span>
                <span className="text-[10px] text-muted-foreground">Attained</span>
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Target className="h-3 w-3" />
              <span>Target: {formatCurrency(kpis.yearlyTarget)}</span>
            </div>
            <div className="w-full mt-2">
              <div className="flex justify-between text-[10px] text-muted-foreground mb-1">
                <span>{formatCurrency(kpis.wonValue)}</span>
                <span>of {formatCurrency(kpis.yearlyTarget)}</span>
              </div>
              <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-1000"
                  style={{
                    width: `${kpis.targetAttained}%`,
                    background: kpis.targetAttained >= 75 ? "linear-gradient(90deg, #22c55e, #16a34a)" : kpis.targetAttained >= 40 ? "linear-gradient(90deg, #f59e0b, #d97706)" : "linear-gradient(90deg, #ef4444, #dc2626)",
                  }}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Pending Leads Alert */}
        <Card className={cn(
          "lg:col-span-3 border-0 shadow-sm",
          kpis.pendingLeads > 0
            ? "bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-950/30 dark:to-orange-950/30 ring-1 ring-red-200 dark:ring-red-900"
            : "bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 ring-1 ring-green-200 dark:ring-green-900"
        )}>
          <CardContent className="p-5 flex flex-col items-center justify-center text-center">
            {kpis.pendingLeads > 0 ? (
              <>
                <div className="w-14 h-14 rounded-full bg-red-100 dark:bg-red-900/40 flex items-center justify-center mb-3">
                  <AlertTriangle className="h-7 w-7 text-red-500" />
                </div>
                <p className="text-3xl font-bold text-red-600 dark:text-red-400">{kpis.pendingLeads}</p>
                <p className="text-sm font-semibold text-red-700 dark:text-red-300 mt-1">Pending Leads</p>
                <p className="text-xs text-red-600/70 dark:text-red-400/70 mt-1">Require follow-up or action</p>
                {kpis.hotLeads > 0 && (
                  <Badge variant="outline" className="mt-2 border-amber-300 text-amber-700 bg-amber-50 dark:bg-amber-900/30 dark:text-amber-300">
                    {kpis.hotLeads} Hot Lead{kpis.hotLeads > 1 ? "s" : ""} need attention
                  </Badge>
                )}
              </>
            ) : (
              <>
                <div className="w-14 h-14 rounded-full bg-green-100 dark:bg-green-900/40 flex items-center justify-center mb-3">
                  <CheckCircle2 className="h-7 w-7 text-green-500" />
                </div>
                <p className="text-lg font-bold text-green-600 dark:text-green-400">All Clear!</p>
                <p className="text-xs text-green-600/70 dark:text-green-400/70 mt-1">No pending leads requiring action</p>
              </>
            )}
          </CardContent>
        </Card>

        {/* Top Performers */}
        <Card className="lg:col-span-3 shadow-sm border-0 ring-1 ring-border/50">
          <CardHeader className="pb-2 border-b bg-muted/10">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Users className="h-4 w-4 text-violet-500" />
              Top Performers
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <div className="space-y-3">
              {assignedPerf.length === 0 && (
                <p className="text-xs text-muted-foreground text-center py-4">No data yet</p>
              )}
              {assignedPerf.map((p, i) => {
                const maxVal = assignedPerf[0]?.value || 1;
                const barPct = p.value > 0 ? (p.value / maxVal) * 100 : 0;
                return (
                  <div key={p.name} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className={cn(
                          "w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white",
                          i === 0 ? "bg-amber-500" : i === 1 ? "bg-gray-400" : i === 2 ? "bg-amber-700" : "bg-muted-foreground/40"
                        )}>
                          {i + 1}
                        </span>
                        <span className="font-medium">{p.name}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-muted-foreground">{p.won} won</span>
                        <span className="font-semibold w-20 text-right">{formatCurrency(p.value)}</span>
                      </div>
                    </div>
                    <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${Math.max(barPct, 2)}%`, background: "linear-gradient(90deg, #8b5cf6, #6366f1)" }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ===== ROW 4: Charts + Notifications ===== */}
      <div className="grid gap-6 lg:grid-cols-12">
        {/* Leads By Stage - Donut */}
        <Card className="lg:col-span-3 shadow-sm border-0 ring-1 ring-border/50">
          <CardHeader className="pb-2 border-b bg-muted/10">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <PieChartIcon className="h-4 w-4 text-[var(--chart-1)]" />
              Leads By Stage
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <ChartContainer config={stageChartConfig} className="h-[180px]">
              <PieChart>
                <Pie data={leadsByStage} dataKey="count" nameKey="stage" cx="50%" cy="50%" outerRadius={65} innerRadius={40}>
                  {leadsByStage.map((entry) => (
                    <Cell key={entry.stage} fill={STAGE_COLORS[entry.stage]?.chart || "#9ca3af"} />
                  ))}
                </Pie>
                <ChartTooltip content={<ChartTooltipContent />} />
              </PieChart>
            </ChartContainer>
            <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1">
              {leadsByStage.map((entry) => (
                <div key={entry.stage} className="flex items-center gap-1.5 text-xs">
                  <div className="w-2 h-2 rounded-sm" style={{ backgroundColor: STAGE_COLORS[entry.stage]?.chart }} />
                  <span className="text-muted-foreground">{entry.stage}</span>
                  <span className="font-medium">{entry.count}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Leads By Source - Donut */}
        <Card className="lg:col-span-3 shadow-sm border-0 ring-1 ring-border/50">
          <CardHeader className="pb-2 border-b bg-muted/10">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-[var(--chart-4)]" />
              Leads By Source
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <ChartContainer
              config={leadsBySource.reduce((acc, s, i) => {
                acc[s.source] = { label: s.source, color: CHART_COLORS[i % CHART_COLORS.length] };
                return acc;
              }, {} as Record<string, { label: string; color: string }>)}
              className="h-[180px]"
            >
              <PieChart>
                <Pie data={leadsBySource} dataKey="count" nameKey="source" cx="50%" cy="50%" outerRadius={65} innerRadius={40}>
                  {leadsBySource.map((entry, i) => (
                    <Cell key={entry.source} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <ChartTooltip content={<ChartTooltipContent />} />
              </PieChart>
            </ChartContainer>
            <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1">
              {leadsBySource.map((entry, i) => (
                <div key={entry.source} className="flex items-center gap-1.5 text-xs">
                  <div className="w-2 h-2 rounded-sm" style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }} />
                  <span className="text-muted-foreground">{entry.source}</span>
                  <span className="font-medium">{entry.count}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Stage Value Distribution - Horizontal Bar */}
        <Card className="lg:col-span-3 shadow-sm border-0 ring-1 ring-border/50">
          <CardHeader className="pb-2 border-b bg-muted/10">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <IndianRupee className="h-4 w-4 text-emerald-500" />
              Value by Stage
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <div className="space-y-2.5">
              {leadsByStage
                .sort((a, b) => b.value - a.value)
                .map((entry) => {
                  const maxVal = Math.max(...leadsByStage.map((s) => s.value), 1);
                  const pct = (entry.value / maxVal) * 100;
                  return (
                    <div key={entry.stage} className="space-y-0.5">
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: STAGE_COLORS[entry.stage]?.chart }} />
                          <span className="text-muted-foreground">{entry.stage}</span>
                        </div>
                        <span className="font-medium text-xs">{formatCurrency(entry.value)}</span>
                      </div>
                      <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                        <div className="h-full rounded-full transition-all" style={{ width: `${Math.max(pct, 2)}%`, backgroundColor: STAGE_COLORS[entry.stage]?.chart }} />
                      </div>
                    </div>
                  );
                })}
            </div>
          </CardContent>
        </Card>

        {/* Notifications Panel */}
        <Card className="lg:col-span-3 shadow-sm border-0 ring-1 ring-border/50">
          <CardHeader className="pb-2 border-b bg-muted/10">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Bell className="h-4 w-4 text-amber-500" />
                Notifications
                {activeNotifications.length > 0 && (
                  <Badge variant="secondary" className="text-[10px] h-5">{activeNotifications.length}</Badge>
                )}
              </CardTitle>
              <Button variant="ghost" size="sm" className="h-6 text-xs" onClick={() => setShowNotifications(!showNotifications)}>
                {showNotifications ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {showNotifications && (
              <div className="divide-y max-h-[300px] overflow-y-auto">
                {activeNotifications.map((n) => (
                  <div key={n.id} className="flex items-start gap-3 p-3 hover:bg-muted/30 transition-colors group relative">
                    <div className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center shrink-0",
                      n.type === "lead_won" ? "bg-green-100 text-green-600" :
                      n.type === "tender_deadline" ? "bg-red-100 text-red-600" :
                      n.type === "project_update" ? "bg-[var(--report-accent-bg)] text-[var(--report-accent)]" :
                      "bg-amber-100 text-amber-600"
                    )}>
                      <Bell className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold">{n.title}</p>
                      <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-2">{n.message}</p>
                      <p className="text-[10px] text-muted-foreground/60 mt-1">
                        {new Date(n.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>
                    <button
                      onClick={() => dismissNotif(n.id)}
                      className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-foreground"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
                {activeNotifications.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                    <CheckCircle2 className="h-8 w-8 mb-2 text-green-400" />
                    <p className="text-sm">All caught up!</p>
                    <p className="text-xs">No new notifications</p>
                  </div>
                )}
              </div>
            )}
            {!showNotifications && (
              <div className="flex items-center justify-center py-8 text-muted-foreground">
                <p className="text-xs">Notifications hidden</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ===== BOTTOM: Quick Stats Bar ===== */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <QuickStat label="Hot Leads Needing Urgent Attention" value={String(kpis.hotLeads)} icon={TrendingUp} />
        <QuickStat label="Open Tenders" value={String(kpis.tenders)} icon={FileText} />
        <QuickStat label="Pending Follow-ups" value={String(kpis.pendingLeads)} icon={Activity} />
        <QuickStat label="Monthly Target" value={formatCurrency(kpis.monthlyTarget)} icon={Target} />
      </div>
    </div>
  );
}

// ==================== Sub-components ====================

interface CompactStatProps {
  icon: React.ElementType;
  label: string;
  value: string;
  sub?: string;
  trend?: string;
  trendUp?: boolean;
  trendDown?: boolean;
  color: "blue" | "amber" | "green" | "red" | "purple" | "teal";
}

const colorMap: Record<string, { bg: string; icon: string; text: string; ring: string }> = {
  blue: { bg: "bg-[var(--report-accent-bg)]", icon: "text-[var(--report-accent)]", text: "text-[var(--report-accent)]", ring: "ring-[var(--report-accent-border)]" },
  amber: { bg: "bg-amber-50 dark:bg-amber-950/30", icon: "text-amber-500", text: "text-amber-700 dark:text-amber-300", ring: "ring-amber-200 dark:ring-amber-800" },
  green: { bg: "bg-green-50 dark:bg-green-950/30", icon: "text-green-500", text: "text-green-700 dark:text-green-300", ring: "ring-green-200 dark:ring-green-800" },
  red: { bg: "bg-red-50 dark:bg-red-950/30", icon: "text-red-500", text: "text-red-700 dark:text-red-300", ring: "ring-red-200 dark:ring-red-800" },
  purple: { bg: "bg-[var(--report-accent-bg)]", icon: "text-[var(--chart-4)]", text: "text-[var(--report-accent)]", ring: "ring-[var(--report-accent-border)]" },
  teal: { bg: "bg-teal-50 dark:bg-teal-950/30", icon: "text-teal-500", text: "text-teal-700 dark:text-teal-300", ring: "ring-teal-200 dark:ring-teal-800" },
};

function CompactStat({ icon: Icon, label, value, sub, trend, trendUp, trendDown, color }: CompactStatProps) {
  const c = colorMap[color];
  return (
    <Card className={cn("shadow-sm border-0 ring-1", c.ring)}>
      <CardContent className="p-3">
        <div className="flex items-start justify-between">
          <div className="space-y-0.5 min-w-0">
            <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider truncate">{label}</p>
            <p className={cn("text-lg font-bold", c.text)}>{value}</p>
            {sub && <p className="text-[10px] text-muted-foreground truncate">{sub}</p>}
          </div>
          <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center shrink-0", c.bg)}>
            <Icon className={cn("h-4 w-4", c.icon)} />
          </div>
        </div>
        {(trend || trendDown) && (
          <div className="flex items-center gap-1 mt-1.5">
            {trendUp && <TrendingUp className="h-3 w-3 text-green-500" />}
            {trendDown && <TrendingDown className="h-3 w-3 text-red-400" />}
            {trend && <span className="text-[10px] text-muted-foreground">{trend}</span>}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function QuickStat({ label, value, icon: Icon }: { label: string; value: string; icon: React.ElementType }) {
  return (
    <Card className="bg-muted/20 border-dashed">
      <CardContent className="p-3 flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-background border flex items-center justify-center shrink-0">
          <Icon className="h-4 w-4 text-muted-foreground" />
        </div>
        <div className="min-w-0">
          <p className="text-[10px] text-muted-foreground">{label}</p>
          <p className="text-sm font-semibold">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}

