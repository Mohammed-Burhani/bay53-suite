// What changed on an invoice, in the shape the activity log stores:
// a snapshot for creates, and { field: { old, new } } plus line changes for edits.

import type { InvoiceCreatePayload, InvoiceDetail } from "@/lib/types/invoice.types";

type Line = { item_ID: number; std_Qty: number; std_Rate: number; discount1: number; amount: number; vatPer: number };

// Header fields that exist with the same meaning on both the GetById detail and the Create payload.
const HEADER_FIELDS = [
  "ledger_ID",
  "date",
  "bill_No",
  "item_SubTotal",
  "extra_SubTotal",
  "roundOff",
  "grandTotal",
  "recBy",
  "dueDays",
  "taxableType",
] as const;

const LINE_FIELDS = ["item_ID", "std_Qty", "std_Rate", "discount1", "vatPer", "amount"] as const;

export function invoiceSnapshot(p: InvoiceCreatePayload) {
  return {
    snapshot: {
      bill_No: p.bill_No || null,
      date: p.date,
      ledger_ID: p.ledger_ID,
      party: p.shipToName || null,
      lines: p.invoiceItemDetail.length,
      item_SubTotal: p.item_SubTotal,
      extra_SubTotal: p.extra_SubTotal,
      grandTotal: p.grandTotal,
      recBy: p.recBy || null,
    },
  };
}

/** Field-level diff between the invoice as loaded for editing and the payload being saved. */
export function invoiceDiff(before: InvoiceDetail | undefined, after: InvoiceCreatePayload) {
  if (!before) return { ...invoiceSnapshot(after), note: "Previous version was not loaded, so only the new state is recorded." };

  const fields: Record<string, { old: unknown; new: unknown }> = {};
  for (const f of HEADER_FIELDS) {
    const o = normalize(before[f]);
    const n = normalize(after[f]);
    if (o !== n) fields[f] = { old: o, new: n };
  }

  const oldLines = new Map<number, Line>();
  for (const l of before.invoiceItemDetail ?? []) oldLines.set(l.invDetID, l as unknown as Line);

  const added: Record<string, unknown>[] = [];
  const edited: Record<string, unknown>[] = [];
  const seen = new Set<number>();
  for (const l of after.invoiceItemDetail) {
    const prev = l.invDetID ? oldLines.get(l.invDetID) : undefined;
    if (!prev) {
      added.push(lineSummary(l));
      continue;
    }
    seen.add(l.invDetID);
    const diff: Record<string, { old: unknown; new: unknown }> = {};
    for (const f of LINE_FIELDS) {
      if (normalize(prev[f]) !== normalize(l[f])) diff[f] = { old: prev[f], new: l[f] };
    }
    if (Object.keys(diff).length) edited.push({ invDetID: l.invDetID, item_ID: l.item_ID, ...diff });
  }
  const removed = [...oldLines.entries()].filter(([id]) => !seen.has(id)).map(([, l]) => lineSummary(l));

  return {
    fields,
    lines: { added, edited, removed },
  };
}

function lineSummary(l: Line & { invDetID?: number; mfrItemName?: string | null }) {
  return {
    invDetID: l.invDetID ?? null,
    item_ID: l.item_ID,
    name: l.mfrItemName || null,
    qty: l.std_Qty,
    rate: l.std_Rate,
    amount: l.amount,
  };
}

// Dates arrive as "2026-10-17T00:00:00" from GetById and "2026-10-17" from the form.
function normalize(v: unknown): unknown {
  if (typeof v === "string" && /^\d{4}-\d{2}-\d{2}T/.test(v)) return v.slice(0, 10);
  if (v === "" || v === undefined) return null;
  return v;
}
