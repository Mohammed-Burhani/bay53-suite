"use client";

import { InvoiceListTable } from "@/components/invoices/InvoiceListTable";
import { PackageOpen } from "lucide-react";

export default function StockOpeningPage() {
  return (
    <div className="flex flex-col gap-6 p-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Opening Stock</h1>
        <p className="text-sm text-muted-foreground">
          View and manage opening stock entries
        </p>
      </div>

      <InvoiceListTable
        title="Opening Stock"
        invType={12}
        showInvoiceTypeFilter={false}
        icon={PackageOpen}
        iconColor="bg-slate-500"
      />
    </div>
  );
}
