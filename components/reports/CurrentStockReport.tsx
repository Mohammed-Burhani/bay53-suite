"use client";

import { useState, useMemo, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { 
  Download, 
  Search, 
  X, 
  Filter, 
  Package, 
  AlertCircle, 
  TrendingDown,
  TrendingUp,
  FileSpreadsheet,
  Printer,
  Sparkles,
  BarChart3,
  Layers,
  Loader2,
  Lightbulb,
  SlidersHorizontal,
} from "lucide-react";
import { ModuleAIAssistant } from "@/components/ModuleAIAssistant";
import { TablePagination, usePagination } from "@/components/ui/table-pagination";
import { Combobox } from "@/components/ui/combobox";
import { useClassificationLabels } from "@/lib/contexts/ClassificationContext";
import { useStockPlaces, useItems, useCurrentStock } from "@/lib/hooks/useReports";
import { toast } from "sonner";
import type { CurrentStockItem, ItemAttributes } from "@/lib/types/reports.types";
import { getAvailableOptions } from "@/lib/utils/item-parser";
import { exportToExcel, exportToPDF } from "@/lib/utils/report-export";

export default function CurrentStockReport() {
  const { getLabel } = useClassificationLabels();
  
  const [selectedStockPlace, setSelectedStockPlace] = useState<number>(0);
  
  // 6 separate filter states
  const [selectedItemCode, setSelectedItemCode] = useState<string>("");
  const [selectedName, setSelectedName] = useState<string>("");
  const [selectedSize, setSelectedSize] = useState<string>("");
  const [selectedMaterial, setSelectedMaterial] = useState<string>("");
  const [selectedQuality, setSelectedQuality] = useState<string>("");
  const [selectedBrand, setSelectedBrand] = useState<string>("");
  
  const [showReorderDetails, setShowReorderDetails] = useState(false);
  const [rackWise, setRackWise] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [advancedFiltersOpen, setAdvancedFiltersOpen] = useState(false);
  const { currentPage, pageSize, setCurrentPage, setPageSize } = usePagination(50);

  // Fetch dropdown data with aggressive caching
  const { data: stockPlaces = [], isLoading: isLoadingStockPlaces } = useStockPlaces();
  const { data: items = [], isLoading: isLoadingItems, isSuccess: itemsLoaded } = useItems();

  // Fetch current stock mutation
  const { mutate: fetchCurrentStock, data: stockData = [], isPending: isLoadingStock } = useCurrentStock();

  // Current filter state - memoized to prevent recalculation
  const currentFilters: Partial<ItemAttributes> = useMemo(() => ({
    itemCode: selectedItemCode || undefined,
    name: selectedName || undefined,
    size: selectedSize || undefined,
    material: selectedMaterial || undefined,
    quality: selectedQuality || undefined,
    brand: selectedBrand || undefined,
  }), [selectedItemCode, selectedName, selectedSize, selectedMaterial, selectedQuality, selectedBrand]);

  // Pre-compute available options ONLY when items load or filters change
  // Use lazy initialization to defer computation
  const availableItemCodes = useMemo(() => {
    if (!itemsLoaded || items.length === 0) return [];
    return getAvailableOptions(items, currentFilters, 'itemCode');
  }, [items, currentFilters, itemsLoaded]);

  const availableNames = useMemo(() => {
    if (!itemsLoaded || items.length === 0) return [];
    return getAvailableOptions(items, currentFilters, 'name');
  }, [items, currentFilters, itemsLoaded]);

  const availableSizes = useMemo(() => {
    if (!itemsLoaded || items.length === 0) return [];
    return getAvailableOptions(items, currentFilters, 'size');
  }, [items, currentFilters, itemsLoaded]);

  const availableMaterials = useMemo(() => {
    if (!itemsLoaded || items.length === 0) return [];
    return getAvailableOptions(items, currentFilters, 'material');
  }, [items, currentFilters, itemsLoaded]);

  const availableQualities = useMemo(() => {
    if (!itemsLoaded || items.length === 0) return [];
    return getAvailableOptions(items, currentFilters, 'quality');
  }, [items, currentFilters, itemsLoaded]);

  const availableBrands = useMemo(() => {
    if (!itemsLoaded || items.length === 0) return [];
    return getAvailableOptions(items, currentFilters, 'brand');
  }, [items, currentFilters, itemsLoaded]);

  const handleStock = () => {
    // Allow fetching without filters (fetch all)
    fetchCurrentStock(
      {
        itemCode: selectedItemCode || null,
        name: selectedName || null,
        size: selectedSize || null,
        material: selectedMaterial || null,
        quality: selectedQuality || null,
        brand: selectedBrand || null,
        spId: selectedStockPlace,
      },
      {
        onSuccess: (data) => {
          toast.success(`Loaded ${data.length} stock records`);
          setCurrentPage(1);
        },
        onError: (error) => {
          toast.error("Failed to load stock data");
          console.error(error);
        },
      }
    );
  };

  const handleClear = () => {
    setSelectedStockPlace(0);
    setSelectedItemCode("");
    setSelectedName("");
    setSelectedSize("");
    setSelectedMaterial("");
    setSelectedQuality("");
    setSelectedBrand("");
    setSearchTerm("");
  };

  const handleExport = (format: 'csv' | 'excel' | 'pdf') => {
    const headers = [
      { key: "itename", label: "Item Name" },
      { key: "category", label: getLabel("category") },
      { key: "brand", label: "Brand" },
      { key: "stock", label: "Stock" },
      { key: "unit", label: "Unit" },
      { key: "costPrice", label: "Cost Price" },
      { key: "sellingPrice", label: "Selling Price" },
      { key: "stockValue", label: "Stock Value" },
    ];
    
    if (format === 'excel') {
      exportToExcel(filteredData as unknown as Record<string, unknown>[], headers, "current-stock");
      toast.success("Exported to Excel");
    } else if (format === 'pdf') {
      exportToPDF(filteredData as unknown as Record<string, unknown>[], headers, "Current Stock Report", "current-stock");
      toast.success("Downloaded PDF");
    } else if (format === 'csv') {
      exportToExcel(filteredData as unknown as Record<string, unknown>[], headers, "current-stock-csv");
      toast.success("Exported to CSV");
    }
  };

  // Filter and search stock data
  const filteredData = useMemo(() => {
    if (!stockData || stockData.length === 0) return [];
    
    return stockData.filter((item) => {
      if (!searchTerm) return true;
      const search = searchTerm.toLowerCase();
      return (
        item.itename?.toLowerCase().includes(search) ||
        item.category?.toLowerCase().includes(search) ||
        item.brand?.toLowerCase().includes(search) ||
        item.itemcode?.toLowerCase().includes(search)
      );
    });
  }, [stockData, searchTerm]);

  // Calculate stats
  const totalItems = filteredData.length;
  const totalStock = filteredData.reduce((sum, item) => sum + (item.total || 0), 0);
  const totalValue = filteredData.reduce((sum, item) => sum + ((item.total || 0) * (item.stdSellRate || 0)), 0);
  const lowStockItems = filteredData.filter(item => item.total > 0 && item.total < 10).length;
  const negativeStockItems = filteredData.filter(item => item.total < 0).length;

  // Pagination
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedData = filteredData.slice(startIndex, endIndex);

  // Group by category if needed
  const groupedData = useMemo(() => {
    const groups: Record<string, CurrentStockItem[]> = {};
    paginatedData.forEach((item) => {
      const category = item.category || "Uncategorized";
      if (!groups[category]) {
        groups[category] = [];
      }
      groups[category].push(item);
    });
    return groups;
  }, [paginatedData]);

  const isLoading = isLoadingStockPlaces || isLoadingItems || isLoadingStock;
  const hasAnyFilter = selectedItemCode || selectedName || selectedSize || 
                       selectedMaterial || selectedQuality || selectedBrand;

  // Loading tips to show while items are loading
  const loadingTips = [
    "Use multiple filters together to narrow down your search quickly",
    "Filters cascade automatically - selecting one updates the others",
    "All 10,000+ items are loaded once and cached for instant access",
    "Try filtering by brand first, then narrow down by other attributes",
    "The 'Clear All' button resets all filters at once",
    "Export your filtered results to Excel, CSV, or PDF",
  ];

  const [currentTip, setCurrentTip] = useState(0);

  useEffect(() => {
    if (isLoadingItems) {
      const interval = setInterval(() => {
        setCurrentTip((prev) => (prev + 1) % loadingTips.length);
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [isLoadingItems, loadingTips.length]);

  // Show loading screen until items are loaded
  if (isLoadingItems) {
    return (
      <div className="flex items-center justify-center min-h-[600px]">
        <Card className="max-w-md w-full border-0 shadow-xl">
          <CardContent className="p-8">
            <div className="flex flex-col items-center text-center space-y-6">
              <div className="relative">
                <div className="absolute inset-0 bg-linear-to-r from-indigo-500 to-purple-600 rounded-full blur-2xl opacity-30 animate-pulse" />
                <div className="relative p-6 rounded-full bg-linear-to-br from-indigo-100 to-purple-100 dark:from-indigo-950/50 dark:to-purple-950/50">
                  <Loader2 className="h-12 w-12 text-indigo-600 animate-spin" />
                </div>
              </div>
              
              <div className="space-y-2">
                <h3 className="text-xl font-bold bg-linear-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                  Loading Items Data
                </h3>
                <p className="text-sm text-muted-foreground">
                  Please wait while we load your inventory...
                </p>
              </div>

              <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                <div className="h-full bg-linear-to-r from-indigo-600 to-purple-600 animate-pulse" style={{ width: '70%' }} />
              </div>

              <div className="flex items-start gap-3 p-4 bg-linear-to-r from-indigo-50 to-purple-50 dark:from-indigo-950/20 dark:to-purple-950/20 rounded-lg border border-indigo-200 dark:border-indigo-800">
                <Lightbulb className="h-5 w-5 text-indigo-600 shrink-0 mt-0.5" />
                <div className="text-left">
                  <p className="text-xs font-semibold text-indigo-900 dark:text-indigo-100 mb-1">
                    Pro Tip
                  </p>
                  <p className="text-xs text-indigo-700 dark:text-indigo-300">
                    {loadingTips[currentTip]}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="flex flex-col gap-6">
        {/* Hero Stats Section */}
        {filteredData.length > 0 && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card className="relative overflow-hidden border-0 bg-linear-to-br from-blue-500 to-blue-600 text-white shadow-lg hover:shadow-xl transition-all duration-300">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16" />
              <CardContent className="p-6 relative">
                <div className="flex items-center justify-between mb-2">
                  <Package className="h-8 w-8 opacity-80" />
                  <Sparkles className="h-5 w-5 opacity-60" />
                </div>
                <p className="text-sm font-medium opacity-90">Total Items</p>
                <p className="text-3xl font-bold mt-1">{totalItems}</p>
              </CardContent>
            </Card>

            <Card className="relative overflow-hidden border-0 bg-linear-to-br from-emerald-500 to-emerald-600 text-white shadow-lg hover:shadow-xl transition-all duration-300">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16" />
              <CardContent className="p-6 relative">
                <div className="flex items-center justify-between mb-2">
                  <TrendingUp className="h-8 w-8 opacity-80" />
                  <BarChart3 className="h-5 w-5 opacity-60" />
                </div>
                <p className="text-sm font-medium opacity-90">Total Stock</p>
                <p className="text-3xl font-bold mt-1">{totalStock.toFixed(2)}</p>
              </CardContent>
            </Card>

            <Card className="relative overflow-hidden border-0 bg-linear-to-br from-amber-500 to-amber-600 text-white shadow-lg hover:shadow-xl transition-all duration-300">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16" />
              <CardContent className="p-6 relative">
                <div className="flex items-center justify-between mb-2">
                  <AlertCircle className="h-8 w-8 opacity-80" />
                  <Layers className="h-5 w-5 opacity-60" />
                </div>
                <p className="text-sm font-medium opacity-90">Low Stock</p>
                <p className="text-3xl font-bold mt-1">{lowStockItems}</p>
              </CardContent>
            </Card>

            <Card className="relative overflow-hidden border-0 bg-linear-to-br from-red-500 to-red-600 text-white shadow-lg hover:shadow-xl transition-all duration-300">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16" />
              <CardContent className="p-6 relative">
                <div className="flex items-center justify-between mb-2">
                  <TrendingDown className="h-8 w-8 opacity-80" />
                  <AlertCircle className="h-5 w-5 opacity-60" />
                </div>
                <p className="text-sm font-medium opacity-90">Negative Stock</p>
                <p className="text-3xl font-bold mt-1">{negativeStockItems}</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Compact Filter Panel */}
        <Card className="border shadow-sm">
          <CardContent className="p-4">
            <div className="flex flex-col gap-3">
              {/* Search Bar */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Quick search by item name, category, or stock place..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 h-9"
                />
              </div>

              {/* Stock Place + Advanced Filters Button */}
              <div className="flex flex-wrap items-center gap-2">
                <Select
                  value={selectedStockPlace.toString()}
                  onValueChange={(value) => setSelectedStockPlace(Number(value))}
                  disabled={isLoadingStockPlaces}
                >
                  <SelectTrigger className="h-9 w-[200px]">
                    <SelectValue placeholder={isLoadingStockPlaces ? "Loading..." : "All Stock Places"} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">All Stock Places</SelectItem>
                    {stockPlaces.map((sp) => (
                      <SelectItem key={sp.sp_ID} value={sp.sp_ID.toString()}>
                        {sp.name} ({sp.code})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Sheet open={advancedFiltersOpen} onOpenChange={setAdvancedFiltersOpen}>
                  <SheetTrigger asChild>
                    <Button variant="outline" size="sm" className="h-9">
                      <SlidersHorizontal className="h-4 w-4 mr-2" />
                      Advanced Filters
                      {hasAnyFilter && (
                        <Badge variant="secondary" className="ml-2">
                          {Object.values(currentFilters).filter(Boolean).length}
                        </Badge>
                      )}
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="right" className="w-[400px] sm:w-[540px] overflow-y-auto p-4">
                    <SheetHeader>
                      <SheetTitle>Advanced Filters</SheetTitle>
                      <SheetDescription>
                        Refine your stock search with detailed filters
                      </SheetDescription>
                    </SheetHeader>

                    <div className="space-y-6 mt-6">
                      {/* 6 Item Attribute Filters */}
                      <div className="space-y-4">
                        <div className="flex items-center gap-2">
                          <Package className="h-4 w-4 text-purple-500" />
                          <Label className="text-sm font-semibold">Item Filters</Label>
                        </div>

                        {/* Item Code */}
                        <div className="space-y-2">
                          <Label className="text-sm">{getLabel('item_code')}</Label>
                          <Combobox
                            options={[
                              { value: "__all__", label: "All" },
                              ...availableItemCodes.map(code => ({ value: code, label: code }))
                            ]}
                            value={selectedItemCode || "__all__"}
                            onValueChange={(val) => setSelectedItemCode(val === "__all__" ? "" : val)}
                            placeholder="Select Item Code"
                            searchPlaceholder="Search item codes..."
                            emptyText="No item codes found."
                            disabled={!itemsLoaded || availableItemCodes.length === 0}
                            minSearchChars={3}
                          />
                        </div>

                        {/* Item Name */}
                        <div className="space-y-2">
                          <Label className="text-sm">{getLabel('item')}</Label>
                          <Combobox
                            options={[
                              { value: "__all__", label: "All" },
                              ...availableNames.map(name => ({ value: name, label: name }))
                            ]}
                            value={selectedName || "__all__"}
                            onValueChange={(val) => setSelectedName(val === "__all__" ? "" : val)}
                            placeholder="Select Name"
                            searchPlaceholder="Search names..."
                            emptyText="No names found."
                            disabled={false}
                          />
                        </div>

                        {/* Size */}
                        <div className="space-y-2">
                          <Label className="text-sm">{getLabel('size')}</Label>
                          <Combobox
                            options={[
                              { value: "__all__", label: "All" },
                              ...availableSizes.map(size => ({ value: size, label: size }))
                            ]}
                            value={selectedSize || "__all__"}
                            onValueChange={(val) => setSelectedSize(val === "__all__" ? "" : val)}
                            placeholder="Select Size"
                            searchPlaceholder="Search sizes..."
                            emptyText="No sizes found."
                            disabled={false}
                          />
                        </div>

                        {/* Material → Category */}
                        <div className="space-y-2">
                          <Label className="text-sm">{getLabel('category')}</Label>
                          <Combobox
                            options={[
                              { value: "__all__", label: "All" },
                              ...availableMaterials.map(material => ({ value: material, label: material }))
                            ]}
                            value={selectedMaterial || "__all__"}
                            onValueChange={(val) => setSelectedMaterial(val === "__all__" ? "" : val)}
                            placeholder="Select Material"
                            searchPlaceholder="Search materials..."
                            emptyText="No materials found."
                            disabled={false}
                          />
                        </div>

                        {/* Quality → Sub Cat */}
                        <div className="space-y-2">
                          <Label className="text-sm">{getLabel('sub_cat')}</Label>
                          <Combobox
                            options={[
                              { value: "__all__", label: "All" },
                              ...availableQualities.map(quality => ({ value: quality, label: quality }))
                            ]}
                            value={selectedQuality || "__all__"}
                            onValueChange={(val) => setSelectedQuality(val === "__all__" ? "" : val)}
                            placeholder="Select Quality"
                            searchPlaceholder="Search qualities..."
                            emptyText="No qualities found."
                            disabled={false}
                          />
                        </div>

                        {/* Brand → Ref No */}
                        <div className="space-y-2">
                          <Label className="text-sm">{getLabel('ref_no')}</Label>
                          <Combobox
                            options={[
                              { value: "__all__", label: "All" },
                              ...availableBrands.map(brand => ({ value: brand, label: brand }))
                            ]}
                            value={selectedBrand || "__all__"}
                            onValueChange={(val) => setSelectedBrand(val === "__all__" ? "" : val)}
                            placeholder="Select Brand"
                            searchPlaceholder="Search brands..."
                            emptyText="No brands found."
                            disabled={!itemsLoaded || availableBrands.length === 0}
                          />
                        </div>
                      </div>

                      {/* Display Options */}
                      <div className="space-y-4 pt-4 border-t">
                        <Label className="text-sm font-semibold">Display Options</Label>
                        <div className="space-y-3">
                          <div className="flex items-center space-x-2">
                            <Checkbox 
                              id="reorder" 
                              checked={showReorderDetails}
                              onCheckedChange={(checked) => setShowReorderDetails(checked as boolean)}
                            />
                            <Label htmlFor="reorder" className="cursor-pointer text-sm font-normal">
                              Show Reorder Details
                            </Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Checkbox 
                              id="rackwise" 
                              checked={rackWise}
                              onCheckedChange={(checked) => setRackWise(checked as boolean)}
                            />
                            <Label htmlFor="rackwise" className="cursor-pointer text-sm font-normal">
                              Group by Category
                            </Label>
                          </div>
                        </div>
                      </div>

                      {/* Drawer Actions */}
                      <div className="flex gap-2 pt-4 border-t">
                        <Button 
                          onClick={() => {
                            handleStock();
                            setAdvancedFiltersOpen(false);
                          }}
                          disabled={isLoading}
                          className="flex-1"
                        >
                          {isLoadingStock ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Loading...
                            </>
                          ) : (
                            <>
                              <Search className="h-4 w-4 mr-2" />
                              Apply
                            </>
                          )}
                        </Button>
                        <Button 
                          variant="outline" 
                          onClick={() => {
                            handleClear();
                            setAdvancedFiltersOpen(false);
                          }}
                        >
                          <X className="h-4 w-4 mr-2" />
                          Clear
                        </Button>
                      </div>
                    </div>
                  </SheetContent>
                </Sheet>

                <Button 
                  onClick={handleStock} 
                  disabled={isLoading}
                  size="sm"
                  className="h-9"
                >
                  {isLoadingStock ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                      Loading...
                    </>
                  ) : (
                    <>
                      <Search className="h-3.5 w-3.5 mr-1.5" />
                      Apply
                    </>
                  )}
                </Button>

                <Button variant="outline" onClick={handleClear} size="sm" className="h-9">
                  <X className="h-3.5 w-3.5 mr-1.5" />
                  Clear
                </Button>

                <div className="flex-1" />

                {/* Export Buttons */}
                <div className="flex gap-2">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button 
                        variant="outline" 
                        size="icon" 
                        onClick={() => handleExport('excel')} 
                        className="h-9 w-9"
                        disabled={filteredData.length === 0}
                      >
                        <FileSpreadsheet className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Export to Excel</TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button 
                        variant="outline" 
                        size="icon" 
                        onClick={() => handleExport('csv')} 
                        className="h-9 w-9"
                        disabled={filteredData.length === 0}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Export to CSV</TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button 
                        variant="outline" 
                        size="icon" 
                        onClick={() => handleExport('pdf')} 
                        className="h-9 w-9"
                        disabled={filteredData.length === 0}
                      >
                        <Printer className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Print Report</TooltipContent>
                  </Tooltip>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Results Table */}
        {filteredData.length > 0 ? (
          <Card className="border-0 shadow-lg">
            <CardHeader className="border-b">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-xl">Stock Results</CardTitle>
                  <CardDescription>
                    Showing {filteredData.length} items • Total Value: ₹{totalValue.toFixed(2)}
                  </CardDescription>
                </div>
                <Badge variant="secondary" className="text-base px-4 py-2">
                  {totalStock.toFixed(2)} Units
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-linear-to-r from-indigo-50 to-purple-50 dark:from-indigo-950/20 dark:to-purple-950/20">
                      <TableHead className="font-semibold">Item Code</TableHead>
                      <TableHead className="font-semibold">Item Name</TableHead>
                      <TableHead className="font-semibold">Brand</TableHead>
                      <TableHead className="font-semibold">Category</TableHead>
                      <TableHead className="font-semibold">Size</TableHead>
                      <TableHead className="text-right font-semibold">Stock (HO)</TableHead>
                      <TableHead className="text-right font-semibold">Total</TableHead>
                      <TableHead className="text-right font-semibold">Std Rate</TableHead>
                      <TableHead className="text-right font-semibold">Value</TableHead>
                      <TableHead className="text-center font-semibold">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rackWise ? (
                      // Grouped by category
                      Object.entries(groupedData).map(([category, items]) => (
                        <>
                          <TableRow key={`cat-${category}`} className="bg-linear-to-r from-indigo-100/50 to-purple-100/50 dark:from-indigo-950/30 dark:to-purple-950/30 hover:from-indigo-100 hover:to-purple-100 dark:hover:from-indigo-950/40 dark:hover:to-purple-950/40">
                            <TableCell colSpan={10} className="font-semibold">
                              <div className="flex items-center gap-3">
                                <div className="p-1.5 rounded-lg bg-linear-to-br from-indigo-500 to-purple-600 text-white">
                                  <Package className="h-4 w-4" />
                                </div>
                                <span className="text-base">{category}</span>
                                <Badge variant="secondary" className="ml-2">
                                  {items.length} items
                                </Badge>
                              </div>
                            </TableCell>
                          </TableRow>
                          {items.map((item, idx) => {
                            const stockStatus = item.total < 0 ? 'negative' : item.total < 10 ? 'low' : 'good';
                            const itemValue = (item.total || 0) * (item.stdSellRate || 0);
                            
                            return (
                              <TableRow key={`${category}-${idx}`} className="hover:bg-muted/50 transition-colors">
                                <TableCell className="font-mono text-xs">{item.itemcode}</TableCell>
                                <TableCell className="font-medium">{item.itename}</TableCell>
                                <TableCell>{item.brand || "-"}</TableCell>
                                <TableCell>{item.category || "-"}</TableCell>
                                <TableCell>{item.sizes || "-"}</TableCell>
                                <TableCell className="text-right">{item.HO}</TableCell>
                                <TableCell className={`text-right font-bold ${
                                  stockStatus === 'negative' ? 'text-red-600' : 
                                  stockStatus === 'low' ? 'text-amber-600' : 
                                  'text-emerald-600'
                                }`}>
                                  {item.total}
                                </TableCell>
                                <TableCell className="text-right">₹{item.stdSellRate?.toFixed(2)}</TableCell>
                                <TableCell className="text-right font-medium">₹{itemValue.toFixed(2)}</TableCell>
                                <TableCell className="text-center">
                                  {stockStatus === 'negative' ? (
                                    <Badge className="bg-linear-to-r from-red-500 to-red-600 text-white border-0 shadow-md">
                                      <TrendingDown className="h-3 w-3 mr-1" />
                                      Negative
                                    </Badge>
                                  ) : stockStatus === 'low' ? (
                                    <Badge className="bg-linear-to-r from-amber-500 to-amber-600 text-white border-0 shadow-md">
                                      <AlertCircle className="h-3 w-3 mr-1" />
                                      Low Stock
                                    </Badge>
                                  ) : (
                                    <Badge className="bg-linear-to-r from-emerald-500 to-emerald-600 text-white border-0 shadow-md">
                                      <TrendingUp className="h-3 w-3 mr-1" />
                                      Good
                                    </Badge>
                                  )}
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </>
                      ))
                    ) : (
                      // Flat list
                      paginatedData.map((item, idx) => {
                        const stockStatus = item.total < 0 ? 'negative' : item.total < 10 ? 'low' : 'good';
                        const itemValue = (item.total || 0) * (item.stdSellRate || 0);
                        
                        return (
                          <TableRow key={idx} className="hover:bg-muted/50 transition-colors">
                            <TableCell className="font-mono text-xs">{item.itemcode}</TableCell>
                            <TableCell className="font-medium">{item.itename}</TableCell>
                            <TableCell>{item.brand || "-"}</TableCell>
                            <TableCell>{item.category || "-"}</TableCell>
                            <TableCell>{item.sizes || "-"}</TableCell>
                            <TableCell className="text-right">{item.HO}</TableCell>
                            <TableCell className={`text-right font-bold ${
                              stockStatus === 'negative' ? 'text-red-600' : 
                              stockStatus === 'low' ? 'text-amber-600' : 
                              'text-emerald-600'
                            }`}>
                              {item.total}
                            </TableCell>
                            <TableCell className="text-right">₹{item.stdSellRate?.toFixed(2)}</TableCell>
                            <TableCell className="text-right font-medium">₹{itemValue.toFixed(2)}</TableCell>
                            <TableCell className="text-center">
                              {stockStatus === 'negative' ? (
                                <Badge className="bg-linear-to-r from-red-500 to-red-600 text-white border-0 shadow-md">
                                  <TrendingDown className="h-3 w-3 mr-1" />
                                  Negative
                                </Badge>
                              ) : stockStatus === 'low' ? (
                                <Badge className="bg-linear-to-r from-amber-500 to-amber-600 text-white border-0 shadow-md">
                                  <AlertCircle className="h-3 w-3 mr-1" />
                                  Low Stock
                                </Badge>
                              ) : (
                                <Badge className="bg-linear-to-r from-emerald-500 to-emerald-600 text-white border-0 shadow-md">
                                  <TrendingUp className="h-3 w-3 mr-1" />
                                  Good
                                </Badge>
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                    {/* Totals Row */}
                    <TableRow className="bg-linear-to-r from-indigo-100 to-purple-100 dark:from-indigo-900/30 dark:to-purple-900/30 border-t-2 border-indigo-200 dark:border-indigo-800 font-semibold">
                      <TableCell colSpan={5} className="text-right text-base">
                        Total:
                      </TableCell>
                      <TableCell className="text-right text-base">
                        {paginatedData.reduce((sum, item) => sum + (typeof item.HO === 'number' ? item.HO : parseFloat(item.HO as string) || 0), 0).toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right text-base font-bold text-emerald-600 dark:text-emerald-400">
                        {paginatedData.reduce((sum, item) => sum + (item.total || 0), 0).toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right">-</TableCell>
                      <TableCell className="text-right text-base font-bold text-indigo-600 dark:text-indigo-400">
                        ₹{paginatedData.reduce((sum, item) => sum + ((item.total || 0) * (item.stdSellRate || 0)), 0).toFixed(2)}
                      </TableCell>
                      <TableCell className="text-center">-</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
              {!rackWise && (
                <TablePagination
                  totalItems={filteredData.length}
                  pageSize={pageSize}
                  currentPage={currentPage}
                  onPageChange={setCurrentPage}
                  onPageSizeChange={setPageSize}
                />
              )}
            </CardContent>
          </Card>
        ) : (
          <Card className="border-0 shadow-lg">
            <CardContent className="flex flex-col items-center justify-center py-20">
              <div className="relative mb-6">
                <div className="absolute inset-0 bg-linear-to-r from-indigo-500 to-purple-600 rounded-full blur-2xl opacity-20 animate-pulse" />
                <div className="relative p-6 rounded-full bg-linear-to-br from-indigo-100 to-purple-100 dark:from-indigo-950/50 dark:to-purple-950/50">
                  <Package className="h-16 w-16 text-indigo-600" />
                </div>
              </div>
              <h3 className="text-2xl font-bold mb-2 bg-linear-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                No Stock Data Yet
              </h3>
              <p className="text-muted-foreground text-center max-w-md mb-8">
                Select item filters (code, name, size, material, quality, or brand) and click the button below to load your current stock levels
              </p>
              <Button 
                onClick={handleStock}
                size="lg"
                disabled={isLoading}
                className="bg-linear-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-300"
              >
                {isLoadingStock ? (
                  <>
                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                    Loading...
                  </>
                ) : (
                  <>
                    <Search className="h-5 w-5 mr-2" />
                    Load Stock Data
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* AI Assistant */}
      <ModuleAIAssistant
        moduleName="Current Stock Report"
        moduleData={{ 
          stockData: filteredData, 
          showReorderDetails, 
          rackWise,
          selectedStockPlace,
          filters: currentFilters,
          totalItems,
          totalStock,
          totalValue,
        }}
      />
    </TooltipProvider>
  );
}
