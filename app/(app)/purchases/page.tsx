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
        defaultInvType={2} // Purchase invoice type ID (adjust based on your setup)
        icon={ShoppingCart}
        iconColor="bg-violet-500"
      />
    </div>
  );
}
