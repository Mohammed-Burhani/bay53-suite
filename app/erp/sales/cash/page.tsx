"use client";

import { InvoiceListTable } from "@/components/invoices/InvoiceListTable";
import { Wallet } from "lucide-react";

export default function SalesCashPage() {
  return (
    <div className="flex flex-col gap-6 p-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Cash Invoices</h1>
        <p className="text-sm text-muted-foreground">
          View and manage cash sales invoices
        </p>
      </div>

      <InvoiceListTable
        title="Cash Invoices"
        invType={2}
        showInvoiceTypeFilter={false}
        icon={Wallet}
        iconColor="bg-green-500"
        createUrl="/erp/sales/cash/create"
      />
    </div>
  );
}
