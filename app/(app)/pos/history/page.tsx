"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { getInvoices, formatCurrency } from "@/lib/store";
import type { Invoice } from "@/lib/types";
import { useTenant } from "@/lib/contexts/TenantContext";
import {
  posService,
  type POSTransaction,
  type POSTransactionItem,
} from "@/lib/services/pos.service";
import {
  printReceiptDeferred,
  downloadReceiptPdf,
  type ReceiptData,
} from "@/lib/utils/pos-print";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
  RefreshCw,
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { ContextMenu, ContextMenuItem } from "@/components/ui/context-menu";

const USE_SUPABASE = !!process.env.NEXT_PUBLIC_POS_SUPABASE_URL;

interface HistoryRow {
  id: string;
  number: string;
  dateISO: string;
  customerName: string;
  grandTotal: number;
  paymentMode: string;
  itemCount?: number;
  source: "supabase" | "zustand";
}

export default function POSHistoryPage() {
  const router = useRouter();
  const { tenantId, tenantName } = useTenant();
  const [search, setSearch] = useState("");
  const [dateFilter, setDateFilter] = useState<"all" | "today" | "week" | "month">("all");
  const [paymentFilter, setPaymentFilter] = useState<string>("all");
  const [selected, setSelected] = useState<ReceiptData | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const storeName = tenantName || "My Store";

  // --- Data sources ---------------------------------------------------------
  const {
    data: supaTx = [],
    isLoading: supaLoading,
    isFetching: supaFetching,
    refetch: refetchSupa,
  } = useQuery({
    queryKey: ["pos-transactions", tenantId, "history"],
    queryFn: () => posService.getTransactions(tenantId, { status: "completed", limit: 500 }),
    enabled: USE_SUPABASE,
    // Always pull the freshest list so a bill saved moments ago on the POS
    // screen reliably appears here.
    staleTime: 0,
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
  });

  const {
    data: zustandInvoices = [],
    isLoading: zustandLoading,
    isFetching: zustandFetching,
    refetch: refetchZustand,
  } = useQuery({
    queryKey: ["invoices"],
    queryFn: () => getInvoices(),
    enabled: !USE_SUPABASE,
  });

  const isLoading = USE_SUPABASE ? supaLoading : zustandLoading;
  const isFetching = USE_SUPABASE ? supaFetching : zustandFetching;
  const refetch = USE_SUPABASE ? refetchSupa : refetchZustand;

  // --- Normalize to rows ----------------------------------------------------
  const rows = useMemo<HistoryRow[]>(() => {
    const list: HistoryRow[] = USE_SUPABASE
      ? supaTx.map((t) => ({
          id: t.id,
          number: t.transaction_number,
          dateISO: t.transaction_date,
          customerName: t.customer_name,
          grandTotal: Number(t.grand_total),
          paymentMode: t.payment_mode,
          source: "supabase" as const,
        }))
      : zustandInvoices
          .filter((inv) => inv.type === "sale" && inv.status === "paid")
          .map((inv) => ({
            id: inv.id,
            number: inv.invoiceNumber || inv.id,
            dateISO: inv.date,
            customerName: inv.partyName,
            grandTotal: inv.grandTotal,
            paymentMode: inv.paymentMode,
            itemCount: inv.items.length,
            source: "zustand" as const,
          }));
    return list.sort((a, b) => new Date(b.dateISO).getTime() - new Date(a.dateISO).getTime());
  }, [supaTx, zustandInvoices]);

  const filteredRows = useMemo(() => {
    return rows.filter((row) => {
      const matchesSearch =
        search === "" ||
        row.customerName.toLowerCase().includes(search.toLowerCase()) ||
        row.number.toLowerCase().includes(search.toLowerCase());

      const rowDate = new Date(row.dateISO);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const weekAgo = new Date(today);
      weekAgo.setDate(weekAgo.getDate() - 7);
      const monthAgo = new Date(today);
      monthAgo.setMonth(monthAgo.getMonth() - 1);

      let matchesDate = true;
      if (dateFilter === "today") matchesDate = rowDate >= today;
      else if (dateFilter === "week") matchesDate = rowDate >= weekAgo;
      else if (dateFilter === "month") matchesDate = rowDate >= monthAgo;

      const matchesPayment = paymentFilter === "all" || row.paymentMode === paymentFilter;

      return matchesSearch && matchesDate && matchesPayment;
    });
  }, [rows, search, dateFilter, paymentFilter]);

  const stats = useMemo(() => {
    const total = filteredRows.reduce((sum, r) => sum + r.grandTotal, 0);
    const count = filteredRows.length;
    const avgTransaction = count > 0 ? total / count : 0;
    return { total, count, avgTransaction };
  }, [filteredRows]);

  // --- Receipt builders -----------------------------------------------------
  const invoiceToReceipt = (inv: Invoice): ReceiptData => ({
    storeName,
    invoiceNumber: inv.invoiceNumber || inv.id,
    dateISO: inv.date,
    customerName: inv.partyName,
    customerGstin: inv.partyGstin,
    paymentMode: inv.paymentMode,
    items: inv.items.map((it) => ({
      name: it.productName,
      quantity: it.quantity,
      unit: it.unit,
      price: it.price,
      discount: it.discount,
      gstRate: it.gstRate,
      total: it.total,
    })),
    subtotal: inv.subtotal,
    totalDiscount: inv.totalDiscount,
    taxableAmount: inv.taxableAmount,
    cgst: inv.cgst,
    sgst: inv.sgst,
    igst: inv.igst,
    totalGst: inv.totalGst,
    grandTotal: inv.grandTotal,
    amountPaid: inv.amountPaid,
  });

  const supabaseToReceipt = (t: POSTransaction, items: POSTransactionItem[]): ReceiptData => ({
    storeName,
    invoiceNumber: t.transaction_number,
    dateISO: t.transaction_date,
    customerName: t.customer_name,
    paymentMode: t.payment_mode,
    items: items.map((it) => ({
      name: it.product_name,
      sku: it.product_sku,
      quantity: it.quantity,
      unit: it.unit,
      price: Number(it.unit_price),
      discount: Number(it.discount),
      gstRate: Number(it.gst_rate),
      total: Number(it.total),
    })),
    subtotal: Number(t.subtotal),
    totalDiscount: Number(t.total_discount),
    taxableAmount: Number(t.taxable_amount),
    cgst: Number(t.cgst),
    sgst: Number(t.sgst),
    igst: Number(t.igst),
    totalGst: Number(t.total_gst),
    grandTotal: Number(t.grand_total),
    amountPaid: Number(t.amount_paid),
  });

  const resolveReceipt = async (row: HistoryRow): Promise<ReceiptData | null> => {
    if (row.source === "zustand") {
      const inv = zustandInvoices.find((i) => i.id === row.id);
      return inv ? invoiceToReceipt(inv) : null;
    }
    const detail = await posService.getTransactionById(row.id);
    return detail ? supabaseToReceipt(detail.transaction, detail.items) : null;
  };

  // --- Actions --------------------------------------------------------------
  const handleView = async (row: HistoryRow) => {
    setBusyId(row.id);
    try {
      const receipt = await resolveReceipt(row);
      if (receipt) setSelected(receipt);
      else toast.error("Could not load this bill.");
    } catch (e) {
      toast.error(`Could not load bill: ${(e as Error).message}`);
    } finally {
      setBusyId(null);
    }
  };

  const handlePrint = (row: HistoryRow) => {
    // Window opens synchronously inside the click; filled once data resolves.
    void printReceiptDeferred(() => resolveReceipt(row)).then((ok) => {
      if (!ok) toast.error("Couldn't open the print window. Allow pop-ups, or use View → Print.");
    });
  };

  const handleDownload = async (row: HistoryRow) => {
    setBusyId(row.id);
    try {
      const receipt = await resolveReceipt(row);
      if (!receipt) {
        toast.error("Could not load this bill.");
        return;
      }
      await downloadReceiptPdf(receipt);
      toast.success(`Downloaded receipt ${receipt.invoiceNumber} (PDF).`);
    } catch (e) {
      toast.error(`Could not generate PDF: ${(e as Error).message}`);
    } finally {
      setBusyId(null);
    }
  };

  const printSelected = () => {
    if (!selected) return;
    void printReceiptDeferred(async () => selected).then((ok) => {
      if (!ok) toast.error("Couldn't open the print window. Please allow pop-ups for this site.");
    });
  };

  const downloadSelected = async () => {
    if (!selected) return;
    try {
      await downloadReceiptPdf(selected);
      toast.success(`Downloaded receipt ${selected.invoiceNumber} (PDF).`);
    } catch (e) {
      toast.error(`Could not generate PDF: ${(e as Error).message}`);
    }
  };

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

  const getContextMenuItems = (row: HistoryRow): ContextMenuItem[] => [
    { label: "View Details", icon: Eye, onClick: () => handleView(row) },
    { label: "Print Receipt", icon: Printer, onClick: () => handlePrint(row) },
    { label: "Download PDF", icon: Download, onClick: () => void handleDownload(row) },
  ];

  const handleExport = () => {
    const headers = ["Date", "Bill No", "Customer", "Amount", "Payment Mode"];
    const csvRows = filteredRows.map((row) => [
      format(new Date(row.dateISO), "yyyy-MM-dd HH:mm"),
      row.number,
      row.customerName,
      row.grandTotal.toFixed(2),
      row.paymentMode,
    ]);
    const csv = [headers, ...csvRows]
      .map((r) => r.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
      .join("\n");
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
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => void refetch()}
            disabled={isFetching}
            className="gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button variant="outline" size="sm" onClick={handleExport} className="gap-2">
            <Download className="h-4 w-4" />
            Export CSV
          </Button>
        </div>
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
                placeholder="Search by customer or bill number..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="flex gap-2">
              <Select value={dateFilter} onValueChange={(v: "all" | "today" | "week" | "month") => setDateFilter(v)}>
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
                <TableHead className="w-[150px]">Date &amp; Time</TableHead>
                <TableHead>Bill / Customer</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead className="text-center">Payment</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-32 text-center text-muted-foreground">
                    Loading transactions…
                  </TableCell>
                </TableRow>
              ) : filteredRows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-32 text-center">
                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                      <Receipt className="h-8 w-8 opacity-30" />
                      <p className="text-sm">No transactions found</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredRows.map((row) => {
                  const PaymentIcon = getPaymentIcon(row.paymentMode);
                  return (
                    <ContextMenu key={row.id} items={getContextMenuItems(row)}>
                      <TableRow className="group cursor-context-menu">
                        <TableCell className="font-medium text-xs">
                          {format(new Date(row.dateISO), "MMM dd, yyyy")}
                          <br />
                          <span className="text-muted-foreground">
                            {format(new Date(row.dateISO), "hh:mm a")}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="text-sm font-medium">{row.customerName}</p>
                            <p className="text-xs text-muted-foreground font-mono">{row.number}</p>
                          </div>
                        </TableCell>
                        <TableCell className="text-right font-semibold">
                          {formatCurrency(row.grandTotal)}
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <PaymentIcon className="h-3.5 w-3.5 text-muted-foreground" />
                            <span className="text-xs capitalize">{row.paymentMode.replace("_", " ")}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              title="View details"
                              disabled={busyId === row.id}
                              onClick={(e) => {
                                e.stopPropagation();
                                void handleView(row);
                              }}
                            >
                              <Eye className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              title="Print receipt"
                              onClick={(e) => {
                                e.stopPropagation();
                                handlePrint(row);
                              }}
                            >
                              <Printer className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              title="Download PDF"
                              disabled={busyId === row.id}
                              onClick={(e) => {
                                e.stopPropagation();
                                void handleDownload(row);
                              }}
                            >
                              <Download className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    </ContextMenu>
                  );
                })
              )}
            </TableBody>
          </Table>
        </Card>
      </div>

      {/* Receipt Detail Dialog */}
      <Dialog open={!!selected} onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Receipt className="h-5 w-5" />
              {selected?.invoiceNumber}
            </DialogTitle>
            <DialogDescription>
              {selected && format(new Date(selected.dateISO), "MMMM dd, yyyy 'at' hh:mm a")}
            </DialogDescription>
          </DialogHeader>

          {selected && (
            <div className="space-y-4">
              <Card className="p-4">
                <div className="grid gap-3 md:grid-cols-2">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">Customer</p>
                    <p className="text-sm font-medium mt-1">{selected.customerName}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">Payment Method</p>
                    <p className="text-sm font-medium mt-1 capitalize">
                      {selected.paymentMode.replace("_", " ")}
                    </p>
                  </div>
                </div>
              </Card>

              <div>
                <p className="text-sm font-medium mb-2">Items</p>
                <Card className="divide-y">
                  {selected.items.map((item, idx) => (
                    <div key={idx} className="p-3 flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{item.name}</p>
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

              <Card className="p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>{formatCurrency(selected.subtotal)}</span>
                </div>
                {selected.totalDiscount > 0 && (
                  <div className="flex justify-between text-sm text-emerald-600">
                    <span>Discount</span>
                    <span>-{formatCurrency(selected.totalDiscount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">GST</span>
                  <span>+{formatCurrency(selected.totalGst)}</span>
                </div>
                <Separator />
                <div className="flex justify-between text-base font-semibold">
                  <span>Total</span>
                  <span>{formatCurrency(selected.grandTotal)}</span>
                </div>
              </Card>

              <div className="flex gap-2">
                <Button variant="outline" className="flex-1 gap-2" onClick={printSelected}>
                  <Printer className="h-4 w-4" />
                  Print
                </Button>
                <Button variant="outline" className="flex-1 gap-2" onClick={() => void downloadSelected()}>
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
