// Shared types for the invoice Activity Log module.
// Row shape mirrors the future `activity_logs` table (snake_case columns map 1:1).

export type Json = string | number | boolean | null | Json[] | { [key: string]: Json };

export type EntityType = "invoice" | "invoice_item";
export type Importance = "info" | "important" | "critical";
export type Source = "web" | "mobile" | "api" | "system";
export type ActorRole = "admin" | "accountant" | "sales" | "system";

export type ActionCode =
  | "invoice.created"
  | "invoice.updated"
  | "item.added"
  | "item.edited"
  | "item.removed"
  | "pdf.generated"
  | "pdf.downloaded"
  | "invoice.status_changed"
  | "invoice.total_changed"
  | "invoice.discount_changed"
  | "invoice.tax_changed"
  | "invoice.emailed"
  | "invoice.shared"
  | "invoice.voided"
  | "invoice.deleted"
  | "invoice.edited_after_sent"
  | "price.override"
  | "export.csv";

export interface FieldChange {
  old: Json;
  new: Json;
}
export type DiffChanges = Record<string, FieldChange>;
export interface SnapshotChanges {
  snapshot: Record<string, Json>;
}
export type Changes = DiffChanges | SnapshotChanges;

/** Full stored row. Append-only: there is no update or delete path anywhere. */
export interface ActivityLog {
  id: string;
  orgId: string;
  entityType: EntityType;
  entityId: string;
  /** Invoice number, e.g. INV-0042. */
  entityLabel: string;
  /** Extra index column (not in the original spec) so rows can be filtered per invoice. */
  invoiceId: string | null;
  action: ActionCode;
  importance: Importance;
  actorId: string;
  actorName: string;
  actorRole: ActorRole;
  source: Source;
  changes: Changes | null;
  metadata: Record<string, Json>;
  ip: string;
  userAgent: string;
  /** ISO 8601, always UTC. Display layer converts to IST. */
  createdAt: string;
}

/**
 * What the API returns. ip, userAgent and metadata exist ONLY for admins;
 * the API layer strips them for everyone else (mirrors a column-level policy / view).
 */
export type ActivityRow = Omit<ActivityLog, "ip" | "userAgent" | "metadata"> & {
  ip?: string;
  userAgent?: string;
  metadata?: Record<string, Json>;
};

export interface ActivityUser {
  id: string;
  name: string;
  role: ActorRole;
}

/** The acting user. The API derives permissions from the user record, never from client input. */
export interface Viewer {
  userId: string;
}

export interface LogFilters {
  /** IST calendar day, YYYY-MM-DD. */
  from?: string;
  to?: string;
  user?: string;
  action?: ActionCode;
  importance?: Importance;
  source?: Source;
  /** Invoice-number search. */
  q?: string;
}

export interface Page<T> {
  rows: T[];
  nextCursor: string | null;
  total: number;
}

export interface KpiValue {
  current: number;
  previous: number;
}
export interface Kpis {
  windowDays: number;
  voids: KpiValue;
  editsAfterSentOrPaid: KpiValue;
  discountOverrides: KpiValue;
  afterHours: KpiValue;
  deletions: KpiValue;
  topActors: { actorId: string; name: string; role: ActorRole; count: number }[];
}

export type InvoiceStatus = "Draft" | "Sent" | "Voided" | "Deleted";

export interface InvoiceItem {
  id: string;
  name: string;
  hsn: string;
  qty: number;
  rate: number;
}
export interface Invoice {
  id: string;
  orgId: string;
  number: string;
  customer: string;
  ownerId: string;
  accountantId: string;
  createdAt: string;
  dueDate: string;
  status: InvoiceStatus;
  items: InvoiceItem[];
  discountPct: number;
  taxPct: number;
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  notes: string;
}

export type ActivityErrorCode = "forbidden" | "not_found" | "unavailable";
export class ActivityError extends Error {
  code: ActivityErrorCode;
  constructor(code: ActivityErrorCode, message: string) {
    super(message);
    this.name = "ActivityError";
    this.code = code;
  }
}

export function isSnapshot(c: Changes): c is SnapshotChanges {
  return "snapshot" in c && typeof (c as SnapshotChanges).snapshot === "object";
}
