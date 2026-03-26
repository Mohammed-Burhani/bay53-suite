// ==================== Reports Service ====================
// All report-related API calls

import { apiClient } from "./client";
import type {
  Ledger,
  LedgerSearchPayload,
  LedgerOutstandingPayload,
  LedgerOutstandingItem,
  ItemRegisterPayload,
  ItemRegisterItem,
} from "@/lib/types/reports.types";

export const reportsService = {
  searchLedgers: (payload: LedgerSearchPayload) =>
    apiClient.post<Ledger[]>("/Ledger/Search", payload),

  getLedgerOutstanding: (payload: LedgerOutstandingPayload) =>
    apiClient.post<LedgerOutstandingItem[]>("/Report/LedgerOutstanding", payload),

  getItemRegister: (payload: ItemRegisterPayload) =>
    apiClient.post<ItemRegisterItem[]>("/Report/ItemRegister", payload),
};
