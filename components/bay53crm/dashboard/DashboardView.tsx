"use client";

import { useMemo } from "react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  AlertTriangle, Bell, CheckCircle2, TrendingUp, Users, IndianRupee, Target, Trophy,
  Activity, Percent, Layers, X, PieChart as PieChartIcon, FileText, Wallet,
} from "lucide-react";
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line,
} from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import {
  useDashboardResult,
  useFinancialYears,
  useLeads,
  useMarkNotificationRead,
  useUserNotifications,
} from "@/lib/bay53crm/api/queries";
import type { CrmFinancialYear, CrmLeadListItem, CrmUserNotification } from "@/lib/bay53crm/api";
import { useCRMFiltersStore } from "@/lib/stores/crm-filters-store";
import { formatCurrency } from "@/lib/bay53crm/constants";
import {
  findFinancialYear,
  fyValue,
  leadsByStage,
  monthlyTotals,
  splitNotification,
  sumValue,
  topOwners,
  winRate,
} from "@/lib/bay53crm/dashboard";
import { cn } from "@/lib/utils";
import { CompactStat, QuickStat } from "./DashboardWidgets";

const NO_YEARS: CrmFinancialYear[] = [];
const NO_LEADS: CrmLeadListItem[] = [];
const NO_NOTIFICATIONS: CrmUserNotification[] = [];

const MAX_NOTIFICATIONS = 6;
const HOT_STAGE = "Hot Lead";
const TENDER_STAGE = "Tender";

export function DashboardView() {
  const { selectedFY, setSelectedFY } = useCRMFiltersStore();
  const { data: years = NO_YEARS } = useFinancialYears();
  const fy = findFinancialYear(years, selectedFY);

  // The dashboard numbers and the lead list cover the same financial year.
  const range = { fromDate: fy?.fromDate, toDate: fy?.toDate };
  const { data: dash, isError: dashFailed, error: dashError } = useDashboardResult(range, { enabled: !!fy });
  const { data: leads = NO_LEADS, isError: leadsFailed } = useLeads({ ...range, isArchive: false }, { enabled: !!fy });
  const { data: notificationList } = useUserNotifications({});
  const markRead = useMarkNotificationRead();

  const totalLeads = dash?.totalLeads ?? 0;
  const openLeads = dash?.openLeads ?? 0;
  const ordersWon = dash?.ordersWon ?? 0;
  const ordersLost = dash?.ordersLost ?? 0;
  const pendingLeads = dash?.pendingLeads ?? 0;
  const monthlyTarget = dash?.monthlyTargetRevenue ?? 0;
  // Common/DashboardResult names this yearlyActualRevenue, but it equals twelve months of the target.
  const yearlyTarget = monthlyTarget * 12;

  const pipelineValue = useMemo(() => sumValue(leads), [leads]);
  const coverage = yearlyTarget > 0 ? Math.min(100, Math.round((pipelineValue / yearlyTarget) * 100)) : 0;
  const rate = winRate(ordersWon, ordersLost);

  const stageTotals = useMemo(() => leadsByStage(leads), [leads]);
  const months = useMemo(() => monthlyTotals(leads), [leads]);
  const owners = useMemo(() => topOwners(leads), [leads]);
  const hotLeads = stageTotals.find((s) => s.stage === HOT_STAGE)?.count ?? 0;
  const openTenders = stageTotals.find((s) => s.stage === TENDER_STAGE)?.count ?? 0;

  const stageChartConfig = useMemo(
    () => Object.fromEntries(stageTotals.map((s) => [s.stage, { label: s.stage, color: s.color }])),
    [stageTotals]
  );
  const stageMaxCount = Math.max(...stageTotals.map((s) => s.count), 1);
  const stageMaxValue = Math.max(...stageTotals.map((s) => s.value), 1);
  const valueChart = months.map((m) => ({ label: m.label, pipeline: m.value, target: Math.round(monthlyTarget) }));

  // Unread messages only: reading one removes it from the panel.
  const notifications = (notificationList?.list ?? NO_NOTIFICATIONS).filter((n) => !n.isRead).slice(0, MAX_NOTIFICATIONS);
  const dismissNotification = async (id: number) => {
    try {
      await markRead.mutateAsync(id);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not dismiss the notification");
    }
  };

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* ===== HEADER ===== */}
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-lime-600 via-green-600 to-emerald-700 p-6">
        <div className="relative flex items-center justify-between">
          <div className="space-y-1">
            <h1 className="text-2xl font-bold tracking-tight text-white">Admin Reports &amp; Dashboard</h1>
            <p className="text-sm text-white/80">{fy ? fy.title : "Loading"} · Sales performance overview</p>
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

      {(dashFailed || leadsFailed) && (
        <p className="text-sm text-destructive">
          Could not load the dashboard{dashError instanceof Error ? `: ${dashError.message}` : ""}.
        </p>
      )}

      {/* ===== ROW 1: Compact Top Stats ===== */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        <CompactStat icon={Users} label="Total Leads" value={String(totalLeads)} color="blue" />
        <CompactStat icon={Activity} label="Open Leads" value={String(openLeads)} sub={`${hotLeads} hot`} color="amber" />
        <CompactStat icon={Trophy} label="Orders Won" value={String(ordersWon)} color="green" />
        <CompactStat icon={AlertTriangle} label="Orders Lost" value={String(ordersLost)} color="red" trendDown />
        <CompactStat
          icon={Percent}
          label="Win Rate"
          value={`${rate}%`}
          sub={`${ordersWon} won / ${ordersWon + ordersLost} closed`}
          color="purple"
        />
        <CompactStat icon={Wallet} label="Pipeline Value" value={formatCurrency(pipelineValue)} sub="Leads in this year" color="teal" />
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
              <LineChart data={months}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" strokeOpacity={0.4} />
                <XAxis dataKey="label" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid var(--border)", fontSize: 12 }} />
                <Line type="monotone" dataKey="leads" name="Leads" stroke="var(--chart-1)" strokeWidth={2.5} dot={{ r: 3 }} activeDot={{ r: 5 }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Pipeline value vs monthly target - Bar Chart */}
        <Card className="lg:col-span-4 shadow-sm border-0 ring-1 ring-border/50">
          <CardHeader className="pb-2 border-b bg-muted/10">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <IndianRupee className="h-4 w-4 text-emerald-500" />
              Pipeline vs Monthly Target
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={valueChart}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" strokeOpacity={0.4} />
                <XAxis dataKey="label" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} tickFormatter={(v) => `₹${(v / 100000).toFixed(0)}L`} />
                <Tooltip
                  contentStyle={{ borderRadius: 8, border: "1px solid var(--border)", fontSize: 12 }}
                  formatter={(v) => formatCurrency(Number(v))}
                />
                <Bar dataKey="target" name="Target" fill="#94a3b8" radius={[3, 3, 0, 0]} opacity={0.5} />
                <Bar dataKey="pipeline" name="Pipeline" fill="#10b981" radius={[3, 3, 0, 0]}>
                  {valueChart.map((entry, i) => (
                    <Cell key={i} fill={entry.pipeline >= entry.target ? "#10b981" : "#f59e0b"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Sales Pipeline: leads per stage */}
        <Card className="lg:col-span-4 shadow-sm border-0 ring-1 ring-border/50">
          <CardHeader className="pb-2 border-b bg-muted/10">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Layers className="h-4 w-4 text-[var(--chart-1)]" />
              Sales Pipeline
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 space-y-3 max-h-[260px] overflow-y-auto">
            {stageTotals.length === 0 && <p className="text-xs text-muted-foreground text-center py-4">No leads in this year</p>}
            {stageTotals.map((item) => (
              <div key={item.stage} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
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
                    style={{ width: `${Math.max((item.count / stageMaxCount) * 100, 3)}%`, backgroundColor: item.color }}
                  />
                </div>
              </div>
            ))}
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
                <circle cx="60" cy="60" r="50" fill="none" stroke={rate >= 50 ? "#22c55e" : "#f59e0b"} strokeWidth="10"
                  strokeDasharray={`${2 * Math.PI * 50}`}
                  strokeDashoffset={`${2 * Math.PI * 50 * (1 - rate / 100)}`}
                  strokeLinecap="round"
                  className="transition-all duration-1000"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center flex-col">
                <span className="text-2xl font-bold">{rate}%</span>
                <span className="text-[10px] text-muted-foreground">Win Rate</span>
              </div>
            </div>
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1"><CheckCircle2 className="h-3 w-3 text-green-500" />{ordersWon} Won</span>
              <span className="flex items-center gap-1"><X className="h-3 w-3 text-red-400" />{ordersLost} Lost</span>
            </div>
          </CardContent>
        </Card>

        {/* Pipeline coverage of the yearly target */}
        <Card className="lg:col-span-3 shadow-sm border-0 ring-1 ring-border/50">
          <CardContent className="p-5 flex flex-col items-center justify-center">
            <div className="relative w-28 h-28 mb-3">
              <svg className="w-28 h-28 -rotate-90" viewBox="0 0 120 120">
                <circle cx="60" cy="60" r="50" fill="none" stroke="var(--border)" strokeWidth="10" />
                <circle cx="60" cy="60" r="50" fill="none" stroke={coverage >= 75 ? "#22c55e" : coverage >= 40 ? "#f59e0b" : "#ef4444"} strokeWidth="10"
                  strokeDasharray={`${2 * Math.PI * 50}`}
                  strokeDashoffset={`${2 * Math.PI * 50 * (1 - coverage / 100)}`}
                  strokeLinecap="round"
                  className="transition-all duration-1000"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center flex-col">
                <span className="text-2xl font-bold">{coverage}%</span>
                <span className="text-[10px] text-muted-foreground">Covered</span>
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Target className="h-3 w-3" />
              <span>Target: {formatCurrency(yearlyTarget)}</span>
            </div>
            <div className="w-full mt-2">
              <div className="flex justify-between text-[10px] text-muted-foreground mb-1">
                <span>{formatCurrency(pipelineValue)} pipeline</span>
                <span>of {formatCurrency(yearlyTarget)}</span>
              </div>
              <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-1000"
                  style={{
                    width: `${coverage}%`,
                    background: coverage >= 75 ? "linear-gradient(90deg, #22c55e, #16a34a)" : coverage >= 40 ? "linear-gradient(90deg, #f59e0b, #d97706)" : "linear-gradient(90deg, #ef4444, #dc2626)",
                  }}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Pending Leads Alert */}
        <Card className={cn(
          "lg:col-span-3 border-0 shadow-sm",
          pendingLeads > 0
            ? "bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-950/30 dark:to-orange-950/30 ring-1 ring-red-200 dark:ring-red-900"
            : "bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 ring-1 ring-green-200 dark:ring-green-900"
        )}>
          <CardContent className="p-5 flex flex-col items-center justify-center text-center">
            {pendingLeads > 0 ? (
              <>
                <div className="w-14 h-14 rounded-full bg-red-100 dark:bg-red-900/40 flex items-center justify-center mb-3">
                  <AlertTriangle className="h-7 w-7 text-red-500" />
                </div>
                <p className="text-3xl font-bold text-red-600 dark:text-red-400">{pendingLeads}</p>
                <p className="text-sm font-semibold text-red-700 dark:text-red-300 mt-1">Pending Leads</p>
                <p className="text-xs text-red-600/70 dark:text-red-400/70 mt-1">Require follow-up or action</p>
                {hotLeads > 0 && (
                  <Badge variant="outline" className="mt-2 border-amber-300 text-amber-700 bg-amber-50 dark:bg-amber-900/30 dark:text-amber-300">
                    {hotLeads} Hot Lead{hotLeads > 1 ? "s" : ""} need attention
                  </Badge>
                )}
              </>
            ) : (
              <>
                <div className="w-14 h-14 rounded-full bg-green-100 dark:bg-green-900/40 flex items-center justify-center mb-3">
                  <CheckCircle2 className="h-7 w-7 text-green-500" />
                </div>
                <p className="text-lg font-bold text-green-600 dark:text-green-400">All Clear</p>
                <p className="text-xs text-green-600/70 dark:text-green-400/70 mt-1">No pending leads requiring action</p>
              </>
            )}
          </CardContent>
        </Card>

        {/* Pipeline by owner */}
        <Card className="lg:col-span-3 shadow-sm border-0 ring-1 ring-border/50">
          <CardHeader className="pb-2 border-b bg-muted/10">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Users className="h-4 w-4 text-violet-500" />
              Pipeline by Owner
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <div className="space-y-3">
              {owners.length === 0 && <p className="text-xs text-muted-foreground text-center py-4">No data yet</p>}
              {owners.map((p, i) => {
                const maxVal = owners[0]?.value || 1;
                const barPct = p.value > 0 ? (p.value / maxVal) * 100 : 0;
                return (
                  <div key={p.assignTo} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className={cn(
                          "w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white",
                          i === 0 ? "bg-amber-500" : i === 1 ? "bg-gray-400" : i === 2 ? "bg-amber-700" : "bg-muted-foreground/40"
                        )}>
                          {i + 1}
                        </span>
                        <span className="font-medium">{p.assignTo}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-muted-foreground">{p.leads} leads</span>
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
        <Card className="lg:col-span-4 shadow-sm border-0 ring-1 ring-border/50">
          <CardHeader className="pb-2 border-b bg-muted/10">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <PieChartIcon className="h-4 w-4 text-[var(--chart-1)]" />
              Leads By Stage
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <ChartContainer config={stageChartConfig} className="h-[180px]">
              <PieChart>
                <Pie data={stageTotals} dataKey="count" nameKey="stage" cx="50%" cy="50%" outerRadius={65} innerRadius={40}>
                  {stageTotals.map((entry) => (
                    <Cell key={entry.stage} fill={entry.color} />
                  ))}
                </Pie>
                <ChartTooltip content={<ChartTooltipContent />} />
              </PieChart>
            </ChartContainer>
            <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1">
              {stageTotals.map((entry) => (
                <div key={entry.stage} className="flex items-center gap-1.5 text-xs">
                  <div className="w-2 h-2 rounded-sm" style={{ backgroundColor: entry.color }} />
                  <span className="text-muted-foreground">{entry.stage}</span>
                  <span className="font-medium">{entry.count}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Stage Value Distribution - Horizontal Bar */}
        <Card className="lg:col-span-4 shadow-sm border-0 ring-1 ring-border/50">
          <CardHeader className="pb-2 border-b bg-muted/10">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <IndianRupee className="h-4 w-4 text-emerald-500" />
              Value by Stage
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <div className="space-y-2.5">
              {stageTotals.length === 0 && <p className="text-xs text-muted-foreground text-center py-4">No leads in this year</p>}
              {[...stageTotals]
                .sort((a, b) => b.value - a.value)
                .map((entry) => (
                  <div key={entry.stage} className="space-y-0.5">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
                        <span className="text-muted-foreground">{entry.stage}</span>
                      </div>
                      <span className="font-medium text-xs">{formatCurrency(entry.value)}</span>
                    </div>
                    <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{ width: `${Math.max((entry.value / stageMaxValue) * 100, 2)}%`, backgroundColor: entry.color }}
                      />
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>

        {/* Notifications Panel */}
        <Card className="lg:col-span-4 shadow-sm border-0 ring-1 ring-border/50">
          <CardHeader className="pb-2 border-b bg-muted/10">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Bell className="h-4 w-4 text-amber-500" />
              Notifications
              {notifications.length > 0 && <Badge variant="secondary" className="text-[10px] h-5">{notifications.length}</Badge>}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y max-h-[300px] overflow-y-auto">
              {notifications.map((n) => {
                const { headline, body } = splitNotification(n.result);
                return (
                  <div key={n.id} className="flex items-start gap-3 p-3 hover:bg-muted/30 transition-colors group relative">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 bg-amber-100 text-amber-600">
                      <Bell className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0 pr-5">
                      <p className="text-xs font-semibold line-clamp-2">{headline}</p>
                      {body && <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-2">{body}</p>}
                      <p className="text-[10px] text-muted-foreground/60 mt-1">
                        {new Date(n.date).toLocaleDateString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>
                    <button
                      type="button"
                      aria-label="Dismiss notification"
                      onClick={() => dismissNotification(n.id)}
                      className="absolute top-2 right-2 opacity-60 group-hover:opacity-100 focus-visible:opacity-100 transition-opacity text-muted-foreground hover:text-foreground"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                );
              })}
              {notifications.length === 0 && (
                <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                  <CheckCircle2 className="h-8 w-8 mb-2 text-green-400" />
                  <p className="text-sm">All caught up</p>
                  <p className="text-xs">No new notifications</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ===== BOTTOM: Quick Stats Bar ===== */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <QuickStat label="Hot Leads Needing Urgent Attention" value={String(hotLeads)} icon={TrendingUp} />
        <QuickStat label="Open Tenders" value={String(openTenders)} icon={FileText} />
        <QuickStat label="Pending Follow-ups" value={String(pendingLeads)} icon={Activity} />
        <QuickStat label="Monthly Target" value={formatCurrency(monthlyTarget)} icon={Target} />
      </div>
    </div>
  );
}
