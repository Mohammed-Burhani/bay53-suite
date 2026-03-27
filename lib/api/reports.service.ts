// ==================== Reports Service ====================
// All report-related API calls

import { apiClient } from "./client";
import type {
  Ledger,
  LedgerSearchPayload,
  LedgerSearchResponse,
  LedgerOutstandingPayload,
  LedgerOutstandingItem,
  LedgerOutstandingSummaryPayload,
  LedgerOutstandingSummaryItem,
  ItemRegisterPayload,
  ItemRegisterItem,
  LedgerRegisterPayload,
  LedgerRegisterItem,
} from "@/lib/types/reports.types";

export const reportsService = {
  searchLedgers: async (payload: LedgerSearchPayload): Promise<Ledger[]> => {
    const response = await apiClient.post<LedgerSearchResponse>("/Ledger/Search", payload);
    return response.list || [];
  },

  getLedgerOutstanding: (payload: LedgerOutstandingPayload) =>
    apiClient.post<LedgerOutstandingItem[]>("/Report/LedgerOutstanding", payload),

  getLedgerOutstandingSummary: (payload: LedgerOutstandingSummaryPayload) =>
    apiClient.post<LedgerOutstandingSummaryItem[]>("/Report/LedgerOutstandingSummary", payload),

  getItemRegister: (payload: ItemRegisterPayload) =>
    apiClient.post<ItemRegisterItem[]>("/Report/ItemRegister", payload),

  getLedgerRegister: (payload: LedgerRegisterPayload) =>
    apiClient.post<{ list: LedgerRegisterItem[] }>("/Report/LedgerRegister", payload),
};
