// ==================== TNC & Extra Charge Master Search ====================
// Types for POST /Tnc/Search and POST /ExtraCharge/Search — used to populate
// the invoice form's Terms & Conditions and Extra Charges dropdowns.

export interface TncSearchPayload {
  sessionId: string;
  pageSize: number;
  pageNumber: number;
  isSync: boolean;
  lastModifiedDate: string;
  text: string;
}

// A single TNC (terms & conditions) master record. Field names beyond the
// id/name are kept loose since the API shape is forward-compatible.
export interface Tnc {
  tncID: number;
  name: string;
  description?: string | null;
  text?: string | null;
  [key: string]: unknown;
}

export interface ExtraChargeSearchPayload {
  sessionId: string;
  pageSize: number;
  pageNumber: number;
  isSync: boolean;
  lastModifiedDate: string;
}

// A single Extra Charge / tax master record. Mirrors the shape returned by
// /Invoice/SetupInfo.extraCharges (extraCharges_ID, name, taxPercent, ...).
export interface ExtraCharge {
  extraCharges_ID: number;
  name: string;
  taxType?: number; // API returns taxType
  tax_Type?: number; // legacy field
  taxPercent?: number;
  vatPercent?: number;
  percentBased?: boolean;
  fixedAmount?: number;
  fixedPercent?: number;
  isPositiveEffect?: boolean;
  vatEffect?: boolean;
  cstEffect?: boolean;
  description?: string | null;
  [key: string]: unknown;
}
