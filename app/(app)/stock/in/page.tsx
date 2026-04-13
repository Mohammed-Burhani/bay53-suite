"use client";

import { InvoiceListTable } from "@/components/invoices/InvoiceListTable";
import { PackagePlus } from "lucide-react";

export default function StockInPage() {
  return (
    <div className="flex flex-col gap-6 p-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Stock In</h1>
        <p className="text-sm text-muted-foreground">
          View and manage stock inward entries
        </p>
      </div>

      <InvoiceListTable
        title="Stock In"
        invType={13}
        showInvoiceTypeFilter={false}
        icon={PackagePlus}
        iconColor="bg-emerald-500"
      />
    </div>
  );
}
