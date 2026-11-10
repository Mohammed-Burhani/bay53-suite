"use client";

import { CrmLoginGate } from "@/components/bay53crm/shared/CrmLoginGate";
import { LeadsView } from "@/components/bay53crm/leads/LeadsView";

export default function LeadsPage() {
  return (
    <CrmLoginGate>
      <LeadsView />
    </CrmLoginGate>
  );
}
