"use client";

import { InvoiceListTable } from "@/components/invoices/InvoiceListTable";
import { Undo2 } from "lucide-react";

export default function SalesReturnsPage() {
  return (
    <div className="flex flex-col gap-6 p-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Sales Returns</h1>
        <p className="text-sm text-muted-foreground">
          View and manage sales return invoices
        </p>
      </div>

      <InvoiceListTable
        title="Sales Returns"
        invType={3}
        showInvoiceTypeFilter={false}
        icon={Undo2}
        iconColor="bg-red-500"
        createUrl="/erp/sales/returns/create"
      />
    </div>
  );
}
