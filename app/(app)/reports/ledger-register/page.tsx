"use client";

import { useState, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Download, Search, X, Filter, FileSpreadsheet, Printer, Loader2, FileText } from "lucide-react";
import { useLedgerRegister, useLedgerSearch } from "@/lib/hooks/useReports";
import { LedgerRegisterTable } from "@/components/reports/LedgerRegisterTable";
import { format, subMonths } from "date-fns";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";

type DatePreset = "none" | "today" | "current_month" | "range" | "monthly" | "quarterly" | "half_yearly" | "yearly";

function toApiDate(date: Date) {
  return format(date, "dd/MM/yyyy HH:mm:ss");
}

function resolveDateRange(preset: DatePreset): { from: Date; to: Date } {
  const now = new Date();
  switch (preset) {
    case "today":
      return { from: new Date(new Date().setHours(0, 0, 0, 0)), to: new Date() };
    case "current_month":
      return { from: new Date(now.getFullYear(), now.getMonth(), 1), to: new Date() };
    case "monthly":
      return { from: subMonths(new Date(), 1), to: new Date() };
    case "quarterly":
      return { from: subMonths(new Date(), 3), to: new Date() };
    case "half_yearly":
      return { from: subMonths(new Date(), 6), to: new Date() };
    case "yearly":
      return { from: new Date(now.getFullYear(), 0, 1), to: new Date() };
    default:
      return { from: new Date("2022-01-01"), to: new Date() };
  }
}

export default function LedgerRegisterPage() {
  const [datePreset, setDatePreset] = useState<DatePreset>("yearly");
  const [fromDate, setFromDate] = useState(format(new Date("2022-01-01"), "yyyy-MM-dd"));
  const [toDate, setToDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [runningBalance, setRunningBalance] = useState(true);
  const [openingBalance, setOpeningBalance] = useState(true);
  const [billDetails, setBillDetails] = useState(true);
  const [bankDetails, setBankDetails] = useState(true);

  // Ledger selection
  const [ledgerSearchTerm, setLedgerSearchTerm] = useState("");
  const [selectedLedgerId, setSelectedLedgerId] = useState<number | null>(null);
  const [selectedLedgerName, setSelectedLedgerName] = useState<string>("");
  const [open, setOpen] = useState(false);

  // Fetch all ledgers once (no API call on every keystroke)
  const { data: allLedgers = [], isLoading: isSearching } = useLedgerSearch([16, 17]);
  
  // Client-side filtering by group name
  const filteredLedgers = useMemo(() => {
    if (!ledgerSearchTerm.trim()) return allLedgers;
    const term = ledgerSearchTerm.toLowerCase();
    return allLedgers.filter(
      (ledger) =>
        ledger.group?.toLowerCase().includes(term) ||
        ledger.name.toLowerCase().includes(term)
    );
  }, [allLedgers, ledgerSearchTerm]);

  const { mutate: fetchLedgerRegister, data, isPending, error, reset } = useLedgerRegister();

  const handleSearch = () => {
    if (!selectedLedgerId) return;

    const range =
      datePreset === "range"
        ? { from: new Date(fromDate), to: new Date(toDate) }
        : resolveDateRange(datePreset);

    fetchLedgerRegister({
      from: toApiDate(range.from),
      to: toApiDate(range.to),
      ledgerId: selectedLedgerId,
      runningBalance,
      openingBalance,
      billDetails,
      bankDetails,
    });
  };

  const handleClear = () => {
    setSelectedLedgerId(null);
    setSelectedLedgerName("");
    setLedgerSearchTerm("");
    setDatePreset("yearly");
    reset();
  };

  return (
    <TooltipProvider>
      <div className="flex flex-col gap-6 p-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <FileText className="h-6 w-6" />
            Ledger Register
          </h1>
          <p className="text-sm text-muted-foreground">View detailed ledger transactions with running balance</p>
        </div>

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
              <div className="space-y-1.5">
                <Label className="text-xs font-medium flex items-center gap-1.5 text-muted-foreground">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                  Ledger <span className="text-red-500">*</span>
                </Label>
                <Popover open={open} onOpenChange={setOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={open}
                      className="w-full justify-between h-9"
                    >
                      {selectedLedgerName || "Select ledger..."}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[400px] p-0">
                    <Command>
                      <CommandInput
                        placeholder="Search ledger..."
                        value={ledgerSearchTerm}
                        onValueChange={setLedgerSearchTerm}
                      />
                      <CommandList>
                        <CommandEmpty>
                          {isSearching ? "Loading ledgers..." : "No ledgers found"}
                        </CommandEmpty>
                        <CommandGroup>
                          {filteredLedgers.map((ledger) => (
                            <CommandItem
                              key={ledger.ledger_id}
                              value={ledger.name}
                              onSelect={() => {
                                setSelectedLedgerId(ledger.ledger_id);
                                setSelectedLedgerName(ledger.name);
                                setOpen(false);
                              }}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  selectedLedgerId === ledger.ledger_id ? "opacity-100" : "opacity-0"
                                )}
                              />
                              <div className="flex flex-col">
                                <span>{ledger.name}</span>
                                <span className="text-xs text-muted-foreground">{ledger.group}</span>
                              </div>
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>

              {/* Date Preset */}
              <div className="space-y-1.5">
                <Label className="text-xs font-medium flex items-center gap-1.5 text-muted-foreground">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                  Date Range
                </Label>
                <Select
                  value={datePreset}
                  onValueChange={(v) => setDatePreset(v as DatePreset)}
                >
                  <SelectTrigger className="h-9 w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    <SelectItem value="today">Today</SelectItem>
                    <SelectItem value="current_month">Current Month</SelectItem>
                    <SelectItem value="range">Custom Range</SelectItem>
                    <SelectItem value="monthly">Last Month</SelectItem>
                    <SelectItem value="quarterly">Last Quarter</SelectItem>
                    <SelectItem value="half_yearly">Last 6 Months</SelectItem>
                    <SelectItem value="yearly">This Year</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Custom date range */}
            {datePreset === "range" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-muted-foreground">From Date</Label>
                  <Input type="date" className="h-9" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-muted-foreground">To Date</Label>
                  <Input type="date" className="h-9" value={toDate} onChange={(e) => setToDate(e.target.value)} />
                </div>
              </div>
            )}

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
                disabled={isPending || !selectedLedgerId}
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
