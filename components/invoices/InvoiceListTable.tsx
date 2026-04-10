"use client";

import { useState, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Search,
  FileText,
  Loader2,
  Filter,
  X,
  Building2,
  Package,
  ChevronsUpDown,
} from "lucide-react";
import { format } from "date-fns";
import { formatCurrency } from "@/lib/store";
import { TablePagination, usePagination } from "@/components/ui/table-pagination";
import { ModuleAIAssistant } from "@/components/ModuleAIAssistant";
import { useInvoiceSearch } from "@/lib/hooks/useInvoices";
import { useInvoiceTypes, useStockPlaces } from "@/lib/hooks/useReports";
import { toast } from "sonner";
import { DateRangeFilter, type DateFilterType } from "@/components/reports/DateRangeFilter";
import { LedgerSearchInput } from "@/components/reports/LedgerSearchInput";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Checkbox } from "@/components/ui/checkbox";

interface InvoiceListTableProps {
  title: string;
  defaultInvType?: number; // Default invoice type filter
  icon?: React.ElementType;
  iconColor?: string;
}

export function InvoiceListTable({
  title,
  defaultInvType = 0,
  icon: Icon = FileText,
  iconColor = "bg-indigo-500",
}: InvoiceListTableProps) {
  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedInvType, setSelectedInvType] = useState<number>(defaultInvType);
  const [selectedStockPlaceIds, setSelectedStockPlaceIds] = useState<number[]>([]);
  const [invoiceNo, setInvoiceNo] = useState("");
  const [billNo, setBillNo] = useState("");
  
  // Date filter state
  const [dateType, setDateType] = useState<DateFilterType>("current_month");
  const [selectedMonth, setSelectedMonth] = useState("");
  const [selectedQuarter, setSelectedQuarter] = useState("");
  const [selectedHalfYear, setSelectedHalfYear] = useState("");
  const [selectedYear, setSelectedYear] = useState("");
  const [fromDate, setFromDate] = useState<string | null>(null);
  const [toDate, setToDate] = useState<string | null>(null);
  const [calculatedFromDate, setCalculatedFromDate] = useState<string | null>(null);
  const [calculatedToDate, setCalculatedToDate] = useState<string | null>(null);
  
  // Ledger filter state
  const [selectedLedgerIds, setSelectedLedgerIds] = useState<number[]>([]);
  const [selectedLedgers, setSelectedLedgers] = useState<Array<{ ledger_id: number; name: string; group: string | null }>>([]);

  // Check if invoice number is entered (disables date filter)
  const isInvoiceNoEntered = invoiceNo.trim().length > 0;

  // Pagination
  const { currentPage, pageSize, setCurrentPage, setPageSize } = usePagination(50);

  // Fetch dropdown data
  const { data: invoiceTypes = [], isLoading: isLoadingTypes } = useInvoiceTypes();
  const { data: stockPlaces = [], isLoading: isLoadingStockPlaces } = useStockPlaces();

  // Fetch invoices mutation
  const { mutate: searchInvoices, data: invoiceData, isPending: isLoadingInvoices } = useInvoiceSearch();

  const handleDateChange = (from: string | null, to: string | null) => {
    setCalculatedFromDate(from);
    setCalculatedToDate(to);
  };

  const handleSearch = () => {
    // Get party name from selected ledgers
    const partyName = selectedLedgers.length > 0 ? selectedLedgers[0].name : null;
    
    // Parse invoice number (should be numeric)
    const parsedInvoiceNo = invoiceNo.trim() ? parseInt(invoiceNo.trim(), 10) : null;
    
    // If invoice number is entered, dates should be null
    const shouldUseDates = !isInvoiceNoEntered;
    
    searchInvoices(
      {
        pageSize: 0, // 0 = fetch all
        pageNumber: 0,
        invType: selectedInvType,
        fromDate: shouldUseDates ? calculatedFromDate : null,
        toDate: shouldUseDates ? calculatedToDate : null,
        invoiceNo: parsedInvoiceNo,
        bill_No: billNo.trim() || null,
        spIds: selectedStockPlaceIds,
        partyName: partyName,
        itemName: null,
      },
      {
        onSuccess: (data) => {
          toast.success(`Loaded ${data.list.length} invoices`);
          setCurrentPage(1);
        },
        onError: (error) => {
          toast.error("Failed to load invoices");
          console.error(error);
        },
      }
    );
  };

  const handleClear = () => {
    setSelectedInvType(defaultInvType);
    setSelectedStockPlaceIds([]);
    setInvoiceNo("");
    setDateType("current_month");
    setSelectedMonth("");
    setSelectedQuarter("");
    setSelectedHalfYear("");
    setSelectedYear("");
    setFromDate(null);
    setToDate(null);
    setCalculatedFromDate(null);
    setCalculatedToDate(null);
    setBillNo("");
    setSelectedLedgerIds([]);
    setSelectedLedgers([]);
    setSearchTerm("");
  };

  // Filter and search
  const filteredInvoices = useMemo(() => {
    const invoices = invoiceData?.list || [];
    if (!invoices || invoices.length === 0) return [];

    return invoices.filter((inv) => {
      if (!searchTerm) return true;
      const search = searchTerm.toLowerCase();
      return (
        inv.billNo?.toLowerCase().includes(search) ||
        inv.partyName?.toLowerCase().includes(search) ||
        inv.invType?.toLowerCase().includes(search) ||
        inv.stockPlace?.toLowerCase().includes(search)
      );
    });
  }, [invoiceData?.list, searchTerm]);

  // Calculate stats
  const totalAmount = filteredInvoices.reduce((sum, inv) => sum + (inv.grandTotal || 0), 0);
  const totalPaid = filteredInvoices.reduce((sum, inv) => sum + (inv.paidAmount || 0), 0);
  const totalBalance = filteredInvoices.reduce((sum, inv) => sum + (inv.balanceAmount || 0), 0);

  // Pagination
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedInvoices = filteredInvoices.slice(startIndex, endIndex);

  const isLoading = isLoadingTypes || isLoadingStockPlaces || isLoadingInvoices;
  const hasFilters = selectedInvType !== 0 || selectedStockPlaceIds.length > 0 || calculatedFromDate || calculatedToDate || billNo || invoiceNo || selectedLedgerIds.length > 0;

  return (
    <div className="flex flex-col gap-6">
      {/* Stats Cards */}
      {filteredInvoices.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-3">
          <Card className="relative overflow-hidden border-0 bg-linear-to-br from-blue-500 to-blue-600 text-white shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <FileText className="h-8 w-8 opacity-80" />
              </div>
              <p className="text-sm font-medium opacity-90">Total Amount</p>
              <p className="text-3xl font-bold mt-1">{formatCurrency(totalAmount)}</p>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden border-0 bg-linear-to-br from-emerald-500 to-emerald-600 text-white shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <Package className="h-8 w-8 opacity-80" />
              </div>
              <p className="text-sm font-medium opacity-90">Total Paid</p>
              <p className="text-3xl font-bold mt-1">{formatCurrency(totalPaid)}</p>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden border-0 bg-linear-to-br from-amber-500 to-amber-600 text-white shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <Building2 className="h-8 w-8 opacity-80" />
              </div>
              <p className="text-sm font-medium opacity-90">Balance Due</p>
              <p className="text-3xl font-bold mt-1">{formatCurrency(totalBalance)}</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filter Panel */}
      <Card className="border shadow-sm">
        <CardHeader className="border-b bg-linear-to-r from-slate-50 to-gray-50 dark:from-slate-900 dark:to-gray-900">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${iconColor} text-white`}>
              <Filter className="h-4 w-4" />
            </div>
            <div>
              <CardTitle className="text-base font-semibold">Filters</CardTitle>
              <CardDescription className="text-xs">
                Search and filter invoices
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-6 space-y-4">
          {/* Quick Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Quick search by bill no, party, type..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 h-10"
            />
          </div>

          {/* Filter Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Invoice Type */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Invoice Type</label>
              <Select
                value={selectedInvType.toString()}
                onValueChange={(value) => setSelectedInvType(Number(value))}
                disabled={isLoadingTypes}
              >
                <SelectTrigger className="h-9 w-full">
                  <SelectValue placeholder="All Types" />
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
            </div>

            {/* Invoice Number (Numeric) */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Invoice Number</label>
              <Input
                type="number"
                placeholder="Enter invoice number"
                value={invoiceNo}
                onChange={(e) => setInvoiceNo(e.target.value)}
                className="h-9"
              />
            </div>

            {/* Bill Number (Alphanumeric) */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Bill Number</label>
              <Input
                placeholder="Enter bill number"
                value={billNo}
                onChange={(e) => setBillNo(e.target.value)}
                className="h-9"
              />
            </div>
          </div>

          {/* Stock Place Multi-Select */}
          <div className="pt-2 border-t">
            <div className="space-y-2">
              <label className="text-sm font-medium">Stock Places</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full h-9 justify-between font-normal"
                    disabled={isLoadingStockPlaces}
                  >
                    {selectedStockPlaceIds.length === 0 ? (
                      <span className="text-muted-foreground">All Stock Places</span>
                    ) : (
                      <span className="truncate">
                        {selectedStockPlaceIds.length} stock place{selectedStockPlaceIds.length > 1 ? "s" : ""} selected
                      </span>
                    )}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0" align="start">
                  <Command>
                    <CommandInput placeholder="Search stock places..." />
                    <CommandList>
                      <CommandEmpty>No stock places found.</CommandEmpty>
                      <CommandGroup>
                        {stockPlaces.map((sp) => (
                          <CommandItem
                            key={sp.sp_ID}
                            onSelect={() => {
                              setSelectedStockPlaceIds((prev) =>
                                prev.includes(sp.sp_ID)
                                  ? prev.filter((id) => id !== sp.sp_ID)
                                  : [...prev, sp.sp_ID]
                              );
                            }}
                          >
                            <Checkbox
                              checked={selectedStockPlaceIds.includes(sp.sp_ID)}
                              className="mr-2"
                            />
                            <div className="flex-1">
                              <div className="font-medium">{sp.name}</div>
                              <div className="text-xs text-muted-foreground">Code: {sp.code}</div>
                            </div>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
              {selectedStockPlaceIds.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {selectedStockPlaceIds.map((spId) => {
                    const sp = stockPlaces.find((s) => s.sp_ID === spId);
                    if (!sp) return null;
                    return (
                      <Badge key={spId} variant="secondary" className="text-xs gap-1 pr-1">
                        <span>{sp.name}</span>
                        <button
                          type="button"
                          className="ml-1 rounded-sm hover:bg-destructive/20 hover:text-destructive"
                          onClick={() => {
                            setSelectedStockPlaceIds((prev) => prev.filter((id) => id !== spId));
                          }}
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Date Range Filter */}
          <div className="pt-2 border-t">
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
              label={isInvoiceNoEntered ? "Date Range (Disabled)" : "Date Range"}
              className={isInvoiceNoEntered ? "opacity-50 pointer-events-none" : ""}
            />
          </div>

          {/* Ledger Search */}
          <div className="pt-2 border-t">
            <LedgerSearchInput
              selectedLedgerIds={selectedLedgerIds}
              onLedgerIdsChange={setSelectedLedgerIds}
              selectedLedgers={selectedLedgers}
              onSelectedLedgersChange={setSelectedLedgers}
              label="Party (Ledger)"
              placeholder="Search and select party..."
              groups={null}
              multiSelect={false}
            />
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2 pt-3 border-t">
            <Button
              onClick={handleSearch}
              disabled={isLoading}
              size="sm"
              className="bg-linear-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white h-9"
            >
              {isLoadingInvoices ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                  Loading...
                </>
              ) : (
                <>
                  <Search className="h-3.5 w-3.5 mr-1.5" />
                  Search Invoices
                </>
              )}
            </Button>
            <Button variant="outline" onClick={handleClear} size="sm" className="h-9">
              <X className="h-3.5 w-3.5 mr-1.5" />
              Clear Filters
            </Button>
            {hasFilters && (
              <Badge variant="secondary" className="ml-2">
                {[selectedInvType !== 0, selectedStockPlaceIds.length > 0, calculatedFromDate, calculatedToDate, billNo, invoiceNo, selectedLedgerIds.length > 0].filter(Boolean).length} filters active
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Results Table */}
      {filteredInvoices.length > 0 ? (
        <Card className="border-0 shadow-lg">
          <CardHeader className="border-b">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl">{title}</CardTitle>
                <CardDescription>
                  Showing {filteredInvoices.length} invoices • Total: {formatCurrency(totalAmount)}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-linear-to-r from-indigo-50 to-purple-50 dark:from-indigo-950/20 dark:to-purple-950/20">
                    <TableHead className="font-semibold">Bill No</TableHead>
                    <TableHead className="font-semibold">Date</TableHead>
                    <TableHead className="font-semibold">Party</TableHead>
                    <TableHead className="font-semibold">Type</TableHead>
                    <TableHead className="font-semibold">Stock Place</TableHead>
                    <TableHead className="text-right font-semibold">Amount</TableHead>
                    <TableHead className="text-right font-semibold">Paid</TableHead>
                    <TableHead className="text-right font-semibold">Balance</TableHead>
                    <TableHead className="text-center font-semibold">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedInvoices.map((invoice) => (
                    <TableRow key={invoice.invCode} className="hover:bg-muted/50">
                      <TableCell className="font-mono text-sm">{invoice.billNo}</TableCell>
                      <TableCell className="text-sm">
                        {format(new Date(invoice.billDate), "dd MMM yyyy")}
                      </TableCell>
                      <TableCell className="text-sm font-medium">{invoice.partyName}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">
                          {invoice.invType}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">{invoice.stockPlace}</TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(invoice.grandTotal)}
                      </TableCell>
                      <TableCell className="text-right text-green-600 dark:text-green-400">
                        {formatCurrency(invoice.paidAmount)}
                      </TableCell>
                      <TableCell className="text-right text-amber-600 dark:text-amber-400">
                        {formatCurrency(invoice.balanceAmount)}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge
                          variant={
                            invoice.status === "Paid"
                              ? "default"
                              : invoice.status === "Partial"
                              ? "secondary"
                              : "destructive"
                          }
                          className="text-xs"
                        >
                          {invoice.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Pagination */}
            <div className="border-t p-4">
              <TablePagination
                currentPage={currentPage}
                pageSize={pageSize}
                totalItems={filteredInvoices.length}
                onPageChange={setCurrentPage}
                onPageSizeChange={setPageSize}
                pageSizeOptions={[25, 50, 100, 200]}
              />
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="py-12 text-center">
            <Icon className="mx-auto h-12 w-12 text-muted-foreground/40" />
            <p className="mt-4 text-sm text-muted-foreground">
              {isLoadingInvoices ? "Loading invoices..." : "No invoices found. Try adjusting your filters."}
            </p>
          </CardContent>
        </Card>
      )}

      {/* AI Assistant */}
      <ModuleAIAssistant
        moduleName={title}
        moduleData={{ invoices: filteredInvoices }}
      />
    </div>
  );
}
