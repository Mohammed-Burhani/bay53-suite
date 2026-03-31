"use client";

import { useState, useEffect } from "react";
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
import { Printer, Search, Filter, Receipt, TrendingUp, Users, Loader2, X } from "lucide-react";
import { ModuleAIAssistant } from "@/components/ModuleAIAssistant";
import { useLedgerOutstandingSummary, useLedgerSearch } from "@/lib/hooks/useReports";
import type { LedgerOutstandingSummaryItem, Ledger } from "@/lib/types/reports.types";
import { format, subMonths } from "date-fns";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { TablePagination, usePagination } from "@/components/ui/table-pagination";

// Helper: format date string "DD/MM/YYYY HH:mm:ss" for the API
function toApiDate(date: Date) {
  return format(date, "dd/MM/yyyy HH:mm:ss");
}

// Preset date ranges
type DatePreset = "none" | "today" | "current_month" | "range" | "monthly" | "quarterly" | "half_yearly" | "yearly";

function resolveDateRange(preset: DatePreset): { from: Date; to: Date } {
  const now = new Date();
  switch (preset) {
    case "today":
      return { from: new Date(now.setHours(0, 0, 0, 0)), to: new Date() };
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
      // "none" / "range" — use wide default
      return { from: new Date("2022-01-01"), to: new Date() };
  }
}

export default function LedgerOutstandingSummaryTable() {
  const [selectedLedgerIds, setSelectedLedgerIds] = useState<number[]>([]);
  const [ledgerSearchOpen, setLedgerSearchOpen] = useState(false);
  const [ledgerSearchTerm, setLedgerSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [toDate, setToDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [datePreset, setDatePreset] = useState<"none" | "today" | "current_month" | "range" | "monthly" | "quarterly" | "half_yearly" | "yearly">("none");
  const [fromDate, setFromDate] = useState(format(new Date("2022-01-01"), "yyyy-MM-dd"));

  // Debounce search term (500ms delay)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(ledgerSearchTerm);
    }, 500);

    return () => clearTimeout(timer);
  }, [ledgerSearchTerm]);

  const { data: searchResults = [], isLoading: ledgersLoading } = useLedgerSearch(debouncedSearchTerm);
  const { mutate: fetchSummary, data, isPending, error } = useLedgerOutstandingSummary();
  const { currentPage, pageSize, setCurrentPage, setPageSize, getPaginatedData } = usePagination(50);

  const handleSearch = () => {
    // Allow search even without ledger selection
    const range =
      datePreset === "range"
        ? { from: new Date(fromDate), to: new Date(toDate) }
        : resolveDateRange(datePreset);

    fetchSummary({
      ledgers: selectedLedgerIds.length > 0 ? selectedLedgerIds : [], // Empty array if no selection
      toDate: toApiDate(range.to),
    });
  };

  // Keep track of all selected ledgers
  const [selectedLedgersMap, setSelectedLedgersMap] = useState<Map<number, Ledger>>(new Map());

  const handleLedgerSelect = (ledger: Ledger) => {
    if (selectedLedgerIds.includes(ledger.ledger_id)) {
      setSelectedLedgerIds((prev) => prev.filter((id) => id !== ledger.ledger_id));
      setSelectedLedgersMap((prev) => {
        const newMap = new Map(prev);
        newMap.delete(ledger.ledger_id);
        return newMap;
      });
    } else {
      setSelectedLedgerIds((prev) => [...prev, ledger.ledger_id]);
      setSelectedLedgersMap((prev) => new Map(prev).set(ledger.ledger_id, ledger));
    }
  };

  const removeLedgerById = (ledgerId: number) => {
    setSelectedLedgerIds((prev) => prev.filter((id) => id !== ledgerId));
    setSelectedLedgersMap((prev) => {
      const newMap = new Map(prev);
      newMap.delete(ledgerId);
      return newMap;
    });
  };

  const selectedLedgers = Array.from(selectedLedgersMap.values());

  // Group ledgers by their group field
  const groupedLedgers = searchResults.reduce((acc, ledger) => {
    const groupName = ledger.group || "Ungrouped";
    if (!acc[groupName]) {
      acc[groupName] = [];
    }
    acc[groupName].push(ledger);
    return acc;
  }, {} as Record<string, Ledger[]>);

  const rows: LedgerOutstandingSummaryItem[] = data ?? [];
  const paginatedRows = getPaginatedData(rows);
  const totalPending = rows.reduce((sum, r) => sum + r["Pending Amount"], 0);
  const debtorCount = rows.filter((r) => r.DrCr === "Dr").length;
  const creditorCount = rows.filter((r) => r.DrCr === "Cr").length;

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
                <p className="text-sm font-medium opacity-90">Total Pending</p>
                <p className="text-3xl font-bold mt-1">₹{totalPending.toLocaleString()}</p>
              </CardContent>
            </Card>

            <Card className="relative overflow-hidden border-0 bg-linear-to-br from-emerald-500 to-emerald-600 text-white shadow-lg">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16" />
              <CardContent className="p-6 relative">
                <Users className="h-8 w-8 opacity-80 mb-2" />
                <p className="text-sm font-medium opacity-90">Total Parties</p>
                <p className="text-3xl font-bold mt-1">{rows.length}</p>
              </CardContent>
            </Card>

            <Card className="relative overflow-hidden border-0 bg-linear-to-br from-purple-500 to-purple-600 text-white shadow-lg">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16" />
              <CardContent className="p-6 relative">
                <TrendingUp className="h-8 w-8 opacity-80 mb-2" />
                <p className="text-sm font-medium opacity-90">Dr / Cr</p>
                <p className="text-3xl font-bold mt-1">{debtorCount} / {creditorCount}</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Filter Panel */}
        <Card className="border shadow-sm">
          <CardHeader className="border-b bg-linear-to-r from-slate-50 to-gray-50 dark:from-slate-900 dark:to-gray-900 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-linear-to-br from-blue-500 to-indigo-600 text-white">
                <Filter className="h-4 w-4" />
              </div>
              <div>
                <CardTitle className="text-base font-semibold">Ledger Outstanding Summary Filters</CardTitle>
                <CardDescription className="text-xs">View summary of outstanding balances by ledger</CardDescription>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-6 space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-4">
              {/* Ledger Selection */}
              <div className="space-y-1.5">
                <Label className="text-xs font-medium flex items-center gap-1.5 text-muted-foreground">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                  Ledgers
                </Label>
                <Popover open={ledgerSearchOpen} onOpenChange={setLedgerSearchOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={ledgerSearchOpen}
                      className="w-full h-9 justify-between font-normal"
                    >
                      {selectedLedgerIds.length === 0 ? (
                        <span className="text-muted-foreground">Search and select ledgers...</span>
                      ) : (
                        <span className="truncate">
                          {selectedLedgerIds.length} ledger{selectedLedgerIds.length > 1 ? "s" : ""} selected
                        </span>
                      )}
                      <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[400px] p-0" align="start">
                    <Command shouldFilter={false}>
                      <CommandInput 
                        placeholder="Type to search ledgers (min 2 chars)..." 
                        value={ledgerSearchTerm}
                        onValueChange={setLedgerSearchTerm}
                      />
                      {ledgerSearchTerm.length < 2 ? (
                        <div className="py-6 text-center text-sm text-muted-foreground">
                          Type at least 2 characters to search
                        </div>
                      ) : ledgersLoading || ledgerSearchTerm !== debouncedSearchTerm ? (
                        <div className="py-6 text-center text-sm text-muted-foreground">
                          <Loader2 className="h-4 w-4 animate-spin mx-auto mb-2" />
                          Searching...
                        </div>
                      ) : Object.keys(groupedLedgers).length === 0 ? (
                        <CommandEmpty>No ledgers found.</CommandEmpty>
                      ) : (
                        <div className="max-h-[300px] overflow-auto">
                          {Object.entries(groupedLedgers).map(([groupName, ledgers]) => (
                            <CommandGroup key={groupName} heading={groupName}>
                              {ledgers.map((ledger) => (
                                <CommandItem
                                  key={ledger.ledger_id}
                                  value={`${ledger.name} ${ledger.ledger_id}`}
                                  onSelect={() => handleLedgerSelect(ledger)}
                                >
                                  <Checkbox
                                    checked={selectedLedgerIds.includes(ledger.ledger_id)}
                                    className="mr-2"
                                  />
                                  <div className="flex-1">
                                    <div className="font-medium">{ledger.name}</div>
                                    <div className="text-xs text-muted-foreground">
                                      ID: {ledger.ledger_id}
                                    </div>
                                  </div>
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          ))}
                        </div>
                      )}
                    </Command>
                  </PopoverContent>
                </Popover>
                {selectedLedgers.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {selectedLedgers.map((ledger) => (
                      <Badge
                        key={ledger.ledger_id}
                        variant="secondary"
                        className="text-xs gap-1 pr-1"
                      >
                        <span>{ledger.name}</span>
                        <button
                          type="button"
                          className="ml-1 rounded-sm hover:bg-destructive/20 hover:text-destructive focus:outline-none focus:ring-1 focus:ring-destructive"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            removeLedgerById(ledger.ledger_id);
                          }}
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              {/* To Date */}
              <div className="space-y-1.5">
                <Label className="text-xs font-medium flex items-center gap-1.5 text-muted-foreground">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                  To Date
                </Label>
                <Input
                  type="date"
                  className="h-9"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-2 pt-3 border-t">
              <Button
                onClick={handleSearch}
                disabled={isPending}
                size="sm"
                className="bg-linear-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white h-9"
              >
                {isPending ? (
                  <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                ) : (
                  <Search className="h-3.5 w-3.5 mr-1.5" />
                )}
                {isPending ? "Loading..." : "Get Summary"}
              </Button>
              <div className="flex-1" />
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" size="icon" className="h-9 w-9" onClick={() => window.print()}>
                    <Printer className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Print</TooltipContent>
              </Tooltip>
            </div>

            {/* API Error */}
            {error && (
              <p className="text-sm text-destructive">
                Failed to fetch data. Please try again.
              </p>
            )}
          </CardContent>
        </Card>

        {/* Results Table */}
        <Card className="border shadow-sm">
          <CardHeader className="border-b">
            <CardTitle className="text-xl">Outstanding Summary</CardTitle>
            <CardDescription>Party-wise outstanding summary</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-linear-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20">
                    <TableHead className="font-semibold">Party</TableHead>
                    <TableHead className="font-semibold">Area</TableHead>
                    <TableHead className="font-semibold">City</TableHead>
                    <TableHead className="font-semibold">Contact No.</TableHead>
                    <TableHead className="font-semibold">Address</TableHead>
                    <TableHead className="font-semibold">Pin</TableHead>
                    <TableHead className="text-right font-semibold">Pending Amount</TableHead>
                    <TableHead className="font-semibold">Dr/Cr</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-12 text-muted-foreground">
                        <Receipt className="h-12 w-12 mx-auto mb-3 opacity-50" />
                        <p className="text-lg font-medium">No outstanding summary data</p>
                        <p className="text-sm">Click Get Summary to view outstanding balances</p>
                      </TableCell>
                    </TableRow>
                  ) : (
                    paginatedRows.map((row, idx) => (
                      <TableRow key={idx} className="hover:bg-muted/50">
                        <TableCell className="font-medium">{row.Party}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{row.Area}</TableCell>
                        <TableCell className="text-sm">{row.City}</TableCell>
                        <TableCell className="text-sm">{row["Contact No."]}</TableCell>
                        <TableCell className="text-xs text-muted-foreground max-w-[200px] truncate" title={row.Address}>
                          {row.Address}
                        </TableCell>
                        <TableCell className="text-sm">{row.Pin}</TableCell>
                        <TableCell className="text-right font-bold text-blue-600">
                          ₹{row["Pending Amount"].toLocaleString()}
                        </TableCell>
                        <TableCell>
                          <Badge variant={row.DrCr === "Dr" ? "destructive" : "default"}>
                            {row.DrCr}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))
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
        moduleName="Ledger Outstanding Summary"
        moduleData={{ data: rows, totalPending, debtorCount, creditorCount }}
      />
    </TooltipProvider>
  );
}
