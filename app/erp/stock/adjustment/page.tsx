"use client";

import { InvoiceListTable } from "@/components/invoices/InvoiceListTable";
import { Settings } from "lucide-react";

export default function StockAdjustmentPage() {
  return (
    <div className="flex flex-col gap-6 p-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Stock Adjustment</h1>
        <p className="text-sm text-muted-foreground">
          View and manage stock adjustment entries
        </p>
      </div>

      <InvoiceListTable
        title="Stock Adjustment"
        invType={15}
        showInvoiceTypeFilter={false}
        icon={Settings}
        iconColor="bg-gray-500"
      />
    </div>
  );
}
