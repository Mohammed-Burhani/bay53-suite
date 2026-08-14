"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { InvoiceCreateForm } from "@/components/invoice/InvoiceCreateForm";

function CreateSalesEnquiryPageInner() {
  const searchParams = useSearchParams();
  const editRaw = searchParams.get("edit");
  const editInvCode = editRaw ? Number(editRaw) || undefined : undefined;

  return (
    <InvoiceCreateForm
      invType={23}
      title="Sales Enquiry"
      backUrl="/erp/sales/enquiry"
      editInvCode={editInvCode}
    />
  );
}

export default function CreateSalesEnquiryPage() {
  return (
    <Suspense fallback={null}>
      <CreateSalesEnquiryPageInner />
    </Suspense>
  );
}
