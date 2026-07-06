"use client";

import { useMutation } from "@tanstack/react-query";
import { auth } from "@/lib/auth";
import { ledgerService } from "@/lib/api/ledger.service";
import { reportsService } from "@/lib/api/reports.service";
import type {
  LedgerSearchPayload,
  GroupSearchPayload,
} from "@/lib/types/reports.types";

export function useLedgerSearch() {
  return useMutation({
    mutationFn: (filters: Omit<LedgerSearchPayload, "sessionId" | "isSync" | "lastModifiedDate">) => {
      const sessionId = auth.getSessionId();
      if (!sessionId) throw new Error("No session");
      return ledgerService.search({
        ...filters,
        sessionId,
        isSync: false,
        lastModifiedDate: null,
      });
    },
  });
}

export function useGroupSearch() {
  return useMutation({
    mutationFn: (filters: Omit<GroupSearchPayload, "sessionId" | "lastModifiedDate" | "isSync">) => {
      const sessionId = auth.getSessionId();
      if (!sessionId) throw new Error("No session");
      return reportsService.searchGroups({
        ...filters,
        sessionId,
        lastModifiedDate: null,
        isSync: false,
      });
    },
  });
}
