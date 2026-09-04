"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { InvoiceCreateForm } from "@/components/invoice/InvoiceCreateForm";

function CreateSalesReturnPageInner() {
  const searchParams = useSearchParams();
  const editRaw = searchParams.get("edit");
  const editInvCode = editRaw ? Number(editRaw) || undefined : undefined;

  return (
    <InvoiceCreateForm
      invType={3}
      title="Sales Return"
      backUrl="/erp/sales/returns"
      editInvCode={editInvCode}
    />
  );
}

export default function CreateSalesReturnPage() {
  return (
    <Suspense fallback={null}>
      <CreateSalesReturnPageInner />
    </Suspense>
  );
}
