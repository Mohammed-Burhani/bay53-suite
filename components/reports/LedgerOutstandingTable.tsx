"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
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
import { Printer, Search, Filter, Receipt, TrendingUp, AlertTriangle, Loader2, X, Download, FileSpreadsheet, SlidersHorizontal } from "lucide-react";
import { ModuleAIAssistant } from "@/components/ModuleAIAssistant";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useLedgerOutstanding } from "@/lib/hooks/useReports";
import type { LedgerOutstandingItem } from "@/lib/types/reports.types";
import { LedgerSearchInput } from "./LedgerSearchInput";
import { TablePagination, usePagination } from "@/components/ui/table-pagination";
import { DateRangeFilter } from "./DateRangeFilter";
import { useReportFiltersStore } from "@/lib/stores/report-filters-store";
import { exportToExcel, exportToPDF, printTable } from "@/lib/utils/report-export";

export default function LedgerOutstandingTable() {
  const { ledgerOutstanding, setLedgerOutstandingFilters } = useReportFiltersStore();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { 
    detailed, 
    selectedLedgerIds, 
    fromDate, 
    toDate,
    dateType,
    selectedMonth,
    selectedQuarter,
    selectedHalfYear,
    selectedYear,
    selectedLedgers,
  } = ledgerOutstanding;

  const { mutate: fetchOutstanding, data, isPending, error } = useLedgerOutstanding();
  const { currentPage, pageSize, setCurrentPage, setPageSize, getPaginatedData } = usePagination(50);

  const handleDateChange = (from: string | null, to: string | null) => {
    setLedgerOutstandingFilters({ fromDate: from, toDate: to });
  };

  const handleSearch = () => {
    // Require at least one ledger to be selected
    if (selectedLedgerIds.length === 0) {
      return;
    }

    console.log("Fetching outstanding with payload:", {
      ledgers: selectedLedgerIds,
      detailed,
      salesman: null,
      fromDate: fromDate,
      toDate: toDate,
    });

    fetchOutstanding({
      ledgers: selectedLedgerIds,
      detailed,
      salesman: null,
      fromDate: fromDate,
      toDate: toDate,
    });
  };

  const rows: LedgerOutstandingItem[] = data ?? [];
  const paginatedRows = getPaginatedData(rows);
  const totalOutstanding = rows.reduce((sum, r) => sum + r.pending, 0);
  const overdueCount = rows.filter((r) => {
    const overdue = typeof r.overDue === 'string' ? parseFloat(r.overDue) : r.overDue;
    return overdue < 0; // Negative means overdue
  }).length;
  
  // Calculate opening and closing totals
  const totalOpening = rows.reduce((sum, r) => {
    const amount = r.openingDrCr === "Cr" ? -r.opening : r.opening;
    return sum + amount;
  }, 0);
  
  const totalClosing = rows.reduce((sum, r) => {
    const amount = r.pendingDrCr === "Cr" ? -r.pending : r.pending;
    return sum + amount;
  }, 0);

  // Export handlers
  const handlePrint = () => {
    const headers = [
      { key: "party", label: "Party" },
      { key: "group", label: "Group" },
      { key: "billNo", label: "Bill No" },
      { key: "date", label: "Date" },
      { key: "phone", label: "Phone" },
      { key: "address", label: "Address" },
      { key: "opening", label: "Opening" },
      { key: "openingDrCr", label: "Dr/Cr" },
      { key: "pending", label: "Pending" },
      { key: "pendingDrCr", label: "Dr/Cr" },
      { key: "dueOn", label: "Due On" },
      { key: "overDue", label: "Overdue (days)" },
    ];
    const exportData = rows.map(row => ({
      ...row,
      date: new Date(row.date).toLocaleDateString("en-IN"),
      dueOn: new Date(row.dueOn).toLocaleDateString("en-IN"),
      phone: [row.phone1, row.phone2, row.mobile].filter(Boolean).join(" / "),
      overDue: typeof row.overDue === 'string' ? parseFloat(row.overDue) : row.overDue,
    }));
    printTable(exportData as unknown as Record<string, unknown>[], headers, "Ledger Outstanding Report");
  };

  const handleDownloadPDF = () => {
    const headers = [
      { key: "party", label: "Party" },
      { key: "group", label: "Group" },
      { key: "billNo", label: "Bill No" },
      { key: "date", label: "Date" },
      { key: "phone", label: "Phone" },
      { key: "address", label: "Address" },
      { key: "opening", label: "Opening" },
      { key: "openingDrCr", label: "Dr/Cr" },
      { key: "pending", label: "Pending" },
      { key: "pendingDrCr", label: "Dr/Cr" },
      { key: "dueOn", label: "Due On" },
      { key: "overDue", label: "Overdue (days)" },
    ];
    const exportData = rows.map(row => ({
      ...row,
      date: new Date(row.date).toLocaleDateString("en-IN"),
      dueOn: new Date(row.dueOn).toLocaleDateString("en-IN"),
      phone: [row.phone1, row.phone2, row.mobile].filter(Boolean).join(" / "),
      overDue: typeof row.overDue === 'string' ? parseFloat(row.overDue) : row.overDue,
    }));
    exportToPDF(exportData as unknown as Record<string, unknown>[], headers, "Ledger Outstanding Report", "ledger-outstanding");
  };

  const handleExportExcel = () => {
    const headers = [
      { key: "party", label: "Party" },
      { key: "group", label: "Group" },
      { key: "billNo", label: "Bill No" },
      { key: "date", label: "Date" },
      { key: "phone", label: "Phone" },
      { key: "address", label: "Address" },
      { key: "opening", label: "Opening" },
      { key: "openingDrCr", label: "Dr/Cr" },
      { key: "pending", label: "Pending" },
      { key: "pendingDrCr", label: "Dr/Cr" },
      { key: "dueOn", label: "Due On" },
      { key: "overDue", label: "Overdue (days)" },
    ];
    const exportData = rows.map(row => ({
      ...row,
      date: new Date(row.date).toLocaleDateString("en-IN"),
      dueOn: new Date(row.dueOn).toLocaleDateString("en-IN"),
      phone: [row.phone1, row.phone2, row.mobile].filter(Boolean).join(" / "),
      overDue: typeof row.overDue === 'string' ? parseFloat(row.overDue) : row.overDue,
    }));
    exportToExcel(exportData as unknown as Record<string, unknown>[], headers, "ledger-outstanding");
  };

  return (
    <TooltipProvider>
      <div className="flex flex-col gap-6">
        {/* Stats Cards */}
        {rows.length > 0 && (
          <div className="grid gap-4 sm:grid-cols-3">
            <Card className="relative overflow-hidden border-0 bg-linear-to-br from-blue-500 to-blue-600 text-white shadow-lg">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16" />
              <CardContent className="p-6 relative">
                <Receipt className="h-8 w-8 opacity-80 mb-2" />
                <p className="text-sm font-medium opacity-90">Total Outstanding</p>
                <p className="text-3xl font-bold mt-1">₹{totalOutstanding.toLocaleString()}</p>
              </CardContent>
            </Card>

            <Card className="relative overflow-hidden border-0 bg-linear-to-br from-emerald-500 to-emerald-600 text-white shadow-lg">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16" />
              <CardContent className="p-6 relative">
                <TrendingUp className="h-8 w-8 opacity-80 mb-2" />
                <p className="text-sm font-medium opacity-90">Total Entries</p>
                <p className="text-3xl font-bold mt-1">{rows.length}</p>
              </CardContent>
            </Card>

            <Card className="relative overflow-hidden border-0 bg-linear-to-br from-red-500 to-red-600 text-white shadow-lg">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16" />
              <CardContent className="p-6 relative">
                <AlertTriangle className="h-8 w-8 opacity-80 mb-2" />
                <p className="text-sm font-medium opacity-90">Overdue</p>
                <p className="text-3xl font-bold mt-1">{overdueCount}</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Filter Panel */}
        <Card className="border shadow-sm">
          <CardContent className="p-4 space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {/* Ledger Selection */}
              <LedgerSearchInput
                selectedLedgerIds={selectedLedgerIds}
                onLedgerIdsChange={(ids) => setLedgerOutstandingFilters({ selectedLedgerIds: ids })}
                label="Ledgers"
                placeholder="Search and select ledgers..."
                required={true}
                groups={[16, 17]}
                selectedLedgers={selectedLedgers}
                onSelectedLedgersChange={(ledgers) => setLedgerOutstandingFilters({ selectedLedgers: ledgers })}
              />

              {/* Date Filter */}
              <DateRangeFilter
                dateType={dateType}
                selectedMonth={selectedMonth}
                selectedQuarter={selectedQuarter}
                selectedHalfYear={selectedHalfYear}
                selectedYear={selectedYear}
                fromDate={fromDate}
                toDate={toDate}
                onDateTypeChange={(type) => setLedgerOutstandingFilters({ dateType: type })}
                onSelectedMonthChange={(month) => setLedgerOutstandingFilters({ selectedMonth: month })}
                onSelectedQuarterChange={(quarter) => setLedgerOutstandingFilters({ selectedQuarter: quarter })}
                onSelectedHalfYearChange={(halfYear) => setLedgerOutstandingFilters({ selectedHalfYear: halfYear })}
                onSelectedYearChange={(year) => setLedgerOutstandingFilters({ selectedYear: year })}
                onFromDateChange={(date) => setLedgerOutstandingFilters({ fromDate: date })}
                onToDateChange={(date) => setLedgerOutstandingFilters({ toDate: date })}
                onDateChange={handleDateChange}
                label="Date"
                financialYearStart={4}
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* Options Drawer */}
              <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
                <SheetTrigger asChild>
                  <Button variant="outline" size="sm" className="h-9">
                    <SlidersHorizontal className="h-4 w-4 mr-2" />
                    Options
                    {detailed && <Badge variant="secondary" className="ml-2">1</Badge>}
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-[320px]">
                  <SheetHeader>
                    <SheetTitle>Display Options</SheetTitle>
                    <SheetDescription>Configure report display settings</SheetDescription>
                  </SheetHeader>
                  <div className="mt-6">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="detailed"
                        checked={detailed}
                        onCheckedChange={(c) => setLedgerOutstandingFilters({ detailed: c as boolean })}
                      />
                      <Label htmlFor="detailed" className="cursor-pointer text-sm font-normal">Detailed</Label>
                    </div>
                  </div>
                </SheetContent>
              </Sheet>

              <Button
                onClick={handleSearch}
                disabled={isPending || selectedLedgerIds.length === 0}
                size="sm"
                className="h-9"
              >
                {isPending ? (
                  <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                ) : (
                  <Search className="h-3.5 w-3.5 mr-1.5" />
                )}
                {isPending ? "Loading..." : "Outstanding"}
              </Button>
              <Button
                onClick={() => {
                  setLedgerOutstandingFilters({
                    selectedLedgerIds: [],
                    selectedLedgers: [],
                    detailed: false,
                    dateType: "current_month",
                    selectedMonth: "",
                    selectedQuarter: "",
                    selectedHalfYear: "",
                    selectedYear: "",
                  });
                }}
                variant="outline"
                size="sm"
                className="h-9"
              >
                <X className="h-3.5 w-3.5 mr-1.5" />
                Clear
              </Button>

              <div className="flex-1" />

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" size="icon" className="h-9 w-9" onClick={handlePrint} disabled={rows.length === 0}>
                    <Printer className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Print</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" size="icon" className="h-9 w-9" onClick={handleDownloadPDF} disabled={rows.length === 0}>
                    <Download className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Download PDF</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" size="icon" className="h-9 w-9" onClick={handleExportExcel} disabled={rows.length === 0}>
                    <FileSpreadsheet className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Export to Excel</TooltipContent>
              </Tooltip>
            </div>

            {/* API Error */}
            {error && (
              <div className="text-sm text-destructive space-y-1">
                <p className="font-medium">Failed to fetch data:</p>
                {error instanceof Error && (
                  <div className="text-xs">
                    {/* @ts-expect-error - ApiError has data property */}
                    {error.data && typeof error.data === 'object' && 'errors' in error.data ? (
                      <ul className="list-disc list-inside space-y-0.5 ml-2">
                        {/* @ts-expect-error - ApiError errors property */}
                        {Object.entries(error.data.errors).map(([field, messages]) => (
                          <li key={field}>
                            <span className="font-medium">{field}:</span>{' '}
                            {Array.isArray(messages) ? messages.join(', ') : String(messages)}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p>{error.message}</p>
                    )}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Results Table */}
        <Card className="border shadow-sm">
          <CardHeader className="border-b">
            <CardTitle className="text-xl">Outstanding Balances</CardTitle>
            <CardDescription>Ledger-wise outstanding amounts</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-linear-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20">
                    <TableHead className="font-semibold">Party</TableHead>
                    <TableHead className="font-semibold">Group</TableHead>
                    <TableHead className="font-semibold">Bill No</TableHead>
                    <TableHead className="font-semibold">Date</TableHead>
                    <TableHead className="font-semibold">Phone</TableHead>
                    <TableHead className="font-semibold">Address</TableHead>
                    <TableHead className="text-right font-semibold">Opening</TableHead>
                    <TableHead className="font-semibold">Dr/Cr</TableHead>
                    <TableHead className="text-right font-semibold">Pending</TableHead>
                    <TableHead className="font-semibold">Dr/Cr</TableHead>
                    <TableHead className="font-semibold">Due On</TableHead>
                    <TableHead className="text-right font-semibold">Overdue (days)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={12} className="text-center py-12 text-muted-foreground">
                        <Receipt className="h-12 w-12 mx-auto mb-3 opacity-50" />
                        <p className="text-lg font-medium">Select ledgers to view outstanding</p>
                        <p className="text-sm">Choose one or more ledgers above and click Outstanding</p>
                      </TableCell>
                    </TableRow>
                  ) : (
                    <>
                      {/* Data Rows */}
                      {paginatedRows.map((row, idx) => {
                        const overdue = typeof row.overDue === 'string' ? parseFloat(row.overDue) : row.overDue;
                        const isOverdue = overdue < 0; // Negative means overdue
                        const overdueDays = Math.abs(overdue); // Display as positive number
                        return (
                          <TableRow
                            key={idx}
                            className={`hover:bg-muted/50 ${isOverdue ? "bg-red-50/50 dark:bg-red-950/10" : ""}`}
                          >
                            <TableCell className="font-medium">{row.party}</TableCell>
                            <TableCell className="text-sm text-muted-foreground">{row.group}</TableCell>
                            <TableCell className="font-mono text-sm">{row.billNo}</TableCell>
                            <TableCell>{new Date(row.date).toLocaleDateString("en-IN")}</TableCell>
                            <TableCell className="text-sm">
                              {[row.phone1, row.phone2, row.mobile].filter(Boolean).join(" / ")}
                            </TableCell>
                            <TableCell className="text-xs text-muted-foreground max-w-[180px] truncate" title={row.address}>
                              {row.address}
                            </TableCell>
                            <TableCell className="text-right font-medium">₹{row.opening.toLocaleString()}</TableCell>
                            <TableCell>
                              <Badge variant={row.openingDrCr === "Dr" ? "destructive" : "default"}>
                                {row.openingDrCr}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right font-bold text-blue-600">
                              ₹{row.pending.toLocaleString()}
                            </TableCell>
                            <TableCell>
                              <Badge variant={row.pendingDrCr === "Dr" ? "destructive" : "default"}>
                                {row.pendingDrCr}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <span className={isOverdue ? "text-red-600 font-medium" : ""}>
                                {new Date(row.dueOn).toLocaleDateString("en-IN")}
                              </span>
                            </TableCell>
                            <TableCell className="text-right">
                              {isOverdue ? (
                                <Badge variant="destructive">{overdueDays}d</Badge>
                              ) : (
                                <span className="text-muted-foreground">—</span>
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })}

                      {/* Total Row - Opening and Closing in single line */}
                      <TableRow className="bg-linear-to-r from-blue-50 to-green-50 dark:from-blue-950/20 dark:to-green-950/20 font-bold border-t-2">
                        <TableCell colSpan={6} className="text-right">Total:</TableCell>
                        <TableCell className="text-right">₹{Math.abs(totalOpening).toLocaleString()}</TableCell>
                        <TableCell>
                          <Badge variant={totalOpening >= 0 ? "destructive" : "default"}>
                            {totalOpening >= 0 ? "Dr" : "Cr"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">₹{Math.abs(totalClosing).toLocaleString()}</TableCell>
                        <TableCell>
                          <Badge variant={totalClosing >= 0 ? "destructive" : "default"}>
                            {totalClosing >= 0 ? "Dr" : "Cr"}
                          </Badge>
                        </TableCell>
                        <TableCell colSpan={2}></TableCell>
                      </TableRow>
                    </>
                  )}
                </TableBody>
              </Table>
            </div>
            <TablePagination
              totalItems={rows.length}
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
        moduleName="Ledger Balances"
        moduleData={{ data: rows, detailed, totalOutstanding }}
      />
    </TooltipProvider>
  );
}
