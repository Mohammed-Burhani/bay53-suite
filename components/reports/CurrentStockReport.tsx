"use client";

import { useState, useMemo } from "react";
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
} from "lucide-react";
import { ModuleAIAssistant } from "@/components/ModuleAIAssistant";
import { TablePagination, usePagination } from "@/components/ui/table-pagination";
import { MultiSelect } from "@/components/ui/multi-select";
import { useStockPlaces, useItems, useCurrentStock } from "@/lib/hooks/useReports";
import { toast } from "sonner";
import type { CurrentStockItem } from "@/lib/types/reports.types";

export default function CurrentStockReport() {
  const [selectedStockPlace, setSelectedStockPlace] = useState<number>(0);
  const [selectedItems, setSelectedItems] = useState<number[]>([]);
  const [showReorderDetails, setShowReorderDetails] = useState(false);
  const [rackWise, setRackWise] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const { currentPage, pageSize, setCurrentPage, setPageSize } = usePagination(50);

  // Fetch dropdown data
  const { data: stockPlaces = [], isLoading: isLoadingStockPlaces } = useStockPlaces();
  const { data: items = [], isLoading: isLoadingItems } = useItems();

  // Fetch current stock mutation
  const { mutate: fetchCurrentStock, data: stockData = [], isPending: isLoadingStock } = useCurrentStock();

  const handleStock = () => {
    if (selectedItems.length === 0) {
      toast.error("Please select at least one item");
      return;
    }

    fetchCurrentStock(
      {
        itemIds: selectedItems,
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
    setSelectedItems([]);
    setSearchTerm("");
  };

  const handleExport = (format: 'csv' | 'excel' | 'pdf') => {
    console.log(`Exporting as ${format}`);
    toast.info(`Exporting as ${format.toUpperCase()}...`);
  };

  // Filter and search stock data
  const filteredData = useMemo(() => {
    if (!stockData || stockData.length === 0) return [];
    
    return stockData.filter((item) => {
      if (!searchTerm) return true;
      const search = searchTerm.toLowerCase();
      return (
        item.itemName?.toLowerCase().includes(search) ||
        item.category?.toLowerCase().includes(search) ||
        item.stockPlace?.toLowerCase().includes(search)
      );
    });
  }, [stockData, searchTerm]);

  // Calculate stats
  const totalItems = filteredData.length;
  const totalStock = filteredData.reduce((sum, item) => sum + (item.quantity || 0), 0);
  const totalValue = filteredData.reduce((sum, item) => sum + (item.value || 0), 0);
  const lowStockItems = filteredData.filter(item => item.quantity > 0 && item.quantity < 10).length;
  const negativeStockItems = filteredData.filter(item => item.quantity < 0).length;

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

        {/* Modern Filter Panel */}
        <Card className="border shadow-sm">
          <CardHeader className="border-b bg-linear-to-r from-slate-50 to-gray-50 dark:from-slate-900 dark:to-gray-900">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-linear-to-br from-indigo-500 to-purple-600 text-white">
                <Filter className="h-4 w-4" />
              </div>
              <div>
                <CardTitle className="text-base font-semibold">Smart Filters</CardTitle>
                <CardDescription className="text-xs">Refine your stock view with intelligent filtering</CardDescription>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-6 space-y-5">
            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Quick search by item name, category, or stock place..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 h-10"
              />
            </div>

            {/* Filter Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium flex items-center gap-1.5 text-muted-foreground">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                  Stock Place
                </Label>
                <Select
                  value={selectedStockPlace.toString()}
                  onValueChange={(value) => setSelectedStockPlace(Number(value))}
                  disabled={isLoadingStockPlaces}
                >
                  <SelectTrigger className="h-9 w-full">
                    <SelectValue placeholder={isLoadingStockPlaces ? "Loading..." : "Select Stock Place"} />
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
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-medium flex items-center gap-1.5 text-muted-foreground">
                  <span className="w-1.5 h-1.5 rounded-full bg-purple-500" />
                  Items (Select Multiple)
                </Label>
                <MultiSelect
                  options={items
                    .filter(item => item.isActive)
                    .map(item => ({
                      label: `${item.name}${item.category ? ` (${item.category})` : ""}`,
                      value: item.item_ID.toString(),
                    }))}
                  selected={selectedItems.map(id => id.toString())}
                  onChange={(values) => setSelectedItems(values.map(v => Number(v)))}
                  placeholder={isLoadingItems ? "Loading..." : "Select items"}
                  disabled={isLoadingItems}
                  className="h-auto"
                />
                {selectedItems.length > 0 && (
                  <p className="text-xs text-muted-foreground">
                    {selectedItems.length} item(s) selected
                  </p>
                )}
              </div>
            </div>

            {/* Display Options */}
            <div className="flex flex-wrap items-center gap-6 pt-2">
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

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-2 pt-3 border-t">
              <Button 
                onClick={handleStock} 
                disabled={isLoading || selectedItems.length === 0}
                size="sm"
                className="bg-linear-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white h-9"
              >
                {isLoadingStock ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                    Loading...
                  </>
                ) : (
                  <>
                    <Search className="h-3.5 w-3.5 mr-1.5" />
                    Apply Filters
                  </>
                )}
              </Button>
              <Button variant="outline" onClick={handleClear} size="sm" className="h-9">
                <X className="h-3.5 w-3.5 mr-1.5" />
                Clear All
              </Button>
              <div className="flex-1" />
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
                      <TableHead className="font-semibold">Item Name</TableHead>
                      <TableHead className="font-semibold">Category</TableHead>
                      <TableHead className="font-semibold">Unit</TableHead>
                      <TableHead className="font-semibold">Stock Place</TableHead>
                      <TableHead className="text-right font-semibold">Quantity</TableHead>
                      <TableHead className="text-right font-semibold">Rate</TableHead>
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
                            <TableCell colSpan={8} className="font-semibold">
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
                            const stockStatus = item.quantity < 0 ? 'negative' : item.quantity < 10 ? 'low' : 'good';
                            
                            return (
                              <TableRow key={`${category}-${idx}`} className="hover:bg-muted/50 transition-colors">
                                <TableCell className="font-medium">{item.itemName}</TableCell>
                                <TableCell>{item.category || "-"}</TableCell>
                                <TableCell>{item.unit}</TableCell>
                                <TableCell>{item.stockPlace}</TableCell>
                                <TableCell className={`text-right font-bold ${
                                  stockStatus === 'negative' ? 'text-red-600' : 
                                  stockStatus === 'low' ? 'text-amber-600' : 
                                  'text-emerald-600'
                                }`}>
                                  {item.quantity?.toFixed(2)}
                                </TableCell>
                                <TableCell className="text-right">₹{item.rate?.toFixed(2)}</TableCell>
                                <TableCell className="text-right font-medium">₹{item.value?.toFixed(2)}</TableCell>
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
                        const stockStatus = item.quantity < 0 ? 'negative' : item.quantity < 10 ? 'low' : 'good';
                        
                        return (
                          <TableRow key={idx} className="hover:bg-muted/50 transition-colors">
                            <TableCell className="font-medium">{item.itemName}</TableCell>
                            <TableCell>{item.category || "-"}</TableCell>
                            <TableCell>{item.unit}</TableCell>
                            <TableCell>{item.stockPlace}</TableCell>
                            <TableCell className={`text-right font-bold ${
                              stockStatus === 'negative' ? 'text-red-600' : 
                              stockStatus === 'low' ? 'text-amber-600' : 
                              'text-emerald-600'
                            }`}>
                              {item.quantity?.toFixed(2)}
                            </TableCell>
                            <TableCell className="text-right">₹{item.rate?.toFixed(2)}</TableCell>
                            <TableCell className="text-right font-medium">₹{item.value?.toFixed(2)}</TableCell>
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
                Select items and stock place, then click the button below to load your current stock levels
              </p>
              <Button 
                onClick={handleStock}
                size="lg"
                disabled={isLoading || selectedItems.length === 0}
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
          selectedItems,
          totalItems,
          totalStock,
          totalValue,
        }}
      />
    </TooltipProvider>
  );
}
