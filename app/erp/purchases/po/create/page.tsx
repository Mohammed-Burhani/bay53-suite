"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { InvoiceCreateForm } from "@/components/invoice/InvoiceCreateForm";

function CreatePurchaseOrderPageInner() {
  const searchParams = useSearchParams();
  const editRaw = searchParams.get("edit");
  const editInvCode = editRaw ? Number(editRaw) || undefined : undefined;

  return (
    <InvoiceCreateForm
      invType={8}
      title="Purchase Order"
      backUrl="/erp/purchases/po"
      editInvCode={editInvCode}
    />
  );
}

export default function CreatePurchaseOrderPage() {
  return (
    <Suspense fallback={null}>
      <CreatePurchaseOrderPageInner />
    </Suspense>
  );
}
