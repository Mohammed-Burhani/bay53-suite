/**
 * Print & PDF-download helpers for the POS module.
 *
 *  - Barcode labels print/download at a small standard label size (default
 *    50mm x 25mm) — NOT A4.
 *  - POS receipts print/download in an 80mm thermal-printer format — NOT A4.
 *
 * jsPDF is imported dynamically so it never runs during SSR and stays out of
 * the initial bundle. All functions are client-only (guarded on `window`).
 */

import {
  encodeCode128,
  generateBarcodeSVG,
  drawBarcodeToPdf,
  canRenderBarcode,
} from "@/lib/utils/barcode";

// ----------------------------------------------------------------------------
// Types
// ----------------------------------------------------------------------------

export interface BarcodeLabelData {
  barcode: string;
  productName?: string;
  sku?: string;
  /** numeric price; rendered as the price line when provided */
  price?: number;
  /** label shown before the price (default "MRP") */
  priceLabel?: string;
}

export interface LabelSize {
  widthMm: number;
  heightMm: number;
}

export const DEFAULT_LABEL_SIZE: LabelSize = { widthMm: 50, heightMm: 25 };

export interface ReceiptItem {
  name: string;
  sku?: string;
  quantity: number;
  unit: string;
  price: number;
  discount: number;
  gstRate: number;
  total: number;
}

export interface ReceiptData {
  storeName: string;
  storeAddress?: string;
  storePhone?: string;
  storeGstin?: string;
  invoiceNumber: string;
  /** ISO date string */
  dateISO: string;
  customerName: string;
  customerGstin?: string;
  paymentMode: string;
  items: ReceiptItem[];
  subtotal: number;
  totalDiscount: number;
  taxableAmount: number;
  cgst: number;
  sgst: number;
  igst: number;
  totalGst: number;
  grandTotal: number;
  amountPaid: number;
  /** optional footer note */
  footerNote?: string;
}

// ----------------------------------------------------------------------------
// Formatting helpers
// ----------------------------------------------------------------------------

const inrFormatter = new Intl.NumberFormat("en-IN", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/** Indian-grouped amount, no symbol. e.g. 1234.5 -> "1,234.50" */
function amount(n: number): string {
  return inrFormatter.format(Number.isFinite(n) ? n : 0);
}

/** For HTML (browser fonts render the rupee glyph). */
function inrHtml(n: number): string {
  return `\u20B9${amount(n)}`;
}

/** For PDF (standard PDF fonts lack the rupee glyph, so use "Rs."). */
function inrPdf(n: number): string {
  return `Rs.${amount(n)}`;
}

function formatDateTime(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

function escapeHtml(s: string): string {
  return (s ?? "").replace(/[<>&"]/g, (c) =>
    c === "<" ? "&lt;" : c === ">" ? "&gt;" : c === "&" ? "&amp;" : "&quot;"
  );
}

function truncate(s: string, max: number): string {
  const str = (s ?? "").toString();
  return str.length > max ? str.slice(0, max - 1) + "\u2026" : str;
}

function prettyPayment(mode: string): string {
  return (mode || "").replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

// ----------------------------------------------------------------------------
// Print window helper
// ----------------------------------------------------------------------------

function buildPrintDocument(title: string, bodyHtml: string, pageCss: string): string {
  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8" />
<title>${escapeHtml(title)}</title>
<style>
  ${pageCss}
  * { box-sizing: border-box; }
  body { margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif; color: #000; background: #fff; }
  .print-actions { text-align: center; padding: 12px; background: #f3f4f6; }
  .print-actions button { font-size: 13px; padding: 8px 16px; margin: 0 4px; cursor: pointer; border: 1px solid #d1d5db; border-radius: 6px; background: #fff; }
  .print-actions button.primary { background: #111827; color: #fff; border-color: #111827; }
  @media print { .print-actions { display: none !important; } }
</style>
</head>
<body>
<div class="print-actions">
  <button class="primary" onclick="window.print()">Print</button>
  <button onclick="window.close()">Close</button>
</div>
${bodyHtml}
<script>
  window.onload = function () { setTimeout(function () { try { window.focus(); window.print(); } catch (e) {} }, 250); };
</script>
</body>
</html>`;
}

function writeToWindow(win: Window, html: string): void {
  win.document.open();
  win.document.write(html);
  win.document.close();
}

function openPrintWindow(title: string, bodyHtml: string, pageCss: string): boolean {
  if (typeof window === "undefined") return false;
  const win = window.open("", "_blank", "width=480,height=720");
  if (!win) return false; // popup blocked
  writeToWindow(win, buildPrintDocument(title, bodyHtml, pageCss));
  return true;
}

// ----------------------------------------------------------------------------
// BARCODE LABELS
// ----------------------------------------------------------------------------

function labelHtml(label: BarcodeLabelData): string {
  const svg = generateBarcodeSVG(label.barcode, {
    moduleWidth: 2,
    height: 44,
    quietZone: 8,
    displayValue: true,
    fontSize: 11,
  });
  const priceLine =
    typeof label.price === "number"
      ? `<div class="lbl-price">${escapeHtml(label.priceLabel || "MRP")}: ${inrHtml(label.price)}</div>`
      : "";
  const nameLine = label.productName
    ? `<div class="lbl-name">${escapeHtml(truncate(label.productName, 30))}</div>`
    : "";

  return `<div class="label">
    ${nameLine}
    <div class="lbl-barcode">${svg}</div>
    ${priceLine}
  </div>`;
}

/**
 * Open a print window with `copies` barcode labels at the given small label
 * size. Each label is its own page so it prints correctly on a label printer.
 * Returns false if the popup was blocked.
 */
export function printBarcodeLabels(
  label: BarcodeLabelData,
  copies = 1,
  size: LabelSize = DEFAULT_LABEL_SIZE
): boolean {
  if (!canRenderBarcode(label.barcode)) return false;
  const n = Math.max(1, Math.min(500, Math.floor(copies) || 1));
  const one = labelHtml(label);
  const body = Array.from({ length: n }, () => one).join("");

  const pageCss = `
    @page { size: ${size.widthMm}mm ${size.heightMm}mm; margin: 0; }
    .label {
      width: ${size.widthMm}mm; height: ${size.heightMm}mm;
      padding: 1.5mm; display: flex; flex-direction: column;
      align-items: center; justify-content: center; overflow: hidden;
      page-break-after: always; break-after: page;
    }
    .label:last-child { page-break-after: auto; break-after: auto; }
    .lbl-name { font-size: 8pt; font-weight: 600; text-align: center; line-height: 1.1; margin-bottom: 0.5mm; max-width: 100%; }
    .lbl-barcode { width: 100%; text-align: center; }
    .lbl-barcode svg { max-width: 100%; height: auto; display: block; margin: 0 auto; }
    .lbl-price { font-size: 9pt; font-weight: 700; margin-top: 0.5mm; }
    @media screen {
      body { padding: 16px; background: #e5e7eb; }
      .label { background: #fff; margin: 0 auto 8px; box-shadow: 0 1px 3px rgba(0,0,0,.2); }
    }
  `;
  return openPrintWindow(`Barcode ${label.barcode}`, body, pageCss);
}

// ----------------------------------------------------------------------------
// A4 SHEET (grid of labels — cut out manually, like a label/book-label sheet)
// ----------------------------------------------------------------------------

/** A4 dimensions and default sheet layout, in mm. */
const A4_WIDTH_MM = 210;
const A4_HEIGHT_MM = 297;
const A4_MARGIN_MM = 10; // outer page margin
const A4_GUTTER_MM = 2; // gap between labels

export interface A4GridLayout {
  cols: number;
  rows: number;
  perPage: number;
  /** actual cell size used (label size, possibly shrunk to fit) */
  cellW: number;
  cellH: number;
}

/**
 * Compute how many labels of `size` fit on an A4 sheet (portrait), with a fixed
 * outer margin and gutter between cells.
 */
export function computeA4Grid(size: LabelSize): A4GridLayout {
  const usableW = A4_WIDTH_MM - A4_MARGIN_MM * 2;
  const usableH = A4_HEIGHT_MM - A4_MARGIN_MM * 2;
  const cellW = Math.min(size.widthMm, usableW);
  const cellH = Math.min(size.heightMm, usableH);
  const cols = Math.max(1, Math.floor((usableW + A4_GUTTER_MM) / (cellW + A4_GUTTER_MM)));
  const rows = Math.max(1, Math.floor((usableH + A4_GUTTER_MM) / (cellH + A4_GUTTER_MM)));
  return { cols, rows, perPage: cols * rows, cellW, cellH };
}

/**
 * Open a print window with `copies` barcode labels tiled into a grid on A4
 * sheet(s) — sorted left-to-right, top-to-bottom — with dashed cut guides so
 * the user can cut each sticker out manually. Returns false if popup blocked.
 */
export function printBarcodeLabelsA4(
  label: BarcodeLabelData,
  copies = 1,
  size: LabelSize = DEFAULT_LABEL_SIZE
): boolean {
  if (!canRenderBarcode(label.barcode)) return false;
  const n = Math.max(1, Math.min(500, Math.floor(copies) || 1));
  const { cols, cellW, cellH } = computeA4Grid(size);

  const one = labelHtml(label);
  const cells = Array.from({ length: n }, () => `<div class="cell">${one}</div>`).join("");

  const pageCss = `
    @page { size: A4 portrait; margin: ${A4_MARGIN_MM}mm; }
    .sheet {
      display: grid;
      grid-template-columns: repeat(${cols}, ${cellW}mm);
      gap: ${A4_GUTTER_MM}mm;
      justify-content: center;
      align-content: start;
    }
    .cell {
      width: ${cellW}mm; height: ${cellH}mm;
      border: 0.2mm dashed #9ca3af;
      display: flex; align-items: center; justify-content: center;
      overflow: hidden;
    }
    .label {
      width: 100%; height: 100%;
      padding: 1.5mm; display: flex; flex-direction: column;
      align-items: center; justify-content: center; overflow: hidden;
    }
    .lbl-name { font-size: 8pt; font-weight: 600; text-align: center; line-height: 1.1; margin-bottom: 0.5mm; max-width: 100%; }
    .lbl-barcode { width: 100%; text-align: center; }
    .lbl-barcode svg { max-width: 100%; height: auto; display: block; margin: 0 auto; }
    .lbl-price { font-size: 9pt; font-weight: 700; margin-top: 0.5mm; }
    @media screen {
      body { padding: 16px; background: #e5e7eb; }
      .sheet { background: #fff; padding: ${A4_MARGIN_MM}mm; margin: 0 auto; width: ${A4_WIDTH_MM}mm; box-shadow: 0 1px 6px rgba(0,0,0,.2); }
    }
  `;
  return openPrintWindow(`Barcodes ${label.barcode}`, `<div class="sheet">${cells}</div>`, pageCss);
}

/**
 * Generate and download a PDF with `copies` barcode labels tiled into a grid on
 * A4 sheet(s) (vector barcodes), with dashed cut guides. Adds pages as needed.
 */
export async function downloadBarcodeLabelsA4Pdf(
  label: BarcodeLabelData,
  copies = 1,
  size: LabelSize = DEFAULT_LABEL_SIZE
): Promise<void> {
  if (typeof window === "undefined") return;
  if (!canRenderBarcode(label.barcode)) throw new Error("Barcode value cannot be rendered.");
  const n = Math.max(1, Math.min(500, Math.floor(copies) || 1));
  const { cols, rows, perPage, cellW, cellH } = computeA4Grid(size);
  const { jsPDF } = await import("jspdf");

  const doc = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait" });

  // Center the grid block horizontally; start at the top margin.
  const gridW = cols * cellW + (cols - 1) * A4_GUTTER_MM;
  const offsetX = (A4_WIDTH_MM - gridW) / 2;
  const offsetY = A4_MARGIN_MM;

  for (let i = 0; i < n; i++) {
    const indexOnPage = i % perPage;
    if (i > 0 && indexOnPage === 0) doc.addPage("a4", "portrait");

    const col = indexOnPage % cols;
    const row = Math.floor(indexOnPage / cols);
    const x = offsetX + col * (cellW + A4_GUTTER_MM);
    const y = offsetY + row * (cellH + A4_GUTTER_MM);

    // Dashed cut guide around the cell.
    doc.setDrawColor(156, 163, 175);
    doc.setLineWidth(0.15);
    doc.setLineDashPattern([0.8, 0.8], 0);
    doc.rect(x, y, cellW, cellH);
    doc.setLineDashPattern([], 0);

    drawSingleLabel(doc, label, cellW, cellH, x, y);
  }

  doc.save(`barcodes-${sanitizeFilename(label.barcode)}-x${n}.pdf`);
}

/**
 * Generate and download a PDF of `copies` barcode labels at the small label
 * size (vector barcode, one label per page).
 */
export async function downloadBarcodeLabelsPdf(
  label: BarcodeLabelData,
  copies = 1,
  size: LabelSize = DEFAULT_LABEL_SIZE
): Promise<void> {
  if (typeof window === "undefined") return;
  if (!canRenderBarcode(label.barcode)) throw new Error("Barcode value cannot be rendered.");
  const n = Math.max(1, Math.min(500, Math.floor(copies) || 1));
  const { jsPDF } = await import("jspdf");

  const w = size.widthMm;
  const h = size.heightMm;
  const doc = new jsPDF({ unit: "mm", format: [w, h], orientation: w >= h ? "landscape" : "portrait" });

  for (let i = 0; i < n; i++) {
    if (i > 0) doc.addPage([w, h], w >= h ? "landscape" : "portrait");
    drawSingleLabel(doc, label, w, h);
  }

  doc.save(`barcode-${sanitizeFilename(label.barcode)}.pdf`);
}

function drawSingleLabel(
  doc: import("jspdf").jsPDF,
  label: BarcodeLabelData,
  w: number,
  h: number,
  originX = 0,
  originY = 0
): void {
  const margin = 2;
  let y = originY + margin;

  doc.setTextColor(0, 0, 0);

  // Product name (optional)
  if (label.productName) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7);
    doc.text(truncate(label.productName, 32), originX + w / 2, y + 2.2, { align: "center" });
    y += 3.4;
  } else {
    y += 1;
  }

  // Barcode geometry
  const priceShown = typeof label.price === "number";
  const valueTextH = 3;
  const priceH = priceShown ? 3.4 : 0;
  const barWidth = w - margin * 2;
  const barTop = y + 0.5;
  const barHeight = Math.max(6, originY + h - barTop - valueTextH - priceH - margin);

  drawBarcodeToPdf(doc, label.barcode, originX + margin, barTop, barWidth, barHeight);

  // Human-readable value
  doc.setFont("courier", "normal");
  doc.setFontSize(7);
  doc.text(label.barcode, originX + w / 2, barTop + barHeight + 2.4, { align: "center" });

  // Price (optional)
  if (priceShown) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.text(
      `${label.priceLabel || "MRP"}: ${inrPdf(label.price as number)}`,
      originX + w / 2,
      barTop + barHeight + 2.4 + priceH,
      { align: "center" }
    );
  }
}

// ----------------------------------------------------------------------------
// POS RECEIPT (80mm thermal)
// ----------------------------------------------------------------------------

const RECEIPT_WIDTH_MM = 80;

function buildReceiptHtml(r: ReceiptData): string {
  const itemsRows = r.items
    .map((it) => {
      const lineBase = it.quantity * it.price;
      return `<tr class="item">
        <td class="it-name" colspan="3">${escapeHtml(it.name)}</td>
      </tr>
      <tr class="item">
        <td class="it-qty">${it.quantity} ${escapeHtml(it.unit)} \u00d7 ${inrHtml(it.price)}${
          it.discount > 0 ? ` <span class="disc">- ${inrHtml(it.discount)}</span>` : ""
        }</td>
        <td></td>
        <td class="it-amt">${inrHtml(it.total != null ? it.total : lineBase - it.discount)}</td>
      </tr>`;
    })
    .join("");

  const totalsRows = [
    `<div class="trow"><span>Subtotal</span><span>${inrHtml(r.subtotal)}</span></div>`,
    r.totalDiscount > 0 ? `<div class="trow disc"><span>Discount</span><span>- ${inrHtml(r.totalDiscount)}</span></div>` : "",
    `<div class="trow"><span>Taxable</span><span>${inrHtml(r.taxableAmount)}</span></div>`,
    r.cgst > 0 ? `<div class="trow"><span>CGST</span><span>${inrHtml(r.cgst)}</span></div>` : "",
    r.sgst > 0 ? `<div class="trow"><span>SGST</span><span>${inrHtml(r.sgst)}</span></div>` : "",
    r.igst > 0 ? `<div class="trow"><span>IGST</span><span>${inrHtml(r.igst)}</span></div>` : "",
    r.totalGst > 0 && r.igst <= 0 && r.cgst <= 0 ? `<div class="trow"><span>GST</span><span>${inrHtml(r.totalGst)}</span></div>` : "",
  ]
    .filter(Boolean)
    .join("");

  return `<div class="receipt">
    <div class="r-header">
      <div class="r-store">${escapeHtml(r.storeName)}</div>
      ${r.storeAddress ? `<div class="r-sub">${escapeHtml(r.storeAddress)}</div>` : ""}
      ${r.storePhone ? `<div class="r-sub">Ph: ${escapeHtml(r.storePhone)}</div>` : ""}
      ${r.storeGstin ? `<div class="r-sub">GSTIN: ${escapeHtml(r.storeGstin)}</div>` : ""}
    </div>
    <div class="r-title">TAX INVOICE</div>
    <div class="r-divider"></div>
    <div class="r-meta">
      <div><span>Bill No</span><span>${escapeHtml(r.invoiceNumber)}</span></div>
      <div><span>Date</span><span>${escapeHtml(formatDateTime(r.dateISO))}</span></div>
      <div><span>Customer</span><span>${escapeHtml(r.customerName)}</span></div>
      ${r.customerGstin ? `<div><span>Cust GSTIN</span><span>${escapeHtml(r.customerGstin)}</span></div>` : ""}
      <div><span>Payment</span><span>${escapeHtml(prettyPayment(r.paymentMode))}</span></div>
    </div>
    <div class="r-divider"></div>
    <table class="r-items">
      <thead><tr><th class="it-name" colspan="3">Item</th></tr></thead>
      <tbody>${itemsRows}</tbody>
    </table>
    <div class="r-divider"></div>
    <div class="r-totals">
      ${totalsRows}
      <div class="trow grand"><span>TOTAL</span><span>${inrHtml(r.grandTotal)}</span></div>
      <div class="trow"><span>Paid (${escapeHtml(prettyPayment(r.paymentMode))})</span><span>${inrHtml(r.amountPaid)}</span></div>
    </div>
    <div class="r-divider"></div>
    <div class="r-footer">${escapeHtml(r.footerNote || "Thank you for your purchase!")}</div>
    <div class="r-footer small">${r.items.length} item(s)</div>
  </div>`;
}

/**
 * Open a print window with the receipt formatted for an 80mm thermal printer.
 * Returns false if the popup was blocked.
 */
function receiptPageCss(): string {
  return `
    @page { size: ${RECEIPT_WIDTH_MM}mm auto; margin: 3mm; }
    .receipt { width: ${RECEIPT_WIDTH_MM - 6}mm; margin: 0 auto; font-family: "Courier New", monospace; color: #000; }
    .r-header { text-align: center; }
    .r-store { font-size: 13pt; font-weight: 700; }
    .r-sub { font-size: 8pt; }
    .r-title { text-align: center; font-size: 9pt; font-weight: 700; margin-top: 2mm; letter-spacing: 1px; }
    .r-divider { border-top: 1px dashed #000; margin: 1.5mm 0; }
    .r-meta div, .trow { display: flex; justify-content: space-between; font-size: 8.5pt; gap: 6px; }
    .r-meta span:first-child { color: #000; }
    .r-meta span:last-child { text-align: right; }
    .r-items { width: 100%; border-collapse: collapse; }
    .r-items th { text-align: left; font-size: 8.5pt; border-bottom: 1px solid #000; padding-bottom: 1mm; }
    .it-name { font-size: 9pt; font-weight: 600; padding-top: 1mm; }
    .it-qty { font-size: 8.5pt; }
    .it-amt { text-align: right; font-size: 9pt; font-weight: 600; white-space: nowrap; }
    .disc { color: #000; }
    .r-totals { font-size: 8.5pt; }
    .trow { padding: 0.3mm 0; }
    .trow.grand { font-size: 11pt; font-weight: 700; border-top: 1px solid #000; border-bottom: 1px solid #000; padding: 1mm 0; margin: 1mm 0; }
    .r-footer { text-align: center; font-size: 9pt; margin-top: 2mm; }
    .r-footer.small { font-size: 7.5pt; margin-top: 0.5mm; }
    @media screen {
      body { padding: 16px; background: #e5e7eb; }
      .receipt { background: #fff; padding: 4mm; box-shadow: 0 1px 6px rgba(0,0,0,.2); }
    }
  `;
}

/**
 * Open a print window with the receipt formatted for an 80mm thermal printer.
 * Returns false if the popup was blocked.
 */
export function printReceipt(r: ReceiptData): boolean {
  return openPrintWindow(`Receipt ${r.invoiceNumber}`, buildReceiptHtml(r), receiptPageCss());
}

/**
 * Print a receipt whose data must be fetched asynchronously. The print window
 * is opened synchronously (inside the user gesture, so it isn't pop-up blocked)
 * and filled once `load` resolves. Returns false if the popup was blocked or no
 * data was returned.
 */
export async function printReceiptDeferred(load: () => Promise<ReceiptData | null>): Promise<boolean> {
  if (typeof window === "undefined") return false;
  const win = window.open("", "_blank", "width=480,height=720");
  if (!win) return false; // popup blocked

  writeToWindow(
    win,
    `<!DOCTYPE html><html><head><meta charset="utf-8"/><title>Receipt</title></head>` +
      `<body style="font-family:-apple-system,Segoe UI,Roboto,Arial,sans-serif;padding:24px;color:#374151">Generating receipt…</body></html>`
  );

  let data: ReceiptData | null = null;
  try {
    data = await load();
  } catch {
    data = null;
  }

  if (!data) {
    try {
      win.document.body.innerHTML = "Could not load this receipt.";
    } catch {
      /* ignore */
    }
    return false;
  }

  writeToWindow(win, buildPrintDocument(`Receipt ${data.invoiceNumber}`, buildReceiptHtml(data), receiptPageCss()));
  return true;
}

// PDF receipt — row model keeps height calculation and drawing in sync.
type ReceiptRow =
  | { kind: "text"; text: string; size: number; bold?: boolean; align?: "left" | "center" | "right"; font?: "courier" | "helvetica" }
  | { kind: "lr"; left: string; right: string; size: number; bold?: boolean }
  | { kind: "sep" }
  | { kind: "gap"; h: number };

function buildReceiptRows(r: ReceiptData): ReceiptRow[] {
  const rows: ReceiptRow[] = [];
  rows.push({ kind: "text", text: r.storeName, size: 13, bold: true, align: "center", font: "helvetica" });
  if (r.storeAddress) rows.push({ kind: "text", text: r.storeAddress, size: 8, align: "center", font: "helvetica" });
  if (r.storePhone) rows.push({ kind: "text", text: `Ph: ${r.storePhone}`, size: 8, align: "center", font: "helvetica" });
  if (r.storeGstin) rows.push({ kind: "text", text: `GSTIN: ${r.storeGstin}`, size: 8, align: "center", font: "helvetica" });
  rows.push({ kind: "gap", h: 1 });
  rows.push({ kind: "text", text: "TAX INVOICE", size: 9, bold: true, align: "center", font: "helvetica" });
  rows.push({ kind: "sep" });
  rows.push({ kind: "lr", left: "Bill No", right: r.invoiceNumber, size: 8.5 });
  rows.push({ kind: "lr", left: "Date", right: formatDateTime(r.dateISO), size: 8.5 });
  rows.push({ kind: "lr", left: "Customer", right: truncate(r.customerName, 24), size: 8.5 });
  if (r.customerGstin) rows.push({ kind: "lr", left: "Cust GSTIN", right: r.customerGstin, size: 8.5 });
  rows.push({ kind: "lr", left: "Payment", right: prettyPayment(r.paymentMode), size: 8.5 });
  rows.push({ kind: "sep" });
  rows.push({ kind: "lr", left: "Item", right: "Amount", size: 8.5, bold: true });
  for (const it of r.items) {
    rows.push({ kind: "text", text: truncate(it.name, 40), size: 9, bold: true, font: "helvetica" });
    const qtyText = `${it.quantity} ${it.unit} x ${inrPdf(it.price)}${it.discount > 0 ? `  (-${inrPdf(it.discount)})` : ""}`;
    rows.push({ kind: "lr", left: qtyText, right: inrPdf(it.total), size: 8.5 });
  }
  rows.push({ kind: "sep" });
  rows.push({ kind: "lr", left: "Subtotal", right: inrPdf(r.subtotal), size: 8.5 });
  if (r.totalDiscount > 0) rows.push({ kind: "lr", left: "Discount", right: `-${inrPdf(r.totalDiscount)}`, size: 8.5 });
  rows.push({ kind: "lr", left: "Taxable", right: inrPdf(r.taxableAmount), size: 8.5 });
  if (r.cgst > 0) rows.push({ kind: "lr", left: "CGST", right: inrPdf(r.cgst), size: 8.5 });
  if (r.sgst > 0) rows.push({ kind: "lr", left: "SGST", right: inrPdf(r.sgst), size: 8.5 });
  if (r.igst > 0) rows.push({ kind: "lr", left: "IGST", right: inrPdf(r.igst), size: 8.5 });
  if (r.totalGst > 0 && r.cgst <= 0 && r.igst <= 0) rows.push({ kind: "lr", left: "GST", right: inrPdf(r.totalGst), size: 8.5 });
  rows.push({ kind: "gap", h: 1 });
  rows.push({ kind: "lr", left: "TOTAL", right: inrPdf(r.grandTotal), size: 11, bold: true });
  rows.push({ kind: "lr", left: `Paid (${prettyPayment(r.paymentMode)})`, right: inrPdf(r.amountPaid), size: 8.5 });
  rows.push({ kind: "sep" });
  rows.push({ kind: "text", text: r.footerNote || "Thank you for your purchase!", size: 9, align: "center", font: "helvetica" });
  rows.push({ kind: "text", text: `${r.items.length} item(s)`, size: 7.5, align: "center", font: "helvetica" });
  return rows;
}

function rowHeightMm(row: ReceiptRow): number {
  switch (row.kind) {
    case "sep":
      return 2.4;
    case "gap":
      return row.h;
    case "text":
    case "lr":
      return row.size * 0.42 + 0.6;
  }
}

/**
 * Generate and download an 80mm-wide PDF receipt (height auto-sized to content).
 */
export async function downloadReceiptPdf(r: ReceiptData): Promise<void> {
  if (typeof window === "undefined") return;
  const { jsPDF } = await import("jspdf");

  const marginX = 4;
  const marginY = 4;
  const rows = buildReceiptRows(r);
  const contentHeight = rows.reduce((sum, row) => sum + rowHeightMm(row), 0);
  const pageHeight = Math.max(40, Math.ceil(contentHeight + marginY * 2));

  const doc = new jsPDF({ unit: "mm", format: [RECEIPT_WIDTH_MM, pageHeight], orientation: "portrait" });
  doc.setTextColor(0, 0, 0);

  const leftX = marginX;
  const rightX = RECEIPT_WIDTH_MM - marginX;
  const centerX = RECEIPT_WIDTH_MM / 2;
  let y = marginY;

  for (const row of rows) {
    const h = rowHeightMm(row);
    if (row.kind === "sep") {
      doc.setDrawColor(120, 120, 120);
      doc.setLineWidth(0.2);
      const lineY = y + h / 2;
      doc.setLineDashPattern([0.6, 0.6], 0);
      doc.line(leftX, lineY, rightX, lineY);
      doc.setLineDashPattern([], 0);
    } else if (row.kind === "gap") {
      // spacing only
    } else if (row.kind === "text") {
      doc.setFont(row.font || "courier", row.bold ? "bold" : "normal");
      doc.setFontSize(row.size);
      const baseline = y + h - 1;
      const align = row.align || "left";
      const x = align === "center" ? centerX : align === "right" ? rightX : leftX;
      doc.text(row.text, x, baseline, { align });
    } else {
      // lr
      doc.setFont("courier", row.bold ? "bold" : "normal");
      doc.setFontSize(row.size);
      const baseline = y + h - 1;
      doc.text(row.left, leftX, baseline, { align: "left" });
      doc.text(row.right, rightX, baseline, { align: "right" });
    }
    y += h;
  }

  doc.save(`receipt-${sanitizeFilename(r.invoiceNumber)}.pdf`);
}

function sanitizeFilename(s: string): string {
  return (s || "file").replace(/[^A-Za-z0-9._-]/g, "_");
}

/** Re-export for callers that want to embed a preview SVG. */
export { generateBarcodeSVG, encodeCode128 };
