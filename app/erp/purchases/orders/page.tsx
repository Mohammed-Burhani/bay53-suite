"use client";

import { InvoiceListTable } from "@/components/invoices/InvoiceListTable";
import { ShoppingBag } from "lucide-react";

export default function PurchaseOrdersPage() {
  return (
    <div className="flex flex-col gap-6 p-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Purchase Orders</h1>
        <p className="text-sm text-muted-foreground">
          View and manage purchase orders to suppliers
        </p>
      </div>

      <InvoiceListTable
        title="Purchase Orders"
        invType={8}
        showInvoiceTypeFilter={false}
        icon={ShoppingBag}
        iconColor="bg-amber-500"
        createUrl="/erp/purchases/po/create"
      />
    </div>
  );
}
