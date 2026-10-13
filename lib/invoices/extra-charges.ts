// ==================== Invoice Extra Charge Calculation ====================
// Pure helpers behind the invoice form's Extra Charges panel. Every master
// charge (/ExtraCharge/Search) is listed; the user switches on / edits the
// ones the bill needs and the totals follow. Tax rows (CGST / SGST / IGST) are
// never typed in — they are derived from the line items plus the GST on any
// taxed charge (e.g. "Delivery Charges, GST @ 18%"), like the desktop app.

import type { ExtraCharge } from "@/lib/types/master.types";

export type GstKind = "cgst" | "sgst" | "igst";

/** What the user typed for one master charge. Missing = untouched (defaults from the master). */
export interface ChargeInput {
  enabled: boolean;
  percent: number; // used when the master is percentBased
  amount: number; // used when the master is a fixed amount
}

export interface ChargeLineItemTotals {
  taxable: number;
  cgst: number;
  sgst: number;
  igst: number;
  /** Supply type chosen on the bill: true = IGST, false = CGST+SGST. */
  interState: boolean;
}

export interface ComputedCharge {
  master: ExtraCharge;
  id: number;
  gstKind: GstKind | null; // set for derived tax rows
  enabled: boolean;
  percentBased: boolean;
  percent: number;
  /** Magnitude of the charge before its own GST (always >= 0). */
  amount: number;
  /** GST charged on this charge itself (0 for tax rows). */
  gstOnCharge: number;
  /** +1 adds to the bill, -1 deducts (e.g. Less Goods). */
  sign: 1 | -1;
}

export interface ChargeResult {
  rows: ComputedCharge[];
  /** Σ signed charges incl. derived tax rows — the bill's extra_SubTotal. */
  extraSubTotal: number;
  /** Item taxable + extras, before rounding. */
  preRoundTotal: number;
  roundOff: number;
  grandTotal: number;
}

export const round2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;

/** Tax rows are recognised by name ("CGST", "Output SGST @9%", "IGST"…). */
export function gstKindOf(ec: ExtraCharge): GstKind | null {
  const name = ec.name ?? "";
  if (/\bcgst\b/i.test(name)) return "cgst";
  if (/\bsgst\b/i.test(name) || /\butgst\b/i.test(name)) return "sgst";
  if (/\bigst\b/i.test(name)) return "igst";
  return null;
}

/** Master defaults for a charge the user has not touched. */
export function defaultInput(ec: ExtraCharge): ChargeInput {
  return { enabled: false, percent: ec.fixedPercent ?? 0, amount: ec.fixedAmount ?? 0 };
}

export function sortCharges(list: ExtraCharge[]): ExtraCharge[] {
  return [...list].sort(
    (a, b) => Number(a.sequenceNo ?? 0) - Number(b.sequenceNo ?? 0) || a.extraCharges_ID - b.extraCharges_ID
  );
}

export function computeCharges(
  masters: ExtraCharge[],
  inputs: Record<number, ChargeInput | undefined>,
  items: ChargeLineItemTotals,
  isRoundOff: boolean
): ChargeResult {
  const rows: ComputedCharge[] = masters.map((master) => {
    const id = master.extraCharges_ID;
    const gstKind = gstKindOf(master);
    const input = inputs[id] ?? defaultInput(master);
    const percentBased = !!master.percentBased;
    const sign: 1 | -1 = master.isPositiveEffect === false ? -1 : 1;
    const enabled = gstKind ? false : input.enabled; // tax rows are filled in below
    const amount = !enabled
      ? 0
      : percentBased
        ? round2((items.taxable * input.percent) / 100)
        : round2(input.amount);
    const gstRate = gstKind ? 0 : master.taxPercent ?? 0;
    const gstOnCharge = enabled ? round2((amount * gstRate) / 100) : 0;
    return { master, id, gstKind, enabled, percentBased, percent: input.percent, amount, gstOnCharge, sign };
  });

  // GST on taxed charges follows the bill's supply type: IGST when inter-state, else CGST+SGST.
  const chargeGst = rows.reduce((s, r) => s + r.sign * r.gstOnCharge, 0);
  const tax: Record<GstKind, number> = items.interState
    ? { cgst: items.cgst, sgst: items.sgst, igst: round2(items.igst + chargeGst) }
    : { cgst: round2(items.cgst + chargeGst / 2), sgst: round2(items.sgst + chargeGst / 2), igst: items.igst };

  for (const r of rows) {
    if (!r.gstKind) continue;
    r.amount = Math.abs(tax[r.gstKind]);
    r.sign = tax[r.gstKind] < 0 ? -1 : 1;
    r.enabled = r.amount > 0;
  }

  const extraSubTotal = round2(rows.reduce((s, r) => s + (r.enabled ? r.sign * r.amount : 0), 0));
  const preRoundTotal = round2(items.taxable + extraSubTotal);
  const roundOff = isRoundOff ? round2(Math.round(preRoundTotal) - preRoundTotal) : 0;
  return { rows, extraSubTotal, preRoundTotal, roundOff, grandTotal: round2(preRoundTotal + roundOff) };
}
