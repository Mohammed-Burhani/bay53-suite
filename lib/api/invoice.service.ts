// ==================== Invoice Service ====================
// All invoice-related API calls

import { apiClient } from "./client";
import type {
  InvoiceSearchPayload,
  InvoiceSearchResponse,
  InvoiceGetByIdPayload,
  InvoiceDetail,
  InvoiceSetupInfoPayload,
  InvoiceSetupInfoResponse,
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

  // Fetch setup info (print/export templates, extra charges, etc.)
  getSetupInfo: async (payload: InvoiceSetupInfoPayload): Promise<InvoiceSetupInfoResponse> => {
    return apiClient.post<InvoiceSetupInfoResponse>("/Invoice/SetupInfo", payload);
  },
};
