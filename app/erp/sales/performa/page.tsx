"use client";

import { InvoiceListTable } from "@/components/invoices/InvoiceListTable";
import { FileCheck } from "lucide-react";

export default function SalesPerformaPage() {
  return (
    <div className="flex flex-col gap-6 p-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Performa Invoices</h1>
        <p className="text-sm text-muted-foreground">
          View and manage performa invoices
        </p>
      </div>

      <InvoiceListTable
        title="Performa Invoices"
        invType={6}
        showInvoiceTypeFilter={false}
        icon={FileCheck}
        iconColor="bg-indigo-500"
        createUrl="/erp/sales/performa/create"
      />
    </div>
  );
}
