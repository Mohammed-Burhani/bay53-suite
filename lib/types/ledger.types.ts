// ==================== Ledger Master Types ====================
// Shapes for POST /Ledger/Create, /Ledger/Update, /Ledger/GetById, /Ledger/Delete
// and /Ledger/LockLedger. Request shapes come from the backend swagger
// (LedgerCreateViewModel); GetById is read defensively because the swagger
// documents no response bodies.

export interface LedgerGetByIdPayload {
  id: number;
  sessionId: string;
}

export interface LedgerDeletePayload {
  id: number;
  sessionId: string;
}

export interface LedgerLockPayload {
  id: number;
  sessionId: string;
  lockLedger: boolean;
}

// Create/update body. Only the fields the form edits are typed; everything else
// on the record (state/country ids, GST type, opening details, …) is carried
// through from GetById by `buildLedgerPayload`.
export interface LedgerSaveBody {
  id: number;
  name: string;
  group_ID: number;
  partyCode: string;
  partyType: number;
  contact_Person: string;
  mobile: string;
  phone_1: string;
  phone_2: string;
  whatsappNo: string;
  email: string;
  website: string;
  fax: string;
  address: string;
  shipAddress: string;
  area: string;
  city: string;
  pinCode: string;
  gstNo: string;
  panNo: string;
  tinV: string;
  tanNo: string;
  isIndividual: boolean;
  isHeadOffice: boolean;
  isBranchOffice: boolean;
  gstType: number;
  state: number;
  country: number;
  opening_Date?: string;
  opening_Bal: number;
  isCr: boolean;
  credit_Limit: number;
  creditDays: number;
  lock_Freeze: boolean;
  ledgerBankName: string;
  ledgerBankBranch: string;
  ledgerBankAccount: string;
  ledgerBankIFSC: string;
  transportBy: string;
  vendorCode: string;
  created_Date: string;
  modified_Date: string;
}

export type LedgerSavePayload = LedgerSaveBody & { sessionId: string };

// Form state. Numbers are strings so inputs can be empty while typing.
export interface LedgerFormValues {
  name: string;
  group_ID: number | null;
  partyCode: string;
  partyType: number;
  contact_Person: string;
  mobile: string;
  phone_1: string;
  phone_2: string;
  whatsappNo: string;
  email: string;
  website: string;
  fax: string;
  address: string;
  shipAddress: string;
  area: string;
  city: string;
  pinCode: string;
  gstNo: string;
  panNo: string;
  tinV: string;
  tanNo: string;
  isIndividual: boolean; // false = Business
  isHeadOffice: boolean;
  isBranchOffice: boolean;
  gstType: number;
  state: number; // 0 = not set
  country: number;
  opening_Date: string; // yyyy-MM-dd, "" when unset
  opening_Bal: string;
  isCr: boolean;
  credit_Limit: string;
  creditDays: string;
  lock_Freeze: boolean;
  ledgerBankName: string;
  ledgerBankBranch: string;
  ledgerBankAccount: string;
  ledgerBankIFSC: string;
  transportBy: string;
  vendorCode: string;
}

// Matches how the previous Ledger screen labelled `partyType` (1 customer, 2 supplier).
export const PARTY_TYPE_OPTIONS = [
  { value: 0, label: "Other" },
  { value: 1, label: "Customer" },
  { value: 2, label: "Supplier" },
] as const;

// Assumed enum for `gstType` (the old screen's "Type" dropdown defaults to IntraState).
export const GST_TYPE_OPTIONS = [
  { value: 0, label: "IntraState" },
  { value: 1, label: "InterState" },
] as const;
