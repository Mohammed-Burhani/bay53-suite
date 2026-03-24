"use client";

// ==================== Reports Hooks ====================
// All report queries/mutations via TanStack React Query

import { useMutation } from "@tanstack/react-query";
import { reportsService } from "@/lib/api/reports.service";
import { useSession } from "@/lib/hooks/useAuth";
import type { LedgerOutstandingPayload } from "@/lib/types/reports.types";

// Ledger Outstanding is a POST with filters — useMutation is the right choice.
// This avoids auto-fetching on mount and only fires when the user clicks "Outstanding".
export function useLedgerOutstanding() {
  const session = useSession();

  return useMutation({
    mutationFn: (filters: Omit<LedgerOutstandingPayload, "sessionId">) => {
      const sessionId = session?.user.currentSessionId ?? "";
      return reportsService.getLedgerOutstanding({ ...filters, sessionId });
    },
  });
}
