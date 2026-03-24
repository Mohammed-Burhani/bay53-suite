// ==================== Reports Service ====================
// All report-related API calls

import { apiClient } from "./client";
import type {
  LedgerOutstandingPayload,
  LedgerOutstandingItem,
} from "@/lib/types/reports.types";

export const reportsService = {
  getLedgerOutstanding: (payload: LedgerOutstandingPayload) =>
    apiClient.post<LedgerOutstandingItem[]>("/Report/LedgerOutstanding", payload),
};
