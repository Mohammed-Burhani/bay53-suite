// ==================== Invoice Service ====================
// All invoice-related API calls

import { apiClient, type ApiRequestOptions } from "./client";
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
import type { Tnc, TncSearchPayload, ExtraCharge, ExtraChargeSearchPayload } from "@/lib/types/master.types";

export const invoiceService = {
  // Search invoices with filters
  searchInvoices: async (payload: InvoiceSearchPayload, opts?: ApiRequestOptions): Promise<InvoiceSearchResponse> => {
    return apiClient.post<InvoiceSearchResponse>("/Invoice/Search", payload, opts);
  },

  // Fetch a single invoice's full detail for the bill/preview view
  getInvoiceById: async (payload: InvoiceGetByIdPayload, opts?: ApiRequestOptions): Promise<InvoiceDetail> => {
    return apiClient.post<InvoiceDetail>("/Invoice/GetById", payload, opts);
  },

  // Fetch setup info (print/export templates, extra charges, etc.)
  getSetupInfo: async (payload: InvoiceSetupInfoPayload, opts?: ApiRequestOptions): Promise<InvoiceSetupInfoResponse> => {
    return apiClient.post<InvoiceSetupInfoResponse>("/Invoice/SetupInfo", payload, opts);
  },

  // ==================== Create Invoice ====================
  // POST /Invoice/Create - creates a new invoice
  createInvoice: async (payload: InvoiceCreatePayload, opts?: ApiRequestOptions): Promise<{ id: number; bill_No: string }> => {
    return apiClient.post<{ id: number; bill_No: string }>("/Invoice/Create", payload, opts);
  },

  // ==================== Delete Invoice ====================
  // POST /Invoice/Delete - deletes/cancels an invoice
  deleteInvoice: async (payload: InvoiceDeletePayload, opts?: ApiRequestOptions): Promise<void> => {
    await apiClient.post<void>("/Invoice/Delete", payload, opts);
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

  // ==================== TNC Master Search ====================
  // POST /Tnc/Search — fetch list of Terms & Conditions for dropdown
  searchTnc: async (payload: TncSearchPayload): Promise<Tnc[]> => {
    const response = await apiClient.post<{ list: Tnc[] } | Tnc[]>("/Tnc/Search", payload);
    return Array.isArray(response) ? response : (response.list || []);
  },

  // ==================== Extra Charge Master Search ====================
  // POST /ExtraCharge/Search — fetch list of extra charges/taxes for dropdown
  searchExtraCharge: async (payload: ExtraChargeSearchPayload): Promise<ExtraCharge[]> => {
    const response = await apiClient.post<{ list: ExtraCharge[] } | ExtraCharge[]>("/ExtraCharge/Search", payload);
    return Array.isArray(response) ? response : (response.list || []);
  },
};
