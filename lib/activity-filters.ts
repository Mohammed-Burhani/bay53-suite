import { ACTION_CODES, SOURCES } from "./activity-catalog";
import type { ActionCode, Importance, LogFilters, Source } from "./activity-types";

interface ParamReader {
  get(name: string): string | null;
}

const DAY = /^\d{4}-\d{2}-\d{2}$/;
const IMPORTANCES: Importance[] = ["info", "important", "critical"];

/** Reads filters from URL query params, dropping anything invalid. */
export function parseFilters(sp: ParamReader): LogFilters {
  const f: LogFilters = {};
  const from = sp.get("from");
  const to = sp.get("to");
  const user = sp.get("user");
  const action = sp.get("action");
  const importance = sp.get("importance");
  const source = sp.get("source");
  const q = sp.get("q")?.trim();
  if (from && DAY.test(from)) f.from = from;
  if (to && DAY.test(to)) f.to = to;
  if (user && /^[\w-]{1,40}$/.test(user)) f.user = user;
  if (action && (ACTION_CODES as string[]).includes(action)) f.action = action as ActionCode;
  if (importance && (IMPORTANCES as string[]).includes(importance)) f.importance = importance as Importance;
  if (source && (SOURCES as string[]).includes(source)) f.source = source as Source;
  if (q) f.q = q.slice(0, 40);
  return f;
}

export function filtersToParams(f: LogFilters): URLSearchParams {
  const p = new URLSearchParams();
  (Object.keys(f) as (keyof LogFilters)[]).forEach((k) => {
    const v = f[k];
    if (v) p.set(k, v);
  });
  return p;
}

export const activeFilterCount = (f: LogFilters) => Object.values(f).filter(Boolean).length;
