"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { InvoiceCreateForm } from "@/components/invoice/InvoiceCreateForm";

function CreatePerformaInvoicePageInner() {
  const searchParams = useSearchParams();
  const editRaw = searchParams.get("edit");
  const editInvCode = editRaw ? Number(editRaw) || undefined : undefined;

  return (
    <InvoiceCreateForm
      invType={6}
      title="Performa Invoice"
      backUrl="/erp/sales/performa"
      editInvCode={editInvCode}
    />
  );
}

export default function CreatePerformaInvoicePage() {
  return (
    <Suspense fallback={null}>
      <CreatePerformaInvoicePageInner />
    </Suspense>
  );
}
