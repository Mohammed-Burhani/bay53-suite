"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { getInvoices, formatCurrency } from "@/lib/store";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import {
  ArrowLeft,
  Search,
  Filter,
  FileText,
  Printer,
  Download,
  Eye,
  Calendar,
  Receipt,
  CreditCard,
  Smartphone,
  Banknote,
  Building2,
} from "lucide-react";
import { format } from "date-fns";

export default function POSHistoryPage() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [dateFilter, setDateFilter] = useState<"all" | "today" | "week" | "month">("all");
  const [paymentFilter, setPaymentFilter] = useState<string>("all");
  const [selectedInvoice, setSelectedInvoice] = useState<any | null>(null);

  const { data: invoices = [] } = useQuery({
    queryKey: ["invoices"],
    queryFn: getInvoices,
  });

  const posInvoices = useMemo(() => {
    return invoices
      .filter((inv) => inv.type === "sale" && inv.status === "paid")
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [invoices]);

  const filteredInvoices = useMemo(() => {
    return posInvoices.filter((inv) => {
      // Search filter
      const matchesSearch =
        search === "" ||
        inv.partyName.toLowerCase().includes(search.toLowerCase()) ||
        inv.id?.toString().includes(search);

      // Date filter
      const invDate = new Date(inv.date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const weekAgo = new Date(today);
      weekAgo.setDate(weekAgo.getDate() - 7);
      const monthAgo = new Date(today);
      monthAgo.setMonth(monthAgo.getMonth() - 1);

      let matchesDate = true;
      if (dateFilter === "today") {
        matchesDate = invDate >= today;
      } else if (dateFilter === "week") {
        matchesDate = invDate >= weekAgo;
      } else if (dateFilter === "month") {
        matchesDate = invDate >= monthAgo;
      }

      // Payment filter
      const matchesPayment =
        paymentFilter === "all" || inv.paymentMode === paymentFilter;

      return matchesSearch && matchesDate && matchesPayment;
    });
  }, [posInvoices, search, dateFilter, paymentFilter]);

  const stats = useMemo(() => {
    const total = filteredInvoices.reduce((sum, inv) => sum + inv.grandTotal, 0);
    const count = filteredInvoices.length;
    const avgTransaction = count > 0 ? total / count : 0;

    const byPayment = filteredInvoices.reduce((acc, inv) => {
      acc[inv.paymentMode] = (acc[inv.paymentMode] || 0) + inv.grandTotal;
      return acc;
    }, {} as Record<string, number>);

    return { total, count, avgTransaction, byPayment };
  }, [filteredInvoices]);

  const getPaymentIcon = (mode: string) => {
    switch (mode) {
      case "cash":
        return Banknote;
      case "upi":
        return Smartphone;
      case "card":
        return CreditCard;
      case "bank_transfer":
        return Building2;
      default:
        return CreditCard;
    }
  };

  const handlePrint = (invoice: any) => {
    // Placeholder for print functionality
    alert("Print functionality - integrate with your print service");
  };

  const handleExport = () => {
    // Export to CSV
    const headers = ["Date", "Invoice ID", "Customer", "Items", "Amount", "Payment Mode"];
    const rows = filteredInvoices.map((inv) => [
      format(new Date(inv.date), "yyyy-MM-dd HH:mm"),
      inv.id || "N/A",
      inv.partyName,
      inv.items.length,
      inv.grandTotal.toFixed(2),
      inv.paymentMode,
    ]);

    const csv = [headers, ...rows].map((row) => row.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `pos-history-${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex h-screen flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border px-6 py-3">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
              <Receipt className="h-4 w-4 text-primary" />
            </div>
            <h1 className="text-lg font-semibold">POS History</h1>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={handleExport} className="gap-2">
          <Download className="h-4 w-4" />
          Export CSV
        </Button>
      </div>

      <div className="flex-1 overflow-auto p-6 space-y-6">
        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground">Total Sales</p>
                <p className="text-2xl font-semibold mt-1">{formatCurrency(stats.total)}</p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10">
                <FileText className="h-5 w-5 text-emerald-600" />
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground">Transactions</p>
                <p className="text-2xl font-semibold mt-1">{stats.count}</p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10">
                <Receipt className="h-5 w-5 text-blue-600" />
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground">Avg. Transaction</p>
                <p className="text-2xl font-semibold mt-1">{formatCurrency(stats.avgTransaction)}</p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-500/10">
                <CreditCard className="h-5 w-5 text-violet-600" />
              </div>
            </div>
          </Card>
        </div>

        {/* Filters */}
        <Card className="p-4">
          <div className="flex flex-col gap-4 md:flex-row md:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by customer or invoice ID..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="flex gap-2">
              <Select value={dateFilter} onValueChange={(v: any) => setDateFilter(v)}>
                <SelectTrigger className="w-[140px]">
                  <Calendar className="h-4 w-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Time</SelectItem>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="week">Last 7 Days</SelectItem>
                  <SelectItem value="month">Last Month</SelectItem>
                </SelectContent>
              </Select>
              <Select value={paymentFilter} onValueChange={setPaymentFilter}>
                <SelectTrigger className="w-[140px]">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Payments</SelectItem>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="upi">UPI</SelectItem>
                  <SelectItem value="card">Card</SelectItem>
                  <SelectItem value="bank_transfer">Bank</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </Card>

        {/* Table */}
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[140px]">Date & Time</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead className="text-center">Items</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead className="text-center">Payment</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredInvoices.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-32 text-center">
                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                      <Receipt className="h-8 w-8 opacity-30" />
                      <p className="text-sm">No transactions found</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredInvoices.map((invoice) => {
                  const PaymentIcon = getPaymentIcon(invoice.paymentMode);
                  return (
                    <TableRow key={invoice.id} className="group">
                      <TableCell className="font-medium text-xs">
                        {format(new Date(invoice.date), "MMM dd, yyyy")}
                        <br />
                        <span className="text-muted-foreground">
                          {format(new Date(invoice.date), "hh:mm a")}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="text-sm font-medium">{invoice.partyName}</p>
                          {invoice.id && (
                            <p className="text-xs text-muted-foreground">#{invoice.id}</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="secondary" className="text-xs">
                          {invoice.items.length}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-semibold">
                        {formatCurrency(invoice.grandTotal)}
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <PaymentIcon className="h-3.5 w-3.5 text-muted-foreground" />
                          <span className="text-xs capitalize">{invoice.paymentMode.replace("_", " ")}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => setSelectedInvoice(invoice)}
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => handlePrint(invoice)}
                          >
                            <Printer className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </Card>
      </div>

      {/* Invoice Detail Dialog */}
      <Dialog open={!!selectedInvoice} onOpenChange={() => setSelectedInvoice(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Receipt className="h-5 w-5" />
              Invoice Details
            </DialogTitle>
            <DialogDescription>
              {selectedInvoice && format(new Date(selectedInvoice.date), "MMMM dd, yyyy 'at' hh:mm a")}
            </DialogDescription>
          </DialogHeader>

          {selectedInvoice && (
            <div className="space-y-4">
              {/* Customer Info */}
              <Card className="p-4">
                <div className="grid gap-3 md:grid-cols-2">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">Customer</p>
                    <p className="text-sm font-medium mt-1">{selectedInvoice.partyName}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">Payment Method</p>
                    <p className="text-sm font-medium mt-1 capitalize">
                      {selectedInvoice.paymentMode.replace("_", " ")}
                    </p>
                  </div>
                </div>
              </Card>

              {/* Items */}
              <div>
                <p className="text-sm font-medium mb-2">Items</p>
                <Card className="divide-y">
                  {selectedInvoice.items.map((item: any, idx: number) => (
                    <div key={idx} className="p-3 flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{item.productName}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {formatCurrency(item.price)} × {item.quantity} {item.unit}
                          {item.discount > 0 && (
                            <span className="text-emerald-600"> (- {formatCurrency(item.discount)})</span>
                          )}
                        </p>
                      </div>
                      <p className="text-sm font-semibold whitespace-nowrap ml-4">
                        {formatCurrency(item.total)}
                      </p>
                    </div>
                  ))}
                </Card>
              </div>

              {/* Totals */}
              <Card className="p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>{formatCurrency(selectedInvoice.subtotal)}</span>
                </div>
                {selectedInvoice.totalDiscount > 0 && (
                  <div className="flex justify-between text-sm text-emerald-600">
                    <span>Discount</span>
                    <span>-{formatCurrency(selectedInvoice.totalDiscount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">GST</span>
                  <span>+{formatCurrency(selectedInvoice.totalGst)}</span>
                </div>
                <Separator />
                <div className="flex justify-between text-base font-semibold">
                  <span>Total</span>
                  <span>{formatCurrency(selectedInvoice.grandTotal)}</span>
                </div>
              </Card>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1 gap-2"
                  onClick={() => handlePrint(selectedInvoice)}
                >
                  <Printer className="h-4 w-4" />
                  Print
                </Button>
                <Button variant="outline" className="flex-1 gap-2">
                  <Download className="h-4 w-4" />
                  Download PDF
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
