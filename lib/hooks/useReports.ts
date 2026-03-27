"use client";

// ==================== Reports Hooks ====================
// All report queries/mutations via TanStack React Query

import { useQuery, useMutation } from "@tanstack/react-query";
import { reportsService } from "@/lib/api/reports.service";
import { useSession } from "@/lib/hooks/useAuth";
import type { LedgerOutstandingPayload, ItemRegisterPayload } from "@/lib/types/reports.types";

// Fetch ledgers for dropdown/filter selection with search
export function useLedgerSearch(searchTerm: string) {
  const session = useSession();

  return useQuery({
    queryKey: ["ledgers", session?.user.currentSessionId, searchTerm],
    queryFn: () => {
      const sessionId = session?.user.currentSessionId ?? "";
      return reportsService.searchLedgers({
        sessionId,
        pageSize: 100, // Limit to 100 results for performance
        pageNumber: 0,
        groups: [16, 17], // Groups for LedgerOutstanding
        includeChildGroups: true,
        searchTerm: searchTerm.trim(),
      });
    },
    enabled: !!session?.user.currentSessionId && searchTerm.length >= 2, // Only search when 2+ chars
    staleTime: 30 * 1000, // 30 seconds for search results
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
