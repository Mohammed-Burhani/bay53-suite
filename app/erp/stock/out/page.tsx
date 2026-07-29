"use client";

import { InvoiceListTable } from "@/components/invoices/InvoiceListTable";
import { PackageMinus } from "lucide-react";

export default function StockOutPage() {
  return (
    <div className="flex flex-col gap-6 p-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Stock Out</h1>
        <p className="text-sm text-muted-foreground">
          View and manage stock outward entries
        </p>
      </div>

      <InvoiceListTable
        title="Stock Out"
        invType={14}
        showInvoiceTypeFilter={false}
        icon={PackageMinus}
        iconColor="bg-red-600"
      />
    </div>
  );
}
