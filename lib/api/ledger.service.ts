// ==================== Ledger Service ====================

import { apiClient } from "./client";
import type {
  LedgerSearchPayload,
  LedgerSearchResponse,
} from "@/lib/types/reports.types";
import type {
  LedgerDeletePayload,
  LedgerGetByIdPayload,
  LedgerLockPayload,
  LedgerSavePayload,
} from "@/lib/types/ledger.types";

export type { LedgerGetByIdPayload };

export const ledgerService = {
  search: (payload: LedgerSearchPayload) =>
    apiClient.post<LedgerSearchResponse>("/Ledger/Search", payload),
  getById: (payload: LedgerGetByIdPayload) =>
    apiClient.post<LedgerDetail>("/Ledger/GetById", payload),
  // The full record, untyped, for the master form (see lib/ledgers/ledger-form.ts).
  getRecord: (payload: LedgerGetByIdPayload) =>
    apiClient.post<Record<string, unknown>>("/Ledger/GetById", payload),
  create: (payload: LedgerSavePayload) =>
    apiClient.post<unknown>("/Ledger/Create", payload),
  update: (payload: LedgerSavePayload) =>
    apiClient.post<unknown>("/Ledger/Update", payload),
  delete: (payload: LedgerDeletePayload) =>
    apiClient.post<unknown>("/Ledger/Delete", payload),
  lock: (payload: LedgerLockPayload) =>
    apiClient.post<unknown>("/Ledger/LockLedger", payload),
};

/** Subset of the /Ledger/GetById response used for contact details. */
export interface LedgerDetail {
  name: string;
  phone_1: string | null;
  phone_2: string | null;
  mobile: string | null;
  whatsappNo: string | null;
}
