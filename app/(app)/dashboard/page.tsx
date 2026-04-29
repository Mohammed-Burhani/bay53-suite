"use client";

import { formatCurrency } from "@/lib/store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Package,
  TrendingUp,
  IndianRupee,
  Warehouse,
  FileText,
  Users,
  ShoppingCart,
  AlertCircle,
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
  LineChart,
  Line,
  Legend,
} from "recharts";
import { useCurrentStock, useLedgerOutstandingSummary } from "@/lib/hooks/useReports";
import { useInvoiceSearch } from "@/lib/hooks/useInvoices";
import { auth } from "@/lib/auth";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

const COLORS = ["#6366f1", "#8b5cf6", "#a78bfa", "#c4b5fd", "#ddd6fe", "#ede9fe", "#f5f3ff", "#818cf8"];

const CACHE_KEY_STOCK = "dashboard_stock_cache";
const CACHE_KEY_INVOICES = "dashboard_invoices_cache";
const CACHE_KEY_LEDGER = "dashboard_ledger_cache";
const CACHE_DURATION = 5 * 60 * 1000; // 5 min

const LOADING_MESSAGES = [
  "Gathering inventory data...",
  "Fetching invoice records...",
  "Analyzing stock levels...",
  "Calculating ledger balances...",
  "Crunching the numbers...",
  "Almost there...",
];

const MESSAGE_DURATION = 2500; // 2.5s per message

interface CachedData {
  data: any[];
  timestamp: number;
}

function LoadingToast({ message, progress }: { message: string; progress: number }) {
  return (
    <div className="flex flex-col gap-2 min-w-[300px]">
      <div className="flex items-center gap-3">
        <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        <span className="text-sm font-medium">{message}</span>
      </div>
      <div className="h-1 w-full overflow-hidden rounded-full bg-muted">
        <div
          className="h-full bg-primary transition-all duration-300 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const sessionId = auth.getSessionId();
  const [cachedStockData, setCachedStockData] = useState<any[] | null>(null);
  const [cachedInvoiceData, setCachedInvoiceData] = useState<any[] | null>(null);
  const [cachedLedgerData, setCachedLedgerData] = useState<any[] | null>(null);
  const [toastId, setToastId] = useState<string | number | undefined>();
  const [messageIndex, setMessageIndex] = useState(0);
  
  // Fetch data
  const currentStockMutation = useCurrentStock();
  const invoiceSearchMutation = useInvoiceSearch();
  const ledgerOutstandingMutation = useLedgerOutstandingSummary();

  // Load from cache on mount
  useEffect(() => {
    if (typeof window === "undefined") return;
    
    try {
      const cachedStock = localStorage.getItem(CACHE_KEY_STOCK);
      const cachedInvoices = localStorage.getItem(CACHE_KEY_INVOICES);
      const cachedLedger = localStorage.getItem(CACHE_KEY_LEDGER);
      
      if (cachedStock) {
        const { data, timestamp }: CachedData = JSON.parse(cachedStock);
        if (Date.now() - timestamp < CACHE_DURATION && data?.length > 0) {
          setCachedStockData(data);
        }
      }
      
      if (cachedInvoices) {
        const { data, timestamp }: CachedData = JSON.parse(cachedInvoices);
        if (Date.now() - timestamp < CACHE_DURATION && data?.length > 0) {
          setCachedInvoiceData(data);
        }
      }
      
      if (cachedLedger) {
        const { data, timestamp }: CachedData = JSON.parse(cachedLedger);
        if (Date.now() - timestamp < CACHE_DURATION && data?.length > 0) {
          setCachedLedgerData(data);
        }
      }
    } catch (e) {
      console.error("Cache read error:", e);
    }
  }, []);

  useEffect(() => {
    if (sessionId && !currentStockMutation.data && !cachedStockData && !toastId) {
      // Show custom toast with progress
      const id = toast.custom(
        () => (
          <div className="pointer-events-auto flex w-full max-w-md rounded-xl border border-border/50 bg-background/80 p-4 shadow-lg backdrop-blur-xl backdrop-saturate-150">
            <LoadingToast message={LOADING_MESSAGES[0]} progress={0} />
          </div>
        ),
        { duration: Infinity }
      );
      setToastId(id);
      setMessageIndex(0);
      
      // Fetch all data in parallel
      currentStockMutation.mutate({
        itemCode: null,
        name: null,
        size: null,
        material: null,
        quality: null,
        brand: null,
        spId: 0,
      });
      
      // Fetch last 30 days invoices
      const today = new Date();
      const thirtyDaysAgo = new Date(today);
      thirtyDaysAgo.setDate(today.getDate() - 30);
      
      invoiceSearchMutation.mutate({
        pageSize: 0,
        pageNumber: 0,
        invType: 0, // All types
        fromDate: thirtyDaysAgo.toLocaleDateString('en-GB', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        }).replace(/\//g, '/').replace(',', ''),
        toDate: today.toLocaleDateString('en-GB', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        }).replace(/\//g, '/').replace(',', ''),
        invoiceNo: null,
        bill_No: null,
        spIds: [],
        partyName: null,
        itemName: null,
      });
      
      // Fetch ledger outstanding summary (groups 16, 17 = customers/suppliers)
      ledgerOutstandingMutation.mutate({
        groupId: 0,
        ledgers: [],
        fromDate: null,
        toDate: null,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId, cachedStockData]);

  // Rotate loading messages + update progress
  useEffect(() => {
    if (!currentStockMutation.isPending || !toastId) return;
    
    const interval = setInterval(() => {
      setMessageIndex((prev) => {
        const next = (prev + 1) % LOADING_MESSAGES.length;
        const newProgress = ((next + 1) / LOADING_MESSAGES.length) * 100;
        
        toast.custom(
          () => (
            <div className="pointer-events-auto flex w-full max-w-md rounded-xl border border-border/50 bg-background/80 p-4 shadow-lg backdrop-blur-xl backdrop-saturate-150">
              <LoadingToast message={LOADING_MESSAGES[next]} progress={newProgress} />
            </div>
          ),
          { id: toastId, duration: Infinity }
        );
        
        return next;
      });
    }, MESSAGE_DURATION);
    
    return () => clearInterval(interval);
  }, [currentStockMutation.isPending, toastId]);

  // Cache data when loaded + dismiss toast
  useEffect(() => {
    const allLoaded = 
      currentStockMutation.data && 
      invoiceSearchMutation.data && 
      ledgerOutstandingMutation.data;
    
    if (allLoaded) {
      try {
        localStorage.setItem(CACHE_KEY_STOCK, JSON.stringify({
          data: currentStockMutation.data,
          timestamp: Date.now(),
        }));
        
        localStorage.setItem(CACHE_KEY_INVOICES, JSON.stringify({
          data: invoiceSearchMutation.data.list,
          timestamp: Date.now(),
        }));
        
        localStorage.setItem(CACHE_KEY_LEDGER, JSON.stringify({
          data: ledgerOutstandingMutation.data,
          timestamp: Date.now(),
        }));
        
        setCachedStockData(currentStockMutation.data);
        setCachedInvoiceData(invoiceSearchMutation.data.list);
        setCachedLedgerData(ledgerOutstandingMutation.data);
        
        if (toastId) {
          toast.dismiss(toastId);
          setToastId(undefined);
          toast.success("Dashboard loaded!", { duration: 2000 });
        }
      } catch (e) {
        console.error("Cache write error:", e);
        if (toastId) {
          toast.dismiss(toastId);
          setToastId(undefined);
        }
      }
    }
  }, [currentStockMutation.data, invoiceSearchMutation.data, ledgerOutstandingMutation.data, toastId]);

  const currentStockData = useMemo(() => 
    cachedStockData || currentStockMutation.data || [], 
    [cachedStockData, currentStockMutation.data]
  );
  
  const invoiceData = useMemo(() => 
    cachedInvoiceData || invoiceSearchMutation.data?.list || [], 
    [cachedInvoiceData, invoiceSearchMutation.data]
  );
  
  const ledgerData = useMemo(() => 
    cachedLedgerData || ledgerOutstandingMutation.data || [], 
    [cachedLedgerData, ledgerOutstandingMutation.data]
  );

  // Calculate metrics from real data
  const metrics = useMemo(() => {
    // Stock metrics
    const totalItems = currentStockData.length;
    const totalStockValue = currentStockData.reduce((sum, item) => 
      sum + (item.total * item.stdSellRate), 0
    );
    
    const materialMap = new Map<string, number>();
    currentStockData.forEach(item => {
      const mat = item.material || 'Other';
      materialMap.set(mat, (materialMap.get(mat) || 0) + item.total);
    });

    const brandMap = new Map<string, number>();
    currentStockData.forEach(item => {
      const brand = item.brand || 'No Brand';
      brandMap.set(brand, (brandMap.get(brand) || 0) + item.total);
    });
    
    // Invoice metrics
    const totalInvoices = invoiceData.length;
    const totalInvoiceAmount = invoiceData.reduce((sum, inv) => sum + (inv.amount || 0), 0);
    
    // Group invoices by date for trend
    const invoicesByDate = new Map<string, { count: number; amount: number }>();
    invoiceData.forEach(inv => {
      const date = new Date(inv.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
      const existing = invoicesByDate.get(date) || { count: 0, amount: 0 };
      invoicesByDate.set(date, {
        count: existing.count + 1,
        amount: existing.amount + (inv.amount || 0),
      });
    });
    
    // Ledger metrics
    const totalReceivables = ledgerData
      .filter(l => l.DrCr === 'Dr')
      .reduce((sum, l) => sum + (l["Pending Amount"] || 0), 0);
    
    const totalPayables = ledgerData
      .filter(l => l.DrCr === 'Cr')
      .reduce((sum, l) => sum + (l["Pending Amount"] || 0), 0);
    
    const topReceivables = [...ledgerData]
      .filter(l => l.DrCr === 'Dr')
      .sort((a, b) => (b["Pending Amount"] || 0) - (a["Pending Amount"] || 0))
      .slice(0, 5);
    
    const topPayables = [...ledgerData]
      .filter(l => l.DrCr === 'Cr')
      .sort((a, b) => (b["Pending Amount"] || 0) - (a["Pending Amount"] || 0))
      .slice(0, 5);

    return {
      totalItems,
      totalStockValue,
      materialCount: materialMap.size,
      brandCount: brandMap.size,
      totalInvoices,
      totalInvoiceAmount,
      totalReceivables,
      totalPayables,
      materialBreakdown: Array.from(materialMap.entries())
        .sort((a, b) => b[1] - a[1])
        .map(([material, quantity]) => ({
          material,
          quantity,
        })),
      brandBreakdown: Array.from(brandMap.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 8)
        .map(([brand, quantity]) => ({
          brand,
          quantity,
        })),
      invoiceTrend: Array.from(invoicesByDate.entries())
        .map(([date, data]) => ({
          date,
          count: data.count,
          amount: data.amount,
        }))
        .slice(-14), // Last 14 days
      topReceivables,
      topPayables,
    };
  }, [currentStockData, invoiceData, ledgerData]);

  // Top items by stock value
  const topItemsByValue = useMemo(() => {
    return [...currentStockData]
      .map(item => ({
        name: item.itename,
        value: item.total * item.stdSellRate,
        quantity: item.total,
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);
  }, [currentStockData]);

  const isLoading = 
    (currentStockMutation.isPending && !currentStockMutation.data && !cachedStockData) ||
    (invoiceSearchMutation.isPending && !invoiceSearchMutation.data && !cachedInvoiceData) ||
    (ledgerOutstandingMutation.isPending && !ledgerOutstandingMutation.data && !cachedLedgerData);

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
        {isLoading ? (
          <>
            <MetricCardSkeleton />
            <MetricCardSkeleton />
            <MetricCardSkeleton />
            <MetricCardSkeleton />
          </>
        ) : (
          <>
            <MetricCard
              title="Total Invoices"
              value={String(metrics.totalInvoices)}
              subtitle="last 30 days"
              icon={<FileText className="h-5 w-5" />}
              iconBg="bg-blue-100"
              iconColor="text-blue-600"
              borderColor="border-l-blue-500"
            />
            <MetricCard
              title="Invoice Value"
              value={formatCurrency(metrics.totalInvoiceAmount)}
              subtitle="total sales & purchases"
              icon={<IndianRupee className="h-5 w-5" />}
              iconBg="bg-emerald-100"
              iconColor="text-emerald-600"
              borderColor="border-l-emerald-500"
            />
            <MetricCard
              title="Receivables"
              value={formatCurrency(metrics.totalReceivables)}
              subtitle="pending from customers"
              icon={<Users className="h-5 w-5" />}
              iconBg="bg-orange-100"
              iconColor="text-orange-600"
              borderColor="border-l-orange-500"
            />
            <MetricCard
              title="Payables"
              value={formatCurrency(metrics.totalPayables)}
              subtitle="pending to suppliers"
              icon={<ShoppingCart className="h-5 w-5" />}
              iconBg="bg-red-100"
              iconColor="text-red-600"
              borderColor="border-l-red-500"
            />
          </>
        )}
      </div>

      {/* Invoice Trend Chart */}
      <Card className="py-4">
        <CardHeader>
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <div className="rounded-lg bg-blue-100 p-1.5">
              <TrendingUp className="h-3.5 w-3.5 text-blue-600" />
            </div>
            Invoice Trend (Last 14 Days)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[280px]">
            {isLoading ? (
              <Skeleton className="h-full w-full" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={metrics.invoiceTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="date" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip
                    contentStyle={{
                      borderRadius: "8px",
                      border: "1px solid hsl(var(--border))",
                      backgroundColor: "hsl(var(--card))",
                    }}
                  />
                  <Legend />
                  <Line type="monotone" dataKey="count" stroke="#6366f1" name="Invoice Count" strokeWidth={2} />
                  <Line type="monotone" dataKey="amount" stroke="#10b981" name="Amount" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Stock Metrics Row */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {isLoading ? (
          <>
            <MetricCardSkeleton />
            <MetricCardSkeleton />
            <MetricCardSkeleton />
            <MetricCardSkeleton />
          </>
        ) : (
          <>
            <MetricCard
              title="Total Items"
              value={String(metrics.totalItems)}
              subtitle="in inventory"
              icon={<Package className="h-5 w-5" />}
              iconBg="bg-violet-100"
              iconColor="text-violet-600"
              borderColor="border-l-violet-500"
            />
            <MetricCard
              title="Stock Value"
              value={formatCurrency(metrics.totalStockValue)}
              subtitle="total inventory value"
              icon={<IndianRupee className="h-5 w-5" />}
              iconBg="bg-emerald-100"
              iconColor="text-emerald-600"
              borderColor="border-l-emerald-500"
            />
            <MetricCard
              title="Materials"
              value={String(metrics.materialCount)}
              subtitle="material types in stock"
              icon={<Warehouse className="h-5 w-5" />}
              iconBg="bg-indigo-100"
              iconColor="text-indigo-600"
              borderColor="border-l-indigo-500"
            />
            <MetricCard
              title="Brands"
              value={String(metrics.brandCount)}
              subtitle="unique brands"
              icon={<TrendingUp className="h-5 w-5" />}
              iconBg="bg-amber-100"
              iconColor="text-amber-600"
              borderColor="border-l-amber-500"
            />
          </>
        )}
      </div>

      {/* Charts Row */}
      <div className="grid gap-4 lg:grid-cols-7">
        {/* Brand Distribution */}
        <Card className="lg:col-span-4 py-4">
          <CardHeader className="">
            <CardTitle className="text-base font-semibold">Stock by Brand</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[280px]">
              {isLoading ? (
                <div className="space-y-3">
                  <Skeleton className="h-[240px] w-full" />
                  <div className="flex gap-2">
                    <Skeleton className="h-3 w-16" />
                    <Skeleton className="h-3 w-16" />
                    <Skeleton className="h-3 w-16" />
                  </div>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={metrics.brandBreakdown}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="brand" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(v) => `${v}`}
                    />
                    <Tooltip
                      formatter={(value: number | undefined) => [`${value || 0} units`, "Quantity"]}
                      contentStyle={{
                        borderRadius: "8px",
                        border: "1px solid hsl(var(--border))",
                        backgroundColor: "hsl(var(--card))",
                      }}
                    />
                    <Bar dataKey="quantity" fill="#6366f1" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Material Breakdown */}
        <Card className="lg:col-span-3 py-4">
          <CardHeader className="">
            <CardTitle className="text-base font-semibold">Stock by Material</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[200px]">
              {isLoading ? (
                <div className="space-y-3">
                  <Skeleton className="h-[160px] w-full rounded-full mx-auto max-w-[160px]" />
                  <div className="flex flex-wrap gap-2">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-4 w-16" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                </div>
              ) : (
                <>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={metrics.materialBreakdown || []}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={80}
                        paddingAngle={2}
                        dataKey="quantity"
                        nameKey="material"
                      >
                        {(metrics.materialBreakdown || []).map((_, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value: number | undefined, name: string | undefined) => [
                          `${value || 0} units`,
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
                  <div className="mt-2 flex flex-wrap gap-2">
                    {(metrics.materialBreakdown || []).slice(0, 5).map((mat, i) => (
                      <div key={mat.material} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <div
                          className="h-2.5 w-2.5 rounded-full"
                          style={{ backgroundColor: COLORS[i % COLORS.length] }}
                        />
                        {mat.material}
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bottom Row */}
      <div className="grid gap-4 lg:grid-cols-1">
        {/* Top Items by Value */}
        <Card className="py-4">
          <CardHeader className="">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <div className="rounded-lg bg-violet-100 p-1.5">
                <TrendingUp className="h-3.5 w-3.5 text-violet-600" />
              </div>
              Top Items by Stock Value
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-2">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex items-center justify-between px-2 py-1.5">
                    <div className="flex items-center gap-2">
                      <Skeleton className="h-5 w-5 rounded-full" />
                      <Skeleton className="h-4 w-48" />
                      <Skeleton className="h-3 w-16" />
                    </div>
                    <Skeleton className="h-4 w-20" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-2">
                {topItemsByValue.map((item, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between rounded-md px-2 py-1.5 text-sm hover:bg-muted/30 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-indigo-100 text-[10px] font-bold text-indigo-600">
                        {i + 1}
                      </span>
                      <span className="text-muted-foreground">{item.name}</span>
                      <span className="text-xs text-muted-foreground">({item.quantity} units)</span>
                    </div>
                    <span className="font-medium">{formatCurrency(item.value)}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {isLoading ? (
          <>
            <QuickStatSkeleton />
            <QuickStatSkeleton />
            <QuickStatSkeleton />
            <QuickStatSkeleton />
          </>
        ) : (
          <>
            <QuickStat
              label="Avg Item Value"
              value={formatCurrency(metrics.totalItems > 0 ? metrics.totalStockValue / metrics.totalItems : 0)}
              icon={<IndianRupee className="h-4 w-4" />}
              bg="bg-blue-100"
              color="text-blue-600"
            />
            <QuickStat
              label="Total Materials"
              value={String(metrics.materialCount)}
              icon={<Package className="h-4 w-4" />}
              bg="bg-emerald-100"
              color="text-emerald-600"
            />
            <QuickStat
              label="Total Brands"
              value={String(metrics.brandCount)}
              icon={<Warehouse className="h-4 w-4" />}
              bg="bg-orange-100"
              color="text-orange-600"
            />
            <QuickStat
              label="Inventory Items"
              value={String(metrics.totalItems)}
              icon={<TrendingUp className="h-4 w-4" />}
              bg="bg-violet-100"
              color="text-violet-600"
            />
          </>
        )}
      </div>
    </div>
  );
}

function MetricCard({
  title,
  value,
  subtitle,
  icon,
  iconBg,
  iconColor,
  borderColor,
}: {
  title: string;
  value: string;
  subtitle: string;
  icon: React.ReactNode;
  iconBg: string;
  iconColor: string;
  borderColor: string;
}) {
  return (
    <Card className={`card-hover border-l-4 ${borderColor} p-4!`}>
      <CardContent className="">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            {title}
          </span>
          <div className={`rounded-xl ${iconBg} p-2 ${iconColor}`}>{icon}</div>
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-2xl font-bold tracking-tight">{value}</span>
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
    <Card className="card-hover p-4">
      <CardContent className="flex items-center gap-3">
        <div className={`rounded-xl ${bg} p-2.5 ${color}`}>{icon}</div>
        <div>
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="text-base font-semibold">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function MetricCardSkeleton() {
  return (
    <Card className="border-l-4 border-l-muted p-4">
      <CardContent className="">
        <div className="flex items-center justify-between">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-9 w-9 rounded-xl" />
        </div>
        <div className="mt-2">
          <Skeleton className="h-8 w-20" />
        </div>
        <Skeleton className="mt-1 h-3 w-32" />
      </CardContent>
    </Card>
  );
}

function QuickStatSkeleton() {
  return (
    <Card className="p-4">
      <CardContent className="flex items-center gap-3">
        <Skeleton className="h-10 w-10 rounded-xl" />
        <div className="space-y-2">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-4 w-16" />
        </div>
      </CardContent>
    </Card>
  );
}