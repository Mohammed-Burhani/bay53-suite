"use client";

import { InvoiceListTable } from "@/components/invoices/InvoiceListTable";
import { FileText } from "lucide-react";

export default function AllInvoicesPage() {
  return (
    <div className="flex flex-col gap-6 p-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">All Invoices</h1>
        <p className="text-sm text-muted-foreground">
          View and manage all invoices across sales, purchases, and stock
        </p>
      </div>

      <InvoiceListTable
        title="All Invoices"
        invType={0} // 0 = All types
        showInvoiceTypeFilter={true} // Show the dropdown for filtering
        icon={FileText}
        iconColor="bg-indigo-500"
      />
    </div>
  );
}
