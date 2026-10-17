"use client";

import { useEffect, useState } from "react";
import { RotateCcw, Search } from "lucide-react";
import {
  IMPORTANCE_LEVELS,
  IMPORTANCE_TEXT,
  INVOICE_TYPE_LABELS,
  LOG_ACTIONS,
  OUTCOMES,
  OUTCOME_TEXT,
} from "@/lib/activity-log/catalog";
import { activeRealFilterCount, type RealLogFilters } from "@/lib/activity-log/filters";
import { btnCls, cx, fieldCls, labelCls } from "./ui";

interface Props {
  filters: RealLogFilters;
  onChange: (patch: Partial<RealLogFilters>) => void;
  onReset: () => void;
}

function Field({ label, htmlFor, children, className }: { label: string; htmlFor: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={className}>
      <label htmlFor={htmlFor} className={labelCls}>{label}</label>
      {children}
    </div>
  );
}

/** Controlled by URL params. The parent remounts this component on reset so the search box clears. */
export function AdminFilterBar({ filters, onChange, onReset }: Props) {
  const [q, setQ] = useState(filters.q ?? "");

  // Debounce the bill-number search so each keystroke does not rewrite the URL.
  useEffect(() => {
    if (q.trim() === (filters.q ?? "")) return;
    const t = setTimeout(() => onChange({ q: q.trim() || undefined }), 300);
    return () => clearTimeout(t);
  }, [q, filters.q, onChange]);

  const active = activeRealFilterCount(filters);
  const set = <K extends keyof RealLogFilters>(k: K, v: string) =>
    onChange({ [k]: v || undefined } as Partial<RealLogFilters>);

  return (
    <form
      role="search"
      aria-label="Filter activity"
      onSubmit={(e) => e.preventDefault()}
      className="grid grid-cols-2 items-end gap-x-3 gap-y-2 sm:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-8"
    >
      <Field label="From (IST)" htmlFor="f-from">
        <input id="f-from" type="date" value={filters.from ?? ""} max={filters.to} onChange={(e) => set("from", e.target.value)} className={fieldCls} />
      </Field>
      <Field label="To (IST)" htmlFor="f-to">
        <input id="f-to" type="date" value={filters.to ?? ""} min={filters.from} onChange={(e) => set("to", e.target.value)} className={fieldCls} />
      </Field>
      <Field label="Action" htmlFor="f-action">
        <select id="f-action" value={filters.action ?? ""} onChange={(e) => set("action", e.target.value)} className={fieldCls}>
          <option value="">All actions</option>
          {Object.entries(LOG_ACTIONS).map(([code, a]) => (
            <option key={code} value={code}>{a.label}</option>
          ))}
        </select>
      </Field>
      <Field label="Outcome" htmlFor="f-outcome">
        <select id="f-outcome" value={filters.outcome ?? ""} onChange={(e) => set("outcome", e.target.value)} className={fieldCls}>
          <option value="">Any outcome</option>
          {OUTCOMES.map((o) => (
            <option key={o} value={o}>{OUTCOME_TEXT[o]}</option>
          ))}
        </select>
      </Field>
      <Field label="Importance" htmlFor="f-importance">
        <select id="f-importance" value={filters.importance ?? ""} onChange={(e) => set("importance", e.target.value)} className={fieldCls}>
          <option value="">All levels</option>
          {IMPORTANCE_LEVELS.map((i) => (
            <option key={i} value={i}>{IMPORTANCE_TEXT[i]}</option>
          ))}
        </select>
      </Field>
      <Field label="Invoice type" htmlFor="f-type">
        <select id="f-type" value={filters.inv_type ?? ""} onChange={(e) => set("inv_type", e.target.value)} className={fieldCls}>
          <option value="">All types</option>
          {Object.entries(INVOICE_TYPE_LABELS).map(([id, label]) => (
            <option key={id} value={id}>{label}</option>
          ))}
        </select>
      </Field>
      <Field label="Bill number" htmlFor="f-q" className="col-span-2 sm:col-span-1">
        <div className="relative">
          <Search aria-hidden className="pointer-events-none absolute left-2 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <input
            id="f-q"
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="HO/2026-27/52132"
            maxLength={60}
            className={cx(fieldCls, "pl-7")}
          />
        </div>
      </Field>
      <div className="col-span-2 sm:col-span-1">
        <button type="button" onClick={onReset} disabled={active === 0} className={cx(btnCls, "w-full")}>
          <RotateCcw aria-hidden className="size-3.5" />
          Reset{active > 0 ? ` (${active})` : ""}
        </button>
      </div>
    </form>
  );
}
