"use client";

// ==================== Reports Hooks ====================
// All report queries/mutations via TanStack React Query

import { useQuery, useMutation } from "@tanstack/react-query";
import { reportsService } from "@/lib/api/reports.service";
import { useSession } from "@/lib/hooks/useAuth";
import type { LedgerOutstandingPayload, LedgerOutstandingSummaryPayload, ItemRegisterPayload, LedgerRegisterPayload } from "@/lib/types/reports.types";

// Fetch ledgers for dropdown/filter selection
export function useLedgerSearch() {
  const session = useSession();

  return useQuery({
    queryKey: ["ledgers", session?.user.currentSessionId],
    queryFn: () => {
      const sessionId = session?.user.currentSessionId ?? "";
      return reportsService.searchLedgers({
        sessionId,
        pageSize: 500,
        pageNumber: 0,
        groups: [16, 17], // Always fetch groups 16 and 17
        includeChildGroups: true,
      });
    },
    enabled: !!session?.user.currentSessionId,
    staleTime: 5 * 60 * 1000, // 5 minutes cache
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

// Ledger Outstanding Summary — POST with filters, fires on user action only.
export function useLedgerOutstandingSummary() {
  const session = useSession();

  return useMutation({
    mutationFn: (filters: Omit<LedgerOutstandingSummaryPayload, "sessionId">) => {
      const sessionId = session?.user.currentSessionId ?? "";
      return reportsService.getLedgerOutstandingSummary({ ...filters, sessionId });
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

// Ledger Register — POST with filters, fires on user action only.
export function useLedgerRegister() {
  const session = useSession();

  return useMutation({
    mutationFn: (filters: Omit<LedgerRegisterPayload, "sessionId">) => {
      const sessionId = session?.user.currentSessionId ?? "";
      return reportsService.getLedgerRegister({ ...filters, sessionId });
    },
  });
}
