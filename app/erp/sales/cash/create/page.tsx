"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { InvoiceCreateForm } from "@/components/invoice/InvoiceCreateForm";

function CreateCashInvoicePageInner() {
  const searchParams = useSearchParams();
  const editRaw = searchParams.get("edit");
  const editInvCode = editRaw ? Number(editRaw) || undefined : undefined;

  return (
    <InvoiceCreateForm
      invType={2}
      title="Cash Invoice"
      backUrl="/erp/sales/cash"
      editInvCode={editInvCode}
    />
  );
}

export default function CreateCashInvoicePage() {
  return (
    <Suspense fallback={null}>
      <CreateCashInvoicePageInner />
    </Suspense>
  );
}
