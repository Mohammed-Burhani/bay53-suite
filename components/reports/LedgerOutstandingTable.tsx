"use client";

import { useState, useEffect } from "react";
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
import { Printer, Search, Filter, Receipt, TrendingUp, AlertTriangle, Loader2, X } from "lucide-react";
import { ModuleAIAssistant } from "@/components/ModuleAIAssistant";
import { useLedgerOutstanding, useLedgerSearch } from "@/lib/hooks/useReports";
import type { LedgerOutstandingItem, Ledger } from "@/lib/types/reports.types";
import { format, subMonths } from "date-fns";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

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

export default function LedgerOutstandingTable() {
  const [detailed, setDetailed] = useState(false);
  const [datePreset, setDatePreset] = useState<DatePreset>("none");
  // Selected ledger IDs
  const [selectedLedgerIds, setSelectedLedgerIds] = useState<number[]>([]);
  const [ledgerSearchOpen, setLedgerSearchOpen] = useState(false);
  const [ledgerSearchTerm, setLedgerSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  // Custom date range (only used when preset === "range")
  const [fromDate, setFromDate] = useState(format(new Date("2022-01-01"), "yyyy-MM-dd"));
  const [toDate, setToDate] = useState(format(new Date(), "yyyy-MM-dd"));

  // Debounce search term (500ms delay)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(ledgerSearchTerm);
    }, 500);

    return () => clearTimeout(timer);
  }, [ledgerSearchTerm]);

  const { data: searchResults = [], isLoading: ledgersLoading } = useLedgerSearch(debouncedSearchTerm);
  const { mutate: fetchOutstanding, data, isPending, error } = useLedgerOutstanding();

  const handleSearch = () => {
    if (selectedLedgerIds.length === 0) return;

    const range =
      datePreset === "range"
        ? { from: new Date(fromDate), to: new Date(toDate) }
        : resolveDateRange(datePreset);

    fetchOutstanding({
      ledgers: selectedLedgerIds,
      detailed,
      salesman: null,
      fromDate: toApiDate(range.from),
      toDate: toApiDate(range.to),
    });
  };

  // Keep track of all selected ledgers (from search results + previously selected)
  const [selectedLedgersMap, setSelectedLedgersMap] = useState<Map<number, Ledger>>(new Map());

  const handleLedgerSelect = (ledger: Ledger) => {
    if (selectedLedgerIds.includes(ledger.ledger_id)) {
      // Deselect
      setSelectedLedgerIds((prev) => prev.filter((id) => id !== ledger.ledger_id));
      setSelectedLedgersMap((prev) => {
        const newMap = new Map(prev);
        newMap.delete(ledger.ledger_id);
        return newMap;
      });
    } else {
      // Select
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

  const rows: LedgerOutstandingItem[] = data ?? [];
  const totalOutstanding = rows.reduce((sum, r) => sum + r.pending, 0);
  const overdueCount = rows.filter((r) => r.overDue > 0).length;

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
          <CardHeader className="border-b bg-linear-to-r from-slate-50 to-gray-50 dark:from-slate-900 dark:to-gray-900 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-linear-to-br from-blue-500 to-indigo-600 text-white">
                <Filter className="h-4 w-4" />
              </div>
              <div>
                <CardTitle className="text-base font-semibold">Ledger Outstanding Filters</CardTitle>
                <CardDescription className="text-xs">View outstanding balances by ledger</CardDescription>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-6 space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-x-4 gap-y-4">
              {/* Ledger Selection */}
              <div className="space-y-1.5">
                <Label className="text-xs font-medium flex items-center gap-1.5 text-muted-foreground">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                  Ledgers <span className="text-red-500">*</span>
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
                        className="text-xs gap-1"
                      >
                        {ledger.name}
                        <X
                          className="h-3 w-3 cursor-pointer hover:text-destructive"
                          onClick={() => removeLedgerById(ledger.ledger_id)}
                        />
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              {/* Date preset */}
              <div className="space-y-1.5">
                <Label className="text-xs font-medium flex items-center gap-1.5 text-muted-foreground">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                  Date
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
                    <SelectItem value="range">Range</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="quarterly">Quarterly</SelectItem>
                    <SelectItem value="half_yearly">Half Yearly</SelectItem>
                    <SelectItem value="yearly">Yearly</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Detailed checkbox */}
              <div className="space-y-1.5 flex items-end">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="detailed"
                    checked={detailed}
                    onCheckedChange={(c) => setDetailed(c as boolean)}
                  />
                  <Label htmlFor="detailed" className="cursor-pointer text-sm font-normal">Detailed</Label>
                </div>
              </div>
            </div>

            {/* Custom date range inputs — only shown when preset is "range" */}
            {datePreset === "range" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-muted-foreground">From Date</Label>
                  <Input
                    type="date"
                    className="h-9"
                    value={fromDate}
                    onChange={(e) => setFromDate(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-muted-foreground">To Date</Label>
                  <Input
                    type="date"
                    className="h-9"
                    value={toDate}
                    onChange={(e) => setToDate(e.target.value)}
                  />
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-2 pt-3 border-t">
              <Button
                onClick={handleSearch}
                disabled={isPending || selectedLedgerIds.length === 0}
                size="sm"
                className="bg-linear-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white h-9"
              >
                {isPending ? (
                  <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                ) : (
                  <Search className="h-3.5 w-3.5 mr-1.5" />
                )}
                {isPending ? "Loading..." : "Outstanding"}
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
                    rows.map((row, idx) => {
                      const isOverdue = row.overDue > 0;
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
                              <Badge variant="destructive">{row.overDue}d</Badge>
                            ) : (
                              <span className="text-muted-foreground">—</span>
                            )}
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
      </div>

      {/* AI Assistant */}
      <ModuleAIAssistant
        moduleName="Ledger Outstanding"
        moduleData={{ data: rows, detailed, totalOutstanding }}
      />
    </TooltipProvider>
  );
}
