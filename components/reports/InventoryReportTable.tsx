"use client";

import { useState, useMemo, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
  FileSpreadsheet, 
  Printer,
  Loader2,
  Lightbulb,
  BarChart3,
  TrendingUp,
  SlidersHorizontal,
} from "lucide-react";
import { ModuleAIAssistant } from "@/components/ModuleAIAssistant";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { TablePagination, usePagination } from "@/components/ui/table-pagination";
import { Combobox } from "@/components/ui/combobox";
import { DateRangeFilter, type DateFilterType } from "@/components/reports/DateRangeFilter";
import { useStockPlaces, useItems, useInventoryReport, useLedgersByGroup, useInvoiceTypes } from "@/lib/hooks/useReports";
import { toast } from "sonner";
import type { ItemAttributes } from "@/lib/types/reports.types";
import { getAvailableOptions } from "@/lib/utils/item-parser";
import { exportToExcel, exportToPDF } from "@/lib/utils/report-export";
import { useClassificationLabels } from "@/lib/contexts/ClassificationContext";

export default function InventoryReportTable() {
  const { getLabel } = useClassificationLabels();
  // 6 Item Filters (same as Current Stock)
  const [selectedItemCode, setSelectedItemCode] = useState<string>("");
  const [selectedName, setSelectedName] = useState<string>("");
  const [selectedSize, setSelectedSize] = useState<string>("");
  const [selectedMaterial, setSelectedMaterial] = useState<string>("");
  const [selectedQuality, setSelectedQuality] = useState<string>("");
  const [selectedBrand, setSelectedBrand] = useState<string>("");

  // Paired Checkbox Filters
  const [allItem, setAllItem] = useState(true); // Default to true
  const [itemWise, setItemWise] = useState(false);
  const [inventory, setInventory] = useState(false);
  const [reorderDetails, setReorderDetails] = useState(false);

  const [billTypeWise, setBillTypeWise] = useState(false);
  const [billType, setBillType] = useState<number>(0);

  const [stockPlaceWise, setStockPlaceWise] = useState(false);
  const [billFrom, setBillFrom] = useState<number>(0);

  const [batchCodeWise, setBatchCodeWise] = useState(false);
  const [batchCode, setBatchCode] = useState<string>("");

  const [partyWise, setPartyWise] = useState(false);
  const [party, setParty] = useState<number>(0);

  const [billDetail, setBillDetail] = useState(false);
  const [salesman, setSalesman] = useState<string>("");

  const [dateWise, setDateWise] = useState(false);
  
  // Date Range Filter states
  const [dateType, setDateType] = useState<DateFilterType>("none");
  const [selectedMonth, setSelectedMonth] = useState<string>("");
  const [selectedQuarter, setSelectedQuarter] = useState<string>("");
  const [selectedHalfYear, setSelectedHalfYear] = useState<string>("");
  const [selectedYear, setSelectedYear] = useState<string>("");
  const [fromDate, setFromDate] = useState<string | null>(null);
  const [toDate, setToDate] = useState<string | null>(null);
  const [calculatedFromDate, setCalculatedFromDate] = useState<string | null>(null);
  const [calculatedToDate, setCalculatedToDate] = useState<string | null>(null);

  const [areaWise, setAreaWise] = useState(false);
  const [area, setArea] = useState<string>("");

  const [cityWise, setCityWise] = useState(false);
  const [city, setCity] = useState<string>("");

  const [searchTerm, setSearchTerm] = useState("");
  const { currentPage, pageSize, setCurrentPage, setPageSize } = usePagination(50);
  const [advancedOpen, setAdvancedOpen] = useState(false);

  // Fetch dropdown data
  const { data: stockPlaces = [], isLoading: isLoadingStockPlaces } = useStockPlaces();
  const { data: items = [], isLoading: isLoadingItems, isSuccess: itemsLoaded } = useItems();
  const { data: ledgers = [], isLoading: isLoadingLedgers } = useLedgersByGroup([16, 17]);
  const { data: invoiceTypes = [], isLoading: isLoadingInvoiceTypes } = useInvoiceTypes();

  // Fetch inventory report mutation
  const { mutate: fetchInventoryReport, data: reportData = [], isPending: isLoadingReport } = useInventoryReport();

  // Current filter state
  const currentFilters: Partial<ItemAttributes> = useMemo(() => ({
    itemCode: selectedItemCode || undefined,
    name: selectedName || undefined,
    size: selectedSize || undefined,
    material: selectedMaterial || undefined,
    quality: selectedQuality || undefined,
    brand: selectedBrand || undefined,
  }), [selectedItemCode, selectedName, selectedSize, selectedMaterial, selectedQuality, selectedBrand]);

  // Pre-compute available options
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

  const handleSearch = () => {
    // Check if at least one item filter is selected when allItem is false
    if (!allItem) {
      const hasFilter = selectedItemCode || selectedName || selectedSize || 
                        selectedMaterial || selectedQuality || selectedBrand;
      
      if (!hasFilter) {
        toast.error("Please select at least one item filter or check 'All Item'");
        return;
      }
    }

    // When billTypeWise is NOT checked, force user to select a specific bill type (not "All")
    if (!billTypeWise && billType === 0) {
      toast.error("Please select a specific Bill Type or check 'Bill Type Wise'");
      return;
    }

    fetchInventoryReport(
      {
        itemWise: itemWise,
        itemCode: selectedItemCode || null,
        name: selectedName || null,
        size: selectedSize || null,
        material: selectedMaterial || null,
        quality: selectedQuality || null,
        brand: selectedBrand || null,
        invType: billTypeWise ? null : (billType || null),
        spIdWise: stockPlaceWise,
        spId: billFrom || null,
        ledgerWise: partyWise,
        ledgerId: party || null,
        mfrReq: inventory,
        billDetailsReq: billDetail,
        dateWise: dateWise,
        fromDate: calculatedFromDate,
        toDate: calculatedToDate,
        salesman: salesman || null,
        batchCode: batchCode || null,
        area: area || null,
        city: city || null,
        reorder: reorderDetails,
      },
      {
        onSuccess: (data) => {
          toast.success(`Loaded ${data.length} records`);
          setCurrentPage(1);
        },
        onError: (error) => {
          toast.error("Failed to load inventory report");
          console.error(error);
        },
      }
    );
  };

  const handleClear = () => {
    setSelectedItemCode("");
    setSelectedName("");
    setSelectedSize("");
    setSelectedMaterial("");
    setSelectedQuality("");
    setSelectedBrand("");
    setAllItem(true); // Reset to default true
    setItemWise(false);
    setInventory(false);
    setReorderDetails(false);
    setBillTypeWise(false);
    setBillType(0);
    setStockPlaceWise(false);
    setBillFrom(0);
    setBatchCodeWise(false);
    setBatchCode("");
    setPartyWise(false);
    setParty(0);
    setBillDetail(false);
    setSalesman("");
    setDateWise(false);
    setDateType("none");
    setSelectedMonth("");
    setSelectedQuarter("");
    setSelectedHalfYear("");
    setSelectedYear("");
    setFromDate(null);
    setToDate(null);
    setCalculatedFromDate(null);
    setCalculatedToDate(null);
    setAreaWise(false);
    setArea("");
    setCityWise(false);
    setCity("");
    setSearchTerm("");
  };

  const handleExport = (format: 'csv' | 'excel' | 'pdf') => {
    const headers = [
      { key: "itename", label: "Item Name" },
      { key: "category", label: getLabel("category") },
      { key: "brand", label: "Brand" },
      { key: "opening", label: "Opening" },
      { key: "received", label: "Received" },
      { key: "issued", label: "Issued" },
      { key: "closing", label: "Closing" },
      { key: "unit", label: "Unit" },
    ];
    
    if (format === 'excel') {
      exportToExcel(filteredData as unknown as Record<string, unknown>[], headers, "inventory-report");
      toast.success("Exported to Excel");
    } else if (format === 'pdf') {
      exportToPDF(filteredData as unknown as Record<string, unknown>[], headers, "Inventory Report", "inventory-report");
      toast.success("Downloaded PDF");
    } else if (format === 'csv') {
      exportToExcel(filteredData as unknown as Record<string, unknown>[], headers, "inventory-report-csv");
      toast.success("Exported to CSV");
    }
  };

  // Filter and search report data
  const filteredData = useMemo(() => {
    if (!reportData || reportData.length === 0) return [];
    
    return reportData.filter((item) => {
      if (!searchTerm) return true;
      const search = searchTerm.toLowerCase();
      return Object.values(item).some(val => 
        val?.toString().toLowerCase().includes(search)
      );
    });
  }, [reportData, searchTerm]);

  // Extract dynamic columns from data
  const dynamicColumns = useMemo(() => {
    if (filteredData.length === 0) return [];
    
    const firstRow = filteredData[0];
    const allColumns = Object.keys(firstRow);

    // Define hidden columns (case-insensitive matching)
    const hiddenColumns = ['typeid'];
    
    // Filter out hidden columns and create column objects
    const visibleColumns = allColumns
      .filter(key => !hiddenColumns.includes(key.toLowerCase().replace(/\s+/g, '')))
      .map(key => ({
        key,
        label: key, // Keep original key as label since API already provides formatted names
      }));

    // Define column order: Bill Type first, then Amount
    const priorityOrder = ['billtype', 'amount'];
    
    // Sort columns: prioritized columns first in specified order, then others
    const sortedColumns = visibleColumns.sort((a, b) => {
      const aKey = a.key.toLowerCase().replace(/\s+/g, '');
      const bKey = b.key.toLowerCase().replace(/\s+/g, '');
      const aIndex = priorityOrder.indexOf(aKey);
      const bIndex = priorityOrder.indexOf(bKey);
      
      // If both are in priority list, sort by their order
      if (aIndex !== -1 && bIndex !== -1) return aIndex - bIndex;
      // If only a is in priority list, a comes first
      if (aIndex !== -1) return -1;
      // If only b is in priority list, b comes first
      if (bIndex !== -1) return 1;
      // Otherwise maintain original order
      return 0;
    });
    
    return sortedColumns;
  }, [filteredData]);

  // Pagination
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedData = filteredData.slice(startIndex, endIndex);

  const isLoading = isLoadingStockPlaces || isLoadingItems || isLoadingLedgers || isLoadingInvoiceTypes || isLoadingReport;
  const hasAnyItemFilter = selectedItemCode || selectedName || selectedSize || 
                           selectedMaterial || selectedQuality || selectedBrand;

  // Loading tips
  const loadingTips = [
    "Use item filters to narrow down your inventory search",
    "Enable 'All Item' to see all items without filtering",
    "Pair filters work together - check one to disable its counterpart",
    "Date filters help you analyze inventory over specific periods",
    "Export your results to Excel, CSV, or PDF for further analysis",
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
                <div className="absolute inset-0 bg-linear-to-r from-[var(--sidebar-glow-from)] to-[var(--sidebar-glow-to)] rounded-full blur-2xl opacity-30 animate-pulse" />
                <div className="relative p-6 rounded-full bg-linear-to-br from-[var(--report-accent-bg)] to-[var(--report-accent-bg)] dark:from-[var(--report-accent)]/10 dark:to-[var(--report-accent)]/10">
                  <Loader2 className="h-12 w-12 text-[var(--report-accent)] animate-spin" />
                </div>
              </div>
              
              <div className="space-y-2">
                <h3 className="text-xl font-bold bg-linear-to-r from-[var(--sidebar-glow-from)] to-[var(--sidebar-glow-to)] bg-clip-text text-transparent">
                  Loading Items Data
                </h3>
                <p className="text-sm text-muted-foreground">
                  Please wait while we load your inventory...
                </p>
              </div>

              <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                <div className="h-full bg-linear-to-r from-[var(--sidebar-glow-from)] to-[var(--sidebar-glow-to)] animate-pulse" style={{ width: '70%' }} />
              </div>

              <div className="flex items-start gap-3 p-4 bg-linear-to-r bg-[var(--report-accent-bg)] dark:from-[var(--report-accent)]/5 dark:to-[var(--report-accent)]/5 rounded-lg border border-[var(--report-accent-border)] dark:border-[var(--report-accent-border)]">
                <Lightbulb className="h-5 w-5 text-[var(--report-accent)] shrink-0 mt-0.5" />
                <div className="text-left">
                  <p className="text-xs font-semibold text-foreground dark:text-foreground mb-1">
                    Pro Tip
                  </p>
                  <p className="text-xs text-muted-foreground dark:text-muted-foreground">
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
        {/* Stats Cards */}
        {filteredData.length > 0 && (
          <div className="grid gap-4 sm:grid-cols-3">
            <Card className="relative overflow-hidden border-0 bg-linear-to-br from-[var(--card-accent-bg)] to-[var(--card-accent-bg)] text-white shadow-lg hover:shadow-xl transition-all duration-300">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16" />
              <CardContent className="p-6 relative">
                <div className="flex items-center justify-between mb-2">
                  <Package className="h-8 w-8 opacity-80" />
                </div>
                <p className="text-sm font-medium opacity-90">Total Records</p>
                <p className="text-3xl font-bold mt-1">{filteredData.length}</p>
              </CardContent>
            </Card>

            <Card className="relative overflow-hidden border-0 bg-linear-to-br from-emerald-500 to-emerald-600 text-white shadow-lg hover:shadow-xl transition-all duration-300">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16" />
              <CardContent className="p-6 relative">
                <div className="flex items-center justify-between mb-2">
                  <TrendingUp className="h-8 w-8 opacity-80" />
                </div>
                <p className="text-sm font-medium opacity-90">Columns</p>
                <p className="text-3xl font-bold mt-1">{dynamicColumns.length}</p>
              </CardContent>
            </Card>

            <Card className="relative overflow-hidden border-0 bg-linear-to-br from-[var(--card-accent-bg)] to-[var(--card-accent-bg)] text-white shadow-lg hover:shadow-xl transition-all duration-300">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16" />
              <CardContent className="p-6 relative">
                <div className="flex items-center justify-between mb-2">
                  <BarChart3 className="h-8 w-8 opacity-80" />
                </div>
                <p className="text-sm font-medium opacity-90">Active Filters</p>
                <p className="text-3xl font-bold mt-1">
                  {[itemWise, stockPlaceWise, partyWise, dateWise, billTypeWise, batchCodeWise].filter(Boolean).length}
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Filter Panel */}
        <Card className="border shadow-sm">
          <CardContent className="p-4 space-y-3">
            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Quick search in results..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 h-9"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* Date Range */}
              <div className="w-[200px]">
                <DateRangeFilter
                  dateType={dateType}
                  selectedMonth={selectedMonth}
                  selectedQuarter={selectedQuarter}
                  selectedHalfYear={selectedHalfYear}
                  selectedYear={selectedYear}
                  fromDate={fromDate || ""}
                  toDate={toDate || ""}
                  onDateTypeChange={setDateType}
                  onSelectedMonthChange={setSelectedMonth}
                  onSelectedQuarterChange={setSelectedQuarter}
                  onSelectedHalfYearChange={setSelectedHalfYear}
                  onSelectedYearChange={setSelectedYear}
                  onFromDateChange={(date) => setFromDate(date)}
                  onToDateChange={(date) => setToDate(date)}
                  onDateChange={(from, to) => {
                    setCalculatedFromDate(from);
                    setCalculatedToDate(to);
                  }}
                  label="Date Range"
                />
              </div>

              {/* Bill Type */}
              <Select
                value={billType.toString()}
                onValueChange={(value) => setBillType(Number(value))}
                disabled={billTypeWise || isLoadingInvoiceTypes}
              >
                <SelectTrigger className="h-9 w-[180px]">
                  <SelectValue placeholder={isLoadingInvoiceTypes ? "Loading..." : "Bill Type"} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">All Types</SelectItem>
                  {invoiceTypes.map((type) => (
                    <SelectItem key={type.invTypeId} value={type.invTypeId.toString()}>
                      {type.typeName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Advanced Filters Drawer */}
              <Sheet open={advancedOpen} onOpenChange={setAdvancedOpen}>
                <SheetTrigger asChild>
                  <Button variant="outline" size="sm" className="h-9">
                    <SlidersHorizontal className="h-4 w-4 mr-2" />
                    Advanced Filters
                    {(hasAnyItemFilter || [itemWise, stockPlaceWise, partyWise, dateWise, billTypeWise, batchCodeWise, areaWise, cityWise].filter(Boolean).length > 0) && (
                      <Badge variant="secondary" className="ml-2">
                        {Object.values(currentFilters).filter(Boolean).length + [itemWise, stockPlaceWise, partyWise, dateWise, billTypeWise, batchCodeWise, areaWise, cityWise].filter(Boolean).length}
                      </Badge>
                    )}
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-[420px] sm:w-[540px] overflow-y-auto">
                  <SheetHeader>
                    <SheetTitle>Advanced Filters</SheetTitle>
                    <SheetDescription>Item filters, additional options, and report settings</SheetDescription>
                  </SheetHeader>

                  <div className="space-y-6 mt-6">
                    {/* 6 Item Attribute Filters */}
                    <div className="space-y-4">
                      <div className="flex items-center gap-2">
                        <Package className="h-4 w-4 text-[var(--report-accent)]" />
                        <Label className="text-sm font-semibold">Item Filters</Label>
                        <div className="flex items-center space-x-2 ml-auto">
                          <Checkbox id="allitem" checked={allItem} onCheckedChange={(checked) => setAllItem(checked as boolean)} />
                          <Label htmlFor="allitem" className="cursor-pointer text-sm font-normal">All Item</Label>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-2">
                          <Label className="text-sm">{getLabel('item_code')}</Label>
                          <Combobox
                            options={[{ value: "__all__", label: "All" }, ...availableItemCodes.map(code => ({ value: code, label: code }))]}
                            value={selectedItemCode || "__all__"}
                            onValueChange={(val) => setSelectedItemCode(val === "__all__" ? "" : val)}
                            placeholder="Select Item Code"
                            searchPlaceholder="Search item codes..."
                            emptyText="No item codes found."
                            disabled={!itemsLoaded || availableItemCodes.length === 0 || allItem}
                            minSearchChars={3}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-sm">{getLabel('item')}</Label>
                          <Combobox
                            options={[{ value: "__all__", label: "All" }, ...availableNames.map(name => ({ value: name, label: name }))]}
                            value={selectedName || "__all__"}
                            onValueChange={(val) => setSelectedName(val === "__all__" ? "" : val)}
                            placeholder="Select Name"
                            searchPlaceholder="Search names..."
                            emptyText="No names found."
                            disabled={!itemsLoaded || availableNames.length === 0 || allItem}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-sm">{getLabel('size')}</Label>
                          <Combobox
                            options={[{ value: "__all__", label: "All" }, ...availableSizes.map(size => ({ value: size, label: size }))]}
                            value={selectedSize || "__all__"}
                            onValueChange={(val) => setSelectedSize(val === "__all__" ? "" : val)}
                            placeholder="Select Size"
                            searchPlaceholder="Search sizes..."
                            emptyText="No sizes found."
                            disabled={!itemsLoaded || availableSizes.length === 0 || allItem}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-sm">{getLabel('category')}</Label>
                          <Combobox
                            options={[{ value: "__all__", label: "All" }, ...availableMaterials.map(material => ({ value: material, label: material }))]}
                            value={selectedMaterial || "__all__"}
                            onValueChange={(val) => setSelectedMaterial(val === "__all__" ? "" : val)}
                            placeholder="Select Material"
                            searchPlaceholder="Search materials..."
                            emptyText="No materials found."
                            disabled={!itemsLoaded || availableMaterials.length === 0 || allItem}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-sm">{getLabel('sub_cat')}</Label>
                          <Combobox
                            options={[{ value: "__all__", label: "All" }, ...availableQualities.map(quality => ({ value: quality, label: quality }))]}
                            value={selectedQuality || "__all__"}
                            onValueChange={(val) => setSelectedQuality(val === "__all__" ? "" : val)}
                            placeholder="Select Quality"
                            searchPlaceholder="Search qualities..."
                            emptyText="No qualities found."
                            disabled={!itemsLoaded || availableQualities.length === 0 || allItem}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-sm">{getLabel('ref_no')}</Label>
                          <Combobox
                            options={[{ value: "__all__", label: "All" }, ...availableBrands.map(brand => ({ value: brand, label: brand }))]}
                            value={selectedBrand || "__all__"}
                            onValueChange={(val) => setSelectedBrand(val === "__all__" ? "" : val)}
                            placeholder="Select Brand"
                            searchPlaceholder="Search brands..."
                            emptyText="No brands found."
                            disabled={!itemsLoaded || availableBrands.length === 0 || allItem}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Additional Filters */}
                    <div className="space-y-4 pt-4 border-t">
                      <Label className="text-sm font-semibold">Additional Filters</Label>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-2">
                          <Label className="text-sm">Bill From</Label>
                          <Select value={billFrom.toString()} onValueChange={(value) => setBillFrom(Number(value))} disabled={isLoadingStockPlaces || stockPlaceWise}>
                            <SelectTrigger className="h-9"><SelectValue placeholder="All Sources" /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="0">All Sources</SelectItem>
                              {stockPlaces.map((sp) => (
                                <SelectItem key={sp.sp_ID} value={sp.sp_ID.toString()}>{sp.name} ({sp.code})</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label className="text-sm">Party</Label>
                          <Select value={party.toString()} onValueChange={(value) => setParty(Number(value))} disabled={isLoadingLedgers || partyWise}>
                            <SelectTrigger className="h-9"><SelectValue placeholder="All Parties" /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="0">All Parties</SelectItem>
                              {ledgers.map((ledger) => (
                                <SelectItem key={ledger.ledger_id} value={ledger.ledger_id.toString()}>{ledger.name}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label className="text-sm">Salesman</Label>
                          <Input placeholder="Enter salesman" value={salesman} onChange={(e) => setSalesman(e.target.value)} disabled={billDetail} className="h-9" />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-sm">Batch Code</Label>
                          <Input placeholder="Enter batch code" value={batchCode} onChange={(e) => setBatchCode(e.target.value)} disabled={batchCodeWise} className="h-9" />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-sm">Area</Label>
                          <Input placeholder="Enter area" value={area} onChange={(e) => setArea(e.target.value)} disabled={areaWise} className="h-9" />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-sm">City</Label>
                          <Input placeholder="Enter city" value={city} onChange={(e) => setCity(e.target.value)} disabled={cityWise} className="h-9" />
                        </div>
                      </div>
                    </div>

                    {/* Report Options */}
                    <div className="space-y-3 pt-4 border-t">
                      <Label className="text-sm font-semibold">Report Options</Label>
                      <div className="grid grid-cols-2 gap-3">
                        {[
                          { id: "itemwise", label: "Item Wise", checked: itemWise, onChange: setItemWise },
                          { id: "billtypewise", label: "Bill Type Wise", checked: billTypeWise, onChange: setBillTypeWise },
                          { id: "stockplacewise", label: "Stock Place Wise", checked: stockPlaceWise, onChange: setStockPlaceWise },
                          { id: "batchcodewise", label: "Batch Code Wise", checked: batchCodeWise, onChange: setBatchCodeWise },
                          { id: "partywise", label: "Party Wise", checked: partyWise, onChange: setPartyWise },
                          { id: "billdetail", label: "Bill Detail", checked: billDetail, onChange: setBillDetail },
                          { id: "datewise", label: "Date Wise", checked: dateWise, onChange: setDateWise },
                          { id: "areawise", label: "Area Wise", checked: areaWise, onChange: setAreaWise },
                          { id: "citywise", label: "City Wise", checked: cityWise, onChange: setCityWise },
                          { id: "inventory", label: "Inventory", checked: inventory, onChange: setInventory },
                          { id: "reorderdetails", label: "Re-order Details", checked: reorderDetails, onChange: setReorderDetails },
                        ].map(({ id, label, checked, onChange }) => (
                          <div key={id} className="flex items-center space-x-2">
                            <Checkbox id={id} checked={checked} onCheckedChange={(c) => onChange(c as boolean)} />
                            <Label htmlFor={id} className="cursor-pointer text-sm font-normal">{label}</Label>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Drawer Actions */}
                    <div className="flex gap-2 pt-4 border-t">
                      <Button onClick={() => { handleSearch(); setAdvancedOpen(false); }} disabled={isLoading} className="flex-1">
                        {isLoadingReport ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Search className="h-4 w-4 mr-2" />}
                        {isLoadingReport ? "Loading..." : "Apply"}
                      </Button>
                      <Button variant="outline" onClick={() => { handleClear(); setAdvancedOpen(false); }}>
                        <X className="h-4 w-4 mr-2" />
                        Clear
                      </Button>
                    </div>
                  </div>
                </SheetContent>
              </Sheet>

              <Button onClick={handleSearch} disabled={isLoading} size="sm" className="h-9">
                {isLoadingReport ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> : <Search className="h-3.5 w-3.5 mr-1.5" />}
                {isLoadingReport ? "Loading..." : "Generate"}
              </Button>
              <Button variant="outline" onClick={handleClear} size="sm" className="h-9">
                <X className="h-3.5 w-3.5 mr-1.5" />
                Clear
              </Button>

              <div className="flex-1" />

              <div className="flex gap-2">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="outline" size="icon" onClick={() => handleExport('excel')} className="h-9 w-9" disabled={filteredData.length === 0}>
                      <FileSpreadsheet className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Export to Excel</TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="outline" size="icon" onClick={() => handleExport('csv')} className="h-9 w-9" disabled={filteredData.length === 0}>
                      <Download className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Export to CSV</TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="outline" size="icon" onClick={() => handleExport('pdf')} className="h-9 w-9" disabled={filteredData.length === 0}>
                      <Printer className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Print Report</TooltipContent>
                </Tooltip>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Results Table with Dynamic Columns */}
        {filteredData.length > 0 ? (
          <Card className="border-0 shadow-lg">
            <CardHeader className="border-b">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-xl">Inventory Report Results</CardTitle>
                  <CardDescription>
                    Showing {filteredData.length} records with {dynamicColumns.length} columns
                  </CardDescription>
                </div>
                <Badge variant="secondary" className="text-base px-4 py-2">
                  {filteredData.length} Records
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-linear-to-r bg-[var(--report-accent-bg)] dark:from-[var(--report-accent)]/5 dark:to-[var(--report-accent)]/5">
                      {dynamicColumns.map((col) => {
                        const isAmountColumn = col.key.toLowerCase().replace(/\s+/g, '') === 'amount';
                        return (
                          <TableHead 
                            key={col.key} 
                            className={`font-semibold whitespace-nowrap ${isAmountColumn ? 'text-right' : 'text-left'}`}
                          >
                            {col.label}
                          </TableHead>
                        );
                      })}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedData.map((row, idx) => (
                      <TableRow key={idx} className="hover:bg-muted/50 transition-colors">
                        {dynamicColumns.map((col) => {
                          const value = row[col.key];
                          const isNumeric = typeof value === 'number';
                          const isAmountColumn = col.key.toLowerCase().replace(/\s+/g, '') === 'amount';
                          
                          return (
                            <TableCell 
                              key={col.key} 
                              className={`${isNumeric || isAmountColumn ? 'text-right font-medium tabular-nums' : 'text-left'}`}
                            >
                              {value === null || value === undefined ? '-' : 
                               isNumeric ? value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : 
                               String(value)}
                            </TableCell>
                          );
                        })}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <TablePagination
                totalItems={filteredData.length}
                pageSize={pageSize}
                currentPage={currentPage}
                onPageChange={setCurrentPage}
                onPageSizeChange={setPageSize}
              />
            </CardContent>
          </Card>
        ) : (
          <Card className="border-0 shadow-lg">
            <CardContent className="flex flex-col items-center justify-center py-20">
              <div className="relative mb-6">
                <div className="absolute inset-0 bg-linear-to-r from-[var(--sidebar-glow-from)] to-[var(--sidebar-glow-to)] rounded-full blur-2xl opacity-20 animate-pulse" />
                <div className="relative p-6 rounded-full bg-linear-to-br from-[var(--report-accent-bg)] to-[var(--report-accent-bg)] dark:from-[var(--report-accent)]/10 dark:to-[var(--report-accent)]/10">
                  <Package className="h-16 w-16 text-[var(--report-accent)]" />
                </div>
              </div>
              <h3 className="text-2xl font-bold mb-2 bg-linear-to-r from-[var(--sidebar-glow-from)] to-[var(--sidebar-glow-to)] bg-clip-text text-transparent">
                No Report Data Yet
              </h3>
              <p className="text-muted-foreground text-center max-w-md mb-8">
                Configure your filters and click &quot;Generate Report&quot; to view inventory data
              </p>
              <Button 
                onClick={handleSearch}
                size="lg"
                disabled={isLoading}
                className="bg-linear-to-r from-[var(--sidebar-glow-from)] to-[var(--sidebar-glow-to)] hover:from-[var(--sidebar-glow-from)] hover:to-[var(--sidebar-glow-to)] text-white shadow-lg hover:shadow-xl transition-all duration-300"
              >
                {isLoadingReport ? (
                  <>
                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                    Loading...
                  </>
                ) : (
                  <>
                    <Search className="h-5 w-5 mr-2" />
                    Generate Report
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* AI Assistant */}
      <ModuleAIAssistant
        moduleName="Inventory Report"
        moduleData={{ 
          reportData: filteredData,
          filters: {
            itemFilters: currentFilters,
            allItem,
            itemWise,
            inventory,
            reorderDetails,
            billTypeWise,
            billType,
            stockPlaceWise,
            billFrom,
            batchCodeWise,
            batchCode,
            partyWise,
            party,
            billDetail,
            salesman,
            dateWise,
            dateType,
            calculatedFromDate,
            calculatedToDate,
            areaWise,
            area,
            cityWise,
            city,
          },
          totalRecords: filteredData.length,
          totalColumns: dynamicColumns.length,
        }}
      />
    </TooltipProvider>
  );
}
