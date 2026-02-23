"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useInvoicesByType, useDeleteInvoice, useSalesTotals } from "@/lib/api-services/invoice.service";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
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
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Separator } from "@/components/ui/separator";
import { Search, FileText, Eye, Plus, Edit, Trash2, TrendingUp, Printer, Download } from "lucide-react";
import { InvoiceWithItems, invoiceService } from "@/supabase/services/invoice-service";
import { toast } from "sonner";
import { printInvoice, downloadInvoice } from "@/lib/invoice-utils";
import { GenerateTaxInvoiceButton } from "@/components/invoice/GenerateTaxInvoiceButton";

export default function SalesPage() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [viewInvoice, setViewInvoice] = useState<InvoiceWithItems | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);

  const { data: invoices = [], isLoading } = useInvoicesByType('sale');
  const { data: totalSales = 0 } = useSalesTotals();
  const deleteInvoice = useDeleteInvoice();

  const filtered = invoices.filter(
    (inv) =>
      inv.invoice_number.toLowerCase().includes(search.toLowerCase()) ||
      inv.buyer_name.toLowerCase().includes(search.toLowerCase())
  );

  // Removed payment tracking

  const handleDelete = async () => {
    if (!deleteId) return;
    
    try {
      await deleteInvoice.mutateAsync(deleteId);
      toast.success("Invoice deleted successfully");
      setDeleteId(null);
    } catch {
      toast.error("Failed to delete invoice");
    }
  };

  const handleViewInvoice = async (invoiceId: string) => {
    try {
      setLoadingPreview(true);
      const fullInvoice = await invoiceService.getInvoiceById(invoiceId);
      if (fullInvoice) {
        setViewInvoice(fullInvoice);
      } else {
        toast.error("Invoice not found");
      }
    } catch (err) {
      console.error('Error fetching invoice:', err);
      toast.error("Failed to load invoice");
    } finally {
      setLoadingPreview(false);
    }
  };

  const handlePrint = async (invoiceId: string) => {
    try {
      console.log('Fetching invoice for print:', invoiceId);
      const fullInvoice = await invoiceService.getInvoiceById(invoiceId);
      console.log('Fetched invoice:', fullInvoice);
      console.log('Invoice items:', fullInvoice?.items);
      console.log('Items count:', fullInvoice?.items?.length);
      
      if (fullInvoice) {
        printInvoice(fullInvoice);
      } else {
        toast.error("Invoice not found");
      }
    } catch (err) {
      console.error('Error fetching invoice:', err);
      toast.error("Failed to load invoice");
    }
  };

  const handleDownload = async (invoiceId: string) => {
    try {
      console.log('Fetching invoice for download:', invoiceId);
      const fullInvoice = await invoiceService.getInvoiceById(invoiceId);
      console.log('Fetched invoice:', fullInvoice);
      console.log('Invoice items:', fullInvoice?.items);
      
      if (fullInvoice) {
        downloadInvoice(fullInvoice);
        toast.success("Invoice downloaded as PDF");
      } else {
        toast.error("Invoice not found");
      }
    } catch (err) {
      console.error('Error fetching invoice:', err);
      toast.error("Failed to load invoice");
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 2,
    }).format(amount);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading invoices...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Sales & Invoices</h1>
          <p className="text-sm text-muted-foreground">{invoices.length} sale invoices</p>
        </div>
        <div className="flex gap-2">
          <GenerateTaxInvoiceButton />
          <Button onClick={() => router.push('/sales/create')} className="gap-2">
            <Plus className="h-4 w-4" />
            Create Invoice
          </Button>
        </div>
      </div>

      {/* Summary */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Card className="card-hover border-l-4 border-l-indigo-500">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="rounded-xl bg-indigo-100 p-2.5">
              <TrendingUp className="h-5 w-5 text-indigo-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Total Sales</p>
              <p className="text-xl font-bold mt-1">{formatCurrency(totalSales)}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="card-hover border-l-4 border-l-amber-500">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="rounded-xl bg-amber-100 p-2.5">
              <FileText className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Total Invoices</p>
              <p className="text-xl font-bold mt-1 text-amber-600">{invoices.length}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search by invoice no. or customer..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Invoice #</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>To</TableHead>
                <TableHead>From</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead className="text-center">Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-12 text-center">
                    <FileText className="mx-auto h-8 w-8 text-muted-foreground/40" />
                    <p className="mt-2 text-sm text-muted-foreground">
                      {search ? "No invoices found" : "No invoices yet. Create your first invoice!"}
                    </p>
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((inv) => (
                  <TableRow key={inv.id} className="hover:bg-muted/30 transition-colors">
                    <TableCell className="font-mono text-xs">{inv.invoice_number}</TableCell>
                    <TableCell className="text-sm">
                      {new Date(inv.invoice_date).toLocaleDateString("en-IN")}
                    </TableCell>
                    <TableCell className="text-sm font-medium">{inv.buyer_name}</TableCell>
                    <TableCell className="text-sm font-medium">{inv.seller_name}</TableCell>
                    <TableCell className="text-right text-sm font-medium">
                      {formatCurrency(Number(inv.grand_total))}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge
                        variant={
                          inv.invoice_status === "pending" ? "destructive" : inv.invoice_status === "ready" ? "secondary" : "default"
                        }
                        className="text-xs capitalize"
                      >
                        {inv.invoice_status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8" 
                          onClick={() => handlePrint(inv.id!)}
                          title="Print Invoice"
                        >
                          <Printer className="h-3.5 w-3.5" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8" 
                          onClick={() => handleDownload(inv.id!)}
                          title="Download Invoice"
                        >
                          <Download className="h-3.5 w-3.5" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8" 
                          onClick={() => router.push(`/sales/edit/${inv.id}`)}
                          title="Edit Invoice"
                        >
                          <Edit className="h-3.5 w-3.5" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8" 
                          onClick={() => handleViewInvoice(inv.id!)}
                          title="View Details"
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-destructive hover:text-destructive" 
                          onClick={() => setDeleteId(inv.id!)}
                          title="Delete Invoice"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Invoice Detail Dialog */}
      <Dialog open={!!viewInvoice || loadingPreview} onOpenChange={(open) => !open && setViewInvoice(null)}>
        <DialogContent className="max-w-xl max-h-[85vh] overflow-y-auto">
          {loadingPreview ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mx-auto"></div>
                <p className="mt-3 text-sm text-muted-foreground">Loading invoice...</p>
              </div>
            </div>
          ) : viewInvoice ? (
            <>
              <DialogHeader className="space-y-2 pb-2">
                <DialogTitle className="text-xl font-bold">
                  Invoice Preview
                </DialogTitle>
                <DialogDescription>
                  {viewInvoice.invoice_number}
                </DialogDescription>
              </DialogHeader>
              <InvoiceDetail invoice={viewInvoice} formatCurrency={formatCurrency} />
              <div className="flex gap-2 pt-2 border-t">
                <Button 
                  variant="outline" 
                  size="sm"
                  className="gap-1.5 flex-1"
                  onClick={() => viewInvoice && printInvoice(viewInvoice)}
                >
                  <Printer className="h-4 w-4" />
                  Print
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  className="gap-1.5 flex-1"
                  onClick={() => {
                    if (viewInvoice) {
                      downloadInvoice(viewInvoice);
                      toast.success("Invoice downloaded as PDF");
                    }
                  }}
                >
                  <Download className="h-4 w-4" />
                  Download
                </Button>
              </div>
            </>
          ) : null}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Invoice</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this invoice? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function InvoiceDetail({ invoice, formatCurrency }: { invoice: InvoiceWithItems; formatCurrency: (n: number) => string }) {
  return (
    <div className="space-y-4">
      {/* Header Section */}
      <Card className="border-l-4 border-l-indigo-500 bg-gradient-to-br from-indigo-50/50 to-purple-50/30 dark:from-indigo-950/20 dark:to-purple-950/10">
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1.5 flex-1">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                <h3 className="text-base font-semibold text-foreground">{invoice.buyer_name}</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                Date: {new Date(invoice.invoice_date).toLocaleDateString("en-IN", { 
                  day: 'numeric', 
                  month: 'short', 
                  year: 'numeric' 
                })}
              </p>
            </div>
            <Badge
              variant={
                invoice.invoice_status === "tax-invoice" ? "default" : 
                invoice.invoice_status === "ready" ? "secondary" : 
                "outline"
              }
              className="capitalize text-xs"
            >
              {invoice.invoice_status}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Items Section */}
      <div className="space-y-2">
        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Invoice Items</h4>
        <Card>
          <CardContent className="p-0">
            {invoice.items && invoice.items.length > 0 ? (
              <div className="divide-y divide-border">
                {invoice.items.map((item, i) => (
                  <div key={item.id || i} className="p-3 hover:bg-muted/30 transition-colors">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 space-y-1">
                        <p className="text-sm font-medium text-foreground">{item.description}</p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span>Qty: <span className="text-foreground font-medium">{item.quantity} {item.unit}</span></span>
                          <span className="text-border">•</span>
                          <span>Rate: <span className="text-foreground font-medium">{formatCurrency(Number(item.rate))}</span></span>
                        </div>
                      </div>
                      <p className="text-sm font-semibold text-foreground">{formatCurrency(Number(item.amount))}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-6 text-center text-sm text-muted-foreground">
                No items in this invoice
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Summary Section */}
      <Card className="border-t-2 border-t-indigo-500">
        <CardContent className="p-4 space-y-2.5">
          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Payment Summary</h4>
          
          <div className="space-y-2">
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground">Subtotal</span>
              <span className="font-medium text-foreground">{formatCurrency(Number(invoice.subtotal))}</span>
            </div>
            
            {Number(invoice.discount) > 0 && (
              <div className="flex justify-between items-center text-sm">
                <span className="text-emerald-600 dark:text-emerald-400">Discount</span>
                <span className="font-medium text-emerald-600 dark:text-emerald-400">
                  -{formatCurrency(Number(invoice.discount))}
                </span>
              </div>
            )}
            
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground">GST</span>
              <span className="font-medium text-foreground">+{formatCurrency(Number(invoice.total_gst))}</span>
            </div>
            
            <Separator className="my-2" />
            
            <div className="flex justify-between items-center pt-1">
              <span className="text-base font-bold text-foreground">Grand Total</span>
              <span className="text-lg font-bold text-indigo-600 dark:text-indigo-400">
                {formatCurrency(Number(invoice.grand_total))}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
