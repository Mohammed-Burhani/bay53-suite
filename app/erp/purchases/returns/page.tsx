"use client";

import { InvoiceListTable } from "@/components/invoices/InvoiceListTable";
import { Undo2 } from "lucide-react";

export default function PurchaseReturnsPage() {
  return (
    <div className="flex flex-col gap-6 p-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Purchase Returns</h1>
        <p className="text-sm text-muted-foreground">
          View and manage purchase returns to suppliers
        </p>
      </div>

      <InvoiceListTable
        title="Purchase Returns"
        invType={10}
        showInvoiceTypeFilter={false}
        icon={Undo2}
        iconColor="bg-rose-500"
        createUrl="/erp/purchases/returns/create"
      />
    </div>
  );
}
