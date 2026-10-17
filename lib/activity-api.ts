/**
 * Mock data-access module for the invoice-detail and My activity pages (the admin page now reads
 * real logs through lib/activity-log/).
 *
 * Every function is async and takes the acting Viewer. Visibility rules and field
 * stripping live HERE (not in components), so the UI can never receive data the
 * viewer must not see. In production the same rules move into RLS policies and
 * column-level views; see the Supabase swap checklist.
 *
 * The log store is append-only: there is no update or delete path.
 */
import {
  ActivityError,
  type ActivityLog,
  type ActivityRow,
  type ActivityUser,
  type Changes,
  type Importance,
  type Invoice,
  type Json,
  type Page,
  type Viewer,
} from "./activity-types";
import { buildSeed } from "./mock/logs";
import { USERS_BY_ID } from "./mock/users";

// ---------- Mock store (replace with Supabase) ----------

interface Db {
  logs: ActivityLog[]; // newest first
  invoices: Invoice[];
  seq: number;
}
let db: Db | null = null;
function getDb(): Db {
  if (!db) {
    const seeded = buildSeed(Date.now());
    db = { ...seeded, seq: seeded.logs.length };
  }
  return db;
}

let simulatedFailure = false;
/** Demo helper: makes every call reject so error states can be shown. */
export function setSimulatedFailure(on: boolean) {
  simulatedFailure = on;
}

async function gate(): Promise<Db> {
  await new Promise((r) => setTimeout(r, 200 + Math.random() * 200));
  if (simulatedFailure) throw new ActivityError("unavailable", "The activity service did not respond.");
  return getDb();
}

// ---------- Access control ----------

function requireUser(viewer: Viewer): ActivityUser {
  const u = USERS_BY_ID[viewer.userId];
  if (!u || u.role === "system") throw new ActivityError("forbidden", "Unknown user.");
  return u;
}
const canAccessInvoice = (u: ActivityUser, inv: Invoice) =>
  u.role === "admin" || inv.ownerId === u.id || inv.accountantId === u.id;

/** Admin: everything. User: own actions, plus important and critical events on invoices they can access. */
function canSee(u: ActivityUser, log: ActivityLog, invoices: Map<string, Invoice>): boolean {
  if (u.role === "admin" || log.actorId === u.id) return true;
  if (log.importance === "info" || !log.invoiceId) return false;
  const inv = invoices.get(log.invoiceId);
  return !!inv && canAccessInvoice(u, inv);
}

// ---------- Redaction ----------

const SECRET_KEY = /secret|token|password|apikey|api_key|api-key|cardnumber|card_number|cvv|accountnumber|account_number|iban|authorization/i;
/** Drops secret-looking keys and masks any long digit run (card or bank numbers) to its last 4. */
function redact(v: Json, key = ""): Json {
  if (SECRET_KEY.test(key)) return "[redacted]";
  if (typeof v === "string") {
    return v.replace(/\d[\d -]{10,}\d/g, (m) => "*".repeat(Math.max(m.length - 4, 0)) + m.slice(-4));
  }
  if (Array.isArray(v)) return v.map((x) => redact(x, key));
  if (v && typeof v === "object") {
    return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, redact(x, k)]));
  }
  return v;
}

function toRow(log: ActivityLog, admin: boolean): ActivityRow {
  const { ip, userAgent, metadata, changes, ...rest } = log;
  const base = { ...rest, changes: changes ? (redact(changes as Json) as Changes) : null };
  if (!admin) return base;
  return { ...base, ip, userAgent, metadata: redact(metadata) as Record<string, Json> };
}

const encodeCursor = (l: ActivityLog) => `${l.createdAt}|${l.id}`;
function paginate(rows: ActivityLog[], cursor: string | null | undefined, limit: number, admin: boolean): Page<ActivityRow> {
  let start = 0;
  if (cursor) {
    const [at, id] = cursor.split("|");
    start = rows.findIndex((l) => l.createdAt < at || (l.createdAt === at && l.id < id));
    if (start === -1) return { rows: [], nextCursor: null, total: rows.length };
  }
  const slice = rows.slice(start, start + limit);
  const more = start + limit < rows.length;
  return {
    rows: slice.map((l) => toRow(l, admin)),
    nextCursor: more ? encodeCursor(slice[slice.length - 1]) : null,
    total: rows.length,
  };
}

const invoiceMap = (d: Db) => new Map(d.invoices.map((i) => [i.id, i]));

// ---------- Public API ----------

export async function getInvoice(viewer: Viewer, invoiceId: string): Promise<Invoice> {
  const d = await gate();
  const u = requireUser(viewer);
  const inv = d.invoices.find((i) => i.id === invoiceId);
  if (!inv) throw new ActivityError("not_found", "Invoice not found.");
  if (!canAccessInvoice(u, inv)) throw new ActivityError("forbidden", "You do not have access to this invoice.");
  return inv;
}

export async function getInvoiceTimeline(viewer: Viewer, invoiceId: string): Promise<ActivityRow[]> {
  const d = await gate();
  const u = requireUser(viewer);
  const inv = d.invoices.find((i) => i.id === invoiceId);
  if (!inv) throw new ActivityError("not_found", "Invoice not found.");
  if (!canAccessInvoice(u, inv)) throw new ActivityError("forbidden", "You do not have access to this invoice.");
  const map = invoiceMap(d);
  return d.logs
    .filter((l) => l.invoiceId === invoiceId && canSee(u, l, map))
    .map((l) => toRow(l, u.role === "admin"));
}

export async function getMyActivity(
  viewer: Viewer,
  opts: { importance?: Importance } = {},
  cursor: string | null = null,
  limit = 25,
): Promise<Page<ActivityRow>> {
  const d = await gate();
  const u = requireUser(viewer);
  const map = invoiceMap(d);
  // Always the "mine" rule, even for admins: own actions, plus important and critical on their invoices.
  const rows = d.logs.filter((l) => {
    if (opts.importance && l.importance !== opts.importance) return false;
    if (l.actorId === u.id) return true;
    if (l.importance === "info" || !l.invoiceId) return false;
    const inv = map.get(l.invoiceId);
    return !!inv && canAccessInvoice(u, inv);
  });
  return paginate(rows, cursor, limit, u.role === "admin");
}
