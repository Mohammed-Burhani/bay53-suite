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
  invCode: number;
  billNo: string;
  billDate: string;
  partyName: string;
  party_ID: number;
  invType: string;
  invTypeId: number;
  stockPlace: string;
  sp_ID: number;
  totalAmount: number;
  taxAmount: number;
  grandTotal: number;
  paidAmount: number;
  balanceAmount: number;
  status: string; // "Paid", "Partial", "Unpaid"
  createdBy: string;
  createdDate: string;
  modifiedDate: string;
  note: string | null;
  // Additional fields that might come from API
  [key: string]: string | number | boolean | null | undefined;
}

export interface InvoiceSearchResponse {
  list: InvoiceSearchItem[];
  totalRecords: number;
  pageNumber: number;
  pageSize: number;
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
