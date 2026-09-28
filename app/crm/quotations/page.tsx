"use client";

import { Suspense } from "react";
import { QuotationsView } from "@/components/bay53crm/quotations/QuotationsView";

export default function QuotationsPage() {
  return (
    <Suspense>
      <QuotationsView />
    </Suspense>
  );
}
