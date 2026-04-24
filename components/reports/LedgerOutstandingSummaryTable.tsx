"use client";

import { useState, useEffect } from "react";
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
import { Printer, Search, Filter, Receipt, TrendingUp, Users, Loader2, X, Download, FileSpreadsheet } from "lucide-react";
import { ModuleAIAssistant } from "@/components/ModuleAIAssistant";
import { useLedgerOutstandingSummary, useLedgersByGroup, useGroupSearch } from "@/lib/hooks/useReports";
import { exportToExcel, exportToPDF, printTable } from "@/lib/utils/report-export";
import type { LedgerOutstandingSummaryItem, Ledger } from "@/lib/types/reports.types";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { TablePagination, usePagination } from "@/components/ui/table-pagination";
import { DateRangeFilter } from "./DateRangeFilter";
import { useReportFiltersStore } from "@/lib/stores/report-filters-store";

export default function LedgerOutstandingSummaryTable() {
  const { ledgerBalances, setLedgerBalancesFilters } = useReportFiltersStore();
  const { 
    selectedLedgerIds, 
    toDate, 
    selectedGroupId,
    dateType,
    selectedMonth,
    selectedQuarter,
    selectedHalfYear,
    selectedYear,
    fromDate,
    selectedLedgers: persistedLedgers,
  } = ledgerBalances;

  const [ledgerSearchOpen, setLedgerSearchOpen] = useState(false);
  const [ledgerSearchTerm, setLedgerSearchTerm] = useState("");
  // Initialize from persisted ledgers
  const [selectedLedgersMap, setSelectedLedgersMap] = useState<Map<number, Ledger>>(() => {
    const map = new Map<number, Ledger>();
    if (persistedLedgers && Array.isArray(persistedLedgers)) {
      persistedLedgers.forEach(ledger => {
        map.set(ledger.ledger_id, ledger as Ledger);
      });
    }
    return map;
  });

  // Sync selectedLedgersMap when persistedLedgers changes (on mount/reload)
  useEffect(() => {
    if (persistedLedgers && Array.isArray(persistedLedgers) && persistedLedgers.length > 0) {
      const map = new Map<number, Ledger>();
      persistedLedgers.forEach(ledger => {
        map.set(ledger.ledger_id, ledger as Ledger);
      });
      setSelectedLedgersMap(map);
    }
  }, [persistedLedgers]);

  // Fetch groups with childOf filter for ledger balances (16, 17)
  const { data: allGroups = [] } = useGroupSearch([16, 17]);
  
  // Determine which groups to pass to ledger fetch
  const groupsForLedgerFetch = selectedGroupId && selectedGroupId !== "all" 
    ? [parseInt(selectedGroupId)] 
    : undefined; // Don't fetch if "All Groups" is selected
  
  // Fetch all ledgers for the selected group once
  const { data: allLedgers = [], isLoading: ledgersLoading } = useLedgersByGroup(groupsForLedgerFetch);
  
  // Filter ledgers on frontend based on search term - only show results when user types
  const searchResults = ledgerSearchTerm.length >= 3
    ? allLedgers.filter(ledger => 
        ledger.name.toLowerCase().includes(ledgerSearchTerm.toLowerCase())
      )
    : [];
  
  const { mutate: fetchSummary, data, isPending, error } = useLedgerOutstandingSummary();
  const { currentPage, pageSize, setCurrentPage, setPageSize, getPaginatedData } = usePagination(50);

  // Filter groups to show only IDs 16, 17, 29, 30 in the dropdown
  const allowedGroupIds = [16, 17, 29, 30];
  const filteredGroups = allGroups.filter(group => allowedGroupIds.includes(group.id));

  const handleDateChange = (from: string | null, to: string | null) => {
    setLedgerBalancesFilters({ fromDate: from, toDate: to });
  };

  const handleSearch = () => {
    // Require group selection
    if (!selectedGroupId || selectedGroupId === "all") {
      return;
    }
    
    // Ensure groupId is a valid number (byte range: 0-255)
    const groupIdNum = parseInt(selectedGroupId, 10);
    if (isNaN(groupIdNum) || groupIdNum < 0 || groupIdNum > 255) {
      console.error("Invalid group ID:", selectedGroupId, "Parsed:", groupIdNum);
      return;
    }
    
    console.log("Fetching summary with payload:", {
      groupId: groupIdNum,
      ledgers: selectedLedgerIds.length > 0 ? selectedLedgerIds : [],
      fromDate: fromDate || null,
      toDate: toDate || null,
    });
    
    fetchSummary({
      groupId: groupIdNum,
      ledgers: selectedLedgerIds.length > 0 ? selectedLedgerIds : [],
      fromDate: fromDate || null,
      toDate: toDate || null,
    });
  };

  const handleLedgerSelect = (ledger: Ledger) => {
    if (selectedLedgerIds.includes(ledger.ledger_id)) {
      const newIds = selectedLedgerIds.filter((id) => id !== ledger.ledger_id);
      const newMap = new Map(selectedLedgersMap);
      newMap.delete(ledger.ledger_id);
      
      setLedgerBalancesFilters({ 
        selectedLedgerIds: newIds,
        selectedLedgers: Array.from(newMap.values()).map(l => ({
          ledger_id: l.ledger_id,
          name: l.name,
          group: l.group
        }))
      });
      setSelectedLedgersMap(newMap);
    } else {
      const newIds = [...selectedLedgerIds, ledger.ledger_id];
      const newMap = new Map(selectedLedgersMap).set(ledger.ledger_id, ledger);
      
      setLedgerBalancesFilters({ 
        selectedLedgerIds: newIds,
        selectedLedgers: Array.from(newMap.values()).map(l => ({
          ledger_id: l.ledger_id,
          name: l.name,
          group: l.group
        }))
      });
      setSelectedLedgersMap(newMap);
    }
  };

  const removeLedgerById = (ledgerId: number) => {
    const newIds = selectedLedgerIds.filter((id) => id !== ledgerId);
    const newMap = new Map(selectedLedgersMap);
    newMap.delete(ledgerId);
    
    setLedgerBalancesFilters({ 
      selectedLedgerIds: newIds,
      selectedLedgers: Array.from(newMap.values()).map(l => ({
        ledger_id: l.ledger_id,
        name: l.name,
        group: l.group
      }))
    });
    setSelectedLedgersMap(newMap);
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

  // Export handlers
  const handlePrint = () => {
    const headers = [
      { key: "Party", label: "Party" },
      { key: "GSTNo", label: "GST No" },
      { key: "Area", label: "Area" },
      { key: "City", label: "City" },
      { key: "Contact No.", label: "Contact No" },
      { key: "Pending Amount", label: "Closing" },
      { key: "DrCr", label: "DrCr" },
    ];
    printTable(rows as unknown as Record<string, unknown>[], headers, "Ledger Balances Report");
  };

  const handleDownloadPDF = () => {
    const headers = [
      { key: "Party", label: "Party" },
      { key: "GSTNo", label: "GST No" },
      { key: "Area", label: "Area" },
      { key: "City", label: "City" },
      { key: "Contact No.", label: "Contact No" },
      { key: "Pending Amount", label: "Closing" },
      { key: "DrCr", label: "DrCr" },
    ];
    exportToPDF(rows as unknown as Record<string, unknown>[], headers, "Ledger Balances Report", "ledger-balances");
  };

  const handleExportExcel = () => {
    const headers = [
      { key: "Party", label: "Party" },
      { key: "GSTNo", label: "GST No" },
      { key: "Area", label: "Area" },
      { key: "City", label: "City" },
      { key: "Contact No.", label: "Contact No" },
      { key: "Pending Amount", label: "Closing" },
      { key: "DrCr", label: "DrCr" },
    ];
    exportToExcel(rows as unknown as Record<string, unknown>[], headers, "ledger-balances");
  };

  return (
    <TooltipProvider>
      <div className="flex flex-col gap-6 w-full">
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
                <CardTitle className="text-base font-semibold">Ledger Balances Filters</CardTitle>
                <CardDescription className="text-xs">View summary of outstanding balances by ledger</CardDescription>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-6 space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-x-4 gap-y-4">
              {/* Group Filter */}
              <div className="space-y-1.5">
                <Label className="text-xs font-medium flex items-center gap-1.5 text-muted-foreground">
                  <span className="w-1.5 h-1.5 rounded-full bg-purple-500" />
                  Group
                </Label>
                <Select 
                  value={selectedGroupId} 
                  onValueChange={(value) => {
                    setLedgerBalancesFilters({ 
                      selectedGroupId: value,
                      selectedLedgerIds: [], // Clear selected ledgers when group changes
                      selectedLedgers: []
                    });
                    setSelectedLedgersMap(new Map());
                    setLedgerSearchTerm("");
                  }}
                >
                  <SelectTrigger className="w-full h-9">
                    <SelectValue placeholder="Select group..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Groups</SelectItem>
                    {filteredGroups.map((group) => (
                      <SelectItem key={group.id} value={group.id.toString()}>
                        {group.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

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
                        placeholder={
                          !selectedGroupId || selectedGroupId === "all"
                            ? "Select a group first to search ledgers..."
                            : ledgersLoading
                            ? "Loading ledgers..."
                            : "Type company name or ledger name (min 2 chars)..."
                        }
                        value={ledgerSearchTerm}
                        onValueChange={setLedgerSearchTerm}
                        disabled={!selectedGroupId || selectedGroupId === "all" || ledgersLoading}
                      />
                      {!selectedGroupId || selectedGroupId === "all" ? (
                        <div className="py-6 text-center text-sm text-muted-foreground">
                          Please select a group first to search ledgers
                        </div>
                      ) : ledgersLoading ? (
                        <div className="py-6 text-center text-sm text-muted-foreground">
                          <Loader2 className="h-4 w-4 animate-spin mx-auto mb-2" />
                          Loading ledgers...
                        </div>
                      ) : allLedgers.length === 0 ? (
                        <div className="py-6 text-center text-sm text-muted-foreground">
                          No ledgers found in this group
                        </div>
                      ) : ledgerSearchTerm.length < 3 ? (
                        <div className="py-6 text-center text-sm text-muted-foreground">
                          Type at least 3 characters to search
                        </div>
                      ) : searchResults.length === 0 ? (
                        <CommandEmpty>No ledgers match your search.</CommandEmpty>
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
                                      ID: {ledger.ledger_id} • {ledger.group}
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

              {/* Date Filter */}
              <DateRangeFilter 
                dateType={dateType}
                selectedMonth={selectedMonth}
                selectedQuarter={selectedQuarter}
                selectedHalfYear={selectedHalfYear}
                selectedYear={selectedYear}
                fromDate={fromDate}
                toDate={toDate}
                onDateTypeChange={(type) => setLedgerBalancesFilters({ dateType: type })}
                onSelectedMonthChange={(month) => setLedgerBalancesFilters({ selectedMonth: month })}
                onSelectedQuarterChange={(quarter) => setLedgerBalancesFilters({ selectedQuarter: quarter })}
                onSelectedHalfYearChange={(halfYear) => setLedgerBalancesFilters({ selectedHalfYear: halfYear })}
                onSelectedYearChange={(year) => setLedgerBalancesFilters({ selectedYear: year })}
                onFromDateChange={(date) => setLedgerBalancesFilters({ fromDate: date })}
                onToDateChange={(date) => setLedgerBalancesFilters({ toDate: date })}
                onDateChange={handleDateChange} 
                label="Date Range" 
              />
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-2 pt-3 border-t">
              <Button
                onClick={handleSearch}
                disabled={isPending || !selectedGroupId || selectedGroupId === "all"}
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
              <Button
                onClick={() => {
                  setLedgerBalancesFilters({
                    selectedGroupId: "",
                    selectedLedgerIds: [],
                    selectedLedgers: [],
                    dateType: "current_month",
                    selectedMonth: "",
                    selectedQuarter: "",
                    selectedHalfYear: "",
                    selectedYear: "",
                  });
                  setSelectedLedgersMap(new Map());
                  setLedgerSearchTerm("");
                }}
                variant="outline"
                size="sm"
                className="h-9"
              >
                <X className="h-3.5 w-3.5 mr-1.5" />
                Clear Filters
              </Button>
              {(!selectedGroupId || selectedGroupId === "all") && (
                <p className="text-xs text-muted-foreground">
                  Please select a group to get summary
                </p>
              )}
              <div className="flex-1" />
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="outline" 
                    size="icon" 
                    className="h-9 w-9" 
                    onClick={handlePrint}
                    disabled={rows.length === 0}
                  >
                    <Printer className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Print</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="outline" 
                    size="icon" 
                    className="h-9 w-9" 
                    onClick={handleDownloadPDF}
                    disabled={rows.length === 0}
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Download PDF</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="outline" 
                    size="icon" 
                    className="h-9 w-9" 
                    onClick={handleExportExcel}
                    disabled={rows.length === 0}
                  >
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
            <CardTitle className="text-xl">Ledger Balances</CardTitle>
            <CardDescription>Party-wise outstanding summary</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-linear-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20">
                    <TableHead className="font-semibold">Party</TableHead>
                    <TableHead className="font-semibold">GST No</TableHead>
                    <TableHead className="font-semibold">Area</TableHead>
                    <TableHead className="font-semibold">City</TableHead>
                    <TableHead className="font-semibold">Contact No</TableHead>
                    <TableHead className="text-right font-semibold">Closing</TableHead>
                    <TableHead className="font-semibold">DrCr</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                        <Receipt className="h-12 w-12 mx-auto mb-3 opacity-50" />
                        <p className="text-lg font-medium">No outstanding summary data</p>
                        <p className="text-sm">Click Get Summary to view outstanding balances</p>
                      </TableCell>
                    </TableRow>
                  ) : (
                    <>
                      {paginatedRows.map((row, idx) => (
                        <TableRow key={idx} className="hover:bg-muted/50">
                          <TableCell className="font-medium">{row.Party}</TableCell>
                          <TableCell className="text-sm font-mono">{row.GSTNo || "-"}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">{row.Area}</TableCell>
                          <TableCell className="text-sm">{row.City}</TableCell>
                          <TableCell className="text-sm">{row["Contact No."]}</TableCell>
                          <TableCell className="text-right font-bold text-blue-600">
                            {row["Pending Amount"]?.toFixed(2) || "0.00"}
                          </TableCell>
                          <TableCell>
                            <Badge variant={row.DrCr === "Dr" ? "destructive" : "default"} className="text-xs">
                              {row.DrCr}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                      <TableRow className="bg-linear-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 font-bold">
                        <TableCell colSpan={5} className="text-right font-bold">Total:</TableCell>
                        <TableCell className="text-right font-bold text-blue-600">
                          ₹{rows.reduce((sum, r) => sum + r["Pending Amount"], 0).toFixed(2)}
                        </TableCell>
                        <TableCell></TableCell>
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
        moduleData={{ data: rows, totalPending, debtorCount, creditorCount }}
      />
    </TooltipProvider>
  );
}
