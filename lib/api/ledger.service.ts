// ==================== Ledger Service ====================

import { apiClient } from "./client";
import type {
  LedgerSearchPayload,
  LedgerSearchResponse,
} from "@/lib/types/reports.types";


export const ledgerService = {
  search: (payload: LedgerSearchPayload) =>
    apiClient.post<LedgerSearchResponse>("/Ledger/Search", payload),
  getById: (payload: LedgerGetByIdPayload) =>
    apiClient.post<LedgerDetail>("/Ledger/GetById", payload),
};

export interface LedgerGetByIdPayload {
  id: number;
  sessionId: string;
}

/** Subset of the /Ledger/GetById response used for contact details. */
export interface LedgerDetail {
  name: string;
  phone_1: string | null;
  phone_2: string | null;
  mobile: string | null;
  whatsappNo: string | null;
}
