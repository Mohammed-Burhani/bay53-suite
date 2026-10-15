"use client";

import { useEffect, useState } from "react";
import { RotateCcw, Search } from "lucide-react";
import { ACTION_CODES, ACTION_META, IMPORTANCE_LABEL, IMPORTANCE_ORDER, ROLE_LABEL, SOURCES, SOURCE_LABEL } from "@/lib/activity-catalog";
import { activeFilterCount } from "@/lib/activity-filters";
import type { ActionCode, ActivityUser, Importance, LogFilters, Source } from "@/lib/activity-types";
import { btnCls, cx, fieldCls, labelCls } from "./ui";

interface Props {
  filters: LogFilters;
  users: ActivityUser[];
  onChange: (patch: Partial<LogFilters>) => void;
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
export function FilterBar({ filters, users, onChange, onReset }: Props) {
  const [q, setQ] = useState(filters.q ?? "");

  // Debounce the invoice search so each keystroke does not rewrite the URL.
  useEffect(() => {
    if (q.trim() === (filters.q ?? "")) return;
    const t = setTimeout(() => onChange({ q: q.trim() || undefined }), 300);
    return () => clearTimeout(t);
  }, [q, filters.q, onChange]);

  const active = activeFilterCount(filters);
  const set = <K extends keyof LogFilters>(k: K, v: string) =>
    onChange({ [k]: v || undefined } as Partial<LogFilters>);

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
      <Field label="User" htmlFor="f-user">
        <select id="f-user" value={filters.user ?? ""} onChange={(e) => set("user", e.target.value)} className={fieldCls}>
          <option value="">All users</option>
          {users.map((u) => (
            <option key={u.id} value={u.id}>{u.name} ({ROLE_LABEL[u.role]})</option>
          ))}
        </select>
      </Field>
      <Field label="Action" htmlFor="f-action">
        <select id="f-action" value={filters.action ?? ""} onChange={(e) => set("action", e.target.value as ActionCode | "")} className={fieldCls}>
          <option value="">All actions</option>
          {IMPORTANCE_ORDER.map((imp) => (
            <optgroup key={imp} label={IMPORTANCE_LABEL[imp]}>
              {ACTION_CODES.filter((a) => ACTION_META[a].importance === imp).map((a) => (
                <option key={a} value={a}>{ACTION_META[a].label}</option>
              ))}
            </optgroup>
          ))}
        </select>
      </Field>
      <Field label="Importance" htmlFor="f-importance">
        <select id="f-importance" value={filters.importance ?? ""} onChange={(e) => set("importance", e.target.value as Importance | "")} className={fieldCls}>
          <option value="">All levels</option>
          {IMPORTANCE_ORDER.map((i) => (
            <option key={i} value={i}>{IMPORTANCE_LABEL[i]}</option>
          ))}
        </select>
      </Field>
      <Field label="Source" htmlFor="f-source">
        <select id="f-source" value={filters.source ?? ""} onChange={(e) => set("source", e.target.value as Source | "")} className={fieldCls}>
          <option value="">All sources</option>
          {SOURCES.map((s) => (
            <option key={s} value={s}>{SOURCE_LABEL[s]}</option>
          ))}
        </select>
      </Field>
      <Field label="Invoice number" htmlFor="f-q" className="col-span-2 sm:col-span-1">
        <div className="relative">
          <Search aria-hidden className="pointer-events-none absolute left-2 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <input
            id="f-q"
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="INV-0042"
            maxLength={40}
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
