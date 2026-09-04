"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { InvoiceCreateForm } from "@/components/invoice/InvoiceCreateForm";

function CreatePurchaseInvoicePageInner() {
  const searchParams = useSearchParams();
  const editRaw = searchParams.get("edit");
  const editInvCode = editRaw ? Number(editRaw) || undefined : undefined;

  return (
    <InvoiceCreateForm
      invType={9}
      title="Purchase Invoice"
      backUrl="/erp/purchases"
      editInvCode={editInvCode}
    />
  );
}

export default function CreatePurchaseInvoicePage() {
  return (
    <Suspense fallback={null}>
      <CreatePurchaseInvoicePageInner />
    </Suspense>
  );
}
