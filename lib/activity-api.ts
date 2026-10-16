/**
 * Single data-access module for the Activity Log.
 *
 * Every function is async and takes the acting Viewer. Visibility rules and field
 * stripping live HERE (not in components), so the UI can never receive data the
 * viewer must not see. In production the same rules move into RLS policies and
 * column-level views; see the Supabase swap checklist.
 *
 * The log store is append-only: the only mutation exposed is the audit row that
 * exportLogs() and the live simulator append. There is no update or delete path.
 */
import {
  formatISTFull,
  isAfterHours,
  istDayEndMs,
  istDayStartMs,
  summarizeChanges,
} from "./activity-format";
import {
  ActivityError,
  type ActivityLog,
  type ActivityRow,
  type ActivityUser,
  type Changes,
  type Importance,
  type Invoice,
  type Json,
  type Kpis,
  type KpiValue,
  type LogFilters,
  type Page,
  type Viewer,
} from "./activity-types";
import { buildSeed, makeLog, nextLiveInput } from "./mock/logs";
import { USERS, USERS_BY_ID } from "./mock/users";

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
const nextId = (d: Db) => `log_${String(++d.seq).padStart(6, "0")}`;

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
function requireAdmin(viewer: Viewer): ActivityUser {
  const u = requireUser(viewer);
  if (u.role !== "admin") throw new ActivityError("forbidden", "Admin access required.");
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

// ---------- Filtering and cursors ----------

function matches(l: ActivityLog, f: LogFilters): boolean {
  const t = new Date(l.createdAt).getTime();
  if (f.from && t < istDayStartMs(f.from)) return false;
  if (f.to && t > istDayEndMs(f.to)) return false;
  if (f.user && l.actorId !== f.user) return false;
  if (f.action && l.action !== f.action) return false;
  if (f.importance && l.importance !== f.importance) return false;
  if (f.source && l.source !== f.source) return false;
  if (f.q) {
    const q = f.q.toLowerCase().replace(/\s+/g, "");
    if (!l.entityLabel.toLowerCase().includes(q)) return false;
  }
  return true;
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

export async function listLogs(
  viewer: Viewer,
  filters: LogFilters = {},
  cursor: string | null = null,
  limit = 25,
): Promise<Page<ActivityRow>> {
  const d = await gate();
  const u = requireUser(viewer);
  const inv = invoiceMap(d);
  const rows = d.logs.filter((l) => canSee(u, l, inv) && matches(l, filters));
  return paginate(rows, cursor, limit, u.role === "admin");
}

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

const DAY_MS = 86_400_000;
export async function getKpis(viewer: Viewer): Promise<Kpis> {
  const d = await gate();
  requireAdmin(viewer);
  const now = Date.now();
  const count = (pred: (l: ActivityLog) => boolean): KpiValue => {
    let current = 0;
    let previous = 0;
    for (const l of d.logs) {
      const age = now - new Date(l.createdAt).getTime();
      if (age > 2 * 7 * DAY_MS) break; // logs are newest first
      if (!pred(l)) continue;
      if (age <= 7 * DAY_MS) current++;
      else previous++;
    }
    return { current, previous };
  };
  const tally = new Map<string, number>();
  for (const l of d.logs) {
    if (now - new Date(l.createdAt).getTime() > 7 * DAY_MS) break;
    if (l.actorRole === "system") continue;
    tally.set(l.actorId, (tally.get(l.actorId) ?? 0) + 1);
  }
  const topActors = [...tally.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([id, n]) => ({ actorId: id, name: USERS_BY_ID[id].name, role: USERS_BY_ID[id].role, count: n }));

  return {
    windowDays: 7,
    voids: count((l) => l.action === "invoice.voided"),
    editsAfterSentOrPaid: count((l) => l.action === "invoice.edited_after_sent"),
    discountOverrides: count((l) => l.action === "price.override"),
    afterHours: count((l) => l.actorRole !== "system" && isAfterHours(l.createdAt)),
    deletions: count((l) => l.action === "invoice.deleted"),
    topActors,
  };
}

export async function listUsers(viewer: Viewer): Promise<ActivityUser[]> {
  await gate();
  requireAdmin(viewer);
  return USERS;
}

// ---------- Export (appends an audit row) ----------

const CSV_COLUMNS = [
  "id", "created_at_utc", "created_at_ist", "invoice", "entity_type", "entity_id", "action",
  "importance", "actor", "actor_role", "source", "changes", "ip", "user_agent",
];
function csvCell(v: string): string {
  // Neutralise spreadsheet formula injection, then quote if needed.
  const safe = /^[=+\-@\t\r]/.test(v) ? `'${v}` : v;
  return /[",\n\r]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
}

export async function exportLogs(
  viewer: Viewer,
  filters: LogFilters = {},
): Promise<{ filename: string; csv: string; rowCount: number }> {
  const d = await gate();
  const admin = requireAdmin(viewer);
  const rows = d.logs.filter((l) => matches(l, filters)).map((l) => toRow(l, true));
  const lines = rows.map((r) =>
    [
      r.id, r.createdAt, formatISTFull(r.createdAt), r.entityLabel, r.entityType, r.entityId,
      r.action, r.importance, r.actorName, r.actorRole, r.source, summarizeChanges(r.changes, 10),
      r.ip ?? "", r.userAgent ?? "",
    ].map((c) => csvCell(String(c))).join(","),
  );
  const csv = "﻿" + [CSV_COLUMNS.join(","), ...lines].join("\r\n");

  // The export itself is a critical, immutable log entry.
  const entry = makeLog(nextId(d), {
    at: Date.now(),
    action: "export.csv",
    actorId: admin.id,
    source: "web",
    invoice: null,
    ref: `exp_${d.seq}`,
    metadata: { format: "csv", rowCount: rows.length, filters: JSON.parse(JSON.stringify(filters)) as Json },
  });
  d.logs.unshift(entry);

  const stamp = new Date(Date.now() + 330 * 60_000).toISOString().slice(0, 16).replace(/[-:T]/g, "");
  return { filename: `activity-log_${stamp}_IST.csv`, csv, rowCount: rows.length };
}

// ---------- Live critical events ----------

/**
 * Mock: appends a simulated critical event every ~15 s and notifies the callback.
 * Supabase: replace with a Realtime channel on INSERT into activity_logs where importance = 'critical'.
 */
export function subscribeToCritical(viewer: Viewer, onEvent: (row: ActivityRow) => void): () => void {
  const u = USERS_BY_ID[viewer.userId];
  if (!u || u.role !== "admin") return () => {};
  let n = 0;
  const timer = setInterval(() => {
    if (simulatedFailure) return;
    const d = getDb();
    const entry = makeLog(nextId(d), nextLiveInput(Date.now(), d.invoices, n++));
    d.logs.unshift(entry);
    onEvent(toRow(entry, true));
  }, 15_000);
  return () => clearInterval(timer);
}
