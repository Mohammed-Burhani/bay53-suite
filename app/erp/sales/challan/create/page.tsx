"use client";

import { InvoiceCreateForm } from "@/components/invoice/InvoiceCreateForm";

export default function CreateSalesChallanPage() {
  return (
    <InvoiceCreateForm
      invType={7}
      title="Sales Challan"
      backUrl="/erp/sales/challan"
    />
  );
}
