"use client";

import { InvoiceListTable } from "@/components/invoices/InvoiceListTable";
import { ShoppingCart } from "lucide-react";

export default function SalesOrderPage() {
  return (
    <div className="flex flex-col gap-6 p-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Sales Orders</h1>
        <p className="text-sm text-muted-foreground">
          View and manage sales orders
        </p>
      </div>

      <InvoiceListTable
        title="Sales Orders"
        invType={5}
        showInvoiceTypeFilter={false}
        icon={ShoppingCart}
        iconColor="bg-blue-500"
        createUrl="/erp/sales/order/create"
      />
    </div>
  );
}
