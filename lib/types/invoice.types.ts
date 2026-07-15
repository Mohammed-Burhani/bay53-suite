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

// Batch / stock-movement sub-detail nested under a line item.
export interface InvoiceItemSubDetail {
  subDetId: number;
  invDetId: number;
  new0_Against1: boolean;
  qty: number;
  effect: number;
  invCode: number;
  refName: string | null;
  invType: number;
  subDetIdRef: number | null;
  conversion: number;
  id: number | null;
  sessionId: string | null;
}

// A single line item exactly as returned by /Invoice/GetById.
// `amount` is the taxable value (post-discount, pre-tax); HSN code and unit
// name are NOT on this object — they live in `eInvoiceJson` (see below) and
// are merged in by the bill normalizer.
export interface InvoiceItemDetail {
  invDetID: number;
  invCode: number;
  sno: number;
  item_ID: number;
  sp_Code: number;
  mfrItemName: string | null;
  invType: number;
  std_Qty: number;
  conv_Qty: number;
  conv_Unit: number;
  std_Rate: number;
  conv_Rate: number;
  vatPer: number; // total GST rate for the line (e.g. 18)
  discount1: number; // percentages, applied cascading
  discount2: number;
  discount3: number;
  amount: number; // taxable value after discount, before tax
  cost_Rate: number;
  itemDescription: string | null;
  inventoryMoved: number;
  rateDiscount: number;
  cgstPercent: number;
  cgstAmount: number;
  sgstPercent: number;
  sgstAmount: number;
  igstPercent: number;
  igstAmount: number;
  vehicleWeigth: number;
  emptyBoxWeigth: number;
  totalWeigth: number;
  emptyBoxes: number;
  rackId: number | null;
  invoiceItemSubDetail: InvoiceItemSubDetail[] | null;
  currentStck: number;
  conversion: number;
  id: number | null;
  sessionId: string | null;
  [key: string]: unknown;
}

// Extra charge / tax line. For GST invoices these typically carry the CGST /
// SGST / IGST amounts as separate ledger postings; they can also represent
// freight, packing, etc. `effectOnTotal` of 1 adds to the grand total.
export interface InvoiceExtraCharge {
  extra_Charge_ID: number;
  taxType: number;
  perVal: number;
  charges: number;
  cstPer: number;
  vatPer: number;
  amount: number;
  effectOnTotal: number;
  vatAssessValue: number;
  taxEffect: boolean;
  id: number | null;
  sessionId: string | null;
  [key: string]: unknown;
}

// Full invoice detail returned by /Invoice/GetById.
// Forward-compatible: any extra fields are preserved by the index signature.
export interface InvoiceDetail {
  inv_Type: number;
  spCode: number;
  ledger_ID: number;
  invoiceNo: number;
  bill_No: string;
  date: string;

  invoiceItemDetail: InvoiceItemDetail[] | null;
  invoiceExtraCharges: InvoiceExtraCharge[] | null;
  invoiceTncMap: unknown;
  vouchLedgerDetails: unknown;

  // Money / totals
  item_SubTotal: number; // sum of line taxable amounts
  extra_SubTotal: number; // sum of extra charges (often = total GST)
  grandTotal: number;
  roundOff: number;
  profit: number;

  // Payment / refs
  voucherId: number | null;
  recBy: string | null;
  dueDays: number;
  footerXML: unknown[];

  // GST e-invoice (IRP) data
  eInvoiceJson: string | null; // JSON string; see EInvoiceEnvelope
  irn: string | null;
  irnSignedQRCode: string | null; // signed QR JWT to encode into the QR image

  taxableType: number;
  id: number; // == invCode
  sessionId: string | null;

  [key: string]: unknown;
}

// ==================== GST e-invoice (IRP) payload ====================
// `InvoiceDetail.eInvoiceJson` is a JSON string that parses into this envelope
// (the response returned by the NIC Invoice Registration Portal).
export interface EInvoiceEnvelope {
  data?: {
    AckNo?: number | string | null;
    AckDt?: string | null;
    Irn?: string | null;
    SignedInvoice?: string | null; // JWT; payload.data is a JSON string (EInvoiceDoc)
    SignedQRCode?: string | null; // JWT; payload.data is a JSON string (EInvoiceQrData)
    Status?: string | null;
    EwbNo?: string | null;
    EwbDt?: string | null;
    EwbValidTill?: string | null;
    Remarks?: string | null;
  } | null;
  status_cd?: string | null;
  status_desc?: string | null;
}

export interface EInvoiceParty {
  Gstin?: string;
  LglNm?: string;
  TrdNm?: string;
  Addr1?: string;
  Addr2?: string;
  Loc?: string;
  Pin?: number | string;
  Stcd?: string;
  Pos?: string;
  Ph?: string;
  Em?: string;
}

export interface EInvoiceLineItem {
  ItemNo?: number;
  SlNo?: string;
  IsServc?: string;
  PrdDesc?: string;
  HsnCd?: string;
  Qty?: number;
  Unit?: string;
  UnitPrice?: number;
  TotAmt?: number;
  Discount?: number;
  AssAmt?: number;
  GstRt?: number;
  IgstAmt?: number;
  CgstAmt?: number;
  SgstAmt?: number;
  TotItemVal?: number;
}

export interface EInvoiceValDtls {
  AssVal?: number;
  CgstVal?: number;
  SgstVal?: number;
  IgstVal?: number;
  Discount?: number;
  OthChrg?: number;
  RndOffAmt?: number;
  TotInvVal?: number;
}

// Decoded payload of the SignedInvoice JWT (the canonical IRP document).
export interface EInvoiceDoc {
  AckNo?: number | string;
  AckDt?: string;
  Irn?: string;
  Version?: string;
  TranDtls?: { TaxSch?: string; SupTyp?: string; IgstOnIntra?: string };
  DocDtls?: { Typ?: string; No?: string; Dt?: string };
  SellerDtls?: EInvoiceParty;
  BuyerDtls?: EInvoiceParty;
  ShipDtls?: EInvoiceParty;
  ItemList?: EInvoiceLineItem[];
  ValDtls?: EInvoiceValDtls;
}

// Decoded payload of the SignedQRCode JWT.
export interface EInvoiceQrData {
  SellerGstin?: string;
  BuyerGstin?: string;
  DocNo?: string;
  DocTyp?: string;
  DocDt?: string;
  TotInvVal?: number;
  ItemCnt?: number;
  MainHsnCode?: string;
  Irn?: string;
  IrnDt?: string;
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

// ==================== Invoice SetupInfo ====================
// Payload for POST /Invoice/SetupInfo
export interface InvoiceSetupInfoPayload {
  id: number; // invoiceCode (invCode)
  invType: number;
  sessionId: string;
  fromInvoice: boolean;
}

// Extra charge definition from SetupInfo
export interface SetupInfoExtraCharge {
  sequenceNo: number;
  extraCharges_ID: number;
  name: string;
  tax_Type: number;
  taxPercent: number;
  vatEffect: boolean;
  cstEffect: boolean;
  isPositiveEffect: boolean;
  percentBased: boolean;
  ledger_ID: number;
  description: string | null;
  fixedAmount: number;
  fixedPercent: number;
  salesLegderId: number | null;
  purchaseLegderId: number | null;
}

// Print report definition from SetupInfo
export interface PrintReport {
  fileName: string;
  reportName: string;
  isDefault: boolean;
  isVoucher: boolean;
  noOfCopies: number;
}

// Response from SetupInfo API
export interface InvoiceSetupInfoResponse {
  billingPlaces: unknown | null;
  stockPlaces: unknown | null;
  invTypeId: number;
  typeName: string;
  billNoEnable: boolean;
  category: number;
  stockEffect: number;
  vouchEffect: boolean;
  extraCharges: SetupInfoExtraCharge[];
  printReports: PrintReport[];
}

// ==================== Print Invoice API ====================
// Payload for POST https://printapi.bay53.in/api/Print/PrintInvoice
export interface PrintInvoicePayload {
  id: number; // invoiceCode
  invType: number;
  reportName: string; // Selected report from setupInfo.extraCharges
  sessionId: string;
  preCmd?: string;
  reportFormat?: string;
  noOfCopies?: number;
}

// Response from PrintInvoice API (returns PDF blob or URL)
export interface PrintInvoiceResponse {
  // Assuming API returns binary PDF or download URL
  // Adjust based on actual response format
  success?: boolean;
  url?: string;
  message?: string;
}
