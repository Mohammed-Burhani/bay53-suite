"use client";

import { InvoiceCreateForm } from "@/components/invoice/InvoiceCreateForm";

export default function CreateSalesInvoicePage() {
  return (
    <InvoiceCreateForm
      invType={1}
      title="Sales Invoice"
      backUrl="/erp/sales"
    />
  );
}
