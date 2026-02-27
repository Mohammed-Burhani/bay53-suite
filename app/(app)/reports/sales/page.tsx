"use client";

import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { getInvoices, getParties, formatCurrency } from "@/lib/store";
import type { Invoice } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { TrendingUp, FileText, IndianRupee, Search, Calendar, Download, Printer } from "lucide-react";
import { format } from "date-fns";

type ReportType = "sales" | "customer" | "gst" | "ledger";

export default function SalesReportPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState<string>("all");
  const [reportType, setReportType] = useState<ReportType>("sales");

  const { data: invoices = [] } = useQuery({
    queryKey: ["invoices"],
    queryFn: () => getInvoices(),
  });

  const { data: parties = [] } = useQuery({
    queryKey: ["parties"],
    queryFn: () => getParties(),
  });

  const customers = parties.filter(p => p.type === "customer");

  // Filter invoices
  const filteredInvoices = useMemo(() => {
    let filtered = invoices.filter(i => i.type === "sale");

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(inv =>
        inv.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        inv.partyName.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Date filter
    if (startDate) {
      filtered = filtered.filter(inv => new Date(inv.invoiceDate) >= new Date(startDate));
    }
    if (endDate) {
      filtered = filtered.filter(inv => new Date(inv.invoiceDate) <= new Date(endDate));
    }

    // Customer filter
    if (selectedCustomer !== "all") {
      filtered = filtered.filter(inv => inv.partyId === selectedCustomer);
    }

    return filtered.sort((a, b) => 
      new Date(b.invoiceDate).getTime() - new Date(a.invoiceDate).getTime()
    );
  }, [invoices, searchQuery, startDate, endDate, selectedCustomer]);

  const totalSales = filteredInvoices.reduce((sum, i) => sum + i.grandTotal, 0);
  const totalPaid = filteredInvoices.reduce((sum, i) => sum + i.amountPaid, 0);
  const totalPending = totalSales - totalPaid;
  const totalGST = filteredInvoices.reduce((sum, i) => sum + i.totalGst, 0);

  return (
    <div className="flex flex-col gap-6 p-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Sales Reports</h1>
        <p className="text-sm text-muted-foreground">Comprehensive sales analytics and reports</p>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-l-4 border-l-emerald-500 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="rounded-xl bg-emerald-100 p-2.5 ring-1 ring-emerald-200">
              <TrendingUp className="h-5 w-5 text-emerald-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Total Sales</p>
              <p className="text-xl font-bold truncate">{formatCurrency(totalSales)}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{filteredInvoices.length} invoices</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-blue-500 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="rounded-xl bg-blue-100 p-2.5 ring-1 ring-blue-200">
              <IndianRupee className="h-5 w-5 text-blue-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Collected</p>
              <p className="text-xl font-bold truncate">{formatCurrency(totalPaid)}</p>
              <p className="text-xs text-green-600 mt-0.5 font-medium">
                {totalSales > 0 ? `${((totalPaid / totalSales) * 100).toFixed(1)}% collected` : "0%"}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-amber-500 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="rounded-xl bg-amber-100 p-2.5 ring-1 ring-amber-200">
              <FileText className="h-5 w-5 text-amber-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Pending</p>
              <p className="text-xl font-bold truncate">{formatCurrency(totalPending)}</p>
              <p className="text-xs text-amber-600 mt-0.5 font-medium">
                {totalSales > 0 ? `${((totalPending / totalSales) * 100).toFixed(1)}% pending` : "0%"}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-purple-500 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="rounded-xl bg-purple-100 p-2.5 ring-1 ring-purple-200">
              <FileText className="h-5 w-5 text-purple-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Total GST</p>
              <p className="text-xl font-bold truncate">{formatCurrency(totalGST)}</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {totalSales > 0 ? `${((totalGST / totalSales) * 100).toFixed(1)}% of sales` : "0%"}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters - Compact & Accessible */}
      <Card className="shadow-sm">
        <CardContent className="p-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <Search className="h-4 w-4" />
                Filters
              </h3>
              {(searchQuery || startDate || endDate || selectedCustomer !== "all") && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSearchQuery("");
                    setStartDate("");
                    setEndDate("");
                    setSelectedCustomer("all");
                  }}
                  className="h-7 text-xs"
                >
                  Clear All
                </Button>
              )}
            </div>
            
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <div className="space-y-1.5">
                <label htmlFor="search-input" className="text-xs font-medium text-muted-foreground">
                  Search
                </label>
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                  <Input
                    id="search-input"
                    placeholder="Invoice or customer..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-8 h-9 text-sm"
                    aria-label="Search invoices or customers"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="start-date" className="text-xs font-medium text-muted-foreground">
                  From Date
                </label>
                <div className="relative">
                  <Calendar className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
                  <Input
                    id="start-date"
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="pl-8 h-9 text-sm"
                    aria-label="Start date filter"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="end-date" className="text-xs font-medium text-muted-foreground">
                  To Date
                </label>
                <div className="relative">
                  <Calendar className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
                  <Input
                    id="end-date"
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="pl-8 h-9 text-sm"
                    aria-label="End date filter"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="customer-select" className="text-xs font-medium text-muted-foreground">
                  Customer
                </label>
                <Select value={selectedCustomer} onValueChange={setSelectedCustomer}>
                  <SelectTrigger id="customer-select" className="h-9 text-sm" aria-label="Filter by customer">
                    <SelectValue placeholder="All Customers" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Customers</SelectItem>
                    {customers.map(customer => (
                      <SelectItem key={customer.id} value={customer.id}>
                        {customer.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-center justify-between pt-1 border-t">
              <div className="flex items-center gap-2">
                <Button variant="default" size="sm" className="gap-1.5 h-8 text-xs">
                  <Download className="h-3.5 w-3.5" />
                  Export
                </Button>
                <Button variant="outline" size="sm" className="gap-1.5 h-8 text-xs" onClick={() => window.print()}>
                  <Printer className="h-3.5 w-3.5" />
                  Print
                </Button>
              </div>
              <div className="text-xs text-muted-foreground">
                <span className="font-medium text-foreground">{filteredInvoices.length}</span> of{" "}
                <span className="font-medium text-foreground">{invoices.filter(i => i.type === "sale").length}</span> invoices
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Report Tabs */}
      <Tabs value={reportType} onValueChange={(v) => setReportType(v as ReportType)} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4 h-auto p-1 bg-linear-to-r from-muted/80 to-muted/50">
          <TabsTrigger 
            value="sales" 
            className="data-[state=active]:bg-linear-to-br data-[state=active]:from-emerald-500 data-[state=active]:to-emerald-600 data-[state=active]:text-white data-[state=active]:shadow-md py-2.5 transition-all"
          >
            <FileText className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Sales Report</span>
            <span className="sm:hidden">Sales</span>
          </TabsTrigger>
          <TabsTrigger 
            value="customer" 
            className="data-[state=active]:bg-linear-to-br data-[state=active]:from-blue-500 data-[state=active]:to-blue-600 data-[state=active]:text-white data-[state=active]:shadow-md py-2.5 transition-all"
          >
            <TrendingUp className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Customer Report</span>
            <span className="sm:hidden">Customer</span>
          </TabsTrigger>
          <TabsTrigger 
            value="gst" 
            className="data-[state=active]:bg-linear-to-br data-[state=active]:from-purple-500 data-[state=active]:to-purple-600 data-[state=active]:text-white data-[state=active]:shadow-md py-2.5 transition-all"
          >
            <IndianRupee className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">GST Register</span>
            <span className="sm:hidden">GST</span>
          </TabsTrigger>
          <TabsTrigger 
            value="ledger" 
            className="data-[state=active]:bg-linear-to-br data-[state=active]:from-amber-500 data-[state=active]:to-amber-600 data-[state=active]:text-white data-[state=active]:shadow-md py-2.5 transition-all"
          >
            <FileText className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Ledger Register</span>
            <span className="sm:hidden">Ledger</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="sales" className="mt-4">
          <SalesReportTable invoices={filteredInvoices} />
        </TabsContent>

        <TabsContent value="customer" className="mt-4">
          <CustomerReportTable invoices={filteredInvoices} />
        </TabsContent>

        <TabsContent value="gst" className="mt-4">
          <GSTRegisterTable invoices={filteredInvoices} />
        </TabsContent>

        <TabsContent value="ledger" className="mt-4">
          <LedgerRegisterTable invoices={filteredInvoices} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Sales Report Table Component
function SalesReportTable({ invoices }: { invoices: Invoice[] }) {
  return (
    <Card className="shadow-sm">
      <CardHeader className="border-b bg-linear-to-r from-emerald-50 to-emerald-100/50 dark:from-emerald-950 dark:to-emerald-900/50">
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-emerald-500 flex items-center justify-center">
            <FileText className="h-4 w-4 text-white" />
          </div>
          Sales Transactions
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-linear-to-r from-muted/80 to-muted/40 hover:from-muted/80 hover:to-muted/40">
                <TableHead className="font-semibold">Date</TableHead>
                <TableHead className="font-semibold">Invoice No.</TableHead>
                <TableHead className="font-semibold">Customer</TableHead>
                <TableHead className="text-right font-semibold">Amount</TableHead>
                <TableHead className="text-right font-semibold">GST</TableHead>
                <TableHead className="text-right font-semibold">Total</TableHead>
                <TableHead className="text-right font-semibold">Paid</TableHead>
                <TableHead className="text-right font-semibold">Balance</TableHead>
                <TableHead className="font-semibold">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoices.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-12">
                    <div className="flex flex-col items-center gap-2">
                      <FileText className="h-12 w-12 text-muted-foreground/30" />
                      <p className="text-muted-foreground font-medium">No sales records found</p>
                      <p className="text-sm text-muted-foreground">Try adjusting your filters</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                invoices.map((invoice, idx) => (
                  <TableRow 
                    key={invoice.id} 
                    className={`hover:bg-emerald-50/50 dark:hover:bg-emerald-950/20 transition-colors ${
                      idx % 2 === 0 ? 'bg-background' : 'bg-muted/20'
                    }`}
                  >
                    <TableCell className="font-medium">{format(new Date(invoice.invoiceDate), "dd MMM yyyy")}</TableCell>
                    <TableCell>
                      <span className="font-mono text-sm bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 px-2 py-1 rounded">
                        {invoice.invoiceNumber}
                      </span>
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate">{invoice.partyName}</TableCell>
                    <TableCell className="text-right tabular-nums">{formatCurrency(invoice.taxableAmount)}</TableCell>
                    <TableCell className="text-right tabular-nums text-muted-foreground">{formatCurrency(invoice.totalGst)}</TableCell>
                    <TableCell className="text-right font-semibold tabular-nums">{formatCurrency(invoice.grandTotal)}</TableCell>
                    <TableCell className="text-right tabular-nums text-green-600 dark:text-green-400">{formatCurrency(invoice.amountPaid)}</TableCell>
                    <TableCell className="text-right tabular-nums">
                      <span className={invoice.grandTotal - invoice.amountPaid > 0 ? "text-amber-600 dark:text-amber-400 font-medium" : "text-muted-foreground"}>
                        {formatCurrency(invoice.grandTotal - invoice.amountPaid)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${
                        invoice.status === "paid" ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 ring-1 ring-green-600/20" :
                        invoice.status === "partial" ? "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 ring-1 ring-yellow-600/20" :
                        "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 ring-1 ring-red-600/20"
                      }`}>
                        {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                      </span>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}

// Customer Report Table Component
function CustomerReportTable({ invoices }: { invoices: Invoice[] }) {
  const customerSummary = useMemo(() => {
    const summary = new Map();
    
    invoices.forEach(inv => {
      const existing = summary.get(inv.partyId) || {
        name: inv.partyName,
        totalSales: 0,
        totalPaid: 0,
        invoiceCount: 0,
      };
      
      summary.set(inv.partyId, {
        ...existing,
        totalSales: existing.totalSales + inv.grandTotal,
        totalPaid: existing.totalPaid + inv.amountPaid,
        invoiceCount: existing.invoiceCount + 1,
      });
    });
    
    return Array.from(summary.values()).sort((a, b) => b.totalSales - a.totalSales);
  }, [invoices]);

  return (
    <Card className="shadow-sm">
      <CardHeader className="border-b bg-linear-to-r from-blue-50 to-blue-100/50 dark:from-blue-950 dark:to-blue-900/50">
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-blue-500 flex items-center justify-center">
            <TrendingUp className="h-4 w-4 text-white" />
          </div>
          Customer-wise Sales Summary
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-linear-to-r from-muted/80 to-muted/40 hover:from-muted/80 hover:to-muted/40">
                <TableHead className="font-semibold">Customer Name</TableHead>
                <TableHead className="text-right font-semibold">Total Invoices</TableHead>
                <TableHead className="text-right font-semibold">Total Sales</TableHead>
                <TableHead className="text-right font-semibold">Amount Paid</TableHead>
                <TableHead className="text-right font-semibold">Outstanding</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {customerSummary.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-12">
                    <div className="flex flex-col items-center gap-2">
                      <TrendingUp className="h-12 w-12 text-muted-foreground/30" />
                      <p className="text-muted-foreground font-medium">No customer data found</p>
                      <p className="text-sm text-muted-foreground">Try adjusting your filters</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                customerSummary.map((customer, idx) => (
                  <TableRow 
                    key={idx} 
                    className={`hover:bg-blue-50/50 dark:hover:bg-blue-950/20 transition-colors ${
                      idx % 2 === 0 ? 'bg-background' : 'bg-muted/20'
                    }`}
                  >
                    <TableCell className="font-medium">{customer.name}</TableCell>
                    <TableCell className="text-right">
                      <span className="inline-flex items-center justify-center min-w-[2rem] h-7 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-semibold text-sm px-2">
                        {customer.invoiceCount}
                      </span>
                    </TableCell>
                    <TableCell className="text-right font-semibold tabular-nums">{formatCurrency(customer.totalSales)}</TableCell>
                    <TableCell className="text-right tabular-nums text-green-600 dark:text-green-400">{formatCurrency(customer.totalPaid)}</TableCell>
                    <TableCell className="text-right tabular-nums">
                      <span className={customer.totalSales - customer.totalPaid > 0 ? "font-semibold text-amber-600 dark:text-amber-400" : "text-muted-foreground"}>
                        {formatCurrency(customer.totalSales - customer.totalPaid)}
                      </span>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}

// GST Register Table Component
function GSTRegisterTable({ invoices }: { invoices: Invoice[] }) {
  return (
    <Card className="shadow-sm">
      <CardHeader className="border-b bg-linear-to-r from-purple-50 to-purple-100/50 dark:from-purple-950 dark:to-purple-900/50">
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-purple-500 flex items-center justify-center">
            <IndianRupee className="h-4 w-4 text-white" />
          </div>
          GST Register
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-linear-to-r from-muted/80 to-muted/40 hover:from-muted/80 hover:to-muted/40">
                <TableHead className="font-semibold">Date</TableHead>
                <TableHead className="font-semibold">Invoice No.</TableHead>
                <TableHead className="font-semibold">Customer</TableHead>
                <TableHead className="font-semibold">GSTIN</TableHead>
                <TableHead className="text-right font-semibold">Taxable Value</TableHead>
                <TableHead className="text-right font-semibold">CGST</TableHead>
                <TableHead className="text-right font-semibold">SGST</TableHead>
                <TableHead className="text-right font-semibold">IGST</TableHead>
                <TableHead className="text-right font-semibold">Total GST</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoices.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-12">
                    <div className="flex flex-col items-center gap-2">
                      <IndianRupee className="h-12 w-12 text-muted-foreground/30" />
                      <p className="text-muted-foreground font-medium">No GST records found</p>
                      <p className="text-sm text-muted-foreground">Try adjusting your filters</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                <>
                  {invoices.map((invoice, idx) => (
                    <TableRow 
                      key={invoice.id} 
                      className={`hover:bg-purple-50/50 dark:hover:bg-purple-950/20 transition-colors ${
                        idx % 2 === 0 ? 'bg-background' : 'bg-muted/20'
                      }`}
                    >
                      <TableCell className="font-medium">{format(new Date(invoice.invoiceDate), "dd MMM yyyy")}</TableCell>
                      <TableCell>
                        <span className="font-mono text-sm bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 px-2 py-1 rounded">
                          {invoice.invoiceNumber}
                        </span>
                      </TableCell>
                      <TableCell className="max-w-[180px] truncate">{invoice.partyName}</TableCell>
                      <TableCell>
                        <span className="text-xs font-mono bg-muted px-2 py-1 rounded">
                          {invoice.partyGstin || "N/A"}
                        </span>
                      </TableCell>
                      <TableCell className="text-right tabular-nums">{formatCurrency(invoice.taxableAmount)}</TableCell>
                      <TableCell className="text-right tabular-nums text-blue-600 dark:text-blue-400">{formatCurrency(invoice.cgst)}</TableCell>
                      <TableCell className="text-right tabular-nums text-blue-600 dark:text-blue-400">{formatCurrency(invoice.sgst)}</TableCell>
                      <TableCell className="text-right tabular-nums text-purple-600 dark:text-purple-400">{formatCurrency(invoice.igst)}</TableCell>
                      <TableCell className="text-right font-semibold tabular-nums">{formatCurrency(invoice.totalGst)}</TableCell>
                    </TableRow>
                  ))}
                  <TableRow className="bg-linear-to-r from-purple-100 to-purple-50 dark:from-purple-900/30 dark:to-purple-950/20 font-semibold border-t-2 border-purple-200 dark:border-purple-800">
                    <TableCell colSpan={4} className="text-right">Total</TableCell>
                    <TableCell className="text-right tabular-nums">{formatCurrency(invoices.reduce((s, i) => s + i.taxableAmount, 0))}</TableCell>
                    <TableCell className="text-right tabular-nums text-blue-600 dark:text-blue-400">{formatCurrency(invoices.reduce((s, i) => s + i.cgst, 0))}</TableCell>
                    <TableCell className="text-right tabular-nums text-blue-600 dark:text-blue-400">{formatCurrency(invoices.reduce((s, i) => s + i.sgst, 0))}</TableCell>
                    <TableCell className="text-right tabular-nums text-purple-600 dark:text-purple-400">{formatCurrency(invoices.reduce((s, i) => s + i.igst, 0))}</TableCell>
                    <TableCell className="text-right tabular-nums">{formatCurrency(invoices.reduce((s, i) => s + i.totalGst, 0))}</TableCell>
                  </TableRow>
                </>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}

// Ledger Register Table Component
function LedgerRegisterTable({ invoices }: { invoices: Invoice[] }) {
  const ledgerEntries = useMemo(() => {
    return invoices.map(inv => ({
      ...inv,
      debit: inv.grandTotal,
      credit: inv.amountPaid,
      balance: inv.grandTotal - inv.amountPaid,
    }));
  }, [invoices]);

  const runningBalance = ledgerEntries.reduce((acc, entry) => acc + entry.balance, 0);

  return (
    <Card className="shadow-sm">
      <CardHeader className="border-b bg-linear-to-r from-amber-50 to-amber-100/50 dark:from-amber-950 dark:to-amber-900/50">
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-amber-500 flex items-center justify-center">
            <FileText className="h-4 w-4 text-white" />
          </div>
          Sales Ledger Register
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-linear-to-r from-muted/80 to-muted/40 hover:from-muted/80 hover:to-muted/40">
                <TableHead className="font-semibold">Date</TableHead>
                <TableHead className="font-semibold">Particulars</TableHead>
                <TableHead className="font-semibold">Invoice No.</TableHead>
                <TableHead className="text-right font-semibold">Debit</TableHead>
                <TableHead className="text-right font-semibold">Credit</TableHead>
                <TableHead className="text-right font-semibold">Balance</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {ledgerEntries.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12">
                    <div className="flex flex-col items-center gap-2">
                      <FileText className="h-12 w-12 text-muted-foreground/30" />
                      <p className="text-muted-foreground font-medium">No ledger entries found</p>
                      <p className="text-sm text-muted-foreground">Try adjusting your filters</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                <>
                  {ledgerEntries.map((entry, idx) => (
                    <TableRow 
                      key={entry.id} 
                      className={`hover:bg-amber-50/50 dark:hover:bg-amber-950/20 transition-colors ${
                        idx % 2 === 0 ? 'bg-background' : 'bg-muted/20'
                      }`}
                    >
                      <TableCell className="font-medium">{format(new Date(entry.invoiceDate), "dd MMM yyyy")}</TableCell>
                      <TableCell className="max-w-[200px] truncate">{entry.partyName}</TableCell>
                      <TableCell>
                        <span className="font-mono text-sm bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 px-2 py-1 rounded">
                          {entry.invoiceNumber}
                        </span>
                      </TableCell>
                      <TableCell className="text-right tabular-nums text-red-600 dark:text-red-400">{formatCurrency(entry.debit)}</TableCell>
                      <TableCell className="text-right tabular-nums text-green-600 dark:text-green-400">{formatCurrency(entry.credit)}</TableCell>
                      <TableCell className="text-right font-semibold tabular-nums">
                        <span className={entry.balance > 0 ? "text-amber-600 dark:text-amber-400" : "text-muted-foreground"}>
                          {formatCurrency(entry.balance)}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                  <TableRow className="bg-linear-to-r from-amber-100 to-amber-50 dark:from-amber-900/30 dark:to-amber-950/20 font-semibold border-t-2 border-amber-200 dark:border-amber-800">
                    <TableCell colSpan={3} className="text-right">Total Outstanding</TableCell>
                    <TableCell className="text-right tabular-nums text-red-600 dark:text-red-400">{formatCurrency(ledgerEntries.reduce((s, e) => s + e.debit, 0))}</TableCell>
                    <TableCell className="text-right tabular-nums text-green-600 dark:text-green-400">{formatCurrency(ledgerEntries.reduce((s, e) => s + e.credit, 0))}</TableCell>
                    <TableCell className="text-right tabular-nums">
                      <span className={runningBalance > 0 ? "text-amber-600 dark:text-amber-400" : "text-muted-foreground"}>
                        {formatCurrency(runningBalance)}
                      </span>
                    </TableCell>
                  </TableRow>
                </>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
