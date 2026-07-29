"use client";

import { InvoiceListTable } from "@/components/invoices/InvoiceListTable";
import { Package } from "lucide-react";

export default function StockAbsolutePage() {
  return (
    <div className="flex flex-col gap-6 p-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Absolute Stock</h1>
        <p className="text-sm text-muted-foreground">
          View and manage absolute stock entries
        </p>
      </div>

      <InvoiceListTable
        title="Absolute Stock"
        invType={21}
        showInvoiceTypeFilter={false}
        icon={Package}
        iconColor="bg-zinc-500"
      />
    </div>
  );
}
