"use client";

// ==================== Reports Hooks ====================
// All report queries/mutations via TanStack React Query

import { useQuery, useMutation } from "@tanstack/react-query";
import { reportsService } from "@/lib/api/reports.service";
import { auth } from "@/lib/auth";
import type { 
  LedgerOutstandingPayload, 
  LedgerOutstandingSummaryPayload, 
  ItemRegisterPayload, 
  LedgerRegisterPayload, 
  Group,
  CurrentStockPayload,
  InventoryReportPayload,
  PendingItemsPayload,
} from "@/lib/types/reports.types";

// Fetch all ledgers for a group (no search term, fetch once)
export function useLedgersByGroup(groups?: number[]) {
  const sessionId = auth.getSessionId();

  return useQuery({
    queryKey: ["ledgers-by-group", sessionId, groups],
    queryFn: () => {
      if (!sessionId) throw new Error("No session");
      
      // If groups are provided, use them; if undefined, fetch all ledgers (empty array)
      const groupsToSearch = groups && groups.length > 0 ? groups : [];
      
      return reportsService.searchLedgers({
        sessionId,
        pageSize: 0, // 0 means fetch all
        pageNumber: 0,
        groups: groupsToSearch,
        includeChildGroups: true,
      });
    },
    enabled: !!sessionId,
    staleTime: 10 * 60 * 1000, // Cache for 10 minutes
  });
}

// Fetch ledgers for dropdown/filter selection (legacy - kept for backward compatibility)
export function useLedgerSearch(searchTerm: string = "", groups?: number[] | null) {
  const sessionId = auth.getSessionId();

  return useQuery({
    queryKey: ["ledgers", sessionId, searchTerm, groups],
    queryFn: () => {
      if (!sessionId) throw new Error("No session");
      
      // If groups is null, use empty array; if groups are provided, use them; otherwise default to [16, 17]
      const groupsToSearch = groups === null ? [] : (groups && groups.length > 0 ? groups : [16, 17]);
      
      return reportsService.searchLedgers({
        sessionId,
        pageSize: 0, // 0 means fetch all
        pageNumber: 0,
        groups: groupsToSearch,
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

export function useGroupSearch(childOf?: number[] | null) {
  const sessionId = auth.getSessionId();

  return useQuery<Group[]>({
    queryKey: ["groups", sessionId, childOf],
    queryFn: () => {
      if (!sessionId) throw new Error("No session");
      return reportsService.searchGroups({
        sessionId,
        pageSize: 0,
        pageNumber: 0,
        childOf: childOf ?? null,
        name: null,
        nature: null,
      });
    },
    enabled: !!sessionId,
    staleTime: 10 * 60 * 1000, // Cache for 10 minutes
  });
}

// ==================== Current Stock Hooks ====================

// Fetch all stock places for dropdown
export function useStockPlaces() {
  const sessionId = auth.getSessionId();

  return useQuery({
    queryKey: ["stock-places", sessionId],
    queryFn: () => {
      if (!sessionId) throw new Error("No session");
      return reportsService.searchStockPlaces({ sessionId, name: "", area: "", city: "", state: "", code: "", sp_ID: 0, canMakeBill: false, isStockPlace: false });
    },
    enabled: !!sessionId,
    staleTime: Infinity, // Cache indefinitely - stock places rarely change
    gcTime: Infinity, // Keep in cache forever
  });
}

// Fetch all items for dropdown - with aggressive caching
export function useItems() {
  const sessionId = auth.getSessionId();

  return useQuery({
    queryKey: ["items", sessionId],
    queryFn: () => {
      if (!sessionId) throw new Error("No session");
      return reportsService.searchItems({ sessionId });
    },
    enabled: !!sessionId,
    staleTime: Infinity, // Cache indefinitely - fetch once and store in memory
    gcTime: Infinity, // Keep in cache forever
  });
}

// Fetch current stock report
export function useCurrentStock() {
  return useMutation({
    mutationFn: (filters: Omit<CurrentStockPayload, "sessionId">) => {
      const sessionId = auth.getSessionId();
      if (!sessionId) throw new Error("No session");
      return reportsService.getCurrentStock({ ...filters, sessionId });
    },
  });
}

// ==================== Inventory Report Hooks ====================

// Fetch inventory report
export function useInventoryReport() {
  return useMutation({
    mutationFn: (filters: Omit<InventoryReportPayload, "sessionId">) => {
      const sessionId = auth.getSessionId();
      if (!sessionId) throw new Error("No session");
      return reportsService.getInventoryReport({ ...filters, sessionId });
    },
  });
}

// Fetch all invoice types for dropdown
export function useInvoiceTypes() {
  const sessionId = auth.getSessionId();

  return useQuery({
    queryKey: ["invoice-types", sessionId],
    queryFn: () => {
      if (!sessionId) throw new Error("No session");
      return reportsService.searchInvoiceTypes({ sessionId });
    },
    enabled: !!sessionId,
    staleTime: Infinity, // Cache indefinitely - invoice types rarely change
    gcTime: Infinity, // Keep in cache forever
  });
}

// ==================== Pending Items Hooks ====================

// Fetch pending items report
export function usePendingItems() {
  return useMutation({
    mutationFn: (filters: Omit<PendingItemsPayload, "sessionId">) => {
      const sessionId = auth.getSessionId();
      if (!sessionId) throw new Error("No session");
      return reportsService.getPendingItems({ ...filters, sessionId });
    },
  });
}
