"use client";

import { InvoiceListTable } from "@/components/invoices/InvoiceListTable";
import { ShoppingCart } from "lucide-react";

export default function PurchasesPage() {
  return (
    <div className="flex flex-col gap-6 p-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Purchase Invoices</h1>
        <p className="text-sm text-muted-foreground">
          View and manage all purchase invoices
        </p>
      </div>

      <InvoiceListTable
        title="Purchase Invoices"
        invType={9}
        showInvoiceTypeFilter={false}
        icon={ShoppingCart}
        iconColor="bg-violet-500"
        createUrl="/erp/purchases/create"
      />
    </div>
  );
}
