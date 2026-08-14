"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { InvoiceCreateForm } from "@/components/invoice/InvoiceCreateForm";

function CreateSalesInvoicePageInner() {
  const searchParams = useSearchParams();
  const editRaw = searchParams.get("edit");
  const editInvCode = editRaw ? Number(editRaw) || undefined : undefined;

  return (
    <InvoiceCreateForm
      invType={1}
      title="Sales Invoice"
      backUrl="/erp/sales"
      editInvCode={editInvCode}
    />
  );
}

export default function CreateSalesInvoicePage() {
  return (
    <Suspense fallback={null}>
      <CreateSalesInvoicePageInner />
    </Suspense>
  );
}
