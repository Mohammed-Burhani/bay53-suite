// Helpers for the invoice form's "quick add" ledger / item dialogs.

import type { Group } from "@/lib/types/reports.types";

/** Purchase-side invoice types (PO, purchase invoice, purchase return). Every other type is sales-side. */
const PURCHASE_INV_TYPES = [8, 9, 10];
export const isPurchaseSide = (invType: number) => PURCHASE_INV_TYPES.includes(invType);

// Default account groups for parties (same ids the certificate forms use).
const SUNDRY_DEBTORS_ID = 17;
const SUNDRY_CREDITORS_ID = 16;

export const normalizeName = (s: string) => s.trim().replace(/\s+/g, " ").toLowerCase();

/** The group a new customer / supplier belongs in by default, or undefined if the master has none. */
export function defaultPartyGroup(groups: Group[], supplier: boolean): Group | undefined {
  const id = supplier ? SUNDRY_CREDITORS_ID : SUNDRY_DEBTORS_ID;
  const byName = supplier ? /sundry\s*creditor/i : /sundry\s*debtor/i;
  return groups.find((g) => g.id === id) ?? groups.find((g) => byName.test(g.name));
}

/** `root` plus every group nested under it. */
export function groupFamily(groups: Group[], root: Group): Group[] {
  const ids = new Set<number>([root.id]);
  let grew = true;
  while (grew) {
    grew = false;
    for (const g of groups) {
      if (!ids.has(g.id) && ids.has(g.parentId)) {
        ids.add(g.id);
        grew = true;
      }
    }
  }
  return groups.filter((g) => ids.has(g.id));
}

/**
 * Create endpoints return no documented id, so the new record is found by name.
 * If the name already existed, the highest id is the one just created.
 */
export function newestByName<T>(rows: T[], name: string, getName: (r: T) => string, getId: (r: T) => number): T | undefined {
  const target = normalizeName(name);
  return rows
    .filter((r) => normalizeName(getName(r)) === target)
    .sort((a, b) => getId(b) - getId(a))[0];
}
