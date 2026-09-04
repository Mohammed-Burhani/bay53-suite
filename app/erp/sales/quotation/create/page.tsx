"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { InvoiceCreateForm } from "@/components/invoice/InvoiceCreateForm";

function CreateSalesQuotationPageInner() {
  const searchParams = useSearchParams();
  const editRaw = searchParams.get("edit");
  const editInvCode = editRaw ? Number(editRaw) || undefined : undefined;

  return (
    <InvoiceCreateForm
      invType={4}
      title="Sales Quotation"
      backUrl="/erp/sales/quotation"
      editInvCode={editInvCode}
    />
  );
}

export default function CreateSalesQuotationPage() {
  return (
    <Suspense fallback={null}>
      <CreateSalesQuotationPageInner />
    </Suspense>
  );
}
