"use client";

import { InvoiceListTable } from "@/components/invoices/InvoiceListTable";
import { FileText } from "lucide-react";

export default function PurchasePOPage() {
  return (
    <div className="flex flex-col gap-6 p-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Purchase Orders (PO)</h1>
        <p className="text-sm text-muted-foreground">
          View and manage purchase orders
        </p>
      </div>

      <InvoiceListTable
        title="Purchase Orders"
        invType={8}
        showInvoiceTypeFilter={false}
        icon={FileText}
        iconColor="bg-yellow-500"
        createUrl="/erp/purchases/po/create"
      />
    </div>
  );
}
