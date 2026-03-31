"use client";

// ==================== Reports Hooks ====================
// All report queries/mutations via TanStack React Query

import { useQuery, useMutation } from "@tanstack/react-query";
import { reportsService } from "@/lib/api/reports.service";
import { auth } from "@/lib/auth";
import type { LedgerOutstandingPayload, LedgerOutstandingSummaryPayload, ItemRegisterPayload, LedgerRegisterPayload, Group } from "@/lib/types/reports.types";

// Fetch ledgers for dropdown/filter selection
export function useLedgerSearch(searchTerm: string = "", groups?: number[]) {
  const sessionId = auth.getSessionId();

  return useQuery({
    queryKey: ["ledgers", sessionId, searchTerm, groups],
    queryFn: () => {
      if (!sessionId) throw new Error("No session");
      return reportsService.searchLedgers({
        sessionId,
        pageSize: 500,
        pageNumber: 0,
        groups: groups && groups.length > 0 ? groups : [16, 17],
        includeChildGroups: true,
      });
    },
    enabled: !!sessionId && searchTerm.length >= 2,
    staleTime: 5 * 60 * 1000,
  });
}

export function useLedgerOutstanding() {
  return useMutation({
    mutationFn: (filters: Omit<LedgerOutstandingPayload, "sessionId">) => {
      const sessionId = auth.getSessionId();
      if (!sessionId) throw new Error("No session");
      return reportsService.getLedgerOutstanding({ ...filters, sessionId });
    },
  });
}

export function useLedgerOutstandingSummary() {
  return useMutation({
    mutationFn: (filters: Omit<LedgerOutstandingSummaryPayload, "sessionId">) => {
      const sessionId = auth.getSessionId();
      if (!sessionId) throw new Error("No session");
      return reportsService.getLedgerOutstandingSummary({ ...filters, sessionId });
    },
  });
}

export function useItemRegister() {
  return useMutation({
    mutationFn: (filters: Omit<ItemRegisterPayload, "sessionId">) => {
      const sessionId = auth.getSessionId();
      if (!sessionId) throw new Error("No session");
      return reportsService.getItemRegister({ ...filters, sessionId });
    },
  });
}

export function useLedgerRegister() {
  return useMutation({
    mutationFn: (filters: Omit<LedgerRegisterPayload, "sessionId">) => {
      const sessionId = auth.getSessionId();
      if (!sessionId) throw new Error("No session");
      return reportsService.getLedgerRegister({ ...filters, sessionId });
    },
  });
}

export function useGroupSearch() {
  const sessionId = auth.getSessionId();

  return useQuery<Group[]>({
    queryKey: ["groups", sessionId],
    queryFn: () => {
      if (!sessionId) throw new Error("No session");
      return reportsService.searchGroups({ sessionId });
    },
    enabled: !!sessionId,
    staleTime: 10 * 60 * 1000, // Cache for 10 minutes
  });
}
