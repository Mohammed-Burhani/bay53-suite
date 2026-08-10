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
  PrintInvoicePayload,
  PrintInvoiceResponse,
  InvoiceCreatePayload,
  InvoiceDeletePayload,
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

  // ==================== Create Invoice ====================
  // POST /Invoice/Create - creates a new invoice
  createInvoice: async (payload: InvoiceCreatePayload): Promise<{ id: number; bill_No: string }> => {
    return apiClient.post<{ id: number; bill_No: string }>("/Invoice/Create", payload);
  },

  // ==================== Delete Invoice ====================
  // POST /Invoice/Delete - deletes/cancels an invoice
  deleteInvoice: async (payload: InvoiceDeletePayload): Promise<void> => {
    await apiClient.post<void>("/Invoice/Delete", payload);
  },

  // Print invoice - call external print API
  printInvoice: async (payload: PrintInvoicePayload): Promise<Blob> => {
    const PRINT_API_BASE = "https://printapi.bay53.in/api";
    const response = await fetch(`${PRINT_API_BASE}/Print/PrintInvoice`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`Print API failed: ${response.statusText}`);
    }

    // Return PDF blob for download
    return response.blob();
  },
};
