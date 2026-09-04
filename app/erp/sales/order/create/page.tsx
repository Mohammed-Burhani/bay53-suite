"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { InvoiceCreateForm } from "@/components/invoice/InvoiceCreateForm";

function CreateSalesOrderPageInner() {
  const searchParams = useSearchParams();
  const editRaw = searchParams.get("edit");
  const editInvCode = editRaw ? Number(editRaw) || undefined : undefined;

  return (
    <InvoiceCreateForm
      invType={5}
      title="Sales Order"
      backUrl="/erp/sales/order"
      editInvCode={editInvCode}
    />
  );
}

export default function CreateSalesOrderPage() {
  return (
    <Suspense fallback={null}>
      <CreateSalesOrderPageInner />
    </Suspense>
  );
}
