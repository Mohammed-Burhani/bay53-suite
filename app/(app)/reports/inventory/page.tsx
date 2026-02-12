"use client";

import { useQuery } from "@tanstack/react-query";
import { getProducts, formatCurrency } from "@/lib/store";
import { Card, CardContent } from "@/components/ui/card";
import { Package, IndianRupee, AlertTriangle, FileText } from "lucide-react";

export default function InventoryReportPage() {
  const { data: products = [] } = useQuery({
    queryKey: ["products"],
    queryFn: getProducts,
  });

  const totalProducts = products.length;
  const totalStockValue = products.reduce((sum, p) => sum + (p.stock * p.sellingPrice), 0);
  const totalCostValue = products.reduce((sum, p) => sum + (p.stock * p.costPrice), 0);
  const lowStockCount = products.filter(p => p.stock <= p.lowStockThreshold && p.stock > 0).length;

  return (
    <div className="flex flex-col gap-6 p-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Inventory Report</h1>
        <p className="text-sm text-muted-foreground">Stock valuation and analysis</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-l-4 border-l-indigo-500">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="rounded-xl bg-indigo-100 p-2.5">
              <Package className="h-5 w-5 text-indigo-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-medium">Total Products</p>
              <p className="text-xl font-bold">{totalProducts}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-emerald-500">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="rounded-xl bg-emerald-100 p-2.5">
              <IndianRupee className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-medium">Stock Value</p>
              <p className="text-xl font-bold">{formatCurrency(totalStockValue)}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="rounded-xl bg-blue-100 p-2.5">
              <IndianRupee className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-medium">Cost Value</p>
              <p className="text-xl font-bold">{formatCurrency(totalCostValue)}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-amber-500">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="rounded-xl bg-amber-100 p-2.5">
              <AlertTriangle className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-medium">Low Stock</p>
              <p className="text-xl font-bold">{lowStockCount}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-12 text-center">
          <FileText className="h-12 w-12 mx-auto text-muted-foreground/30" />
          <p className="mt-4 text-muted-foreground">Detailed inventory report coming soon</p>
        </CardContent>
      </Card>
    </div>
  );
}
