"use client";

import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { getInvoices, getParties, formatCurrency } from "@/lib/store";
import { Card, CardContent } from "@/components/ui/card";
import { FileText, TrendingUp, CheckCircle, XCircle } from "lucide-react";
import { ReportFilters } from "@/components/reports/ReportFilters";
import { QuotationsReportTable } from "@/components/reports/QuotationsReportTable";

export default function QuotationsReportPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState<string>("all");

  const { data: invoices = [] } = useQuery({
    queryKey: ["invoices"],
    queryFn: () => getInvoices(),
  });

  const { data: parties = [] } = useQuery({
    queryKey: ["parties"],
    queryFn: () => getParties(),
  });

  const customers = parties.filter((p) => p.type === "customer");

  // Filter quotations
  const filteredQuotations = useMemo(() => {
    let filtered = invoices.filter((i) => i.type === "quotation" || i.type === "proforma");

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

  const totalQuotations = filteredQuotations.length;
  const totalValue = filteredQuotations.reduce((sum, i) => sum + i.grandTotal, 0);
  const convertedQuotations = filteredQuotations.filter(
    (q) => q.status === "paid" || q.status === "partial"
  ).length;
  const pendingQuotations = filteredQuotations.filter(
    (q) => q.status === "unpaid" || q.status === "draft"
  ).length;
  const conversionRate = totalQuotations > 0 ? (convertedQuotations / totalQuotations) * 100 : 0;

  return (
    <div className="flex flex-col gap-6 p-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Quotations & Estimates</h1>
        <p className="text-sm text-muted-foreground">Track and manage your quotations and estimates</p>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-l-4 border-l-cyan-500 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="rounded-xl bg-cyan-100 p-2.5 ring-1 ring-cyan-200">
              <FileText className="h-5 w-5 text-cyan-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
                Total Quotations
              </p>
              <p className="text-xl font-bold truncate">{totalQuotations}</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {formatCurrency(totalValue)} value
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="rounded-xl bg-green-100 p-2.5 ring-1 ring-green-200">
              <CheckCircle className="h-5 w-5 text-green-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
                Converted
              </p>
              <p className="text-xl font-bold truncate">{convertedQuotations}</p>
              <p className="text-xs text-green-600 mt-0.5 font-medium">
                {conversionRate.toFixed(1)}% conversion rate
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-amber-500 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="rounded-xl bg-amber-100 p-2.5 ring-1 ring-amber-200">
              <TrendingUp className="h-5 w-5 text-amber-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
                Pending
              </p>
              <p className="text-xl font-bold truncate">{pendingQuotations}</p>
              <p className="text-xs text-muted-foreground mt-0.5">Awaiting response</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-red-500 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="rounded-xl bg-red-100 p-2.5 ring-1 ring-red-200">
              <XCircle className="h-5 w-5 text-red-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
                Cancelled
              </p>
              <p className="text-xl font-bold truncate">
                {filteredQuotations.filter((q) => q.status === "cancelled").length}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">Lost opportunities</p>
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
        filteredCount={filteredQuotations.length}
        totalCount={invoices.filter((i) => i.type === "quotation" || i.type === "proforma").length}
      />

      {/* Quotations Table */}
      <QuotationsReportTable invoices={filteredQuotations} />
    </div>
  );
}
