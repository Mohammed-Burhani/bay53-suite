"use client";

import { useQuery } from "@tanstack/react-query";
import { getInvoices, formatCurrency } from "@/lib/store";
import { Card, CardContent } from "@/components/ui/card";
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Search, FileText, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { Invoice } from "@/lib/types";

export default function SalesPage() {
  const [search, setSearch] = useState("");
  const [viewInvoice, setViewInvoice] = useState<Invoice | null>(null);

  const { data: invoices = [] } = useQuery({
    queryKey: ["invoices", "sale"],
    queryFn: () => getInvoices("sale"),
  });

  const filtered = invoices.filter(
    (inv) =>
      inv.invoiceNumber.toLowerCase().includes(search.toLowerCase()) ||
      inv.partyName.toLowerCase().includes(search.toLowerCase())
  );

  const totalSales = invoices.reduce((sum, i) => sum + i.grandTotal, 0);
  const totalReceived = invoices.reduce((sum, i) => sum + i.amountPaid, 0);
  const totalPending = totalSales - totalReceived;

  return (
    <div className="flex flex-col gap-6 p-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Sales & Invoices</h1>
        <p className="text-sm text-muted-foreground">{invoices.length} sale invoices</p>
      </div>

        {/* Summary */}
        <div className="grid gap-4 sm:grid-cols-3">
          <Card className="card-hover border-l-4 border-l-indigo-500">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="rounded-xl bg-indigo-100 p-2.5">
                <FileText className="h-5 w-5 text-indigo-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Total Sales</p>
                <p className="text-xl font-bold mt-1">{formatCurrency(totalSales)}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="card-hover border-l-4 border-l-emerald-500">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="rounded-xl bg-emerald-100 p-2.5">
                <Eye className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Received</p>
                <p className="text-xl font-bold mt-1 text-emerald-600">{formatCurrency(totalReceived)}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="card-hover border-l-4 border-l-amber-500">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="rounded-xl bg-amber-100 p-2.5">
                <Search className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Pending</p>
                <p className="text-xl font-bold mt-1 text-amber-600">{formatCurrency(totalPending)}</p>
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
                <TableHead>Customer</TableHead>
                <TableHead className="text-center">Items</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead className="text-center">Payment</TableHead>
                <TableHead className="text-center">Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="py-12 text-center">
                    <FileText className="mx-auto h-8 w-8 text-muted-foreground/40" />
                    <p className="mt-2 text-sm text-muted-foreground">No invoices found</p>
                  </TableCell>
                </TableRow>
              ) : (
                  filtered.map((inv) => (
                    <TableRow key={inv.id} className="hover:bg-muted/30 transition-colors">
                    <TableCell className="font-mono text-xs">{inv.invoiceNumber}</TableCell>
                    <TableCell className="text-sm">
                      {new Date(inv.date).toLocaleDateString("en-IN")}
                    </TableCell>
                    <TableCell className="text-sm font-medium">{inv.partyName}</TableCell>
                    <TableCell className="text-center text-sm">{inv.items.length}</TableCell>
                    <TableCell className="text-right text-sm font-medium">
                      {formatCurrency(inv.grandTotal)}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="outline" className="text-xs capitalize">
                        {inv.paymentMode.replace("_", " ")}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge
                        variant={
                          inv.status === "paid" ? "default" : inv.status === "partial" ? "secondary" : "destructive"
                        }
                        className="text-xs capitalize"
                      >
                        {inv.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setViewInvoice(inv)}>
                        <Eye className="h-3.5 w-3.5" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Invoice Detail Dialog */}
      <Dialog open={!!viewInvoice} onOpenChange={(open) => !open && setViewInvoice(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Invoice {viewInvoice?.invoiceNumber}</DialogTitle>
          </DialogHeader>
          {viewInvoice && <InvoiceDetail invoice={viewInvoice} />}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function InvoiceDetail({ invoice }: { invoice: Invoice }) {
  return (
    <div className="space-y-4 text-sm">
      <div className="flex justify-between">
        <div>
          <p className="font-medium">{invoice.partyName}</p>
          <p className="text-muted-foreground">{new Date(invoice.date).toLocaleDateString("en-IN")}</p>
        </div>
        <Badge
          variant={invoice.status === "paid" ? "default" : invoice.status === "partial" ? "secondary" : "destructive"}
          className="capitalize h-fit"
        >
          {invoice.status}
        </Badge>
      </div>
      <Separator />
      <div className="space-y-2">
        {invoice.items.map((item, i) => (
          <div key={i} className="flex justify-between">
            <div>
              <p className="font-medium">{item.productName}</p>
              <p className="text-xs text-muted-foreground">
                {item.quantity} {item.unit} &times; {formatCurrency(item.price)}
                {item.discount > 0 && ` (disc: ${formatCurrency(item.discount)})`}
              </p>
            </div>
            <p className="font-medium">{formatCurrency(item.total)}</p>
          </div>
        ))}
      </div>
      <Separator />
      <div className="space-y-1">
        <div className="flex justify-between text-muted-foreground">
          <span>Subtotal</span>
          <span>{formatCurrency(invoice.subtotal)}</span>
        </div>
        {invoice.totalDiscount > 0 && (
          <div className="flex justify-between text-emerald-600">
            <span>Discount</span>
            <span>-{formatCurrency(invoice.totalDiscount)}</span>
          </div>
        )}
        <div className="flex justify-between text-muted-foreground">
          <span>GST</span>
          <span>+{formatCurrency(invoice.totalGst)}</span>
        </div>
        <Separator />
        <div className="flex justify-between font-bold text-base">
          <span>Grand Total</span>
          <span>{formatCurrency(invoice.grandTotal)}</span>
        </div>
        <div className="flex justify-between text-muted-foreground">
          <span>Paid ({invoice.paymentMode.replace("_", " ")})</span>
          <span>{formatCurrency(invoice.amountPaid)}</span>
        </div>
        {invoice.grandTotal - invoice.amountPaid > 0 && (
          <div className="flex justify-between text-amber-600 font-medium">
            <span>Balance Due</span>
            <span>{formatCurrency(invoice.grandTotal - invoice.amountPaid)}</span>
          </div>
        )}
      </div>
    </div>
  );
}
