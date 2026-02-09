"use client";

import { useState, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import {
  getProducts,
  addProduct,
  updateProduct,
  deleteProduct,
  formatCurrency,
} from "@/lib/store";
import { Product, PRODUCT_CATEGORIES, GST_RATES, UNITS } from "@/lib/types";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Progress } from "@/components/ui/progress";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Package,
  AlertTriangle,
  Filter,
  LayoutGrid,
  LayoutList,
  TrendingUp,
  IndianRupee,
  ArrowUpDown,
  Copy,
  ArrowDownAZ,
  ArrowUpAZ,
  PackageOpen,
  Boxes,
  X,
  Download,
  FileSpreadsheet,
  FileText,
  ChevronDown,
} from "lucide-react";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const CATEGORY_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  "Electronics": { bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200" },
  "Clothing & Apparel": { bg: "bg-pink-50", text: "text-pink-700", border: "border-pink-200" },
  "Grocery & FMCG": { bg: "bg-green-50", text: "text-green-700", border: "border-green-200" },
  "Pharmacy & Health": { bg: "bg-red-50", text: "text-red-700", border: "border-red-200" },
  "Hardware & Tools": { bg: "bg-slate-50", text: "text-slate-700", border: "border-slate-200" },
  "Stationery & Office": { bg: "bg-yellow-50", text: "text-yellow-700", border: "border-yellow-200" },
  "Automobile Parts": { bg: "bg-gray-50", text: "text-gray-700", border: "border-gray-200" },
  "Jewellery & Accessories": { bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200" },
  "Furniture & Home": { bg: "bg-orange-50", text: "text-orange-700", border: "border-orange-200" },
  "Sports & Fitness": { bg: "bg-teal-50", text: "text-teal-700", border: "border-teal-200" },
  "Beauty & Personal Care": { bg: "bg-purple-50", text: "text-purple-700", border: "border-purple-200" },
  "Books & Media": { bg: "bg-indigo-50", text: "text-indigo-700", border: "border-indigo-200" },
  "Toys & Games": { bg: "bg-cyan-50", text: "text-cyan-700", border: "border-cyan-200" },
  "Other": { bg: "bg-zinc-50", text: "text-zinc-700", border: "border-zinc-200" },
};

const productSchema = Yup.object().shape({
  name: Yup.string().required("Product name is required").min(2, "Min 2 characters"),
  sku: Yup.string().required("SKU is required"),
  barcode: Yup.string(),
  category: Yup.string().required("Category is required"),
  brand: Yup.string(),
  description: Yup.string(),
  costPrice: Yup.number().required("Cost price is required").min(0, "Must be positive"),
  sellingPrice: Yup.number().required("Selling price is required").min(0, "Must be positive"),
  mrp: Yup.number().required("MRP is required").min(0, "Must be positive"),
  gstRate: Yup.number().required("GST rate is required"),
  hsnCode: Yup.string(),
  unit: Yup.string().required("Unit is required"),
  stock: Yup.number().required("Stock is required").min(0, "Must be positive"),
  lowStockThreshold: Yup.number().required("Threshold is required").min(0),
});

type ProductFormValues = Yup.InferType<typeof productSchema>;

const emptyProduct: ProductFormValues = {
  name: "",
  sku: "",
  barcode: "",
  category: "",
  brand: "",
  description: "",
  costPrice: 0,
  sellingPrice: 0,
  mrp: 0,
  gstRate: 18,
  hsnCode: "",
  unit: "Pcs",
  stock: 0,
  lowStockThreshold: 5,
};

type SortKey = "name" | "stock" | "sellingPrice" | "costPrice" | "category";
type SortDir = "asc" | "desc";

export default function InventoryPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [stockFilter, setStockFilter] = useState<string>("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"table" | "grid">("table");
  const [sortKey, setSortKey] = useState<SortKey>("name");
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  const { data: products = [] } = useQuery({
    queryKey: ["products"],
    queryFn: getProducts,
  });

  const filtered = useMemo(() => {
    let result = products.filter((p) => {
      const matchesSearch =
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.sku.toLowerCase().includes(search.toLowerCase()) ||
        (p.barcode && p.barcode.includes(search));
      const matchesCategory = categoryFilter === "all" || p.category === categoryFilter;
      const matchesStock =
        stockFilter === "all" ||
        (stockFilter === "low" && p.stock <= p.lowStockThreshold && p.stock > 0) ||
        (stockFilter === "out" && p.stock === 0) ||
        (stockFilter === "in" && p.stock > p.lowStockThreshold);
      return matchesSearch && matchesCategory && matchesStock;
    });
    result.sort((a, b) => {
      let cmp = 0;
      switch (sortKey) {
        case "name": cmp = a.name.localeCompare(b.name); break;
        case "stock": cmp = a.stock - b.stock; break;
        case "sellingPrice": cmp = a.sellingPrice - b.sellingPrice; break;
        case "costPrice": cmp = a.costPrice - b.costPrice; break;
        case "category": cmp = a.category.localeCompare(b.category); break;
      }
      return sortDir === "asc" ? cmp : -cmp;
    });
    return result;
  }, [products, search, categoryFilter, stockFilter, sortKey, sortDir]);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  const handleSubmit = (values: ProductFormValues) => {
    if (editingProduct) {
      updateProduct(editingProduct.id, values);
      toast.success("Product updated successfully");
    } else {
      addProduct({ ...values, isActive: true } as Omit<Product, "id" | "createdAt" | "updatedAt">);
      toast.success("Product added successfully");
    }
    queryClient.invalidateQueries({ queryKey: ["products"] });
    queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    setDialogOpen(false);
    setEditingProduct(null);
  };

  const handleDelete = () => {
    if (deleteId) {
      deleteProduct(deleteId);
      toast.success("Product deleted");
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      setDeleteId(null);
    }
  };

  const copySku = (sku: string) => {
    navigator.clipboard.writeText(sku);
    toast.success("SKU copied to clipboard");
  };

  const exportToCSV = () => {
    const headers = ["Name", "SKU", "Barcode", "Category", "Brand", "Cost Price", "Selling Price", "MRP", "GST Rate", "HSN Code", "Unit", "Stock", "Low Stock Threshold", "Stock Value"];
    const rows = filtered.map(p => [
      p.name,
      p.sku,
      p.barcode || "",
      p.category,
      p.brand || "",
      p.costPrice,
      p.sellingPrice,
      p.mrp,
      p.gstRate,
      p.hsnCode || "",
      p.unit,
      p.stock,
      p.lowStockThreshold,
      p.stock * p.sellingPrice,
    ]);
    const csv = [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `inventory-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`Exported ${filtered.length} products to CSV`);
  };

  const exportToExcel = () => {
    const headers = ["Name", "SKU", "Barcode", "Category", "Brand", "Cost Price", "Selling Price", "MRP", "GST Rate", "HSN Code", "Unit", "Stock", "Low Stock Threshold", "Stock Value"];
    const rows = filtered.map(p => [
      p.name,
      p.sku,
      p.barcode || "",
      p.category,
      p.brand || "",
      p.costPrice,
      p.sellingPrice,
      p.mrp,
      p.gstRate,
      p.hsnCode || "",
      p.unit,
      p.stock,
      p.lowStockThreshold,
      p.stock * p.sellingPrice,
    ]);
    
    // Create HTML table for Excel
    let html = '<table><thead><tr>';
    headers.forEach(h => html += `<th>${h}</th>`);
    html += '</tr></thead><tbody>';
    rows.forEach(row => {
      html += '<tr>';
      row.forEach(cell => html += `<td>${cell}</td>`);
      html += '</tr>';
    });
    html += '</tbody></table>';
    
    const blob = new Blob([html], { type: "application/vnd.ms-excel" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `inventory-${new Date().toISOString().split("T")[0]}.xls`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`Exported ${filtered.length} products to Excel`);
  };

  const openEdit = (product: Product) => {
    setEditingProduct(product);
    setDialogOpen(true);
  };

  const openAdd = () => {
    setEditingProduct(null);
    setDialogOpen(true);
  };

  const lowStockCount = products.filter((p) => p.stock <= p.lowStockThreshold && p.stock > 0).length;
  const outOfStockCount = products.filter((p) => p.stock === 0).length;
  const totalStockValue = products.reduce((sum, p) => sum + p.stock * p.sellingPrice, 0);
  const totalCostValue = products.reduce((sum, p) => sum + p.stock * p.costPrice, 0);
  const activeCategories = [...new Set(products.map((p) => p.category))].length;
  const activeFilters = (categoryFilter !== "all" ? 1 : 0) + (stockFilter !== "all" ? 1 : 0) + (search ? 1 : 0);

  return (
    <TooltipProvider delayDuration={300}>
      <div className="flex flex-col gap-6 p-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Inventory</h1>
            <p className="text-sm text-muted-foreground">
              Manage your {products.length} products across {activeCategories} categories
            </p>
          </div>
          <div className="flex gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="gap-2">
                  <Download className="h-4 w-4" />
                  Export
                  <ChevronDown className="h-3.5 w-3.5 opacity-50" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={exportToCSV} className="gap-2 cursor-pointer">
                  <FileText className="h-4 w-4" />
                  Export as CSV
                </DropdownMenuItem>
                <DropdownMenuItem onClick={exportToExcel} className="gap-2 cursor-pointer">
                  <FileSpreadsheet className="h-4 w-4" />
                  Export as Excel
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button onClick={openAdd} className="gap-2 bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 text-white shadow-md shadow-indigo-500/25">
              <Plus className="h-4 w-4" />
              Add Product
            </Button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="card-hover border-l-4 border-l-indigo-500">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="rounded-xl bg-indigo-100 p-2.5">
                <Boxes className="h-5 w-5 text-indigo-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-medium">Total Products</p>
                <p className="text-xl font-bold">{products.length}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="card-hover border-l-4 border-l-emerald-500">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="rounded-xl bg-emerald-100 p-2.5">
                <IndianRupee className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-medium">Stock Value</p>
                <p className="text-xl font-bold">{formatCurrency(totalStockValue)}</p>
                <p className="text-[10px] text-muted-foreground">Cost: {formatCurrency(totalCostValue)}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="card-hover border-l-4 border-l-amber-500">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="rounded-xl bg-amber-100 p-2.5">
                <AlertTriangle className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-medium">Low Stock</p>
                <p className="text-xl font-bold text-amber-600">{lowStockCount}</p>
                <p className="text-[10px] text-muted-foreground">items need reorder</p>
              </div>
            </CardContent>
          </Card>
          <Card className="card-hover border-l-4 border-l-red-500">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="rounded-xl bg-red-100 p-2.5">
                <PackageOpen className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-medium">Out of Stock</p>
                <p className="text-xl font-bold text-red-600">{outOfStockCount}</p>
                <p className="text-[10px] text-muted-foreground">items unavailable</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters & Controls - Modern Design */}
        <Card className="border-2 shadow-sm">
          <CardContent className="p-5">
            {/* Search Bar */}
            <div className="relative mb-4">
              <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground/60" />
              <Input
                placeholder="Search by name, SKU, or barcode..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-12 pl-12 pr-10 text-base border-2 focus-visible:ring-2 focus-visible:ring-indigo-500/20 focus-visible:border-indigo-500 transition-all"
              />
              {search && (
                <button 
                  onClick={() => setSearch("")} 
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-muted transition-colors"
                >
                  <X className="h-4 w-4 text-muted-foreground" />
                </button>
              )}
            </div>

            {/* Filter Pills & View Toggle */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <Filter className="h-4 w-4" />
                Filters:
              </div>
              
              {/* Category Filter */}
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className={`h-9 w-auto min-w-[160px] border-2 transition-all ${categoryFilter !== "all" ? "border-indigo-500 bg-indigo-50 text-indigo-700 font-medium" : "hover:border-muted-foreground/30"}`}>
                  <Package className="mr-2 h-3.5 w-3.5" />
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {PRODUCT_CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Stock Filter */}
              <Select value={stockFilter} onValueChange={setStockFilter}>
                <SelectTrigger className={`h-9 w-auto min-w-[140px] border-2 transition-all ${stockFilter !== "all" ? "border-emerald-500 bg-emerald-50 text-emerald-700 font-medium" : "hover:border-muted-foreground/30"}`}>
                  <Boxes className="mr-2 h-3.5 w-3.5" />
                  <SelectValue placeholder="Stock Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Stock</SelectItem>
                  <SelectItem value="in">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-emerald-500" />
                      In Stock
                    </div>
                  </SelectItem>
                  <SelectItem value="low">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-amber-500" />
                      Low Stock
                    </div>
                  </SelectItem>
                  <SelectItem value="out">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-red-500" />
                      Out of Stock
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>

              {/* Clear Filters */}
              {activeFilters > 0 && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => { setSearch(""); setCategoryFilter("all"); setStockFilter("all"); }}
                  className="h-9 text-xs font-medium text-muted-foreground hover:text-foreground"
                >
                  Clear all ({activeFilters})
                </Button>
              )}

              {/* Spacer */}
              <div className="flex-1" />

              {/* Results Count */}
              <div className="text-sm text-muted-foreground font-medium">
                {filtered.length} of {products.length} products
              </div>

              {/* View Toggle */}
              <div className="flex gap-1 rounded-lg border-2 border-border p-1 bg-muted/30">
                <Button
                  variant={viewMode === "table" ? "default" : "ghost"}
                  size="icon"
                  className={`h-8 w-8 transition-all ${viewMode === "table" ? "shadow-sm" : ""}`}
                  onClick={() => setViewMode("table")}
                >
                  <LayoutList className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === "grid" ? "default" : "ghost"}
                  size="icon"
                  className={`h-8 w-8 transition-all ${viewMode === "grid" ? "shadow-sm" : ""}`}
                  onClick={() => setViewMode("grid")}
                >
                  <LayoutGrid className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Active filter chips - Enhanced */}
        {activeFilters > 0 && (
          <div className="flex items-center gap-2 flex-wrap p-4 rounded-lg bg-gradient-to-r from-indigo-50/50 to-violet-50/50 border border-indigo-100">
            <span className="text-xs font-semibold text-indigo-900">Active Filters:</span>
            {search && (
              <Badge 
                variant="secondary" 
                className="gap-1.5 text-xs cursor-pointer hover:bg-indigo-100 bg-indigo-50 text-indigo-700 border-indigo-200 transition-colors" 
                onClick={() => setSearch("")}
              >
                <Search className="h-3 w-3" />
                &quot;{search.length > 20 ? search.slice(0, 20) + "..." : search}&quot;
                <X className="h-3 w-3" />
              </Badge>
            )}
            {categoryFilter !== "all" && (
              <Badge 
                variant="secondary" 
                className="gap-1.5 text-xs cursor-pointer hover:bg-violet-100 bg-violet-50 text-violet-700 border-violet-200 transition-colors" 
                onClick={() => setCategoryFilter("all")}
              >
                <Package className="h-3 w-3" />
                {categoryFilter}
                <X className="h-3 w-3" />
              </Badge>
            )}
            {stockFilter !== "all" && (
              <Badge 
                variant="secondary" 
                className="gap-1.5 text-xs cursor-pointer hover:bg-emerald-100 bg-emerald-50 text-emerald-700 border-emerald-200 transition-colors" 
                onClick={() => setStockFilter("all")}
              >
                <Boxes className="h-3 w-3" />
                {stockFilter === "in" ? "In Stock" : stockFilter === "low" ? "Low Stock" : "Out of Stock"}
                <X className="h-3 w-3" />
              </Badge>
            )}
          </div>
        )}

        {/* Grid View */}
        {viewMode === "grid" ? (
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filtered.length === 0 ? (
              <div className="col-span-full flex flex-col items-center py-16">
                <Package className="h-10 w-10 text-muted-foreground/30" />
                <p className="mt-3 text-sm text-muted-foreground">No products found</p>
              </div>
            ) : filtered.map((product) => {
              const catColor = CATEGORY_COLORS[product.category] || CATEGORY_COLORS["Other"];
              const stockPct = Math.min(100, (product.stock / Math.max(product.lowStockThreshold * 3, 1)) * 100);
              const margin = product.sellingPrice > 0 ? ((product.sellingPrice - product.costPrice) / product.sellingPrice * 100).toFixed(1) : "0";

              return (
                <Card key={product.id} className="card-hover group relative overflow-hidden">
                  {/* Category color bar */}
                  <div className={`absolute top-0 left-0 right-0 h-1 ${catColor.bg.replace('50', '400')}`} style={{ backgroundColor: `var(--cat-color, ${catColor.text.includes('blue') ? '#3b82f6' : catColor.text.includes('pink') ? '#ec4899' : catColor.text.includes('green') ? '#22c55e' : catColor.text.includes('red') ? '#ef4444' : catColor.text.includes('slate') ? '#64748b' : catColor.text.includes('yellow') ? '#eab308' : catColor.text.includes('amber') ? '#f59e0b' : catColor.text.includes('orange') ? '#f97316' : catColor.text.includes('teal') ? '#14b8a6' : catColor.text.includes('purple') ? '#a855f7' : catColor.text.includes('indigo') ? '#6366f1' : catColor.text.includes('cyan') ? '#06b6d4' : '#71717a'})` }} />
                  <CardContent className="p-4 pt-5">
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <Badge className={`text-[10px] font-medium border ${catColor.bg} ${catColor.text} ${catColor.border} hover:${catColor.bg}`}>
                        {product.category}
                      </Badge>
                      <StockBadge stock={product.stock} threshold={product.lowStockThreshold} />
                    </div>
                    <h3 className="font-semibold text-sm leading-tight line-clamp-2">{product.name}</h3>
                    {product.brand && (
                      <p className="text-xs text-muted-foreground mt-0.5">{product.brand}</p>
                    )}
                    <div className="flex items-center gap-1.5 mt-2">
                      <span className="text-xs text-muted-foreground font-mono">{product.sku}</span>
                      <button onClick={(e) => { e.stopPropagation(); copySku(product.sku); }} className="opacity-0 group-hover:opacity-100 transition-opacity">
                        <Copy className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                      </button>
                    </div>

                    {/* Stock progress */}
                    <div className="mt-3">
                      <div className="flex justify-between text-[10px] text-muted-foreground mb-1">
                        <span>{product.stock} {product.unit} in stock</span>
                        <span>min: {product.lowStockThreshold}</span>
                      </div>
                      <Progress
                        value={stockPct}
                        className="h-1.5"
                      />
                    </div>

                    {/* Pricing */}
                    <div className="mt-3 flex items-end justify-between">
                      <div>
                        <p className="text-lg font-bold text-primary">{formatCurrency(product.sellingPrice)}</p>
                        <p className="text-[10px] text-muted-foreground">
                          Cost: {formatCurrency(product.costPrice)} &middot; MRP: {formatCurrency(product.mrp)}
                        </p>
                      </div>
                      <Tooltip>
                        <TooltipTrigger>
                          <Badge variant="outline" className="text-[10px] gap-0.5">
                            <TrendingUp className="h-2.5 w-2.5" />
                            {margin}%
                          </Badge>
                        </TooltipTrigger>
                        <TooltipContent>Profit margin</TooltipContent>
                      </Tooltip>
                    </div>

                    <div className="mt-2 text-[10px] text-muted-foreground">
                      GST: {product.gstRate}%{product.hsnCode ? ` | HSN: ${product.hsnCode}` : ""}
                    </div>

                    {/* Actions */}
                    <div className="mt-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button variant="outline" size="sm" className="flex-1 h-8 text-xs" onClick={() => openEdit(product)}>
                        <Edit className="h-3 w-3 mr-1" />
                        Edit
                      </Button>
                      <Button variant="outline" size="sm" className="h-8 w-8 text-destructive hover:text-destructive hover:bg-red-50" onClick={() => setDeleteId(product.id)}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          /* Table View */
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/30">
                      <TableHead className="min-w-[200px]">
                        <SortButton label="Product" sortKey="name" currentKey={sortKey} dir={sortDir} onSort={handleSort} />
                      </TableHead>
                      <TableHead>SKU</TableHead>
                      <TableHead>
                        <SortButton label="Category" sortKey="category" currentKey={sortKey} dir={sortDir} onSort={handleSort} />
                      </TableHead>
                      <TableHead className="text-right">
                        <SortButton label="Cost" sortKey="costPrice" currentKey={sortKey} dir={sortDir} onSort={handleSort} className="justify-end" />
                      </TableHead>
                      <TableHead className="text-right">
                        <SortButton label="Price" sortKey="sellingPrice" currentKey={sortKey} dir={sortDir} onSort={handleSort} className="justify-end" />
                      </TableHead>
                      <TableHead className="text-right">MRP</TableHead>
                      <TableHead className="text-center">GST</TableHead>
                      <TableHead className="text-center">
                        <SortButton label="Stock" sortKey="stock" currentKey={sortKey} dir={sortDir} onSort={handleSort} className="justify-center" />
                      </TableHead>
                      <TableHead className="text-right">Value</TableHead>
                      <TableHead className="text-right w-[100px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={10} className="py-12 text-center">
                          <Package className="mx-auto h-8 w-8 text-muted-foreground/40" />
                          <p className="mt-2 text-sm text-muted-foreground">No products found</p>
                        </TableCell>
                      </TableRow>
                    ) : (
                      filtered.map((product) => {
                        const catColor = CATEGORY_COLORS[product.category] || CATEGORY_COLORS["Other"];
                        return (
                          <TableRow key={product.id} className="group hover:bg-muted/30 transition-colors">
                            <TableCell>
                              <div className="flex flex-col">
                                <span className="font-medium text-sm">{product.name}</span>
                                {product.brand && (
                                  <span className="text-xs text-muted-foreground">{product.brand}</span>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1">
                                <span className="font-mono text-xs">{product.sku}</span>
                                <button onClick={() => copySku(product.sku)} className="opacity-0 group-hover:opacity-100 transition-opacity">
                                  <Copy className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                                </button>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge className={`text-[10px] font-normal border ${catColor.bg} ${catColor.text} ${catColor.border} hover:${catColor.bg}`}>
                                {product.category}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right text-sm">{formatCurrency(product.costPrice)}</TableCell>
                            <TableCell className="text-right text-sm font-medium">
                              {formatCurrency(product.sellingPrice)}
                            </TableCell>
                            <TableCell className="text-right text-sm text-muted-foreground">
                              {formatCurrency(product.mrp)}
                            </TableCell>
                            <TableCell className="text-center">
                              <Badge variant="outline" className="text-[10px]">{product.gstRate}%</Badge>
                            </TableCell>
                            <TableCell className="text-center">
                              <StockBadge stock={product.stock} threshold={product.lowStockThreshold} />
                            </TableCell>
                            <TableCell className="text-right text-sm">
                              {formatCurrency(product.stock * product.sellingPrice)}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-1">
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                                      onClick={() => openEdit(product)}
                                    >
                                      <Edit className="h-3.5 w-3.5" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>Edit product</TooltipContent>
                                </Tooltip>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-8 w-8 text-destructive hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                                      onClick={() => setDeleteId(product.id)}
                                    >
                                      <Trash2 className="h-3.5 w-3.5" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>Delete product</TooltipContent>
                                </Tooltip>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Results count */}
        {filtered.length > 0 && (
          <p className="text-xs text-muted-foreground text-center">
            Showing {filtered.length} of {products.length} products
          </p>
        )}

        {/* Add/Edit Dialog */}
        <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) setEditingProduct(null); }}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                {editingProduct ? <Edit className="h-4 w-4 text-primary" /> : <Plus className="h-4 w-4 text-primary" />}
                {editingProduct ? "Edit Product" : "Add New Product"}
              </DialogTitle>
            </DialogHeader>
            <Formik
              initialValues={editingProduct ? {
                name: editingProduct.name,
                sku: editingProduct.sku,
                barcode: editingProduct.barcode || "",
                category: editingProduct.category,
                brand: editingProduct.brand || "",
                description: editingProduct.description || "",
                costPrice: editingProduct.costPrice,
                sellingPrice: editingProduct.sellingPrice,
                mrp: editingProduct.mrp,
                gstRate: editingProduct.gstRate,
                hsnCode: editingProduct.hsnCode || "",
                unit: editingProduct.unit,
                stock: editingProduct.stock,
                lowStockThreshold: editingProduct.lowStockThreshold,
              } : emptyProduct}
              validationSchema={productSchema}
              onSubmit={handleSubmit}
              enableReinitialize
            >
              {({ setFieldValue, values, isSubmitting }) => (
                <Form className="grid gap-4">
                  {/* Section: Basic Info */}
                  <div className="rounded-lg border border-border/60 p-4 space-y-4">
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Basic Information</p>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <FormField name="name" label="Product Name *" />
                      <FormField name="sku" label="SKU *" />
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <FormField name="barcode" label="Barcode" />
                      <FormField name="brand" label="Brand" />
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-1.5">
                        <label className="text-sm font-medium">Category *</label>
                        <select
                          className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                          value={values.category}
                          onChange={(e) => setFieldValue("category", e.target.value)}
                        >
                          <option value="">Select category</option>
                          {PRODUCT_CATEGORIES.map((c) => (
                            <option key={c} value={c}>{c}</option>
                          ))}
                        </select>
                        <ErrorMessage name="category" component="p" className="text-xs text-destructive" />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-sm font-medium">Unit *</label>
                        <select
                          className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                          value={values.unit}
                          onChange={(e) => setFieldValue("unit", e.target.value)}
                        >
                          {UNITS.map((u) => (
                            <option key={u} value={u}>{u}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Section: Pricing */}
                  <div className="rounded-lg border border-border/60 p-4 space-y-4">
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Pricing & Tax</p>
                    <div className="grid gap-4 sm:grid-cols-3">
                      <FormField name="costPrice" label="Cost Price (₹) *" type="number" />
                      <FormField name="sellingPrice" label="Selling Price (₹) *" type="number" />
                      <FormField name="mrp" label="MRP (₹) *" type="number" />
                    </div>
                    <div className="grid gap-4 sm:grid-cols-3">
                      <div className="space-y-1.5">
                        <label className="text-sm font-medium">GST Rate *</label>
                        <select
                          className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                          value={values.gstRate}
                          onChange={(e) => setFieldValue("gstRate", Number(e.target.value))}
                        >
                          {GST_RATES.map((r) => (
                            <option key={r} value={r}>{r}%</option>
                          ))}
                        </select>
                      </div>
                      <FormField name="hsnCode" label="HSN Code" />
                      <div /> {/* spacer */}
                    </div>
                  </div>

                  {/* Section: Stock */}
                  <div className="rounded-lg border border-border/60 p-4 space-y-4">
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Stock</p>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <FormField name="stock" label="Opening Stock *" type="number" />
                      <FormField name="lowStockThreshold" label="Low Stock Threshold" type="number" />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-sm font-medium">Description</label>
                    <Field
                      as="textarea"
                      name="description"
                      className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                      rows={2}
                    />
                  </div>
                  <div className="flex justify-end gap-2 pt-2">
                    <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={isSubmitting} className="bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 text-white">
                      {editingProduct ? "Update Product" : "Add Product"}
                    </Button>
                  </div>
                </Form>
              )}
            </Formik>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation */}
        <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Product</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently remove the product from your inventory.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete} className="bg-destructive text-white hover:bg-destructive/90">
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </TooltipProvider>
  );
}

function SortButton({
  label,
  sortKey,
  currentKey,
  dir,
  onSort,
  className,
}: {
  label: string;
  sortKey: SortKey;
  currentKey: SortKey;
  dir: SortDir;
  onSort: (key: SortKey) => void;
  className?: string;
}) {
  const active = sortKey === currentKey;
  return (
    <button
      onClick={() => onSort(sortKey)}
      className={`flex items-center gap-1 text-xs font-medium hover:text-foreground transition-colors ${className || ""}`}
    >
      {label}
      {active ? (
        dir === "asc" ? <ArrowDownAZ className="h-3 w-3 text-primary" /> : <ArrowUpAZ className="h-3 w-3 text-primary" />
      ) : (
        <ArrowUpDown className="h-3 w-3 opacity-30" />
      )}
    </button>
  );
}

function FormField({
  name,
  label,
  type = "text",
}: {
  name: string;
  label: string;
  type?: string;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium">{label}</label>
      <Field
        name={name}
        type={type}
        className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
      />
      <ErrorMessage name={name} component="p" className="text-xs text-destructive" />
    </div>
  );
}

function StockBadge({ stock, threshold }: { stock: number; threshold: number }) {
  if (stock === 0) {
    return (
      <Badge variant="destructive" className="text-xs gap-1 animate-pulse">
        Out
      </Badge>
    );
  }
  if (stock <= threshold) {
    return (
      <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100 text-xs gap-1 dark:bg-amber-900 dark:text-amber-200">
        <AlertTriangle className="h-3 w-3" />
        {stock}
      </Badge>
    );
  }
  return (
    <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 text-xs dark:bg-emerald-900 dark:text-emerald-200">
      {stock}
    </Badge>
  );
}
