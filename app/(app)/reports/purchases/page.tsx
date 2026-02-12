"use client";

import { useQuery } from "@tanstack/react-query";
import { getInvoices, formatCurrency } from "@/lib/store";
import { Card, CardContent } from "@/components/ui/card";
import { TrendingDown, FileText, IndianRupee } from "lucide-react";

export default function PurchaseReportPage() {
  const { data: invoices = [] } = useQuery({
    queryKey: ["invoices"],
    queryFn: () => getInvoices(),
  });

  const purchaseInvoices = invoices.filter(i => i.type === "purchase");
  const totalPurchases = purchaseInvoices.reduce((sum, i) => sum + i.grandTotal, 0);
  const totalPaid = purchaseInvoices.reduce((sum, i) => sum + i.amountPaid, 0);
  const totalPending = totalPurchases - totalPaid;

  return (
    <div className="flex flex-col gap-6 p-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Purchase Report</h1>
        <p className="text-sm text-muted-foreground">Detailed purchase analytics</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="border-l-4 border-l-violet-500">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="rounded-xl bg-violet-100 p-2.5">
              <TrendingDown className="h-5 w-5 text-violet-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-medium">Total Purchases</p>
              <p className="text-xl font-bold">{formatCurrency(totalPurchases)}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="rounded-xl bg-blue-100 p-2.5">
              <IndianRupee className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-medium">Paid</p>
              <p className="text-xl font-bold">{formatCurrency(totalPaid)}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-red-500">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="rounded-xl bg-red-100 p-2.5">
              <FileText className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-medium">Payable</p>
              <p className="text-xl font-bold">{formatCurrency(totalPending)}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-12 text-center">
          <FileText className="h-12 w-12 mx-auto text-muted-foreground/30" />
          <p className="mt-4 text-muted-foreground">Detailed purchase report coming soon</p>
        </CardContent>
      </Card>
    </div>
  );
}
