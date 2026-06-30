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
  deletes: unknown[] | null;
  totalCount: number;
}

// ==================== Invoice GetById (detail) ====================
// Payload for POST /Invoice/GetById
export interface InvoiceGetByIdPayload {
  id: number; // invCode of the selected invoice row
  invType: number; // invoice type (1 = sales, 2 = purchase, etc.)
  sessionId: string;
  fromInvoice: boolean;
}

// A single line item on the invoice detail.
// The exact response shape is provided later by the API, so this stays
// permissive: common keys are typed as optional and the index signature
// keeps it forward-compatible. The preview component reads fields through
// defensive accessors that try several likely key names.
export interface InvoiceDetailItem {
  srNo?: number;
  itemName?: string | null;
  description?: string | null;
  hsn?: string | null;
  hsnCode?: string | null;
  qty?: number | null;
  quantity?: number | null;
  unit?: string | null;
  rate?: number | null;
  price?: number | null;
  discount?: number | null;
  discountPer?: number | null;
  taxPer?: number | null;
  taxAmount?: number | null;
  amount?: number | null;
  total?: number | null;
  [key: string]: string | number | boolean | null | undefined;
}

// Full invoice detail returned by /Invoice/GetById.
// Permissive by design (see note above). Known/likely fields are optional;
// any extra fields from the real response are preserved by the index signature.
export interface InvoiceDetail {
  invCode?: number;
  bill_No?: string | null;
  billNo?: string | null;
  invoiceNo?: number | null;
  inv_Type?: number | null;
  date?: string | null;
  invoiceDate?: string | null;

  // Company / issuer
  companyName?: string | null;
  companyAddress?: string | null;
  companyGST?: string | null;
  companyPhone?: string | null;
  companyEmail?: string | null;

  // Party
  partyName?: string | null;
  partyAddress?: string | null;
  partyGST?: string | null;
  gstNo?: string | null;
  shipToName?: string | null;
  shipToAddress?: string | null;

  // Stock place
  spName?: string | null;

  // Money / totals
  item_SubTotal?: number | null;
  subTotal?: number | null;
  totalDiscount?: number | null;
  taxableAmount?: number | null;
  cgst?: number | null;
  sgst?: number | null;
  igst?: number | null;
  roundOff?: number | null;
  grandTotal?: number | null;

  // Payment / refs / misc
  recBy?: string | null;
  irn?: string | null;
  note?: string | null;
  remark?: string | null;

  // Line items (one of these arrays is expected; accessors check each)
  items?: InvoiceDetailItem[];
  itemList?: InvoiceDetailItem[];
  invoiceItems?: InvoiceDetailItem[];
  invoiceDetails?: InvoiceDetailItem[];
  details?: InvoiceDetailItem[];
  lineItems?: InvoiceDetailItem[];

  // Forward-compatible: preserve any extra fields from the real response.
  [key: string]: unknown;
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
