"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { auth } from "@/lib/auth";
import { ledgerService } from "@/lib/api/ledger.service";
import { reportsService } from "@/lib/api/reports.service";
import type { LedgerSaveBody } from "@/lib/types/ledger.types";

// The ledger list comes from `useLedgersByGroup` (lib/hooks/useReports.ts),
// cached under ["ledgers-by-group", …]. Mutations here invalidate that prefix so
// the invoice/report ledger pickers refresh too.

export function useLedgerById(id: number | null) {
  return useQuery({
    queryKey: ["ledger", id],
    queryFn: () => {
      const sessionId = auth.getSessionId();
      if (!sessionId) throw new Error("No session");
      return ledgerService.getRecord({ id: id as number, sessionId });
    },
    enabled: typeof window !== "undefined" && !!auth.getSessionId() && !!id && id > 0,
    staleTime: 0,
  });
}

// All account groups, for the ledger's Group picker and the list's group filter.
export function useAllGroups() {
  const sessionId = auth.getSessionId();
  return useQuery({
    queryKey: ["groups-all", sessionId],
    queryFn: () => {
      if (!sessionId) throw new Error("No session");
      return reportsService.searchGroups({
        sessionId,
        pageSize: 0,
        pageNumber: 0,
        childOf: null,
        name: null,
        nature: null,
        isSync: false,
        lastModifiedDate: null,
      });
    },
    enabled: !!sessionId,
    staleTime: 10 * 60 * 1000,
  });
}

function useInvalidateLedgers() {
  const queryClient = useQueryClient();
  return (id?: number) => {
    queryClient.invalidateQueries({ queryKey: ["ledgers-by-group"] });
    queryClient.invalidateQueries({ queryKey: ["ledgers"] });
    if (id) queryClient.invalidateQueries({ queryKey: ["ledger", id] });
  };
}

export function useLedgerCreate() {
  const invalidate = useInvalidateLedgers();
  return useMutation({
    mutationFn: (data: LedgerSaveBody) => {
      const sessionId = auth.getSessionId();
      if (!sessionId) throw new Error("No session");
      return ledgerService.create({ ...data, sessionId });
    },
    onSuccess: () => invalidate(),
  });
}

export function useLedgerUpdate() {
  const invalidate = useInvalidateLedgers();
  return useMutation({
    mutationFn: (data: LedgerSaveBody) => {
      const sessionId = auth.getSessionId();
      if (!sessionId) throw new Error("No session");
      return ledgerService.update({ ...data, sessionId });
    },
    onSuccess: (_res, vars) => invalidate(vars.id),
  });
}

export function useLedgerDelete() {
  const invalidate = useInvalidateLedgers();
  return useMutation({
    mutationFn: (id: number) => {
      const sessionId = auth.getSessionId();
      if (!sessionId) throw new Error("No session");
      return ledgerService.delete({ id, sessionId });
    },
    onSuccess: () => invalidate(),
  });
}

export function useLedgerLock() {
  const invalidate = useInvalidateLedgers();
  return useMutation({
    mutationFn: ({ id, lockLedger }: { id: number; lockLedger: boolean }) => {
      const sessionId = auth.getSessionId();
      if (!sessionId) throw new Error("No session");
      return ledgerService.lock({ id, lockLedger, sessionId });
    },
    onSuccess: (_res, vars) => invalidate(vars.id),
  });
}
