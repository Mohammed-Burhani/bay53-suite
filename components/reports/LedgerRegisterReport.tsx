"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Download, Search, X, Filter, FileSpreadsheet, Printer, Loader2, FileText, SlidersHorizontal } from "lucide-react";
import { useLedgerRegister } from "@/lib/hooks/useReports";
import { LedgerRegisterTable } from "@/components/reports/LedgerRegisterTable";
import { LedgerSearchInput } from "@/components/reports/LedgerSearchInput";
import { DateRangeFilter } from "@/components/reports/DateRangeFilter";
import { useReportFiltersStore } from "@/lib/stores/report-filters-store";
import { exportToExcel, exportToPDF, printTable } from "@/lib/utils/report-export";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

export default function LedgerRegisterReport() {
  const { ledgerRegister, setLedgerRegisterFilters } = useReportFiltersStore();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { 
    fromDate, 
    toDate, 
    runningBalance, 
    openingBalance, 
    billDetails, 
    bankDetails,
    selectedLedgerIds,
    selectedLedgerName,
    dateType,
    selectedMonth,
    selectedQuarter,
    selectedHalfYear,
    selectedYear,
    selectedLedgers,
  } = ledgerRegister;

  const { mutate: fetchLedgerRegister, data, isPending, error, reset } = useLedgerRegister();

  const handleDateChange = (from: string | null, to: string | null) => {
    setLedgerRegisterFilters({ fromDate: from, toDate: to });
  };

  const handleSearch = () => {
    const ledgerId = selectedLedgerIds[0];
    if (!ledgerId) return;

    console.log("Fetching ledger register with payload:", {
      fromDate: fromDate,
      toDate: toDate,
      ledgerId,
      runningBalance,
      openingBalance,
      billDetails,
      bankDetails,
    });

    fetchLedgerRegister({
      fromDate: fromDate,
      toDate: toDate,
      ledgerId,
      runningBalance,
      openingBalance,
      billDetails,
      bankDetails,
    });
  };

  const handleClear = () => {
    setLedgerRegisterFilters({ 
      selectedLedgerIds: [], 
      selectedLedgerName: "",
      selectedLedgers: [],
      dateType: "current_month",
      selectedMonth: "",
      selectedQuarter: "",
      selectedHalfYear: "",
      selectedYear: "",
    });
    reset();
  };

  // Export handlers
  const handlePrint = () => {
    if (!data?.list || data.list.length === 0) return;
    const headers = [
      { key: "billDate", label: "Date" },
      { key: "billNo", label: "Bill No." },
      { key: "particular", label: "Particulars" },
      { key: "debit", label: "Debit" },
      { key: "credit", label: "Credit" },
      { key: "running", label: "Balance" },
      { key: "drCr", label: "Dr/Cr" },
    ];
    const exportData = data.list.map(row => ({
      ...row,
      billDate: row.billDate ? new Date(row.billDate).toLocaleDateString("en-IN") : "",
    }));
    printTable(exportData as unknown as Record<string, unknown>[], headers, `Ledger Register - ${selectedLedgerName || "Report"}`);
  };

  const handleDownloadPDF = () => {
    if (!data?.list || data.list.length === 0) return;
    const headers = [
      { key: "billDate", label: "Date" },
      { key: "billNo", label: "Bill No." },
      { key: "particular", label: "Particulars" },
      { key: "debit", label: "Debit" },
      { key: "credit", label: "Credit" },
      { key: "running", label: "Balance" },
      { key: "drCr", label: "Dr/Cr" },
    ];
    const exportData = data.list.map(row => ({
      ...row,
      billDate: row.billDate ? new Date(row.billDate).toLocaleDateString("en-IN") : "",
    }));
    exportToPDF(exportData as unknown as Record<string, unknown>[], headers, `Ledger Register - ${selectedLedgerName || "Report"}`, "ledger-register");
  };

  const handleExportExcel = () => {
    if (!data?.list || data.list.length === 0) return;
    const headers = [
      { key: "billDate", label: "Date" },
      { key: "billNo", label: "Bill No." },
      { key: "particular", label: "Particulars" },
      { key: "debit", label: "Debit" },
      { key: "credit", label: "Credit" },
      { key: "running", label: "Balance" },
      { key: "drCr", label: "Dr/Cr" },
    ];
    const exportData = data.list.map(row => ({
      ...row,
      billDate: row.billDate ? new Date(row.billDate).toLocaleDateString("en-IN") : "",
    }));
    exportToExcel(exportData as unknown as Record<string, unknown>[], headers, "ledger-register");
  };

  return (
    <TooltipProvider>
      <div className="flex flex-col gap-6">
        {/* Filter Panel */}
        <Card className="border shadow-sm">
          <CardContent className="p-4 space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {/* Ledger Selection */}
              <LedgerSearchInput
                selectedLedgerIds={selectedLedgerIds}
                onLedgerIdsChange={(ids) => setLedgerRegisterFilters({ selectedLedgerIds: ids })}
                onLedgerNameChange={(name) => setLedgerRegisterFilters({ selectedLedgerName: name })}
                label="Ledger"
                placeholder="Search and select ledgers..."
                required={true}
                multiSelect={true}
                groups={null}
                selectedLedgers={selectedLedgers}
                onSelectedLedgersChange={(ledgers) => setLedgerRegisterFilters({ selectedLedgers: ledgers })}
              />

              {/* Date Range Filter */}
              <DateRangeFilter 
                dateType={dateType}
                selectedMonth={selectedMonth}
                selectedQuarter={selectedQuarter}
                selectedHalfYear={selectedHalfYear}
                selectedYear={selectedYear}
                fromDate={fromDate}
                toDate={toDate}
                onDateTypeChange={(type) => setLedgerRegisterFilters({ dateType: type })}
                onSelectedMonthChange={(month) => setLedgerRegisterFilters({ selectedMonth: month })}
                onSelectedQuarterChange={(quarter) => setLedgerRegisterFilters({ selectedQuarter: quarter })}
                onSelectedHalfYearChange={(halfYear) => setLedgerRegisterFilters({ selectedHalfYear: halfYear })}
                onSelectedYearChange={(year) => setLedgerRegisterFilters({ selectedYear: year })}
                onFromDateChange={(date) => setLedgerRegisterFilters({ fromDate: date })}
                onToDateChange={(date) => setLedgerRegisterFilters({ toDate: date })}
                onDateChange={handleDateChange} 
                label="Date Range" 
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* Display Options Drawer */}
              <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
                <SheetTrigger asChild>
                  <Button variant="outline" size="sm" className="h-9">
                    <SlidersHorizontal className="h-4 w-4 mr-2" />
                    Options
                    {[runningBalance, openingBalance, billDetails, bankDetails].filter(Boolean).length > 0 && (
                      <Badge variant="secondary" className="ml-2">
                        {[runningBalance, openingBalance, billDetails, bankDetails].filter(Boolean).length}
                      </Badge>
                    )}
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-[320px]">
                  <SheetHeader>
                    <SheetTitle>Display Options</SheetTitle>
                    <SheetDescription>Configure what to show in the report</SheetDescription>
                  </SheetHeader>
                  <div className="mt-6 space-y-4">
                    <div className="flex items-center space-x-2">
                      <Checkbox id="running" checked={runningBalance} onCheckedChange={(c) => setLedgerRegisterFilters({ runningBalance: c as boolean })} />
                      <Label htmlFor="running" className="cursor-pointer text-sm font-normal">Running Balance</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox id="opening" checked={openingBalance} onCheckedChange={(c) => setLedgerRegisterFilters({ openingBalance: c as boolean })} />
                      <Label htmlFor="opening" className="cursor-pointer text-sm font-normal">Opening Balance</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox id="bill" checked={billDetails} onCheckedChange={(c) => setLedgerRegisterFilters({ billDetails: c as boolean })} />
                      <Label htmlFor="bill" className="cursor-pointer text-sm font-normal">Bill Details</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox id="bank" checked={bankDetails} onCheckedChange={(c) => setLedgerRegisterFilters({ bankDetails: c as boolean })} />
                      <Label htmlFor="bank" className="cursor-pointer text-sm font-normal">Bank Details</Label>
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
                {isPending ? "Loading..." : "Generate Report"}
              </Button>
              <Button variant="outline" size="sm" className="h-9" onClick={handleClear}>
                <X className="h-3.5 w-3.5 mr-1.5" />
                Clear
              </Button>

              <div className="flex-1" />

              <div className="flex gap-2">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="outline" size="icon" className="h-9 w-9" onClick={handlePrint} disabled={!data?.list || data.list.length === 0}>
                      <Printer className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Print</TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="outline" size="icon" className="h-9 w-9" onClick={handleDownloadPDF} disabled={!data?.list || data.list.length === 0}>
                      <Download className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Download PDF</TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="outline" size="icon" className="h-9 w-9" onClick={handleExportExcel} disabled={!data?.list || data.list.length === 0}>
                      <FileSpreadsheet className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Export to Excel</TooltipContent>
                </Tooltip>
              </div>
            </div>

            {error && (
              <div className="text-sm text-destructive space-y-1">
                <p className="font-medium">Failed to fetch ledger register:</p>
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

        {/* Results */}
        {data?.list && data.list.length > 0 && (
          <LedgerRegisterTable data={data.list} ledgerName={selectedLedgerName} />
        )}

        {data?.list && data.list.length === 0 && (
          <Card className="py-4">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <FileText className="h-12 w-12 text-muted-foreground/30 mb-3" />
              <p className="text-lg font-medium text-muted-foreground">No transactions found</p>
              <p className="text-sm text-muted-foreground">Try adjusting your filters</p>
            </CardContent>
          </Card>
        )}
      </div>
    </TooltipProvider>
  );
}
