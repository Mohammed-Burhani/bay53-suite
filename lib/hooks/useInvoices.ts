"use client";

// ==================== Invoice Hooks ====================
// All invoice queries/mutations via TanStack React Query

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { invoiceService } from "@/lib/api/invoice.service";
import { auth } from "@/lib/auth";
import type { InvoiceSearchPayload, InvoiceDetail, InvoiceCreatePayload, InvoiceDeletePayload } from "@/lib/types/invoice.types";
import type { TncSearchPayload, ExtraChargeSearchPayload, Tnc, ExtraCharge } from "@/lib/types/master.types";
import { recordActivity } from "@/lib/activity-log/recorder";
import { invoiceDiff, invoiceSnapshot } from "@/lib/activity-log/invoice-changes";

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
// Hook for creating a new invoice via POST /Invoice/Create. An edit re-posts to the same
// endpoint with the existing id. Create and the list refresh after it are logged as one activity.
export function useInvoiceCreate() {
  const sessionId = auth.getSessionId();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: Omit<InvoiceCreatePayload, "sessionId">) => {
      if (!sessionId) throw new Error("No session");
      const editing = payload.id > 0;
      const full = { ...payload, sessionId };
      // The edit form loaded this invoice through useInvoiceById, so the old version is cached.
      const before = editing
        ? queryClient.getQueryData<InvoiceDetail>(["invoice-detail", sessionId, payload.id, payload.inv_Type])
        : undefined;
      const verb = editing ? "Updated" : "Created";

      return recordActivity(
        {
          module: "invoice",
          action: editing ? "invoice.updated" : "invoice.created",
          importance: editing ? "important" : "info",
          entity_type: "invoice",
          entity_id: editing ? String(payload.id) : null,
          entity_label: payload.bill_No || null,
          inv_type: payload.inv_Type,
          changes: editing ? invoiceDiff(before, full) : invoiceSnapshot(full),
        },
        async (trace) => {
          const result = await invoiceService.createInvoice(full, { trace });
          // Refresh the list with current month filters
          await invoiceService.searchInvoices(currentMonthSearch(sessionId, payload.inv_Type), { trace });
          return result;
        },
        (result) => {
          const billNo = result?.bill_No || payload.bill_No || null;
          return {
            entity_id: String(result?.id || payload.id || "") || null,
            entity_label: billNo,
            summary: `${verb} ${billNo ?? "invoice"}${payload.shipToName ? ` for ${payload.shipToName}` : ""}, total ${payload.grandTotal}`,
          };
        }
      );
    },
    onSuccess: () => {
      // Invalidate invoice lists so they refetch
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
    },
  });
}

function currentMonthSearch(sessionId: string, invType: number): InvoiceSearchPayload {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  return {
    sessionId,
    pageSize: 0,
    pageNumber: 0,
    invType,
    fromDate: startOfMonth.toISOString().split("T")[0],
    toDate: endOfMonth.toISOString().split("T")[0],
    invoiceNo: null,
    bill_No: 0,
    spIds: [0],
    partyName: null,
    itemName: null,
  };
}

// ==================== Invoice Delete Mutation ====================
// Hook for deleting an invoice via POST /Invoice/Delete. `log` carries what the caller knows
// about the invoice, because after the delete it can no longer be fetched for the log.
export interface InvoiceDeleteVariables extends Omit<InvoiceDeletePayload, "sessionId"> {
  log?: { bill_No?: string | null; partyName?: string | null; date?: string | null; grandTotal?: number | null };
}

export function useInvoiceDelete() {
  const sessionId = auth.getSessionId();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ log, ...payload }: InvoiceDeleteVariables) => {
      if (!sessionId) throw new Error("No session");
      const label = log?.bill_No || `#${payload.id}`;
      return recordActivity(
        {
          module: "invoice",
          action: "invoice.deleted",
          importance: "critical",
          entity_type: "invoice",
          entity_id: String(payload.id),
          entity_label: log?.bill_No ?? null,
          inv_type: payload.invType,
          changes: log ? { snapshot: log } : null,
          summary: `Deleted ${label}${log?.partyName ? ` for ${log.partyName}` : ""}`,
        },
        (trace) => invoiceService.deleteInvoice({ ...payload, sessionId }, { trace })
      );
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

// Hook for loading the full Extra Charge master list (no search term) — the
// invoice form lists every charge up front and lets the user switch on the ones needed.
export function useExtraCharges() {
  const sessionId = auth.getSessionId();

  return useQuery<ExtraCharge[]>({
    queryKey: ["extra-charges-all", sessionId],
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
    enabled: !!sessionId,
    staleTime: 30 * 60 * 1000, // rarely changes
  });
}
