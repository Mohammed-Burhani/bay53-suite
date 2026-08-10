"use client";

import { InvoiceCreateForm } from "@/components/invoice/InvoiceCreateForm";

export default function CreateSalesEnquiryPage() {
  return (
    <InvoiceCreateForm
      invType={23}
      title="Sales Enquiry"
      backUrl="/erp/sales/enquiry"
    />
  );
}
