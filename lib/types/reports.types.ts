// ==================== Report Types ====================

// --- Ledger ---

export interface Ledger {
  name: string;
  group: string | null;
  address: string | null;
  state: string | null;
  contactInfo: string | null;
  panNo: string | null;
  gstNo: string | null;
  lock_Freeze: boolean;
  ledger_id: number;
  partyType: number;
  modified_Date: string;
}

export interface LedgerSearchPayload {
  sessionId: string;
}

// --- Ledger Outstanding ---

export interface LedgerOutstandingPayload {
  sessionId: string;
  ledgers: number[];
  detailed: boolean;
  salesman: number | null;
  fromDate: string; // "DD/MM/YYYY HH:mm:ss"
  toDate: string;
}

export interface LedgerOutstandingVoucher {
  billNo: string;
  date: string;
  invtype: string;
  amount: string;
}

export interface LedgerOutstandingItem {
  billNo: string;
  date: string;
  opening: number;
  openingDrCr: string;
  pending: number;
  pendingDrCr: string;
  voucher: LedgerOutstandingVoucher[];
  ledgerDrCr: string;
  ledgerId: number;
  party: string;
  group: string;
  address: string;
  phone1: string;
  phone2: string;
  mobile: string | null;
  invCode: number;
  compBaseCurr: number;
  invoiceBaseCurr: number;
  currRate: number;
  currTotal: number;
  dueOn: string;
  overDue: number;
  isPDC: boolean;
  projectSite: number;
  invType: number;
}

// --- Item Register ---

export interface ItemRegisterPayload {
  sessionId: string;
  fromDate: string; // "DD/MM/YYYY HH:mm:ss"
  toDate: string;
  itemId: number;
  isOpeningStock: boolean;
  spIds: number[];
  stockDetail: boolean;
  includeInternalMov: boolean;
  mfrItemName: string;
}

export interface ItemRegisterItem {
  Type: string;           // "Opening" | "Closing" | transaction type
  Party: string | null;
  BillDate: string | null;
  BillNo: string | null;
  StockPlace: string | null;
  Received: number | null;
  Issued: number | null;
  Balance: number | null;
  LedgerId: number | null;
  TypeId: number | null;
  Invcode: number | null;
  Rate: number | null;
  Discount1: number | null;
  Discount2: number | null;
  Discount3: number | null;
  NetRate: number | null;
  BOMCode: string | null;
  BOMName: string | null;
}
