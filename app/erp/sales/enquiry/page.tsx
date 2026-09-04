"use client";

import { InvoiceListTable } from "@/components/invoices/InvoiceListTable";
import { MessageSquare } from "lucide-react";

export default function SalesEnquiryPage() {
  return (
    <div className="flex flex-col gap-6 p-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Sales Enquiries</h1>
        <p className="text-sm text-muted-foreground">
          View and manage sales enquiries
        </p>
      </div>

      <InvoiceListTable
        title="Sales Enquiries"
        invType={23}
        showInvoiceTypeFilter={false}
        icon={MessageSquare}
        iconColor="bg-teal-500"
        hideActions={true}
        createUrl="/erp/sales/enquiry/create"
      />
    </div>
  );
}
