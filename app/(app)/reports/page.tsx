"use client";

import { useQuery } from "@tanstack/react-query";
import {
  getProducts,
  getInvoices,
  getParties,
  formatCurrency,
} from "@/lib/store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  BarChart3,
  Package,
  TrendingUp,
  AlertTriangle,
  IndianRupee,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

export default function ReportsPage() {
  const { data: products = [] } = useQuery({
    queryKey: ["products"],
    queryFn: getProducts,
  });

  const { data: salesInvoices = [] } = useQuery({
    queryKey: ["invoices", "sale"],
    queryFn: () => getInvoices("sale"),
  });

  const { data: purchaseInvoices = [] } = useQuery({
    queryKey: ["invoices", "purchase"],
    queryFn: () => getInvoices("purchase"),
  });

  const { data: parties = [] } = useQuery({
    queryKey: ["parties"],
    queryFn: () => getParties(),
  });

  // Stock Value by Category
  const categoryStock: Record<string, { count: number; value: number; items: number }> = {};
  products.forEach((p) => {
    if (!categoryStock[p.category]) categoryStock[p.category] = { count: 0, value: 0, items: 0 };
    categoryStock[p.category].count += p.stock;
    categoryStock[p.category].value += p.stock * p.costPrice;
    categoryStock[p.category].items++;
  });
  const categoryData = Object.entries(categoryStock)
    .map(([category, data]) => ({ category: category.split(" ")[0], ...data }))
    .sort((a, b) => b.value - a.value);

  // Low stock products
  const lowStock = products
    .filter((p) => p.stock <= p.lowStockThreshold)
    .sort((a, b) => a.stock - b.stock);

  // GST summary from sales
  const gstSummary: Record<number, { taxable: number; cgst: number; sgst: number; total: number }> = {};
  salesInvoices.forEach((inv) => {
    inv.items.forEach((item) => {
      if (!gstSummary[item.gstRate]) gstSummary[item.gstRate] = { taxable: 0, cgst: 0, sgst: 0, total: 0 };
      const taxable = item.quantity * item.price - item.discount;
      const gstAmount = (taxable * item.gstRate) / 100;
      gstSummary[item.gstRate].taxable += taxable;
      gstSummary[item.gstRate].cgst += gstAmount / 2;
      gstSummary[item.gstRate].sgst += gstAmount / 2;
      gstSummary[item.gstRate].total += gstAmount;
    });
  });

  // Payment mode summary
  const paymentSummary: Record<string, { count: number; total: number }> = {};
  salesInvoices.forEach((inv) => {
    const mode = inv.paymentMode.replace("_", " ");
    if (!paymentSummary[mode]) paymentSummary[mode] = { count: 0, total: 0 };
    paymentSummary[mode].count++;
    paymentSummary[mode].total += inv.grandTotal;
  });

  // Profit estimates
  const totalSalesValue = salesInvoices.reduce((s, i) => s + i.subtotal, 0);
  const totalCostEstimate = salesInvoices.reduce(
    (s, inv) =>
      s +
      inv.items.reduce((is, item) => {
        const product = products.find((p) => p.id === item.productId);
        return is + (product ? product.costPrice * item.quantity : 0);
      }, 0),
    0
  );
  const estimatedProfit = totalSalesValue - totalCostEstimate;
  const totalStockValue = products.reduce((s, p) => s + p.stock * p.costPrice, 0);
  const totalRetailValue = products.reduce((s, p) => s + p.stock * p.sellingPrice, 0);

  return (
    <div className="flex flex-col gap-6 p-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Reports</h1>
        <p className="text-sm text-muted-foreground">Business insights and analytics</p>
      </div>

        {/* Summary Cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="card-hover border-l-4 border-l-indigo-500">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="rounded-xl bg-indigo-100 p-2.5">
                <Package className="h-5 w-5 text-indigo-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Stock Value (Cost)</p>
                <p className="text-xl font-bold mt-1">{formatCurrency(totalStockValue)}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="card-hover border-l-4 border-l-violet-500">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="rounded-xl bg-violet-100 p-2.5">
                <BarChart3 className="h-5 w-5 text-violet-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Stock Value (Retail)</p>
                <p className="text-xl font-bold mt-1">{formatCurrency(totalRetailValue)}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="card-hover border-l-4 border-l-emerald-500">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="rounded-xl bg-emerald-100 p-2.5">
                <TrendingUp className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Total Revenue</p>
                <p className="text-xl font-bold mt-1 text-emerald-600">{formatCurrency(totalSalesValue)}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="card-hover border-l-4 border-l-blue-500">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="rounded-xl bg-blue-100 p-2.5">
                <IndianRupee className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Est. Profit</p>
                <p className="text-xl font-bold mt-1 text-blue-600">{formatCurrency(estimatedProfit)}</p>
              </div>
            </CardContent>
          </Card>
        </div>

      <Tabs defaultValue="inventory">
        <TabsList>
          <TabsTrigger value="inventory" className="gap-2">
            <Package className="h-3.5 w-3.5" />
            Inventory
          </TabsTrigger>
          <TabsTrigger value="gst" className="gap-2">
            <IndianRupee className="h-3.5 w-3.5" />
            GST Summary
          </TabsTrigger>
          <TabsTrigger value="lowstock" className="gap-2">
            <AlertTriangle className="h-3.5 w-3.5" />
            Low Stock
          </TabsTrigger>
          <TabsTrigger value="payments" className="gap-2">
            <TrendingUp className="h-3.5 w-3.5" />
            Payments
          </TabsTrigger>
        </TabsList>

        {/* Inventory Report */}
        <TabsContent value="inventory" className="mt-4 space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Stock Value by Category</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={categoryData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis
                      type="number"
                      fontSize={12}
                      tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`}
                    />
                    <YAxis type="category" dataKey="category" fontSize={11} width={80} />
                    <Tooltip
                      formatter={(value: number | undefined) => [formatCurrency(value || 0), "Stock Value"]}
                      contentStyle={{
                        borderRadius: "8px",
                        border: "1px solid hsl(var(--border))",
                        backgroundColor: "hsl(var(--card))",
                      }}
                    />
                    <Bar dataKey="value" fill="#6366f1" radius={[0, 6, 6, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Category</TableHead>
                    <TableHead className="text-center">Products</TableHead>
                    <TableHead className="text-center">Total Stock</TableHead>
                    <TableHead className="text-right">Stock Value</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {categoryData.map((cat) => (
                    <TableRow key={cat.category}>
                      <TableCell className="font-medium">{cat.category}</TableCell>
                      <TableCell className="text-center">{cat.items}</TableCell>
                      <TableCell className="text-center">{cat.count}</TableCell>
                      <TableCell className="text-right font-medium">{formatCurrency(cat.value)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* GST Report */}
        <TabsContent value="gst" className="mt-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">GST Summary (Sales)</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>GST Rate</TableHead>
                    <TableHead className="text-right">Taxable Amount</TableHead>
                    <TableHead className="text-right">CGST</TableHead>
                    <TableHead className="text-right">SGST</TableHead>
                    <TableHead className="text-right">Total GST</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {Object.entries(gstSummary)
                    .sort(([a], [b]) => Number(a) - Number(b))
                    .map(([rate, data]) => (
                      <TableRow key={rate}>
                        <TableCell>
                          <Badge variant="outline">{rate}%</Badge>
                        </TableCell>
                        <TableCell className="text-right">{formatCurrency(data.taxable)}</TableCell>
                        <TableCell className="text-right">{formatCurrency(data.cgst)}</TableCell>
                        <TableCell className="text-right">{formatCurrency(data.sgst)}</TableCell>
                        <TableCell className="text-right font-medium">{formatCurrency(data.total)}</TableCell>
                      </TableRow>
                    ))}
                  <TableRow className="bg-muted/50 font-semibold">
                    <TableCell>Total</TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(Object.values(gstSummary).reduce((s, d) => s + d.taxable, 0))}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(Object.values(gstSummary).reduce((s, d) => s + d.cgst, 0))}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(Object.values(gstSummary).reduce((s, d) => s + d.sgst, 0))}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(Object.values(gstSummary).reduce((s, d) => s + d.total, 0))}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Low Stock */}
        <TabsContent value="lowstock" className="mt-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-500" />
                Low Stock Products ({lowStock.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead className="text-center">Current Stock</TableHead>
                    <TableHead className="text-center">Threshold</TableHead>
                    <TableHead className="text-center">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {lowStock.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium text-sm">{p.name}</p>
                          <p className="text-xs text-muted-foreground">{p.sku}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">{p.category}</Badge>
                      </TableCell>
                      <TableCell className="text-center font-medium">{p.stock}</TableCell>
                      <TableCell className="text-center text-muted-foreground">{p.lowStockThreshold}</TableCell>
                      <TableCell className="text-center">
                        {p.stock === 0 ? (
                          <Badge variant="destructive" className="text-xs">Out of Stock</Badge>
                        ) : (
                          <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100 text-xs dark:bg-amber-900 dark:text-amber-200">
                            Low Stock
                          </Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Payment Summary */}
        <TabsContent value="payments" className="mt-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Payment Mode Summary</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Payment Mode</TableHead>
                    <TableHead className="text-center">Transactions</TableHead>
                    <TableHead className="text-right">Total Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {Object.entries(paymentSummary).map(([mode, data]) => (
                    <TableRow key={mode}>
                      <TableCell className="capitalize font-medium">{mode}</TableCell>
                      <TableCell className="text-center">{data.count}</TableCell>
                      <TableCell className="text-right font-medium">{formatCurrency(data.total)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
