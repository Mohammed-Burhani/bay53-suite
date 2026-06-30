// ==================== Invoice Service ====================
// All invoice-related API calls

import { apiClient } from "./client";
import type {
  InvoiceSearchPayload,
  InvoiceSearchResponse,
  InvoiceGetByIdPayload,
  InvoiceDetail,
} from "@/lib/types/invoice.types";

export const invoiceService = {
  // Search invoices with filters
  searchInvoices: async (payload: InvoiceSearchPayload): Promise<InvoiceSearchResponse> => {
    return apiClient.post<InvoiceSearchResponse>("/Invoice/Search", payload);
  },

  // Fetch a single invoice's full detail for the bill/preview view
  getInvoiceById: async (payload: InvoiceGetByIdPayload): Promise<InvoiceDetail> => {
    return apiClient.post<InvoiceDetail>("/Invoice/GetById", payload);
  },
};
