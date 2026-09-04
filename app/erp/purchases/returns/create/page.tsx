"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { InvoiceCreateForm } from "@/components/invoice/InvoiceCreateForm";

function CreatePurchaseReturnPageInner() {
  const searchParams = useSearchParams();
  const editRaw = searchParams.get("edit");
  const editInvCode = editRaw ? Number(editRaw) || undefined : undefined;

  return (
    <InvoiceCreateForm
      invType={10}
      title="Purchase Return"
      backUrl="/erp/purchases/returns"
      editInvCode={editInvCode}
    />
  );
}

export default function CreatePurchaseReturnPage() {
  return (
    <Suspense fallback={null}>
      <CreatePurchaseReturnPageInner />
    </Suspense>
  );
}
