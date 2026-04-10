"use client";

import { InvoiceListTable } from "@/components/invoices/InvoiceListTable";
import { Package } from "lucide-react";

export default function StockInvoicesPage() {
  return (
    <div className="flex flex-col gap-6 p-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Stock Invoices</h1>
        <p className="text-sm text-muted-foreground">
          View and manage stock transfers and adjustments
        </p>
      </div>

      <InvoiceListTable
        title="Stock Invoices"
        defaultInvType={0} // Show all stock-related types
        icon={Package}
        iconColor="bg-emerald-500"
      />
    </div>
  );
}
