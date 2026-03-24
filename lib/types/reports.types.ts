// ==================== Report Types ====================

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
