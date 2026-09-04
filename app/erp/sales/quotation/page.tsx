"use client";

import { InvoiceListTable } from "@/components/invoices/InvoiceListTable";
import { FileText } from "lucide-react";

export default function SalesQuotationPage() {
  return (
    <div className="flex flex-col gap-6 p-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Sales Quotations</h1>
        <p className="text-sm text-muted-foreground">
          View and manage sales quotations
        </p>
      </div>

      <InvoiceListTable
        title="Sales Quotations"
        invType={4}
        showInvoiceTypeFilter={false}
        icon={FileText}
        iconColor="bg-purple-500"
        createUrl="/erp/sales/quotation/create"
      />
    </div>
  );
}
