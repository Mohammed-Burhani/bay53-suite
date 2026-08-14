"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { InvoiceCreateForm } from "@/components/invoice/InvoiceCreateForm";

function CreateSalesChallanPageInner() {
  const searchParams = useSearchParams();
  const editRaw = searchParams.get("edit");
  const editInvCode = editRaw ? Number(editRaw) || undefined : undefined;

  return (
    <InvoiceCreateForm
      invType={7}
      title="Sales Challan"
      backUrl="/erp/sales/challan"
      editInvCode={editInvCode}
    />
  );
}

export default function CreateSalesChallanPage() {
  return (
    <Suspense fallback={null}>
      <CreateSalesChallanPageInner />
    </Suspense>
  );
}
