// ==================== Ledger Service ====================

import { apiClient } from "./client";
import type {
  LedgerSearchPayload,
  LedgerSearchResponse,
} from "@/lib/types/reports.types";

export const ledgerService = {
  search: (payload: LedgerSearchPayload) =>
    apiClient.post<LedgerSearchResponse>("/Ledger/Search", payload),
};
