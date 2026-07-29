"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
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
import { Download, Search, X, Filter, FileSpreadsheet, Printer, Package, TrendingUp, TrendingDown, Loader2, Lightbulb, SlidersHorizontal } from "lucide-react";
import { ModuleAIAssistant } from "@/components/ModuleAIAssistant";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useItemRegister, useItems } from "@/lib/hooks/useReports";
import { ItemSearchCombobox } from "@/components/ui/item-search-combobox";
import { DateRangeFilter, type DateFilterType } from "@/components/reports/DateRangeFilter";
import type { ItemRegisterItem } from "@/lib/types/reports.types";
import { format } from "date-fns";
import { TablePagination, usePagination } from "@/components/ui/table-pagination";
import { toast } from "sonner";
import { exportToExcel, exportToPDF, printTable } from "@/lib/utils/report-export";

export default function ItemRegisterTable() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedItemId, setSelectedItemId] = useState<number | null>(null);
  const [isOpeningStock, setIsOpeningStock] = useState(true);
  
  // Date filter states
  const [dateType, setDateType] = useState<DateFilterType>("none");
  const [selectedMonth, setSelectedMonth] = useState("");
  const [selectedQuarter, setSelectedQuarter] = useState("");
  const [selectedHalfYear, setSelectedHalfYear] = useState("");
  const [selectedYear, setSelectedYear] = useState("");
  const [fromDate, setFromDate] = useState<string | null>(null);
  const [toDate, setToDate] = useState<string | null>(null);
  const [calculatedFromDate, setCalculatedFromDate] = useState<string | null>(null);
  const [calculatedToDate, setCalculatedToDate] = useState<string | null>(null);

  // Fetch items for dropdown
  const { data: items = [], isLoading: isLoadingItems } = useItems();

  const { mutate: fetchItemRegister, data, isPending, error, reset } = useItemRegister();
  const { currentPage, pageSize, setCurrentPage, setPageSize, getPaginatedData } = usePagination(50);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const handleDateChange = (from: string | null, to: string | null) => {
    setCalculatedFromDate(from);
    setCalculatedToDate(to);
  };

  const handleSearch = () => {
    if (!selectedItemId) {
      toast.error("Please select an item");
      return;
    }

    // Use calculated dates from DateRangeFilter or null if none selected
    const fromDateToSend = calculatedFromDate || format(new Date("2026-01-01"), "dd/MM/yyyy HH:mm:ss");
    const toDateToSend = calculatedToDate || format(new Date(), "dd/MM/yyyy HH:mm:ss");

    fetchItemRegister(
      {
        fromDate: fromDateToSend,
        toDate: toDateToSend,
        itemId: selectedItemId,
        isOpeningStock,
        onWeigth: true, // Always true as per requirement
        batchCode: "", // Always empty string as per requirement
      },
      {
        onSuccess: (data) => {
          toast.success(`Loaded ${data.length} records`);
          setCurrentPage(1);
        },
        onError: () => {
          toast.error("Failed to fetch item register data");
        },
      }
    );
  };

  const handleClear = () => {
    setSearchTerm("");
    setSelectedItemId(null);
    setDateType("none");
    setSelectedMonth("");
    setSelectedQuarter("");
    setSelectedHalfYear("");
    setSelectedYear("");
    setFromDate(null);
    setToDate(null);
    setCalculatedFromDate(null);
    setCalculatedToDate(null);
    setIsOpeningStock(true);
    reset();
  };

  const rows: ItemRegisterItem[] = data ?? [];

  // Derive stats from API response
  const openingRow = rows.find((r) => r.Type === "Opening");
  const closingRow = rows.find((r) => r.Type === "Closing");
  const transactionRows = rows.filter((r) => r.Type !== "Opening" && r.Type !== "Closing");

  const totalReceived = transactionRows.reduce((s, r) => s + (r.Received ?? 0), 0);
  const totalIssued = transactionRows.reduce((s, r) => s + (r.Issued ?? 0), 0);
  const closingBalance = closingRow?.Balance ?? 0;

  // Client-side search filter on party / bill no
  const filtered = searchTerm
    ? rows.filter(
        (r) =>
          r.Party?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          r.BillNo?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : rows;

  const paginatedFiltered = getPaginatedData(filtered);

  // Export handlers
  const handlePrint = () => {
    const headers = [
      { key: "BillDate", label: "Date" },
      { key: "BillNo", label: "Bill No" },
      { key: "Party", label: "Party" },
      { key: "Type", label: "Type" },
      { key: "Received", label: "Received" },
      { key: "Issued", label: "Issued" },
      { key: "Balance", label: "Balance" },
    ];
    const exportData = filtered.map(row => ({
      ...row,
      BillDate: row.BillDate ? format(new Date(row.BillDate), "dd MMM yyyy") : "",
    }));
    printTable(exportData as unknown as Record<string, unknown>[], headers, "Item Register Report");
  };

  const handleDownloadPDF = () => {
    const headers = [
      { key: "BillDate", label: "Date" },
      { key: "BillNo", label: "Bill No" },
      { key: "Party", label: "Party" },
      { key: "Type", label: "Type" },
      { key: "Received", label: "Received" },
      { key: "Issued", label: "Issued" },
      { key: "Balance", label: "Balance" },
    ];
    const exportData = filtered.map(row => ({
      ...row,
      BillDate: row.BillDate ? format(new Date(row.BillDate), "dd MMM yyyy") : "",
    }));
    exportToPDF(exportData as unknown as Record<string, unknown>[], headers, "Item Register Report", "item-register");
  };

  const handleExportExcel = () => {
    const headers = [
      { key: "BillDate", label: "Date" },
      { key: "BillNo", label: "Bill No" },
      { key: "Party", label: "Party" },
      { key: "Type", label: "Type" },
      { key: "Received", label: "Received" },
      { key: "Issued", label: "Issued" },
      { key: "Balance", label: "Balance" },
    ];
    const exportData = filtered.map(row => ({
      ...row,
      BillDate: row.BillDate ? format(new Date(row.BillDate), "dd MMM yyyy") : "",
    }));
    exportToExcel(exportData as unknown as Record<string, unknown>[], headers, "item-register");
  };

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
                    Item register tracks all stock movements for a specific item over time
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
        {rows.length > 0 && (
          <div className="grid gap-4 sm:grid-cols-3">
            <Card className="relative overflow-hidden border-0 bg-linear-to-br from-emerald-500 to-emerald-600 text-white shadow-lg">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16" />
              <CardContent className="p-6 relative">
                <TrendingUp className="h-8 w-8 opacity-80 mb-2" />
                <p className="text-sm font-medium opacity-90">Total Received</p>
                <p className="text-3xl font-bold mt-1">{totalReceived}</p>
              </CardContent>
            </Card>

            <Card className="relative overflow-hidden border-0 bg-linear-to-br from-[var(--card-accent-bg)] to-[var(--card-accent-bg)] text-white shadow-lg">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16" />
              <CardContent className="p-6 relative">
                <TrendingDown className="h-8 w-8 opacity-80 mb-2" />
                <p className="text-sm font-medium opacity-90">Total Issued</p>
                <p className="text-3xl font-bold mt-1">{totalIssued}</p>
              </CardContent>
            </Card>

            <Card className="relative overflow-hidden border-0 bg-linear-to-br from-[var(--card-accent-bg)] to-[var(--card-accent-bg)] text-white shadow-lg">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16" />
              <CardContent className="p-6 relative">
                <Package className="h-8 w-8 opacity-80 mb-2" />
                <p className="text-sm font-medium opacity-90">Closing Balance</p>
                <p className="text-3xl font-bold mt-1">{closingBalance}</p>
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
                placeholder="Quick search by party or bill no..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 h-9"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* Item Selector */}
              <div className="flex-1 min-w-[200px]">
                <ItemSearchCombobox
                  items={items}
                  value={selectedItemId}
                  onValueChange={setSelectedItemId}
                  placeholder="Select an item..."
                  searchPlaceholder="Search by code, name, size, brand..."
                  isLoading={isLoadingItems}
                />
              </div>

              {/* Date Range Filter inline */}
              <div className="w-[200px]">
                <DateRangeFilter
                  dateType={dateType}
                  selectedMonth={selectedMonth}
                  selectedQuarter={selectedQuarter}
                  selectedHalfYear={selectedHalfYear}
                  selectedYear={selectedYear}
                  fromDate={fromDate}
                  toDate={toDate}
                  onDateTypeChange={setDateType}
                  onSelectedMonthChange={setSelectedMonth}
                  onSelectedQuarterChange={setSelectedQuarter}
                  onSelectedHalfYearChange={setSelectedHalfYear}
                  onSelectedYearChange={setSelectedYear}
                  onFromDateChange={setFromDate}
                  onToDateChange={setToDate}
                  onDateChange={handleDateChange}
                  label="Date Range"
                />
              </div>

              {/* Advanced Filters Drawer */}
              <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
                <SheetTrigger asChild>
                  <Button variant="outline" size="sm" className="h-9">
                    <SlidersHorizontal className="h-4 w-4 mr-2" />
                    Options
                    {isOpeningStock && <Badge variant="secondary" className="ml-2">1</Badge>}
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-[320px]">
                  <SheetHeader>
                    <SheetTitle>Display Options</SheetTitle>
                    <SheetDescription>Configure report display settings</SheetDescription>
                  </SheetHeader>
                  <div className="mt-6 space-y-4">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="openingstock"
                        checked={isOpeningStock}
                        onCheckedChange={(c) => setIsOpeningStock(c as boolean)}
                      />
                      <Label htmlFor="openingstock" className="cursor-pointer text-sm font-normal">
                        Include Opening Stock
                      </Label>
                    </div>
                  </div>
                </SheetContent>
              </Sheet>

              <Button
                onClick={handleSearch}
                disabled={isPending || !selectedItemId}
                size="sm"
                className="h-9"
              >
                {isPending ? (
                  <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                ) : (
                  <Search className="h-3.5 w-3.5 mr-1.5" />
                )}
                {isPending ? "Loading..." : "Search"}
              </Button>
              <Button variant="outline" size="sm" className="h-9" onClick={handleClear}>
                <X className="h-3.5 w-3.5 mr-1.5" />
                Clear
              </Button>

              <div className="flex-1" />

              <div className="flex gap-2">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="outline" size="icon" className="h-9 w-9" disabled={filtered.length === 0} onClick={handlePrint}>
                      <Printer className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Print</TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="outline" size="icon" className="h-9 w-9" disabled={filtered.length === 0} onClick={handleDownloadPDF}>
                      <Download className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Download PDF</TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="outline" size="icon" className="h-9 w-9" disabled={filtered.length === 0} onClick={handleExportExcel}>
                      <FileSpreadsheet className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Export to Excel</TooltipContent>
                </Tooltip>
              </div>
            </div>

            {error && (
              <p className="text-sm text-destructive">
                Failed to fetch data. Please check your selection and try again.
              </p>
            )}
          </CardContent>
        </Card>

        {/* Results Table */}
        <Card className="border shadow-sm">
          <CardHeader className="border-b">
            <CardTitle className="text-xl">Item Movement Register</CardTitle>
            <CardDescription>Track stock movement for each item</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-linear-to-r bg-[var(--report-accent-bg)] dark:from-[var(--report-accent)]/5 dark:to-[var(--report-accent)]/5">
                    <TableHead className="font-semibold">Type</TableHead>
                    <TableHead className="font-semibold">Party</TableHead>
                    <TableHead className="font-semibold">Bill No</TableHead>
                    <TableHead className="font-semibold">Bill Date</TableHead>
                    <TableHead className="font-semibold">Stock Place</TableHead>
                    <TableHead className="text-right font-semibold">Received</TableHead>
                    <TableHead className="text-right font-semibold">Issued</TableHead>
                    <TableHead className="text-right font-semibold">Balance</TableHead>
                    <TableHead className="text-right font-semibold">Rate</TableHead>
                    <TableHead className="text-right font-semibold">Net Rate</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={10} className="text-center py-12 text-muted-foreground">
                        <Package className="h-12 w-12 mx-auto mb-3 opacity-50" />
                        <p className="text-lg font-medium">No data found</p>
                        <p className="text-sm">Enter an item ID and click Search to view results</p>
                      </TableCell>
                    </TableRow>
                  ) : (
                    paginatedFiltered.map((row, idx) => {
                      const isSpecial = row.Type === "Opening" || row.Type === "Closing";
                      return (
                        <TableRow
                          key={idx}
                          className={`hover:bg-muted/50 ${isSpecial ? "bg-muted/30 font-semibold" : ""}`}
                        >
                          <TableCell>
                            <Badge
                              variant={
                                row.Type === "Opening"
                                  ? "outline"
                                  : row.Type === "Closing"
                                  ? "secondary"
                                  : "default"
                              }
                            >
                              {row.Type}
                            </Badge>
                          </TableCell>
                          <TableCell>{row.Party ?? "—"}</TableCell>
                          <TableCell className="font-mono text-sm">{row.BillNo ?? "—"}</TableCell>
                          <TableCell>
                            {row.BillDate ? new Date(row.BillDate).toLocaleDateString("en-IN") : "—"}
                          </TableCell>
                          <TableCell>{row.StockPlace ?? "—"}</TableCell>
                          <TableCell className="text-right text-emerald-600 font-medium">
                            {row.Received ?? "—"}
                          </TableCell>
                          <TableCell className="text-right text-[var(--report-accent)] font-medium">
                            {row.Issued ?? "—"}
                          </TableCell>
                          <TableCell className="text-right font-bold">{row.Balance ?? "—"}</TableCell>
                          <TableCell className="text-right">{row.Rate ?? "—"}</TableCell>
                          <TableCell className="text-right">{row.NetRate ?? "—"}</TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
            <TablePagination
              totalItems={filtered.length}
              pageSize={pageSize}
              currentPage={currentPage}
              onPageChange={setCurrentPage}
              onPageSizeChange={setPageSize}
            />
          </CardContent>
        </Card>
      </div>

      {/* AI Assistant */}
      <ModuleAIAssistant
        moduleName="Item Register"
        moduleData={{ 
          data: rows, 
          selectedItemId,
          dateType,
          calculatedFromDate,
          calculatedToDate,
          isOpeningStock,
          openingRow, 
          closingRow,
          totalReceived,
          totalIssued,
          closingBalance,
        }}
      />
    </TooltipProvider>
  );
}
