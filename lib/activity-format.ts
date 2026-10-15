import { isSnapshot, type Changes, type Json } from "./activity-types";

// ---------- Time: stored as UTC ISO strings, always displayed in IST ----------

const IST_OFFSET_MS = 330 * 60_000;
const TZ = "Asia/Kolkata";

const shortFmt = new Intl.DateTimeFormat("en-IN", {
  timeZone: TZ,
  day: "2-digit",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
  hour12: true,
});
const fullFmt = new Intl.DateTimeFormat("en-IN", {
  timeZone: TZ,
  day: "2-digit",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hour12: true,
});
const dayFmt = new Intl.DateTimeFormat("en-IN", {
  timeZone: TZ,
  weekday: "short",
  day: "2-digit",
  month: "short",
  year: "numeric",
});
const upper = (s: string) => s.replace(/\b(am|pm)\b/i, (m) => m.toUpperCase());

export const formatIST = (iso: string) => upper(shortFmt.format(new Date(iso)));
export const formatISTFull = (iso: string) => `${upper(fullFmt.format(new Date(iso)))} IST`;
export const formatISTDay = (iso: string) => dayFmt.format(new Date(iso));

/** YYYY-MM-DD of the IST calendar day. */
export const istDateKey = (iso: string) =>
  new Date(new Date(iso).getTime() + IST_OFFSET_MS).toISOString().slice(0, 10);

export const istHour = (iso: string) =>
  new Date(new Date(iso).getTime() + IST_OFFSET_MS).getUTCHours();

/** Business hours are 09:00 to 20:00 IST. */
export const isAfterHours = (iso: string) => {
  const h = istHour(iso);
  return h < 9 || h >= 20;
};

export const istDayStartMs = (day: string) => new Date(`${day}T00:00:00+05:30`).getTime();
export const istDayEndMs = (day: string) => new Date(`${day}T23:59:59.999+05:30`).getTime();

const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" });
const UNITS: [Intl.RelativeTimeFormatUnit, number][] = [
  ["day", 86_400],
  ["hour", 3_600],
  ["minute", 60],
];
export function relativeTime(iso: string, now = Date.now()): string {
  const diff = (new Date(iso).getTime() - now) / 1000;
  if (Math.abs(diff) < 45) return "just now";
  for (const [unit, secs] of UNITS) {
    if (Math.abs(diff) >= secs) return rtf.format(Math.round(diff / secs), unit);
  }
  return rtf.format(Math.round(diff / 60), "minute");
}

// ---------- Money and values ----------

const inr = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});
export const formatINR = (n: number) => inr.format(n);

const MONEY_FIELDS = new Set([
  "total",
  "subtotal",
  "discount",
  "tax",
  "amount",
  "rate",
  "balanceDue",
  "listPrice",
  "overridePrice",
]);
const PCT_FIELDS = new Set(["discountPct", "taxPct"]);

const FIELD_LABELS: Record<string, string> = {
  discountPct: "Discount %",
  taxPct: "Tax %",
  dueDate: "Due date",
  balanceDue: "Balance due",
  listPrice: "List price",
  overridePrice: "Override price",
  approvalStatus: "Approval",
  hsn: "HSN",
};
export function fieldLabel(key: string): string {
  if (FIELD_LABELS[key]) return FIELD_LABELS[key];
  const spaced = key.replace(/[_-]/g, " ").replace(/([a-z])([A-Z])/g, "$1 $2");
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}

export function formatValue(field: string, v: Json | undefined): string {
  if (v === null || v === undefined || v === "") return "(empty)";
  if (typeof v === "number") {
    if (MONEY_FIELDS.has(field)) return formatINR(v);
    if (PCT_FIELDS.has(field)) return `${v}%`;
    return String(v);
  }
  if (typeof v === "boolean") return v ? "Yes" : "No";
  if (typeof v === "object") return JSON.stringify(v);
  return v;
}

/** One-line summary of a change set for timelines and CSV. */
export function summarizeChanges(changes: Changes | null, maxItems = 2): string {
  if (!changes) return "";
  if (isSnapshot(changes)) {
    return Object.entries(changes.snapshot)
      .slice(0, 3)
      .map(([k, v]) => `${fieldLabel(k)}: ${formatValue(k, v)}`)
      .join(", ");
  }
  const entries = Object.entries(changes);
  const shown = entries
    .slice(0, maxItems)
    .map(([k, c]) => `${fieldLabel(k)}: ${formatValue(k, c.old)} → ${formatValue(k, c.new)}`);
  if (entries.length > maxItems) shown.push(`+${entries.length - maxItems} more`);
  return shown.join("; ");
}

export function computeTotals(
  items: { qty: number; rate: number }[],
  discountPct: number,
  taxPct: number,
) {
  const subtotal = items.reduce((s, i) => s + i.qty * i.rate, 0);
  const discount = Math.round((subtotal * discountPct) / 100);
  const tax = Math.round(((subtotal - discount) * taxPct) / 100);
  return { subtotal, discount, tax, total: subtotal - discount + tax };
}

export const invoiceHref = (invoiceId: string, tab?: "activity") =>
  `/invoices/${invoiceId}${tab ? `?tab=${tab}` : ""}`;

export function initials(name: string): string {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p.charAt(0).toUpperCase())
    .join("");
}
