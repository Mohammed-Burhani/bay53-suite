"use client";

import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { getInvoices, getParties, formatCurrency } from "@/lib/store";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TrendingUp, FileText, IndianRupee } from "lucide-react";
import { ReportFilters } from "@/components/reports/ReportFilters";
import { SalesReportTable } from "@/components/reports/SalesReportTable";
import { CustomerReportTable } from "@/components/reports/CustomerReportTable";
import { GSTRegisterTable } from "@/components/reports/GSTRegisterTable";
import { LedgerRegisterTable } from "@/components/reports/LedgerRegisterTable";
import { ReceivablesReportTable } from "@/components/reports/ReceivablesReportTable";

type ReportType = "sales" | "customer" | "gst" | "ledger" | "receivables";

const TAB_CONFIG = [
  {
    value: "sales",
    label: "Sales Report",
    shortLabel: "Sales",
    icon: FileText,
    gradient: "data-[state=active]:bg-linear-to-br data-[state=active]:from-emerald-500 data-[state=active]:to-emerald-600",
  },
  {
    value: "receivables",
    label: "Receivables",
    shortLabel: "Receivables",
    icon: IndianRupee,
    gradient: "data-[state=active]:bg-linear-to-br data-[state=active]:from-orange-500 data-[state=active]:to-orange-600",
  },
  {
    value: "customer",
    label: "Customer Report",
    shortLabel: "Customer",
    icon: TrendingUp,
    gradient: "data-[state=active]:bg-linear-to-br data-[state=active]:from-blue-500 data-[state=active]:to-blue-600",
  },
  {
    value: "gst",
    label: "GST Register",
    shortLabel: "GST",
    icon: IndianRupee,
    gradient: "data-[state=active]:bg-linear-to-br data-[state=active]:from-purple-500 data-[state=active]:to-purple-600",
  },
  {
    value: "ledger",
    label: "Ledger Register",
    shortLabel: "Ledger",
    icon: FileText,
    gradient: "data-[state=active]:bg-linear-to-br data-[state=active]:from-amber-500 data-[state=active]:to-amber-600",
  },
];

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

  const customers = parties.filter((p) => p.type === "customer");

  // Filter invoices
  const filteredInvoices = useMemo(() => {
    let filtered = invoices.filter((i) => i.type === "sale");

    if (searchQuery) {
      filtered = filtered.filter(
        (inv) =>
          inv.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
          inv.partyName.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (startDate) {
      filtered = filtered.filter((inv) => new Date(inv.invoiceDate) >= new Date(startDate));
    }
    if (endDate) {
      filtered = filtered.filter((inv) => new Date(inv.invoiceDate) <= new Date(endDate));
    }

    if (selectedCustomer !== "all") {
      filtered = filtered.filter((inv) => inv.partyId === selectedCustomer);
    }

    return filtered.sort((a, b) => new Date(b.invoiceDate).getTime() - new Date(a.invoiceDate).getTime());
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

      {/* Filters */}
      <ReportFilters
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        startDate={startDate}
        setStartDate={setStartDate}
        endDate={endDate}
        setEndDate={setEndDate}
        selectedCustomer={selectedCustomer}
        setSelectedCustomer={setSelectedCustomer}
        customers={customers}
        filteredCount={filteredInvoices.length}
        totalCount={invoices.filter((i) => i.type === "sale").length}
      />

      {/* Report Tabs */}
      <Tabs value={reportType} onValueChange={(v) => setReportType(v as ReportType)} className="space-y-4">
        <div className="w-full overflow-x-auto">
          <TabsList className="inline-flex w-full md:grid md:grid-cols-5 h-auto p-1 bg-linear-to-r from-muted/80 to-muted/50 min-w-max md:min-w-0">
            {TAB_CONFIG.map((tab) => {
              const Icon = tab.icon;
              return (
                <TabsTrigger
                  key={tab.value}
                  value={tab.value}
                  className={`${tab.gradient} data-[state=active]:text-white data-[state=active]:shadow-md py-2.5 px-4 transition-all whitespace-nowrap`}
                >
                  <Icon className="h-4 w-4 mr-2" />
                  <span className="hidden sm:inline">{tab.label}</span>
                  <span className="sm:hidden">{tab.shortLabel}</span>
                </TabsTrigger>
              );
            })}
          </TabsList>
        </div>

        <TabsContent value="sales" className="mt-4">
          <SalesReportTable invoices={filteredInvoices} />
        </TabsContent>

        <TabsContent value="receivables" className="mt-4">
          <ReceivablesReportTable invoices={filteredInvoices} />
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
