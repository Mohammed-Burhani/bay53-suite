"use client";

// ==================== Invoice Hooks ====================
// All invoice queries/mutations via TanStack React Query

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { invoiceService } from "@/lib/api/invoice.service";
import { auth } from "@/lib/auth";
import type { InvoiceSearchPayload, InvoiceDetail, InvoiceCreatePayload, InvoiceDeletePayload } from "@/lib/types/invoice.types";
import type { TncSearchPayload, ExtraChargeSearchPayload, Tnc, ExtraCharge } from "@/lib/types/master.types";

// Search invoices with mutation (for on-demand filtering)
export function useInvoiceSearch() {
  return useMutation({
    mutationFn: (filters: Omit<InvoiceSearchPayload, "sessionId">) => {
      const sessionId = auth.getSessionId();
      if (!sessionId) throw new Error("No session");
      return invoiceService.searchInvoices({ ...filters, sessionId });
    },
  });
}

// Fetch invoices with query (for auto-loading with default filters)
export function useInvoices(filters: Omit<InvoiceSearchPayload, "sessionId">) {
  const sessionId = auth.getSessionId();

  return useQuery({
    queryKey: ["invoices", sessionId, filters],
    queryFn: () => {
      if (!sessionId) throw new Error("No session");
      return invoiceService.searchInvoices({ ...filters, sessionId });
    },
    enabled: !!sessionId,
    staleTime: 2 * 60 * 1000, // Cache for 2 minutes
  });
}

// Fetch a single invoice's full detail (for the bill/preview popup).
// Triggered on demand: pass `enabled` (e.g. dialog open) to control fetching.
export function useInvoiceById(
  id: number | null | undefined,
  invType: number,
  enabled: boolean = true
) {
  const sessionId = auth.getSessionId();

  return useQuery<InvoiceDetail>({
    queryKey: ["invoice-detail", sessionId, id, invType],
    queryFn: () => {
      if (!sessionId) throw new Error("No session");
      if (!id || id <= 0) throw new Error("Invalid invoice id");
      return invoiceService.getInvoiceById({
        id,
        invType,
        sessionId,
        fromInvoice: true,
      });
    },
    enabled: !!sessionId && !!id && id > 0 && enabled,
    staleTime: 2 * 60 * 1000, // Cache for 2 minutes
  });
}

// ==================== Invoice Create Mutation ====================
// Hook for creating a new invoice via POST /Invoice/Create
export function useInvoiceCreate() {
  const sessionId = auth.getSessionId();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: Omit<InvoiceCreatePayload, "sessionId">) => {
      if (!sessionId) throw new Error("No session");
      return invoiceService.createInvoice({ ...payload, sessionId });
    },
    onSuccess: () => {
      // Invalidate invoice lists so they refetch
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
    },
  });
}

// ==================== Invoice Delete Mutation ====================
// Hook for deleting an invoice via POST /Invoice/Delete
export function useInvoiceDelete() {
  const sessionId = auth.getSessionId();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: Omit<InvoiceDeletePayload, "sessionId">) => {
      if (!sessionId) throw new Error("No session");
      return invoiceService.deleteInvoice({ ...payload, sessionId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
    },
  });
}

// ==================== TNC Master Search ====================
// Hook for searching TNC (Terms & Conditions) master records
export function useTncSearch(searchTerm: string = "") {
  const sessionId = auth.getSessionId();
  const debouncedTerm = searchTerm.trim(); // no debounce here; UI can debounce if needed

  return useQuery<Tnc[]>({
    queryKey: ["tnc-search", sessionId, debouncedTerm],
    queryFn: async () => {
      if (!sessionId) throw new Error("No session");
      return invoiceService.searchTnc({
        sessionId,
        pageSize: 0, // fetch all
        pageNumber: 0,
        isSync: false,
        lastModifiedDate: new Date().toISOString(),
        text: debouncedTerm,
      });
    },
    enabled: !!sessionId,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    placeholderData: (previousData) => previousData, // keep old results while typing
  });
}

// ==================== Extra Charge Master Search ====================
// Hook for searching Extra Charge master records
export function useExtraChargeSearch(searchTerm: string = "") {
  const sessionId = auth.getSessionId();
  const debouncedTerm = searchTerm.trim();

  return useQuery<ExtraCharge[]>({
    queryKey: ["extra-charge-search", sessionId, debouncedTerm],
    queryFn: async () => {
      if (!sessionId) throw new Error("No session");
      return invoiceService.searchExtraCharge({
        sessionId,
        pageSize: 0, // fetch all
        pageNumber: 0,
        isSync: false,
        lastModifiedDate: new Date().toISOString(),
      });
    },
    enabled: !!sessionId && debouncedTerm.length > 0, // only run when search has text
    staleTime: 30 * 60 * 1000, // Cache for 30 minutes (rarely changes)
    placeholderData: (previousData) => previousData, // keep old results while typing
  });
}
