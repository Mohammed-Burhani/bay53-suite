"use client";

import { useQuery } from "@tanstack/react-query";
import { getDashboardMetrics, formatCurrency } from "@/lib/store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Package,
  TrendingUp,
  TrendingDown,
  Users,
  AlertTriangle,
  IndianRupee,
  ArrowUpRight,
  ArrowDownRight,
  ShoppingCart,
  Truck,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

const COLORS = ["#6366f1", "#8b5cf6", "#a78bfa", "#c4b5fd", "#ddd6fe", "#ede9fe", "#f5f3ff", "#818cf8"];

export default function DashboardPage() {
  const { data } = useQuery({
    queryKey: ["dashboard"],
    queryFn: () => getDashboardMetrics(),
  });

  if (!data) return null;

  const { metrics, recentSales, salesByDay, topProducts, categoryBreakdown } = data;

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Welcome back! Here&apos;s your business overview.
        </p>
      </div>

      {/* Metric Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Today's Sales"
          value={formatCurrency(metrics.totalSalesToday || 28468.48)}
          subtitle="from invoices today"
          icon={<TrendingUp className="h-5 w-5" />}
          trend="+12.5%"
          trendUp
          iconBg="bg-emerald-100"
          iconColor="text-emerald-600"
          borderColor="border-l-emerald-500"
        />
        <MetricCard
          title="Monthly Sales"
          value={formatCurrency(metrics.totalSalesMonth)}
          subtitle="this month"
          icon={<IndianRupee className="h-5 w-5" />}
          trend="+8.2%"
          trendUp
          iconBg="bg-indigo-100"
          iconColor="text-indigo-600"
          borderColor="border-l-indigo-500"
        />
        <MetricCard
          title="Total Products"
          value={String(metrics.totalProducts)}
          subtitle={`${metrics.lowStockCount} low stock items`}
          icon={<Package className="h-5 w-5" />}
          alert={metrics.lowStockCount > 0}
          iconBg="bg-violet-100"
          iconColor="text-violet-600"
          borderColor="border-l-violet-500"
        />
        <MetricCard
          title="Receivables"
          value={formatCurrency(metrics.receivables)}
          subtitle={`Payables: ${formatCurrency(metrics.payables)}`}
          icon={<Users className="h-5 w-5" />}
          iconBg="bg-amber-100"
          iconColor="text-amber-600"
          borderColor="border-l-amber-500"
        />
      </div>

      {/* Charts Row */}
      <div className="grid gap-4 lg:grid-cols-7">
        {/* Sales Chart */}
        <Card className="lg:col-span-4">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Sales (Last 7 Days)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={salesByDay}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="day" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`}
                  />
                  <Tooltip
                    formatter={(value: number | undefined) => [formatCurrency(value || 0), "Sales"]}
                    contentStyle={{
                      borderRadius: "8px",
                      border: "1px solid hsl(var(--border))",
                      backgroundColor: "hsl(var(--card))",
                    }}
                  />
                  <Bar dataKey="amount" fill="#6366f1" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Category Breakdown */}
        <Card className="lg:col-span-3">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Inventory by Category</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryBreakdown}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="count"
                    nameKey="category"
                  >
                    {categoryBreakdown.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number | undefined, name: string | undefined) => [
                      `${value || 0} items`,
                      name || "",
                    ]}
                    contentStyle={{
                      borderRadius: "8px",
                      border: "1px solid hsl(var(--border))",
                      backgroundColor: "hsl(var(--card))",
                      fontSize: "12px",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-2 flex flex-wrap gap-2">
              {categoryBreakdown.slice(0, 5).map((cat, i) => (
                <div key={cat.category} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <div
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: COLORS[i % COLORS.length] }}
                  />
                  {cat.category}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bottom Row */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Recent Sales */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <div className="rounded-lg bg-cyan-100 p-1.5">
                <ShoppingCart className="h-3.5 w-3.5 text-cyan-600" />
              </div>
              Recent Sales
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentSales.map((sale) => (
                <div
                  key={sale.id}
                  className="flex items-center justify-between rounded-lg border border-border p-3 transition-colors hover:bg-muted/30"
                >
                  <div className="flex flex-col">
                    <span className="text-sm font-medium">{sale.partyName}</span>
                    <span className="text-xs text-muted-foreground">{sale.invoiceNumber}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={
                        sale.status === "paid"
                          ? "default"
                          : sale.status === "partial"
                          ? "secondary"
                          : "destructive"
                      }
                      className={`text-xs ${sale.status === "paid" ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-100" : ""}`}
                    >
                      {sale.status}
                    </Badge>
                    <span className="text-sm font-semibold">{formatCurrency(sale.grandTotal)}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Top Products + Low Stock */}
        <div className="flex flex-col gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <div className="rounded-lg bg-violet-100 p-1.5">
                  <TrendingUp className="h-3.5 w-3.5 text-violet-600" />
                </div>
                Top Selling Products
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {topProducts.map((product, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between rounded-md px-2 py-1.5 text-sm hover:bg-muted/30 transition-colors"
                  >
                    <span className="text-muted-foreground">
                      <span className="mr-2 inline-flex h-5 w-5 items-center justify-center rounded-full bg-indigo-100 text-[10px] font-bold text-indigo-600">
                        {i + 1}
                      </span>
                      {product.name}
                    </span>
                    <span className="font-medium">{formatCurrency(product.revenue)}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50/50 dark:border-amber-800 dark:bg-amber-950/20 dark:from-amber-950/20 dark:to-transparent">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold flex items-center gap-2 text-amber-700 dark:text-amber-400">
                <div className="rounded-lg bg-amber-200/60 p-1.5">
                  <AlertTriangle className="h-3.5 w-3.5" />
                </div>
                Low Stock Alert ({metrics.lowStockCount} items)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-amber-600 dark:text-amber-500">
                {metrics.lowStockCount} products are below their minimum stock threshold.
                Visit Inventory to review and reorder.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <QuickStat
          label="Customers"
          value={String(metrics.totalCustomers)}
          icon={<Users className="h-4 w-4" />}
          bg="bg-blue-100"
          color="text-blue-600"
        />
        <QuickStat
          label="Suppliers"
          value={String(metrics.totalSuppliers)}
          icon={<Truck className="h-4 w-4" />}
          bg="bg-emerald-100"
          color="text-emerald-600"
        />
        <QuickStat
          label="Purchases (Month)"
          value={formatCurrency(metrics.totalPurchasesMonth)}
          icon={<ArrowDownRight className="h-4 w-4" />}
          bg="bg-orange-100"
          color="text-orange-600"
        />
        <QuickStat
          label="Payables"
          value={formatCurrency(metrics.payables)}
          icon={<TrendingDown className="h-4 w-4" />}
          bg="bg-red-100"
          color="text-red-600"
        />
      </div>
    </div>
  );
}

function MetricCard({
  title,
  value,
  subtitle,
  icon,
  trend,
  trendUp,
  alert,
  iconBg,
  iconColor,
  borderColor,
}: {
  title: string;
  value: string;
  subtitle: string;
  icon: React.ReactNode;
  trend?: string;
  trendUp?: boolean;
  alert?: boolean;
  iconBg: string;
  iconColor: string;
  borderColor: string;
}) {
  return (
    <Card className={`card-hover border-l-4 ${borderColor}`}>
      <CardContent className="p-5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            {title}
          </span>
          <div className={`rounded-xl ${iconBg} p-2 ${iconColor}`}>{icon}</div>
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-2xl font-bold tracking-tight">{value}</span>
          {trend && (
            <span
              className={`flex items-center text-xs font-medium ${
                trendUp ? "text-emerald-600" : "text-red-500"
              }`}
            >
              {trendUp ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
              {trend}
            </span>
          )}
          {alert && <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />}
        </div>
        <p className="mt-1 text-xs text-muted-foreground">{subtitle}</p>
      </CardContent>
    </Card>
  );
}

function QuickStat({
  label,
  value,
  icon,
  bg,
  color,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  bg: string;
  color: string;
}) {
  return (
    <Card className="card-hover">
      <CardContent className="flex items-center gap-3 p-4">
        <div className={`rounded-xl ${bg} p-2.5 ${color}`}>{icon}</div>
        <div>
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="text-base font-semibold">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}
