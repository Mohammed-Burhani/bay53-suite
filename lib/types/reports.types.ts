// ==================== Report Types ====================

// --- Ledger ---

export interface Ledger {
  name: string;
  group_id: number;
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
  pageSize: number;
  pageNumber: number;
  groups: number[];
  includeChildGroups: boolean;
}

export interface LedgerSearchResponse {
  list: Ledger[];
  deletes: any[] | null;
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

// --- Ledger Outstanding Summary ---

export interface LedgerOutstandingSummaryPayload {
  sessionId: string;
  ledgers: number[];
  toDate: string; // "DD/MM/YYYY HH:mm:ss"
}

export interface LedgerOutstandingSummaryItem {
  Party: string;
  Area: string;
  City: string;
  Phone1: string;
  Phone2: string;
  Mobile: string | null;
  "Contact No.": string;
  "Pending Amount": number;
  DrCr: string;
  Address: string;
  Pin: string;
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

// --- Ledger Register ---

export interface LedgerRegisterPayload {
  from: string; // "DD/MM/YYYY HH:mm:ss"
  to: string;
  ledgerId: number;
  runningBalance: boolean;
  openingBalance: boolean;
  billDetails: boolean;
  bankDetails: boolean;
  sessionId: string;
}

export interface BillDetail {
  subType: string;
  name: string;
  amount: string;
  iscr: string;
}

export interface BankDetail {
  paymentMode: string | null;
  bankName: string | null;
  branch: string | null;
  chequeDate: string | null;
  chequeNumber: string | null;
  amount: number | null;
}

export interface LedgerRegisterItem {
  billNo: string | null;
  billDate: string | null;
  particular: string | null;
  type: string;
  billDetails: BillDetail[] | null;
  debit: number | null;
  credit: number | null;
  running: number | null;
  drCr: string;
  bankDetails: BankDetail[] | null;
  note: string | null;
  invVchId: number | null;
  invVchType: number | null;
  madeFromInvoice: boolean | null;
  isCr: boolean;
  paymentMode: string | null;
  bankName: string | null;
  branch: string | null;
  chequeDate: string | null;
  chequeNumber: string | null;
  amount: number | null;
  againstType: string | null;
  againstRefno: string | null;
  projectSite: string | null;
  compBaseCurr: number;
  invoiceBaseCurr: number;
  currRate: number;
  currTotal: number;
}
