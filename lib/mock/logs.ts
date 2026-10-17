import { ACTION_META } from "../activity-catalog";
import { computeTotals } from "../activity-format";
import type {
  ActionCode,
  ActivityLog,
  Changes,
  Invoice,
  InvoiceItem,
  InvoiceStatus,
  Json,
  Source,
} from "../activity-types";
import { ORG_ID, USERS_BY_ID } from "./users";

const MIN = 60_000;
const HOUR = 60 * MIN;
const DAY = 24 * HOUR;
const IST = 330 * MIN;

// ---------- Network fingerprints (documentation-range IPs only) ----------

const UA_WIN = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36";
const UA_EDGE = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 Edg/141.0.0.0";
const UA_MAC = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Safari/605.1.15";
const UA_FIREFOX = "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:132.0) Gecko/20100101 Firefox/132.0";
const UA_ANDROID = "Bay53Mobile/2.4.1 (Android 14; Pixel 7)";
const UA_IOS = "Bay53Mobile/2.4.1 (iOS 18.1; iPhone15,3)";

type Net = { ip: string; ua: string };
const WEB: Record<string, Net> = {
  u_admin: { ip: "203.0.113.10", ua: UA_WIN },
  u_acc1: { ip: "203.0.113.21", ua: UA_EDGE },
  u_acc2: { ip: "203.0.113.22", ua: UA_MAC },
  u_sal1: { ip: "198.51.100.31", ua: UA_WIN },
  u_sal2: { ip: "198.51.100.32", ua: UA_MAC },
};
const MOBILE: Record<string, Net> = {
  u_sal1: { ip: "198.51.100.131", ua: UA_ANDROID },
  u_sal2: { ip: "198.51.100.132", ua: UA_IOS },
  u_acc1: { ip: "198.51.100.121", ua: UA_ANDROID },
  u_acc2: { ip: "198.51.100.122", ua: UA_IOS },
  u_admin: { ip: "198.51.100.110", ua: UA_IOS },
};
const HOME_IP: Net = { ip: "198.51.100.77", ua: UA_FIREFOX };

function netFor(actorId: string, source: Source): Net {
  if (source === "system") return { ip: "192.0.2.10", ua: "Bay53-Worker/1.8" };
  if (source === "api") return { ip: "192.0.2.77", ua: "bay53-sdk-node/3.1" };
  return (source === "mobile" ? MOBILE : WEB)[actorId] ?? WEB.u_admin;
}

// ---------- Log construction ----------

export interface LogInput {
  at: number;
  action: ActionCode;
  actorId: string;
  source?: Source;
  invoice?: { id: string; number: string } | null;
  /** entityId for item rows. Defaults to the invoice id. */
  ref?: string;
  changes?: Changes | null;
  metadata?: Record<string, Json>;
  net?: Net;
}

export function makeLog(id: string, i: LogInput): ActivityLog {
  const meta = ACTION_META[i.action];
  const actor = USERS_BY_ID[i.actorId];
  const source: Source = i.source ?? (actor.role === "system" ? "system" : "web");
  const net = i.net ?? netFor(i.actorId, source);
  return {
    id,
    orgId: ORG_ID,
    entityType: meta.entity,
    entityId: i.ref ?? i.invoice?.id ?? id,
    entityLabel: i.invoice?.number ?? "All invoices",
    invoiceId: i.invoice?.id ?? null,
    action: i.action,
    importance: meta.importance,
    actorId: actor.id,
    actorName: actor.name,
    actorRole: actor.role,
    source,
    changes: i.changes ?? null,
    metadata: i.metadata ?? {},
    ip: net.ip,
    userAgent: net.ua,
    createdAt: new Date(i.at).toISOString(),
  };
}

// ---------- Seed data ----------

type ItemSeed = [name: string, hsn: string, qty: number, rate: number];
interface Seed {
  n: string;
  customer: string;
  domain: string;
  owner: "u_sal1" | "u_sal2";
  acc: "u_acc1" | "u_acc2";
  age: number;
  to: "Draft" | "Sent";
  final: InvoiceStatus;
  items: ItemSeed[];
  disc: number;
  tax: number;
  notes: string;
  editQty?: boolean;
  removed?: ItemSeed;
  share?: boolean;
  sendDelayH?: number;
  /** Values at creation time, before a later change story. */
  pre?: { disc?: number; tax?: number };
}

const SEEDS: Seed[] = [
  {
    n: "0033", customer: "Kaveri Textiles Pvt Ltd", domain: "kaveritextiles.in",
    owner: "u_sal1", acc: "u_acc1", age: 29, to: "Sent", final: "Sent",
    items: [["Cotton warp yarn 40s", "5205", 120, 410], ["Dyed polyester weft yarn", "5509", 80, 365]],
    disc: 2, tax: 12, editQty: true, share: true,
    notes: "Deliver in two lots, 30 days credit",
  },
  {
    n: "0034", customer: "Sundaram Hardware & Tools", domain: "sundaramhardware.in",
    owner: "u_sal2", acc: "u_acc2", age: 26, to: "Sent", final: "Sent",
    items: [["Hex bolts M12, box of 100", "7318", 6, 1400], ["GI pipe 1 inch", "7306", 90, 232], ["Angle grinder 4 inch", "8467", 6, 2850]],
    disc: 3, tax: 18,
    notes: "Collect from Peenya godown",
  },
  {
    n: "0035", customer: "Greenfield Agro Exports", domain: "greenfieldagro.in",
    owner: "u_sal1", acc: "u_acc2", age: 24, to: "Sent", final: "Voided",
    items: [["Laminated HDPE sack 25 kg", "3923", 1500, 11], ["Export carton 5-ply", "4819", 400, 46]],
    disc: 0, tax: 18, notes: "Replaced by revised quotation",
  },
  {
    n: "0036", customer: "Nilgiri Tea Estates", domain: "nilgiritea.co.in",
    owner: "u_sal2", acc: "u_acc1", age: 22, to: "Sent", final: "Sent",
    items: [["Tea chest, empty", "4415", 300, 285], ["Moisture-proof liner", "3923", 300, 38]],
    disc: 0, tax: 18,
    notes: "Ship to Coonoor estate office",
  },
  {
    n: "0037", customer: "Rangoli Home Decor", domain: "rangolihomedecor.in",
    owner: "u_sal2", acc: "u_acc2", age: 13, to: "Sent", final: "Sent",
    items: [["Brass diya set", "8306", 60, 620], ["Teak wall panel 2x4 ft", "4421", 24, 3150], ["Cotton cushion cover", "6304", 120, 185]],
    disc: 18, pre: { disc: 5 }, tax: 18, share: true,
    notes: "Festive season order, deliver in two lots",
  },
  {
    n: "0038", customer: "Orbit Logistics LLP", domain: "orbitlogistics.in",
    owner: "u_sal1", acc: "u_acc1", age: 17, to: "Sent", final: "Sent",
    items: [["Pallet wrap film", "3920", 200, 520], ["Corner board 1.5 m", "4823", 500, 34], ["Heavy duty strapping roll", "3926", 60, 780]],
    disc: 4, tax: 18, removed: ["Sample pack, cling film", "3920", 2, 300], share: true,
    notes: "Delivery to Hosur warehouse",
  },
  {
    n: "0040", customer: "Marigold Pharma Distributors", domain: "marigoldpharma.in",
    owner: "u_sal2", acc: "u_acc2", age: 9, to: "Sent", final: "Voided",
    items: [["Cold-chain gel pack", "3923", 400, 62], ["Insulated shipper box", "3923", 150, 410]],
    disc: 0, tax: 12, notes: "Dispatch within 3 working days",
  },
  {
    n: "0042", customer: "Tungabhadra Steel Works", domain: "tungabhadrasteel.in",
    owner: "u_sal1", acc: "u_acc1", age: 11, to: "Sent", final: "Sent",
    items: [["MS flat bar 40x6", "7214", 50, 2400]],
    disc: 0, tax: 18,
    notes: "Mill test certificate to be attached",
  },
  {
    n: "0044", customer: "Deccan Auto Components", domain: "deccanauto.in",
    owner: "u_sal1", acc: "u_acc2", age: 6, to: "Sent", final: "Sent",
    items: [["Brake pad set, front", "8708", 80, 1850], ["Clutch plate assembly", "8708", 40, 3400]],
    disc: 28, pre: { disc: 5 }, tax: 28, sendDelayH: 30,
    notes: "Bulk order, quarterly rate contract",
  },
  {
    n: "0045", customer: "Bhavani Packaging Co", domain: "bhavanipack.in",
    owner: "u_sal2", acc: "u_acc1", age: 5, to: "Sent", final: "Sent",
    items: [["Corrugated box 3-ply, 12x10x8", "4819", 2000, 18], ["BOPP tape 48 mm", "3919", 300, 52]],
    disc: 3, tax: 18, pre: { tax: 12 }, notes: "Deliver before month end",
  },
  {
    n: "0047", customer: "Coromandel Fertilizer Depot", domain: "coromandelfert.in",
    owner: "u_sal1", acc: "u_acc2", age: 4, to: "Sent", final: "Sent",
    items: [["NPK 19:19:19, 50 kg bag", "3105", 140, 1280], ["Zinc sulphate, 25 kg", "2833", 60, 940]],
    disc: 1, tax: 5,
    notes: "Deliver within 5 working days",
  },
  {
    n: "0048", customer: "Hosur Cold Storage Services", domain: "hosurcoldstorage.in",
    owner: "u_sal2", acc: "u_acc1", age: 1, to: "Draft", final: "Draft",
    items: [["Cold room rental, per pallet per month", "9967", 120, 640]],
    disc: 0, tax: 18, notes: "Quarterly billing",
  },
  {
    n: "0049", customer: "Pallava Stationers", domain: "pallavastationers.in",
    owner: "u_sal2", acc: "u_acc1", age: 10, to: "Draft", final: "Deleted",
    items: [["A4 copier paper, ream", "4802", 200, 285]],
    disc: 0, tax: 18, notes: "Created in error",
  },
];

interface Built {
  s: Seed;
  inv: Invoice;
  ref: { id: string; number: string };
  base: number;
}

const maskEmail = (domain: string) => `a*****@${domain}`;
const totalFor = (items: { qty: number; rate: number }[], disc: number, tax: number) =>
  computeTotals(items, disc, tax).total;

export function buildSeed(now: number): { logs: ActivityLog[]; invoices: Invoice[] } {
  // Deterministic PRNG so every reload tells the same story.
  let seed = 20261015;
  const rnd = () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const digits = (n: number) => String(Math.floor(rnd() * 10 ** n)).padStart(n, "0");

  const dayStart = (ms: number) => Math.floor((ms + IST) / DAY) * DAY - IST;
  /** A wall-clock moment in IST, N days ago. */
  const at = (daysAgo: number, h: number, m = 0) =>
    dayStart(now - daysAgo * DAY) + h * HOUR + m * MIN;

  const inputs: LogInput[] = [];
  const emit = (i: LogInput) => inputs.push({ ...i, at: Math.min(i.at, now - MIN) });

  // ----- Build invoices -----
  const built: Built[] = SEEDS.map((s) => {
    const id = `inv-${s.n}`;
    const number = `INV-${s.n}`;
    const base = at(s.age, 10 + Math.floor(rnd() * 3), Math.floor(rnd() * 55));
    const items: InvoiceItem[] = s.items.map(([name, hsn, qty, rate], i) => ({
      id: `itm_${s.n}_${i + 1}`, name, hsn, qty, rate,
    }));
    const t = computeTotals(items, s.disc, s.tax);
    const inv: Invoice = {
      id, orgId: ORG_ID, number, customer: s.customer, ownerId: s.owner, accountantId: s.acc,
      createdAt: new Date(base).toISOString(),
      dueDate: new Date(base + 30 * DAY + IST).toISOString().slice(0, 10),
      status: s.final, items, discountPct: s.disc, taxPct: s.tax, ...t,
      notes: s.notes,
    };
    return { s, inv, ref: { id, number }, base };
  });
  const by = (n: string) => built.find((b) => b.s.n === n)!;

  // ----- Generic lifecycle -----
  function lifecycle(B: Built, phase?: { items: InvoiceItem[] }) {
    const { s, inv, ref, base } = B;
    const items = phase?.items ?? inv.items;
    const mobile = rnd() < 0.3;
    const src: Source = mobile ? "mobile" : "web";
    let t = base;
    const step = (min: number) => (t += (min + Math.floor(rnd() * 3)) * MIN);

    emit({ at: base, action: "invoice.created", actorId: s.owner, source: src, invoice: ref,
      changes: { snapshot: { number: inv.number, customer: inv.customer, status: "Draft" } } });

    items.forEach((it, i) => {
      const qty = i === 0 && s.editQty ? it.qty + 10 : it.qty;
      emit({ at: step(4), action: "item.added", actorId: s.owner, source: src, invoice: ref, ref: it.id,
        changes: { snapshot: { name: it.name, qty, rate: it.rate } } });
    });
    if (s.removed) {
      const [name, , qty, rate] = s.removed;
      const rid = `itm_${s.n}_x`;
      emit({ at: step(3), action: "item.added", actorId: s.owner, source: src, invoice: ref, ref: rid,
        changes: { snapshot: { name, qty, rate } } });
      emit({ at: step(4), action: "item.removed", actorId: s.owner, source: src, invoice: ref, ref: rid,
        changes: { snapshot: { name, qty, rate } }, metadata: { reason: "Not part of the order" } });
    }
    if (s.editQty) {
      emit({ at: step(6), action: "item.edited", actorId: s.owner, source: src, invoice: ref, ref: items[0].id,
        changes: { qty: { old: items[0].qty + 10, new: items[0].qty } } });
    }
    const startTotal = totalFor(items, s.pre?.disc ?? s.disc, s.pre?.tax ?? s.tax);
    emit({ at: step(2), action: "invoice.total_changed", actorId: s.owner, source: src, invoice: ref,
      changes: { total: { old: 0, new: startTotal } } });
    emit({ at: step(12), action: "invoice.updated", actorId: s.acc, invoice: ref,
      changes: { notes: { old: "", new: s.notes }, dueDate: { old: null, new: inv.dueDate } } });
    emit({ at: step(18), action: "pdf.generated", actorId: "u_system", invoice: ref,
      metadata: { pages: 1, sizeKb: 60 + Math.floor(rnd() * 40), template: "tax-invoice-v3" } });
    if (s.to === "Draft") return;

    const sentAt = base + (s.sendDelayH ?? 2) * HOUR + Math.floor(rnd() * 25) * MIN;
    emit({ at: sentAt, action: "invoice.status_changed", actorId: s.acc, invoice: ref,
      changes: { status: { old: "Draft", new: "Sent" } } });
    emit({ at: sentAt + 2 * MIN, action: "invoice.emailed", actorId: s.acc, invoice: ref,
      metadata: { to: maskEmail(s.domain), messageId: `msg_${digits(6)}`, attachment: `${inv.number}.pdf` } });
    if (rnd() < 0.75) {
      emit({ at: sentAt + (2 + Math.floor(rnd() * 5)) * HOUR, action: "pdf.downloaded", actorId: s.owner,
        source: "mobile", invoice: ref, metadata: { via: "invoice list", sizeKb: 74 } });
    }
    if (s.share) {
      emit({ at: sentAt + 3 * HOUR, action: "invoice.shared", actorId: s.owner, invoice: ref,
        metadata: { channel: "whatsapp", linkExpiresInDays: 7 } });
    }

  }

  // 0042 is sent at the old rate before the story edits it.
  const b42 = by("0042");
  const phase42Items = b42.inv.items.map((i) => ({ ...i, rate: 2150 }));
  built.forEach((B) => lifecycle(B, B.s.n === "0042" ? { items: phase42Items } : undefined));

  // ----- Stories -----

  // A. Sent invoice edited afterwards (INV-0042): the rate is corrected and the total rises.
  {
    const B = b42;
    const t0 = at(3, 15, 20);
    emit({ at: t0, action: "item.edited", actorId: "u_acc1", invoice: B.ref, ref: B.inv.items[0].id,
      changes: { rate: { old: 2150, new: 2400 } } });
    emit({ at: t0 + 2 * MIN, action: "invoice.total_changed", actorId: "u_acc1", invoice: B.ref,
      changes: { total: { old: 126850, new: 141600 } } });
    emit({ at: t0 + 3 * MIN, action: "invoice.edited_after_sent", actorId: "u_acc1", invoice: B.ref,
      changes: { rate: { old: 2150, new: 2400 }, total: { old: 126850, new: 141600 } },
      metadata: { statusAtEdit: "Sent", reason: "Rate corrected per revised price list", approvalRef: null } });
    emit({ at: t0 + 10 * MIN, action: "invoice.emailed", actorId: "u_acc1", invoice: B.ref,
      metadata: { to: maskEmail(B.s.domain), messageId: `msg_${digits(6)}`, note: "Revised copy" } });
  }

  // B. Voided invoices: one in the current week, one in the previous week.
  {
    const v1 = by("0040");
    emit({ at: at(6, 11, 32), action: "invoice.voided", actorId: "u_admin", invoice: v1.ref,
      changes: { status: { old: "Sent", new: "Voided" } },
      metadata: { reason: "Duplicate invoice raised for the same dispatch", total: v1.inv.total } });
    const v2 = by("0035");
    emit({ at: at(10, 17, 5), action: "invoice.voided", actorId: "u_admin", invoice: v2.ref,
      changes: { status: { old: "Sent", new: "Voided" } },
      metadata: { reason: "Customer revised order quantity", total: v2.inv.total } });
  }

  // C. Large discount overrides (INV-0044 this week, INV-0037 last week).
  {
    const B = by("0044");
    const old = computeTotals(B.inv.items, 5, B.s.tax);
    const cur = computeTotals(B.inv.items, 28, B.s.tax);
    emit({ at: B.base + 70 * MIN, action: "invoice.discount_changed", actorId: "u_sal1", invoice: B.ref,
      changes: { discountPct: { old: 5, new: 28 }, discount: { old: old.discount, new: cur.discount } },
      metadata: { override: true, requiresApproval: true, thresholdPct: 15 } });
    emit({ at: B.base + 72 * MIN, action: "invoice.total_changed", actorId: "u_sal1", invoice: B.ref,
      changes: { total: { old: old.total, new: cur.total } } });
    emit({ at: B.base + 74 * MIN, action: "price.override", actorId: "u_sal1", invoice: B.ref,
      ref: B.inv.items[0].id,
      changes: { discountPct: { old: 5, new: 28 } },
      metadata: { discountPct: 28, thresholdPct: 15, approvalRequired: true, reason: "Competitor quote from Pune plant" } });
    emit({ at: B.base + 25 * HOUR, action: "invoice.updated", actorId: "u_admin", invoice: B.ref,
      changes: { approvalStatus: { old: "Pending approval", new: "Approved" } },
      metadata: { approvedBy: "u_admin", note: "Approved for rate contract" } });

    const C = by("0037");
    const o2 = computeTotals(C.inv.items, 5, C.s.tax);
    const c2 = computeTotals(C.inv.items, 18, C.s.tax);
    emit({ at: C.base + 70 * MIN, action: "invoice.discount_changed", actorId: "u_sal2", invoice: C.ref,
      changes: { discountPct: { old: 5, new: 18 }, discount: { old: o2.discount, new: c2.discount } },
      metadata: { override: true, requiresApproval: true, thresholdPct: 15 } });
    emit({ at: C.base + 72 * MIN, action: "invoice.total_changed", actorId: "u_sal2", invoice: C.ref,
      changes: { total: { old: o2.total, new: c2.total } } });
    emit({ at: C.base + 74 * MIN, action: "price.override", actorId: "u_sal2", invoice: C.ref,
      ref: C.inv.items[1].id, changes: { discountPct: { old: 5, new: 18 } },
      metadata: { discountPct: 18, thresholdPct: 15, approvalRequired: true, reason: "Festive season volume" } });
  }

  // D. After-hours edit from an unusual IP (INV-0045), plus other off-hours touches.
  {
    const B = by("0045");
    const t0 = at(2, 23, 42);
    const old = computeTotals(B.inv.items, B.s.disc, 12);
    const cur = computeTotals(B.inv.items, B.s.disc, 18);
    emit({ at: t0, action: "invoice.tax_changed", actorId: "u_acc1", invoice: B.ref, net: HOME_IP,
      changes: { taxPct: { old: 12, new: 18 }, tax: { old: old.tax, new: cur.tax } } });
    emit({ at: t0 + MIN, action: "invoice.total_changed", actorId: "u_acc1", invoice: B.ref, net: HOME_IP,
      changes: { total: { old: old.total, new: cur.total } } });
    emit({ at: t0 + 2 * MIN, action: "invoice.edited_after_sent", actorId: "u_acc1", invoice: B.ref, net: HOME_IP,
      changes: { taxPct: { old: 12, new: 18 }, total: { old: old.total, new: cur.total } },
      metadata: { statusAtEdit: "Sent", afterHours: true, reason: "GST rate corrected before month end" } });
    emit({ at: at(3, 6, 15), action: "pdf.downloaded", actorId: "u_sal2", source: "mobile", invoice: B.ref,
      metadata: { via: "invoice list", sizeKb: 71 } });
    const D = by("0044");
    emit({ at: at(1, 22, 5), action: "invoice.shared", actorId: "u_sal1", source: "mobile", invoice: D.ref,
      metadata: { channel: "whatsapp", linkExpiresInDays: 7 } });
  }

  // E. Edit after sent on a delivery note (INV-0036).
  {
    const C = by("0036");
    emit({ at: at(11, 13, 30), action: "invoice.edited_after_sent", actorId: "u_acc1", invoice: C.ref,
      changes: { notes: { old: C.s.notes, new: "Ship to Coonoor estate office, gate 2" } },
      metadata: { statusAtEdit: "Sent", reason: "Delivery instruction added" } });
  }

  // F. Draft deleted (INV-0049).
  {
    const B = by("0049");
    emit({ at: at(4, 11, 20), action: "invoice.deleted", actorId: "u_admin", invoice: B.ref,
      changes: { snapshot: { number: B.inv.number, customer: B.inv.customer, total: B.inv.total, status: "Draft" } },
      metadata: { reason: "Created in error" } });
  }

  // G. CSV exports.
  emit({ at: at(12, 18, 5), action: "export.csv", actorId: "u_admin", invoice: null, ref: "exp_seed_1",
    metadata: { format: "csv", rowCount: 87, filters: {} } });
  emit({ at: at(3, 12, 48), action: "export.csv", actorId: "u_admin", invoice: null, ref: "exp_seed_2",
    metadata: { format: "csv", rowCount: 41, filters: { importance: "critical" } } });

  inputs.sort((a, b) => a.at - b.at);
  const logs = inputs.map((i, idx) => makeLog(`log_${String(idx + 1).padStart(6, "0")}`, i)).reverse();
  return { logs, invoices: built.map((b) => b.inv) };
}
