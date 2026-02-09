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
import { Search, FileText, IndianRupee } from "lucide-react";
import { useState } from "react";

export default function PurchasesPage() {
  const [search, setSearch] = useState("");

  const { data: invoices = [] } = useQuery({
    queryKey: ["invoices", "purchase"],
    queryFn: () => getInvoices("purchase"),
  });

  const filtered = invoices.filter(
    (inv) =>
      inv.invoiceNumber.toLowerCase().includes(search.toLowerCase()) ||
      inv.partyName.toLowerCase().includes(search.toLowerCase())
  );

  const totalPurchases = invoices.reduce((sum, i) => sum + i.grandTotal, 0);
  const totalPaid = invoices.reduce((sum, i) => sum + i.amountPaid, 0);
  const totalPending = totalPurchases - totalPaid;

  return (
    <div className="flex flex-col gap-6 p-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Purchases</h1>
        <p className="text-sm text-muted-foreground">{invoices.length} purchase orders</p>
      </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <Card className="card-hover border-l-4 border-l-violet-500">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="rounded-xl bg-violet-100 p-2.5">
                <FileText className="h-5 w-5 text-violet-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Total Purchases</p>
                <p className="text-xl font-bold mt-1">{formatCurrency(totalPurchases)}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="card-hover border-l-4 border-l-emerald-500">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="rounded-xl bg-emerald-100 p-2.5">
                <IndianRupee className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Paid</p>
                <p className="text-xl font-bold mt-1 text-emerald-600">{formatCurrency(totalPaid)}</p>
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

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search by invoice no. or supplier..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Invoice #</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Supplier</TableHead>
                <TableHead className="text-center">Items</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead className="text-center">Payment</TableHead>
                <TableHead className="text-center">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="py-12 text-center">
                    <FileText className="mx-auto h-8 w-8 text-muted-foreground/40" />
                    <p className="mt-2 text-sm text-muted-foreground">No purchases found</p>
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
                        variant={inv.status === "paid" ? "default" : "secondary"}
                        className="text-xs capitalize"
                      >
                        {inv.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
