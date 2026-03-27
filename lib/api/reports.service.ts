// ==================== Reports Service ====================
// All report-related API calls

import { apiClient } from "./client";
import type {
  Ledger,
  LedgerSearchPayload,
  LedgerSearchResponse,
  LedgerOutstandingPayload,
  LedgerOutstandingItem,
  ItemRegisterPayload,
  ItemRegisterItem,
} from "@/lib/types/reports.types";

export const reportsService = {
  searchLedgers: async (payload: LedgerSearchPayload): Promise<Ledger[]> => {
    const response = await apiClient.post<LedgerSearchResponse>("/Ledger/Search", payload);
    const ledgers = response.list || [];
    
    // Client-side filtering if searchTerm is provided (fallback if API doesn't support it)
    if (payload.searchTerm && payload.searchTerm.length >= 2) {
      const term = payload.searchTerm.toLowerCase();
      return ledgers.filter(
        (ledger) =>
          ledger.name.toLowerCase().includes(term) ||
          ledger.ledger_id.toString().includes(term) ||
          (ledger.group && ledger.group.toLowerCase().includes(term))
      );
    }
    
    return ledgers;
  },

  getLedgerOutstanding: (payload: LedgerOutstandingPayload) =>
    apiClient.post<LedgerOutstandingItem[]>("/Report/LedgerOutstanding", payload),

  getItemRegister: (payload: ItemRegisterPayload) =>
    apiClient.post<ItemRegisterItem[]>("/Report/ItemRegister", payload),
};
