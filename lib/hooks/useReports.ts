"use client";

// ==================== Reports Hooks ====================
// All report queries/mutations via TanStack React Query

import { useQuery, useMutation } from "@tanstack/react-query";
import { reportsService } from "@/lib/api/reports.service";
import { useSession } from "@/lib/hooks/useAuth";
import type { LedgerOutstandingPayload, ItemRegisterPayload } from "@/lib/types/reports.types";

// Fetch ledgers for dropdown/filter selection
export function useLedgers() {
  const session = useSession();

  return useQuery({
    queryKey: ["ledgers", session?.user.currentSessionId],
    queryFn: () => {
      const sessionId = session?.user.currentSessionId ?? "";
      return reportsService.searchLedgers({ sessionId });
    },
    enabled: !!session?.user.currentSessionId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

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

// Item Register — POST with filters, fires on user action only.
export function useItemRegister() {
  const session = useSession();

  return useMutation({
    mutationFn: (filters: Omit<ItemRegisterPayload, "sessionId">) => {
      const sessionId = session?.user.currentSessionId ?? "";
      return reportsService.getItemRegister({ ...filters, sessionId });
    },
  });
}
