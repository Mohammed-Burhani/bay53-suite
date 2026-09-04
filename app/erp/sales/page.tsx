"use client";

import { InvoiceListTable } from "@/components/invoices/InvoiceListTable";
import { TrendingUp } from "lucide-react";

export default function SalesPage() {
  return (
    <div className="flex flex-col gap-6 p-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Sales Invoices</h1>
        <p className="text-sm text-muted-foreground">
          View and manage all sales invoices
        </p>
      </div>

      <InvoiceListTable
        title="Sales Invoices"
        invType={1} // Sales invoice type ID
        showInvoiceTypeFilter={false} // Don't show dropdown, fixed to sales
        icon={TrendingUp}
        iconColor="bg-cyan-500"
        hideActions={true}
        createUrl="/erp/sales/create"
      />
    </div>
  );
}
