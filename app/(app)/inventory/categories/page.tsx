"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { getProducts, formatCurrency } from "@/lib/store";
import { PRODUCT_CATEGORIES } from "@/lib/types";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Package, IndianRupee, TrendingUp, Boxes } from "lucide-react";

export default function CategoriesPage() {
  const { data: products = [] } = useQuery({
    queryKey: ["products"],
    queryFn: getProducts,
  });

  const categoryStats = useMemo(() => {
    return PRODUCT_CATEGORIES.map(category => {
      const categoryProducts = products.filter(p => p.category === category);
      const totalValue = categoryProducts.reduce((sum, p) => sum + (p.stock * p.sellingPrice), 0);
      const totalStock = categoryProducts.reduce((sum, p) => sum + p.stock, 0);
      const lowStock = categoryProducts.filter(p => p.stock <= p.lowStockThreshold && p.stock > 0).length;
      
      return {
        category,
        count: categoryProducts.length,
        totalValue,
        totalStock,
        lowStock,
      };
    }).filter(stat => stat.count > 0);
  }, [products]);

  const totalProducts = products.length;
  const totalValue = products.reduce((sum, p) => sum + (p.stock * p.sellingPrice), 0);

  return (
    <div className="flex flex-col gap-6 p-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Product Categories</h1>
        <p className="text-sm text-muted-foreground">
          {categoryStats.length} active categories with {totalProducts} products
        </p>
      </div>

      {/* Summary */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card className="border-l-4 border-l-indigo-500">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="rounded-xl bg-indigo-100 p-2.5">
              <Package className="h-5 w-5 text-indigo-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-medium">Active Categories</p>
              <p className="text-xl font-bold">{categoryStats.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-emerald-500">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="rounded-xl bg-emerald-100 p-2.5">
              <Boxes className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-medium">Total Products</p>
              <p className="text-xl font-bold">{totalProducts}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-violet-500">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="rounded-xl bg-violet-100 p-2.5">
              <IndianRupee className="h-5 w-5 text-violet-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-medium">Total Value</p>
              <p className="text-xl font-bold">{formatCurrency(totalValue)}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Category Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {categoryStats.map(stat => (
          <Card key={stat.category} className="card-hover">
            <CardContent className="p-5">
              <div className="flex items-start justify-between mb-3">
                <h3 className="font-semibold">{stat.category}</h3>
                <Badge variant="secondary">{stat.count} items</Badge>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Stock:</span>
                  <span className="font-medium">{stat.totalStock} units</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Stock Value:</span>
                  <span className="font-medium">{formatCurrency(stat.totalValue)}</span>
                </div>
                {stat.lowStock > 0 && (
                  <div className="flex justify-between text-amber-600">
                    <span>Low Stock Items:</span>
                    <span className="font-medium">{stat.lowStock}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
