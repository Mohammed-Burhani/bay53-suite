"use client";

import { useQuery } from "@tanstack/react-query";
import { getInvoices, formatCurrency } from "@/lib/store";
import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, FileText, IndianRupee } from "lucide-react";

export default function SalesReportPage() {
  const { data: invoices = [] } = useQuery({
    queryKey: ["invoices"],
    queryFn: getInvoices,
  });

  const salesInvoices = invoices.filter(i => i.type === "sale");
  const totalSales = salesInvoices.reduce((sum, i) => sum + i.grandTotal, 0);
  const totalPaid = salesInvoices.reduce((sum, i) => sum + i.amountPaid, 0);
  const totalPending = totalSales - totalPaid;

  return (
    <div className="flex flex-col gap-6 p-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Sales Report</h1>
        <p className="text-sm text-muted-foreground">Detailed sales analytics</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="border-l-4 border-l-emerald-500">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="rounded-xl bg-emerald-100 p-2.5">
              <TrendingUp className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-medium">Total Sales</p>
              <p className="text-xl font-bold">{formatCurrency(totalSales)}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="rounded-xl bg-blue-100 p-2.5">
              <IndianRupee className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-medium">Collected</p>
              <p className="text-xl font-bold">{formatCurrency(totalPaid)}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-amber-500">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="rounded-xl bg-amber-100 p-2.5">
              <FileText className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-medium">Pending</p>
              <p className="text-xl font-bold">{formatCurrency(totalPending)}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-12 text-center">
          <FileText className="h-12 w-12 mx-auto text-muted-foreground/30" />
          <p className="mt-4 text-muted-foreground">Detailed sales report coming soon</p>
        </CardContent>
      </Card>
    </div>
  );
}
