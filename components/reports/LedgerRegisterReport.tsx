"use client";

import { useState } from "react";
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
import { Download, Search, X, Filter, FileSpreadsheet, Printer, Loader2, FileText } from "lucide-react";
import { useLedgerRegister } from "@/lib/hooks/useReports";
import { LedgerRegisterTable } from "@/components/reports/LedgerRegisterTable";
import { LedgerSearchInput } from "@/components/reports/LedgerSearchInput";
import { DateRangeFilter } from "@/components/reports/DateRangeFilter";

export default function LedgerRegisterReport() {
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [runningBalance, setRunningBalance] = useState(true);
  const [openingBalance, setOpeningBalance] = useState(true);
  const [billDetails, setBillDetails] = useState(true);
  const [bankDetails, setBankDetails] = useState(true);
  const [selectedLedgerIds, setSelectedLedgerIds] = useState<number[]>([]);
  const [selectedLedgerName, setSelectedLedgerName] = useState<string>("");

  const { mutate: fetchLedgerRegister, data, isPending, error, reset } = useLedgerRegister();

  const handleDateChange = (from: string, to: string) => {
    setFromDate(from);
    setToDate(to);
  };

  const handleSearch = () => {
    const ledgerId = selectedLedgerIds[0];
    if (!ledgerId) return;

    fetchLedgerRegister({
      from: fromDate,
      to: toDate,
      ledgerId,
      runningBalance,
      openingBalance,
      billDetails,
      bankDetails,
    });
  };

  const handleClear = () => {
    setSelectedLedgerIds([]);
    setSelectedLedgerName("");
    reset();
  };

  return (
    <TooltipProvider>
      <div className="flex flex-col gap-6">
        {/* Filter Panel */}
        <Card className="border shadow-sm">
          <CardHeader className="border-b bg-linear-to-r from-amber-50 to-amber-100/50 dark:from-amber-950 dark:to-amber-900/50 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-linear-to-br from-amber-500 to-amber-600 text-white">
                <Filter className="h-4 w-4" />
              </div>
              <div>
                <CardTitle className="text-base font-semibold">Ledger Register Filters</CardTitle>
                <CardDescription className="text-xs">Select ledger and date range</CardDescription>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-6 space-y-5">
            {/* Filter Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Ledger Selection */}
              <LedgerSearchInput
                selectedLedgerIds={selectedLedgerIds}
                onLedgerIdsChange={setSelectedLedgerIds}
                onLedgerNameChange={setSelectedLedgerName}
                label="Ledger"
                placeholder="Select ledger..."
                required={true}
                multiSelect={false}
                groups={[16, 17]}
              />

              {/* Date Range Filter */}
              <DateRangeFilter onDateChange={handleDateChange} label="Date Range" />
            </div>

            {/* Display Options */}
            <div className="flex flex-wrap items-center gap-6 pt-2">
              <div className="flex items-center space-x-2">
                <Checkbox id="running" checked={runningBalance} onCheckedChange={(c) => setRunningBalance(c as boolean)} />
                <Label htmlFor="running" className="cursor-pointer text-sm font-normal">Running Balance</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox id="opening" checked={openingBalance} onCheckedChange={(c) => setOpeningBalance(c as boolean)} />
                <Label htmlFor="opening" className="cursor-pointer text-sm font-normal">Opening Balance</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox id="bill" checked={billDetails} onCheckedChange={(c) => setBillDetails(c as boolean)} />
                <Label htmlFor="bill" className="cursor-pointer text-sm font-normal">Bill Details</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox id="bank" checked={bankDetails} onCheckedChange={(c) => setBankDetails(c as boolean)} />
                <Label htmlFor="bank" className="cursor-pointer text-sm font-normal">Bank Details</Label>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-2 pt-3 border-t">
              <Button
                onClick={handleSearch}
                disabled={isPending || selectedLedgerIds.length === 0}
                size="sm"
                className="bg-linear-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white h-9"
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
                    <Button variant="outline" size="icon" className="h-9 w-9">
                      <FileSpreadsheet className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Export to Excel</TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="outline" size="icon" className="h-9 w-9">
                      <Download className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Export to CSV</TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="outline" size="icon" className="h-9 w-9" onClick={() => window.print()}>
                      <Printer className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Print</TooltipContent>
                </Tooltip>
              </div>
            </div>

            {error && (
              <p className="text-sm text-destructive">
                Failed to fetch ledger register. Please try again.
              </p>
            )}
          </CardContent>
        </Card>

        {/* Results */}
        {data?.list && data.list.length > 0 && (
          <LedgerRegisterTable data={data.list} ledgerName={selectedLedgerName} />
        )}

        {data?.list && data.list.length === 0 && (
          <Card>
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
