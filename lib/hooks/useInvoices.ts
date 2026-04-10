"use client";

// ==================== Invoice Hooks ====================
// All invoice queries/mutations via TanStack React Query

import { useMutation, useQuery } from "@tanstack/react-query";
import { invoiceService } from "@/lib/api/invoice.service";
import { auth } from "@/lib/auth";
import type { InvoiceSearchPayload } from "@/lib/types/invoice.types";

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
