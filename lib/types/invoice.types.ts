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
  date: string; // ISO format: "2026-04-01T11:53:51.2"
  partyName: string;
  gstNo?: string;
  invoiceType: number;
  stockPlace: string;
  spId: number;
  amount: number;
  recBy?: string; // Payment method: "Credit", "Cash", etc.
  city?: string;
  irn?: string;
  // Additional fields that might come from API
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
