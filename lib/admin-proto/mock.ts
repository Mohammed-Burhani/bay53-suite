// Admin-dashboard UI prototype data.
//
// The existing Invoice / Ledger / Item APIs stay integrated. The *new* fields from the
// dealer-portal API sheet (order status, payment status, dealer limit usage, MOQ, …) do not
// exist in those responses yet, so they are derived here from the real row (id, amount, date)
// with a stable hash. Same row => same mock values on every render.

const hash = (n: number) => {
  let x = (Math.abs(Math.trunc(n)) + 1) * 2654435761;
  x = (x ^ (x >>> 15)) >>> 0;
  return x;
};
const pick = <T,>(arr: readonly T[], seed: number) => arr[hash(seed) % arr.length];
const addDays = (iso: string | null | undefined, days: number) => {
  const d = iso ? new Date(iso) : new Date();
  if (Number.isNaN(d.getTime())) return new Date().toISOString();
  d.setDate(d.getDate() + days);
  return d.toISOString();
};

// ---------------------------------------------------------------- orders / invoices

export const ORDER_STATUSES = ["Placed", "Confirmed", "Processing", "Dispatched", "Delivered", "Cancelled"] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const PAYMENT_STATUSES = ["Unpaid", "Partially Paid", "Paid", "Overdue"] as const;
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

export type DocKind = "order" | "invoice" | "credit_note" | "debit_note" | "other";

export const DOC_KIND_LABEL: Record<DocKind, string> = {
  order: "Order",
  invoice: "Invoice",
  credit_note: "Credit Note",
  debit_note: "Debit Note",
  other: "Not shown to dealer",
};

// Invoice type id => dealer document kind (what /api/InvoiceType/Update will persist).
export const INVOICE_TYPE_ROWS: { invTypeId: number; typeName: string; dealerDocKind: DocKind; showInDealerPortal: boolean }[] = [
  { invTypeId: 5, typeName: "Sales Order", dealerDocKind: "order", showInDealerPortal: true },
  { invTypeId: 1, typeName: "Sales Invoice", dealerDocKind: "invoice", showInDealerPortal: true },
  { invTypeId: 3, typeName: "Sales Return", dealerDocKind: "credit_note", showInDealerPortal: true },
  { invTypeId: 11, typeName: "Sales Debit Note", dealerDocKind: "debit_note", showInDealerPortal: true },
  { invTypeId: 7, typeName: "Sales Challan", dealerDocKind: "other", showInDealerPortal: false },
  { invTypeId: 4, typeName: "Sales Quotation", dealerDocKind: "other", showInDealerPortal: false },
  { invTypeId: 6, typeName: "Performa Invoice", dealerDocKind: "other", showInDealerPortal: false },
  { invTypeId: 2, typeName: "Cash Invoice", dealerDocKind: "other", showInDealerPortal: false },
];

export function docKindOf(invType: number): DocKind {
  return INVOICE_TYPE_ROWS.find((r) => r.invTypeId === invType)?.dealerDocKind ?? "other";
}

const COURIERS = ["Blue Dart", "DTDC", "Delhivery", "VRL Logistics", "Gati"] as const;

export interface OrderMock {
  docKind: DocKind;
  orderStatus: OrderStatus;
  paymentStatus: PaymentStatus;
  source: "Dealer Portal" | "Admin";
  dueDate: string;
  paidAmount: number;
  balanceAmount: number;
  statusEvents: { status: OrderStatus; at: string }[];
  courierName: string | null;
  trackingNo: string | null;
  dispatchedAt: string | null;
  expectedDeliveryDate: string | null;
  deliveredAt: string | null;
  cancelReason: string | null;
  linkedDocuments: { bill_No: string; docKind: DocKind; date: string; grandTotal: number; reason: string }[];
  creditNoteTotal: number;
  debitNoteTotal: number;
}

export function mockOrder(row: { invCode: number; inv_Type: number; grandTotal: number; date: string; bill_No?: string }): OrderMock {
  const seed = row.invCode;
  const flow = ORDER_STATUSES.slice(0, 5);
  const cancelled = hash(seed + 7) % 11 === 0;
  const reached = cancelled ? 1 + (hash(seed + 3) % 3) : hash(seed) % 5; // index into flow
  const orderStatus: OrderStatus = cancelled ? "Cancelled" : flow[reached];

  const statusEvents = flow.slice(0, reached + 1).map((status, i) => ({ status, at: addDays(row.date, i === 0 ? 0 : i * 2) }));
  if (cancelled) statusEvents.push({ status: "Cancelled", at: addDays(row.date, reached * 2 + 1) });

  const dispatched = !cancelled && reached >= 3;
  const delivered = !cancelled && reached >= 4;
  const dueDate = addDays(row.date, 30);
  const paidShare = cancelled ? 0 : pick([0, 0, 0.4, 1, 1], seed + 11);
  const paidAmount = Math.round(row.grandTotal * paidShare);
  const balanceAmount = cancelled ? 0 : Math.max(0, Math.round(row.grandTotal - paidAmount));
  const overdue = balanceAmount > 0 && new Date(dueDate) < new Date();
  const paymentStatus: PaymentStatus = paidShare === 1 ? "Paid" : overdue ? "Overdue" : paidShare > 0 ? "Partially Paid" : "Unpaid";

  const hasNote = hash(seed + 5) % 4 === 0 && !cancelled;
  const creditNoteTotal = hasNote ? Math.round(row.grandTotal * 0.06) : 0;

  return {
    docKind: docKindOf(row.inv_Type),
    orderStatus,
    paymentStatus,
    source: hash(seed + 1) % 3 === 0 ? "Admin" : "Dealer Portal",
    dueDate,
    paidAmount,
    balanceAmount,
    statusEvents,
    courierName: dispatched ? pick(COURIERS, seed) : null,
    trackingNo: dispatched ? `${100000000 + (hash(seed + 9) % 899999999)}` : null,
    dispatchedAt: dispatched ? statusEvents[3].at : null,
    expectedDeliveryDate: dispatched ? addDays(row.date, 8) : null,
    deliveredAt: delivered ? statusEvents[4].at : null,
    cancelReason: cancelled ? "Cancelled by dealer before dispatch" : null,
    linkedDocuments: hasNote
      ? [{ bill_No: `CN/${row.bill_No?.split("/").pop() ?? row.invCode}`, docKind: "credit_note", date: addDays(row.date, 12), grandTotal: creditNoteTotal, reason: "Damaged in transit" }]
      : [],
    creditNoteTotal,
    debitNoteTotal: 0,
  };
}

// ---------------------------------------------------------------- dealers (ledgers)

export const BUSINESS_TYPES = ["Distributor", "Wholesaler", "Retailer", "Installer", "Project Contractor"] as const;

export interface DealerAddress {
  id: number;
  addressName: string;
  addressType: "Billing" | "Shipping" | "Warehouse";
  line: string;
  cityName: string;
  stateName: string;
  isDefault: boolean;
  isActive: boolean;
}

export interface DealerMock {
  businessType: (typeof BUSINESS_TYPES)[number];
  portalEnabled: boolean;
  creditLimit: number;
  usedLimit: number;
  availableLimit: number;
  limitUsagePercent: number;
  outstandingAmount: number;
  overdueAmount: number;
  unpaidDocCount: number;
  openOrderAmount: number;
  lockReason: string | null;
  addresses: DealerAddress[];
}

const LOCK_REASONS = ["Overdue beyond credit days", "Cheque bounced", "Pending KYC documents", "Disputed invoice under review"] as const;

export function mockDealer(ledgerId: number, realCreditLimit?: number | string | null, locked?: boolean): DealerMock {
  const real = Number(realCreditLimit);
  const creditLimit = real > 0 ? real : pick([250000, 500000, 750000, 1000000, 1500000], ledgerId);
  const usagePct = pick([18, 34, 52, 67, 83, 96], ledgerId + 2);
  const usedLimit = Math.round((creditLimit * usagePct) / 100);
  const outstandingAmount = Math.round(usedLimit * 0.72);
  const overdueAmount = hash(ledgerId + 4) % 3 === 0 ? Math.round(outstandingAmount * 0.35) : 0;
  return {
    businessType: pick(BUSINESS_TYPES, ledgerId + 1),
    portalEnabled: hash(ledgerId + 6) % 4 !== 0,
    creditLimit,
    usedLimit,
    availableLimit: creditLimit - usedLimit,
    limitUsagePercent: usagePct,
    outstandingAmount,
    overdueAmount,
    unpaidDocCount: 1 + (hash(ledgerId) % 6),
    openOrderAmount: Math.round(creditLimit * 0.08),
    lockReason: locked ? pick(LOCK_REASONS, ledgerId) : null,
    addresses: [
      { id: 1, addressName: "Head Office", addressType: "Billing", line: "Plot 14, Industrial Area Phase II", cityName: "Mumbai", stateName: "Maharashtra", isDefault: true, isActive: true },
      { id: 2, addressName: "Main Warehouse", addressType: "Shipping", line: "Gate 3, Logistics Park, NH-48", cityName: "Bhiwandi", stateName: "Maharashtra", isDefault: true, isActive: true },
      { id: 3, addressName: "Site Store - Pune", addressType: "Shipping", line: "Survey 88, Hinjewadi Phase 1", cityName: "Pune", stateName: "Maharashtra", isDefault: false, isActive: hash(ledgerId) % 2 === 0 },
    ],
  };
}

// ---------------------------------------------------------------- items

export type StockStatus = "In Stock" | "Low Stock" | "Out of Stock";

export interface ItemMock {
  availableQty: number;
  stockStatus: StockStatus;
  moq: number;
  dealerRate: number;
  dealerVisible: boolean;
  purchaseCount: number;
  imageCount: number;
}

export function mockItem(itemId: number, sellRate?: number | null): ItemMock {
  const availableQty = pick([0, 4, 12, 38, 120, 560, 940], itemId);
  const base = sellRate && sellRate > 0 ? sellRate : 1000 + (hash(itemId) % 9000);
  return {
    availableQty,
    stockStatus: availableQty === 0 ? "Out of Stock" : availableQty <= 12 ? "Low Stock" : "In Stock",
    moq: pick([1, 5, 10, 25], itemId + 3),
    dealerRate: Math.round(base * 0.88),
    dealerVisible: hash(itemId + 8) % 5 !== 0,
    purchaseCount: hash(itemId + 2) % 140,
    imageCount: hash(itemId + 12) % 4,
  };
}

// ---------------------------------------------------------------- static portal data

export interface LimitRequest {
  id: number;
  dealer: string;
  partyCode: string;
  currentLimit: number;
  requestedLimit: number;
  usedLimit: number;
  reason: string;
  status: "Pending" | "Approved" | "Rejected";
  requestedAt: string;
  decidedAt: string | null;
  decidedBy: string | null;
  remarks: string | null;
  approvedLimit?: number;
}

export const LIMIT_REQUESTS: LimitRequest[] = [
  { id: 1042, dealer: "Shree Electricals", partyCode: "DLR-0012", currentLimit: 500000, requestedLimit: 800000, usedLimit: 468000, reason: "Festival season stocking - large project orders expected in the next 3 weeks.", status: "Pending", requestedAt: "2026-10-27T10:20:00", decidedAt: null, decidedBy: null, remarks: null },
  { id: 1041, dealer: "Metro Lighting Co.", partyCode: "DLR-0031", currentLimit: 250000, requestedLimit: 400000, usedLimit: 241000, reason: "Showroom expansion - need to place bulk opening order.", status: "Pending", requestedAt: "2026-10-26T15:05:00", decidedAt: null, decidedBy: null, remarks: null },
  { id: 1040, dealer: "Rajesh Traders", partyCode: "DLR-0007", currentLimit: 1000000, requestedLimit: 1500000, usedLimit: 912000, reason: "Government tender supply - 45 day payment cycle.", status: "Pending", requestedAt: "2026-10-25T09:40:00", decidedAt: null, decidedBy: null, remarks: null },
  { id: 1038, dealer: "Anand Wholesale", partyCode: "DLR-0019", currentLimit: 750000, requestedLimit: 1000000, usedLimit: 301000, reason: "Added two new retail counters.", status: "Approved", requestedAt: "2026-10-20T11:00:00", decidedAt: "2026-10-21T16:30:00", decidedBy: "Admin", remarks: "Approved at requested limit. Good payment history.", approvedLimit: 1000000 },
  { id: 1036, dealer: "Kiran Hardware", partyCode: "DLR-0044", currentLimit: 150000, requestedLimit: 600000, usedLimit: 148000, reason: "Want to match competitor credit terms.", status: "Rejected", requestedAt: "2026-10-14T13:15:00", decidedAt: "2026-10-15T10:10:00", decidedBy: "Admin", remarks: "Two invoices overdue. Clear dues and re-apply." },
  { id: 1033, dealer: "Sunrise Distributors", partyCode: "DLR-0003", currentLimit: 2000000, requestedLimit: 2500000, usedLimit: 1780000, reason: "Q4 stocking.", status: "Approved", requestedAt: "2026-10-09T08:50:00", decidedAt: "2026-10-09T17:45:00", decidedBy: "Admin", remarks: "Approved up to 2.3L.", approvedLimit: 2300000 },
];

export interface PortalNotification {
  id: number;
  kind: "order" | "delivery" | "stock" | "limit" | "payment";
  title: string;
  body: string;
  createdAt: string;
  isRead: boolean;
  refType: string;
  refId: string;
}

export const NOTIFICATIONS: PortalNotification[] = [
  { id: 1, kind: "order", title: "New dealer order placed", body: "Shree Electricals placed order SO/26-27/0412 worth ₹1,84,200.", createdAt: "2026-10-30T09:42:00", isRead: false, refType: "Order", refId: "SO/26-27/0412" },
  { id: 2, kind: "limit", title: "Limit increase requested", body: "Metro Lighting Co. requested ₹4,00,000 (current ₹2,50,000).", createdAt: "2026-10-30T08:15:00", isRead: false, refType: "LimitRequest", refId: "1041" },
  { id: 3, kind: "stock", title: "Low stock alert", body: "LED Panel 40W Cool White fell below 12 units (4 left).", createdAt: "2026-10-29T18:30:00", isRead: false, refType: "Item", refId: "LED-P40-CW" },
  { id: 4, kind: "delivery", title: "Shipment delivered", body: "Order SO/26-27/0398 delivered to Anand Wholesale, Pune.", createdAt: "2026-10-29T14:05:00", isRead: true, refType: "Order", refId: "SO/26-27/0398" },
  { id: 5, kind: "payment", title: "Invoice overdue", body: "INV/26-27/1180 for Rajesh Traders is 12 days overdue (₹96,400).", createdAt: "2026-10-29T07:00:00", isRead: true, refType: "Invoice", refId: "INV/26-27/1180" },
  { id: 6, kind: "order", title: "Order cancelled by dealer", body: "Kiran Hardware cancelled SO/26-27/0391 before dispatch. Limit released: ₹42,500.", createdAt: "2026-10-28T16:20:00", isRead: true, refType: "Order", refId: "SO/26-27/0391" },
  { id: 7, kind: "limit", title: "Dealer reached 95% of limit", body: "Rajesh Traders has used ₹9,12,000 of ₹10,00,000.", createdAt: "2026-10-28T11:10:00", isRead: true, refType: "Ledger", refId: "DLR-0007" },
];

export interface Catalogue {
  id: number;
  title: string;
  description: string;
  scope: "All Dealers" | "Distributors" | "Retailers" | "Installers";
  pages: number;
  updatedAt: string;
  fileSizeKb: number;
}

export const CATALOGUES: Catalogue[] = [
  { id: 1, title: "Master Product Catalogue 2026-27", description: "Complete range with specifications and MRP.", scope: "All Dealers", pages: 148, updatedAt: "2026-10-01T00:00:00", fileSizeKb: 18420 },
  { id: 2, title: "Industrial Lighting Price List", description: "Dealer net rates for industrial and high-bay fixtures.", scope: "Distributors", pages: 36, updatedAt: "2026-10-18T00:00:00", fileSizeKb: 4210 },
  { id: 3, title: "Festive Offers - Diwali Scheme", description: "Slab-wise schemes and free-goods offers.", scope: "All Dealers", pages: 8, updatedAt: "2026-10-22T00:00:00", fileSizeKb: 1260 },
  { id: 4, title: "Installer Wiring Solutions Guide", description: "Wiring accessories installation reference.", scope: "Installers", pages: 52, updatedAt: "2026-09-12T00:00:00", fileSizeKb: 7340 },
];

export const PORTAL_SUMMARY = {
  activeDealers: 128,
  dealersOnHold: 6,
  newOrders: 14,
  pendingDispatch: 9,
  overdueAmount: 1842500,
  pendingLimitRequests: 3,
  ordersByStatus: [
    { status: "Placed", count: 14, color: "#6366f1" },
    { status: "Confirmed", count: 11, color: "#0ea5e9" },
    { status: "Processing", count: 9, color: "#f59e0b" },
    { status: "Dispatched", count: 17, color: "#8b5cf6" },
    { status: "Delivered", count: 62, color: "#10b981" },
    { status: "Cancelled", count: 4, color: "#ef4444" },
  ],
  topDealers: [
    { name: "Sunrise Distributors", used: 89, outstanding: 1780000 },
    { name: "Rajesh Traders", used: 91, outstanding: 912000 },
    { name: "Shree Electricals", used: 94, outstanding: 468000 },
    { name: "Metro Lighting Co.", used: 96, outstanding: 241000 },
  ],
};
