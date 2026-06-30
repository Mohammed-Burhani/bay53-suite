// ==================== Bill View Model ====================
// Pure, framework-free normalizer that turns the raw /Invoice/GetById response
// (plus the search-row we already have) into a clean, render-ready bill.
//
// The richest source of GST data lives inside `eInvoiceJson` — a JSON string
// returned by the NIC IRP that itself contains two signed JWTs:
//   • SignedInvoice  → payload.data (JSON) = the canonical tax invoice
//   • SignedQRCode   → payload.data (JSON) = the QR summary
// We decode those to recover seller/buyer details, HSN codes, unit names and
// the assessable/tax breakup, then reconcile against the top-level totals.
//
// This module has NO runtime dependencies (type-only imports), so it is trivial
// to unit-test and safe to import on both server and client.

import type {
  InvoiceDetail,
  InvoiceSearchItem,
  EInvoiceEnvelope,
  EInvoiceDoc,
  EInvoiceParty,
  EInvoiceQrData,
} from "@/lib/types/invoice.types";

// ---------------------------------------------------------------------------
// View-model shape consumed by the UI
// ---------------------------------------------------------------------------
export interface BillParty {
  name: string | null;
  gstin: string | null;
  address: string | null;
  stateCode: string | null;
  stateName: string | null;
  /** Place-of-supply state code (buyer only). */
  pos: string | null;
}

export interface BillItem {
  sno: number;
  description: string;
  hsn: string | null;
  qty: number;
  unit: string | null;
  rate: number;
  /** qty × rate, before discount. */
  grossAmount: number;
  /** Headline discount % when a single tier is used; null for cascading. */
  discountPercent: number | null;
  discountAmount: number;
  /** Taxable value: post-discount, pre-tax. */
  taxableAmount: number;
  /** Total GST rate for the line, e.g. 18. */
  gstRate: number | null;
  cgstPercent: number;
  cgstAmount: number;
  sgstPercent: number;
  sgstAmount: number;
  igstPercent: number;
  igstAmount: number;
  /** Taxable + all taxes. */
  lineTotal: number;
}

export interface BillTotals {
  taxableSubtotal: number;
  totalDiscount: number;
  cgst: number;
  sgst: number;
  igst: number;
  /** Extra charges beyond GST already counted on the lines (freight, etc.). */
  otherCharges: number;
  roundOff: number;
  grandTotal: number;
  amountInWords: string;
}

export interface BillEInvoice {
  irn: string | null;
  ackNo: string | null;
  ackDt: string | null;
  status: string | null;
  /** Signed QR JWT to encode into the QR image. */
  signedQRCode: string | null;
  mainHsn: string | null;
}

export interface BillMeta {
  billNo: string | null;
  invoiceNo: string | null;
  date: string | null;
  dueDate: string | null;
  dueDays: number | null;
  spName: string | null;
  recBy: string | null;
  docType: string | null;
  supplyType: string | null;
  placeOfSupply: string | null;
}

export interface BillViewModel {
  company: BillParty;
  billTo: BillParty;
  shipTo: BillParty;
  meta: BillMeta;
  eInvoice: BillEInvoice | null;
  items: BillItem[];
  totals: BillTotals;
  isEInvoiced: boolean;
}

// ---------------------------------------------------------------------------
// Small, dependency-free helpers
// ---------------------------------------------------------------------------
function safeJsonParse<T>(value: string | null | undefined): T | null {
  if (!value || typeof value !== "string") return null;
  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
}

/** Decode a base64url segment to a UTF-8 string (browser + Node safe). */
function base64UrlDecode(input: string): string | null {
  try {
    let s = input.replace(/-/g, "+").replace(/_/g, "/");
    const pad = s.length % 4;
    if (pad) s += "=".repeat(4 - pad);

    let binary: string | null = null;
    if (typeof atob === "function") {
      binary = atob(s);
    } else if (typeof Buffer !== "undefined") {
      return Buffer.from(s, "base64").toString("utf-8");
    }
    if (binary === null) return null;

    try {
      const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
      if (typeof TextDecoder !== "undefined") {
        return new TextDecoder("utf-8").decode(bytes);
      }
    } catch {
      /* fall through to raw binary */
    }
    return binary;
  } catch {
    return null;
  }
}

/** Decode the payload (2nd segment) of a JWT. */
function decodeJwtPayload<T>(jwt: string | null | undefined): T | null {
  if (!jwt || typeof jwt !== "string") return null;
  const parts = jwt.split(".");
  if (parts.length < 2) return null;
  return safeJsonParse<T>(base64UrlDecode(parts[1]));
}

/** SignedInvoice / SignedQRCode wrap their data as a JSON string in `.data`. */
function decodeSignedData<T>(jwt: string | null | undefined): T | null {
  const payload = decodeJwtPayload<{ data?: string }>(jwt);
  if (!payload || typeof payload.data !== "string") return null;
  return safeJsonParse<T>(payload.data);
}

function num(v: unknown): number {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string" && v.trim() !== "" && !Number.isNaN(Number(v))) {
    return Number(v);
  }
  return 0;
}

function str(v: unknown): string | null {
  if (v === null || v === undefined) return null;
  const s = String(v).trim();
  return s === "" ? null : s;
}

function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

// Official GST state codes → names (for human-readable Place of Supply).
const GST_STATE_NAMES: Record<string, string> = {
  "01": "Jammu & Kashmir", "02": "Himachal Pradesh", "03": "Punjab",
  "04": "Chandigarh", "05": "Uttarakhand", "06": "Haryana", "07": "Delhi",
  "08": "Rajasthan", "09": "Uttar Pradesh", "10": "Bihar", "11": "Sikkim",
  "12": "Arunachal Pradesh", "13": "Nagaland", "14": "Manipur", "15": "Mizoram",
  "16": "Tripura", "17": "Meghalaya", "18": "Assam", "19": "West Bengal",
  "20": "Jharkhand", "21": "Odisha", "22": "Chhattisgarh", "23": "Madhya Pradesh",
  "24": "Gujarat", "25": "Daman & Diu", "26": "Dadra & Nagar Haveli",
  "27": "Maharashtra", "28": "Andhra Pradesh (Old)", "29": "Karnataka",
  "30": "Goa", "31": "Lakshadweep", "32": "Kerala", "33": "Tamil Nadu",
  "34": "Puducherry", "35": "Andaman & Nicobar Islands", "36": "Telangana",
  "37": "Andhra Pradesh", "38": "Ladakh", "97": "Other Territory", "99": "Centre Jurisdiction",
};

function stateName(code: string | null | undefined): string | null {
  const c = str(code);
  if (!c) return null;
  return GST_STATE_NAMES[c.padStart(2, "0")] ?? null;
}

function composeAddress(p?: EInvoiceParty | null): string | null {
  if (!p) return null;
  const line1 = [str(p.Addr1), str(p.Addr2)].filter(Boolean).join(", ");
  const line2 = [str(p.Loc), p.Pin ? str(p.Pin) : null].filter(Boolean).join(" - ");
  const parts = [line1, line2].filter(Boolean);
  return parts.length ? parts.join(", ") : null;
}

function toParty(
  p: EInvoiceParty | null | undefined,
  fallbackName: string | null,
  fallbackGstin: string | null
): BillParty {
  return {
    name: str(p?.LglNm) ?? str(p?.TrdNm) ?? fallbackName,
    gstin: str(p?.Gstin) ?? fallbackGstin,
    address: composeAddress(p),
    stateCode: str(p?.Stcd),
    stateName: stateName(p?.Stcd),
    pos: str(p?.Pos),
  };
}

function computeDueDate(dateStr: string | null, dueDays: number | null): string | null {
  if (!dateStr || dueDays === null) return null;
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return null;
  d.setDate(d.getDate() + dueDays);
  return d.toISOString();
}

// Indian-format amount in words (handles lakh / crore + paise).
export function numberToIndianWords(input: number): string {
  if (!Number.isFinite(input)) return "";
  const rupees = Math.floor(Math.abs(input));
  const paise = Math.round((Math.abs(input) - rupees) * 100);

  const a = [
    "", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine",
    "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen",
    "Seventeen", "Eighteen", "Nineteen",
  ];
  const b = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];

  const two = (n: number): string =>
    n < 20 ? a[n] : `${b[Math.floor(n / 10)]}${n % 10 ? " " + a[n % 10] : ""}`;
  const three = (n: number): string => {
    const h = Math.floor(n / 100);
    const r = n % 100;
    return `${h ? a[h] + " Hundred" + (r ? " " : "") : ""}${r ? two(r) : ""}`;
  };
  const convert = (n: number): string => {
    if (n === 0) return "Zero";
    let res = "";
    const crore = Math.floor(n / 10000000);
    n %= 10000000;
    const lakh = Math.floor(n / 100000);
    n %= 100000;
    const thousand = Math.floor(n / 1000);
    n %= 1000;
    if (crore) res += `${convert(crore)} Crore `;
    if (lakh) res += `${two(lakh)} Lakh `;
    if (thousand) res += `${two(thousand)} Thousand `;
    if (n) res += three(n);
    return res.trim();
  };

  let words = `${convert(rupees)} Rupees`;
  if (paise > 0) words += ` and ${two(paise)} Paise`;
  return `${words} Only`;
}

// ---------------------------------------------------------------------------
// The normalizer
// ---------------------------------------------------------------------------
export function buildBillViewModel(
  detail: InvoiceDetail | null | undefined,
  row?: InvoiceSearchItem | null
): BillViewModel {
  const envelope = safeJsonParse<EInvoiceEnvelope>(detail?.eInvoiceJson ?? null);
  const doc = decodeSignedData<EInvoiceDoc>(envelope?.data?.SignedInvoice);
  const qr =
    decodeSignedData<EInvoiceQrData>(envelope?.data?.SignedQRCode) ??
    decodeSignedData<EInvoiceQrData>(detail?.irnSignedQRCode);

  // ----- Parties -----
  const company = toParty(
    doc?.SellerDtls,
    str(row?.spName),
    str(qr?.SellerGstin)
  );
  company.pos = null;

  const billTo = toParty(
    doc?.BuyerDtls,
    str(row?.partyName),
    str(qr?.BuyerGstin) ?? str(row?.gstNo)
  );

  const shipTo: BillParty = doc?.ShipDtls
    ? toParty(doc.ShipDtls, str(row?.shipToName), null)
    : { ...billTo, name: str(row?.shipToName) ?? billTo.name, pos: null };

  // ----- Items (merge top-level lines with e-invoice HSN/unit) -----
  const rawItems = Array.isArray(detail?.invoiceItemDetail)
    ? detail!.invoiceItemDetail!
    : [];
  const eItems = Array.isArray(doc?.ItemList) ? doc!.ItemList! : [];

  const items: BillItem[] = rawItems.map((it, idx) => {
    const eItem =
      eItems.find((e) => str(e.SlNo) === String(it.sno)) ?? eItems[idx] ?? null;

    const qty = it.conv_Qty || it.std_Qty || num(eItem?.Qty);
    const rate = it.conv_Rate || it.std_Rate || num(eItem?.UnitPrice);
    const taxable = num(it.amount) || num(eItem?.AssAmt);
    const gross = num(eItem?.TotAmt) || round2(qty * rate);
    const discountAmount = round2(
      eItem?.Discount != null ? num(eItem.Discount) : Math.max(0, gross - taxable)
    );

    const cgstAmount = num(it.cgstAmount) || num(eItem?.CgstAmt);
    const sgstAmount = num(it.sgstAmount) || num(eItem?.SgstAmt);
    const igstAmount = num(it.igstAmount) || num(eItem?.IgstAmt);
    const lineTotal =
      num(eItem?.TotItemVal) || round2(taxable + cgstAmount + sgstAmount + igstAmount);

    let gstRate: number | null = null;
    if (num(it.vatPer) > 0) gstRate = num(it.vatPer);
    else if (num(eItem?.GstRt) > 0) gstRate = num(eItem?.GstRt);
    else {
      const sum = num(it.cgstPercent) + num(it.sgstPercent) + num(it.igstPercent);
      gstRate = sum > 0 ? sum : null;
    }

    const cascading = num(it.discount2) > 0 || num(it.discount3) > 0;
    const discountPercent = cascading
      ? null
      : num(it.discount1) > 0
        ? num(it.discount1)
        : null;

    return {
      sno: it.sno || idx + 1,
      description:
        str(it.itemDescription) ?? str(it.mfrItemName) ?? str(eItem?.PrdDesc) ?? "—",
      hsn: str(eItem?.HsnCd),
      qty,
      unit: str(eItem?.Unit),
      rate,
      grossAmount: gross,
      discountPercent,
      discountAmount,
      taxableAmount: round2(taxable),
      gstRate,
      cgstPercent: num(it.cgstPercent),
      cgstAmount,
      sgstPercent: num(it.sgstPercent),
      sgstAmount,
      igstPercent: num(it.igstPercent),
      igstAmount,
      lineTotal,
    };
  });

  // ----- Totals (reconcile against the response's own grand total) -----
  const cgst = round2(items.reduce((s, x) => s + x.cgstAmount, 0));
  const sgst = round2(items.reduce((s, x) => s + x.sgstAmount, 0));
  const igst = round2(items.reduce((s, x) => s + x.igstAmount, 0));
  const totalDiscount = round2(items.reduce((s, x) => s + x.discountAmount, 0));
  const sumTaxable = round2(items.reduce((s, x) => s + x.taxableAmount, 0));

  const taxableSubtotal =
    detail?.item_SubTotal != null ? round2(num(detail.item_SubTotal)) : sumTaxable;
  const taxTotal = round2(cgst + sgst + igst);
  const otherChargesRaw = round2(num(detail?.extra_SubTotal) - taxTotal);
  const otherCharges = Math.abs(otherChargesRaw) < 0.01 ? 0 : otherChargesRaw;
  const roundOff = round2(num(detail?.roundOff));

  const grandTotal =
    detail?.grandTotal != null
      ? round2(num(detail.grandTotal))
      : row?.grandTotal != null
        ? round2(num(row.grandTotal))
        : round2(taxableSubtotal + taxTotal + Math.max(0, otherCharges) + roundOff);

  const totals: BillTotals = {
    taxableSubtotal,
    totalDiscount,
    cgst,
    sgst,
    igst,
    otherCharges,
    roundOff,
    grandTotal,
    amountInWords: numberToIndianWords(grandTotal),
  };

  // ----- e-invoice authentication -----
  const irn =
    str(detail?.irn) ?? str(envelope?.data?.Irn) ?? str(doc?.Irn) ?? str(qr?.Irn);
  const signedQRCode =
    str(detail?.irnSignedQRCode) ?? str(envelope?.data?.SignedQRCode);
  const isEInvoiced = !!irn;
  const eInvoice: BillEInvoice | null = isEInvoiced
    ? {
        irn,
        ackNo: str(envelope?.data?.AckNo) ?? str(doc?.AckNo),
        ackDt: str(envelope?.data?.AckDt) ?? str(doc?.AckDt) ?? str(qr?.IrnDt),
        status: str(envelope?.data?.Status),
        signedQRCode,
        mainHsn: str(qr?.MainHsnCode),
      }
    : null;

  // ----- Meta -----
  const dateStr = str(detail?.date) ?? str(row?.date);
  const dueDays = detail?.dueDays != null ? num(detail.dueDays) : null;
  const placeOfSupply = billTo.pos
    ? `${billTo.pos}${stateName(billTo.pos) ? " – " + stateName(billTo.pos) : ""}`
    : billTo.stateName
      ? `${billTo.stateCode} – ${billTo.stateName}`
      : null;

  const meta: BillMeta = {
    billNo: str(detail?.bill_No) ?? str(row?.bill_No),
    invoiceNo: str(detail?.invoiceNo) ?? str(row?.invoiceNo),
    date: dateStr,
    dueDate: computeDueDate(dateStr, dueDays),
    dueDays,
    spName: str(row?.spName),
    recBy: str(detail?.recBy) ?? str(row?.recBy),
    docType: str(doc?.DocDtls?.Typ),
    supplyType: str(doc?.TranDtls?.SupTyp),
    placeOfSupply,
  };

  return { company, billTo, shipTo, meta, eInvoice, items, totals, isEInvoiced };
}
