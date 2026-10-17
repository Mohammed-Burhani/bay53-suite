// Filters for the admin activity log. They live in the page URL so a view can be shared.

import { IMPORTANCE_LEVELS, LOG_ACTIONS, OUTCOMES } from "./catalog";
import type { LogImportance, LogOutcome } from "./contract";

export interface RealLogFilters {
  /** IST calendar day, YYYY-MM-DD. */
  from?: string;
  to?: string;
  action?: string;
  outcome?: LogOutcome;
  importance?: LogImportance;
  inv_type?: string;
  /** Bill number contains. */
  q?: string;
}

const DAY = /^\d{4}-\d{2}-\d{2}$/;

export function parseRealFilters(sp: { get(name: string): string | null }): RealLogFilters {
  const f: RealLogFilters = {};
  const from = sp.get("from");
  const to = sp.get("to");
  const action = sp.get("action");
  const outcome = sp.get("outcome");
  const importance = sp.get("importance");
  const invType = sp.get("inv_type");
  const q = sp.get("q")?.trim();
  if (from && DAY.test(from)) f.from = from;
  if (to && DAY.test(to)) f.to = to;
  if (action && action in LOG_ACTIONS) f.action = action;
  if (outcome && (OUTCOMES as string[]).includes(outcome)) f.outcome = outcome as LogOutcome;
  if (importance && (IMPORTANCE_LEVELS as string[]).includes(importance)) f.importance = importance as LogImportance;
  if (invType && /^\d{1,3}$/.test(invType)) f.inv_type = invType;
  if (q) f.q = q.slice(0, 60);
  return f;
}

export function realFiltersToParams(f: RealLogFilters): URLSearchParams {
  const p = new URLSearchParams();
  for (const [k, v] of Object.entries(f)) if (v) p.set(k, v);
  return p;
}

export const activeRealFilterCount = (f: RealLogFilters) => Object.values(f).filter(Boolean).length;
