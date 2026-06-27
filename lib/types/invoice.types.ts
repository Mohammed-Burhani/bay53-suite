// ==================== Invoice Types ====================
// Types for Invoice Search API

export interface InvoiceSearchPayload {
  sessionId: string;
  pageSize: number;
  pageNumber: number;
  invType: number; // 0 = All, specific type IDs for filtering
  toDate: string | null; // "DD/MM/YYYY HH:mm:ss" or null
  fromDate: string | null; // "DD/MM/YYYY HH:mm:ss" or null
  invoiceNo: number | null;
  bill_No: string | null;
  spIds: number[]; // Stock place IDs
  partyName: string | null;
  itemName: string | null;
}

export interface InvoiceSearchItem {
  // Core identifiers
  invCode: number;            // unique invoice id
  bill_No: string;            // displayed bill number, e.g. "HO/2026-27/52132"
  invoiceNo: number;          // numeric invoice number (e.g. 52132)
  inv_Type: number;           // invoice type id (1 = sales, etc.)
  ledger_ID: number;          // party / ledger id

  // Dates / refs
  date: string;               // ISO: "2026-06-01T11:00:03.1"
  poNumber?: string | null;
  poDate?: string | null;
  refPerson?: string | null;
  refPersonNo?: string | null;
  yourRefNo?: string | null;
  yourRefDate?: string | null;
  refNo?: string | null;
  refDate?: string | null;
  otherRefNo?: string | null;
  otherRefDate?: string | null;
  againstRefNo?: string | null;
  againstRefDate?: string | null;

  // Party
  partyName?: string | null;
  partyHasGST?: boolean;
  shipToName?: string | null;

  // Stock place
  spCode?: number | string | null;
  spName?: string | null;

  // Money
  item_SubTotal?: number;
  grandTotal: number;         // total invoice amount
  profit?: number;
  profitPer?: number;
  currRate?: number | string | null;
  currTotal?: number | string | null;
  compBaseCurr?: string | null;
  invoiceBaseCurr?: string | null;

  // Payment
  recBy?: string;             // "Credit", "Cash", etc.

  // GST / IRN
  gstNo?: string | null;
  irn?: string | null;

  // Authorization
  isAuthorized?: boolean;
  authorizedBy?: string | null;
  authorizedDate?: string | null;

  // Misc
  note?: string | null;
  remark?: string | null;
  transactionType?: number;
  transportBy?: string | null;
  inventorySPCode?: string | null;
  offline_Bill_No?: string | null;

  // Allow additional fields returned by the API
  [key: string]: string | number | boolean | null | undefined;
}

export interface InvoiceSearchResponse {
  list: InvoiceSearchItem[];
  deletes: any[] | null;
  totalCount: number;
}

// Invoice category types
export enum InvoiceCategory {
  All = 0,
  Sales = 1,
  Purchase = 2,
  Stock = 3,
}

// Common invoice type IDs (these may vary based on your setup)
export const INVOICE_TYPE_IDS = {
  SALES_INVOICE: 1,
  PURCHASE_INVOICE: 2,
  SALES_RETURN: 3,
  PURCHASE_RETURN: 4,
  STOCK_TRANSFER: 5,
  STOCK_ADJUSTMENT: 6,
} as const;
