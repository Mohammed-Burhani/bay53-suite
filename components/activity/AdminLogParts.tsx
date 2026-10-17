"use client";

import { useState } from "react";
import { ChevronRight } from "lucide-react";
import { IMPORTANCE_TEXT, OUTCOME_TEXT } from "@/lib/activity-log/catalog";
import type { ActivityLogRow, LogImportance, LogOutcome } from "@/lib/activity-log/contract";
import { IMPORTANCE_STYLE, cx } from "./ui";

type ApiCall = ActivityLogRow["api_calls"][number];

// ---------- Badges ----------

const OUTCOME_STYLE: Record<LogOutcome, string> = {
  success: "border-green-300 bg-green-50 text-green-800 dark:border-green-800 dark:bg-green-950/60 dark:text-green-300",
  failure: "border-red-300 bg-red-50 text-red-800 dark:border-red-800 dark:bg-red-950/60 dark:text-red-300",
};

export function OutcomeBadge({ outcome }: { outcome: LogOutcome }) {
  return (
    <span className={cx("inline-flex items-center rounded-md border px-1.5 py-0.5 text-[11px] font-medium", OUTCOME_STYLE[outcome])}>
      {OUTCOME_TEXT[outcome]}
    </span>
  );
}

export function ImportanceBadge({ importance }: { importance: LogImportance }) {
  const s = IMPORTANCE_STYLE[importance];
  return (
    <span className={cx("inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[11px] font-medium", s.chip)}>
      <s.icon aria-hidden className="size-3" />
      {IMPORTANCE_TEXT[importance]}
    </span>
  );
}

/** HTTP status as a small mono pill: green for 2xx, red otherwise, "no response" when the request never answered. */
export function StatusPill({ call }: { call: Pick<ApiCall, "http_status" | "ok"> }) {
  return (
    <span
      className={cx(
        "act-mono inline-flex items-center rounded-md border px-1.5 py-0.5 text-[11px] font-medium",
        call.ok ? OUTCOME_STYLE.success : OUTCOME_STYLE.failure,
      )}
    >
      {call.http_status ?? "no response"}
    </span>
  );
}

// ---------- API calls ----------

export function ApiCallsSummary({ calls }: { calls: ApiCall[] }) {
  if (calls.length === 0) return <span className="text-xs text-muted-foreground">-</span>;
  const failed = calls.filter((c) => !c.ok);
  return (
    <span className="text-xs">
      <span className="text-foreground">{calls.length} {calls.length === 1 ? "call" : "calls"}</span>
      {failed.length > 0 ? (
        <span className="ml-1.5 font-medium text-red-700 dark:text-red-300">
          {failed.length} failed ({failed.map((c) => c.http_status ?? "n/a").join(", ")})
        </span>
      ) : null}
    </span>
  );
}

/** Every .NET call the action made, in order, each expandable to its stored response. */
export function ApiCallList({ calls }: { calls: ApiCall[] }) {
  if (calls.length === 0) {
    return <p className="text-[13px] text-muted-foreground">No API calls were recorded for this action.</p>;
  }
  return (
    <ol className="divide-y divide-border rounded-md border border-border">
      {calls.map((c) => (
        <ApiCallItem key={c.id} call={c} />
      ))}
    </ol>
  );
}

function ApiCallItem({ call }: { call: ApiCall }) {
  const [open, setOpen] = useState(!call.ok);
  const hasResponse = call.response !== null && call.response !== undefined;
  return (
    <li className="px-3 py-2">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex w-full items-start gap-2 text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
      >
        <ChevronRight aria-hidden className={cx("mt-0.5 size-3.5 shrink-0 text-muted-foreground transition-transform", open && "rotate-90")} />
        <span className="min-w-0 flex-1">
          <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className="act-mono text-[11px] font-semibold text-muted-foreground">{call.method}</span>
            <span className="act-mono break-all text-xs text-foreground">{call.endpoint}</span>
            <StatusPill call={call} />
            <span className="act-mono text-[11px] text-muted-foreground">{call.duration_ms} ms</span>
          </span>
          {call.message ? (
            <span className={cx("mt-0.5 block break-words text-xs", call.ok ? "text-muted-foreground" : "text-red-700 dark:text-red-300")}>
              {call.message}
            </span>
          ) : null}
        </span>
      </button>
      {open ? (
        hasResponse ? (
          <pre
            tabIndex={0}
            aria-label="Stored response"
            className="act-mono mt-2 max-h-56 overflow-auto rounded-md border border-border bg-muted p-2 text-xs text-foreground"
          >
            {typeof call.response === "string" ? call.response : JSON.stringify(call.response, null, 2)}
          </pre>
        ) : (
          <p className="mt-2 text-xs text-muted-foreground">No response body.</p>
        )
      ) : null}
    </li>
  );
}

// ---------- Changes ----------

const OLD = "bg-red-50 text-red-900 dark:bg-red-950/50 dark:text-red-200";
const NEW = "bg-green-50 text-green-900 dark:bg-green-950/50 dark:text-green-200";

function show(v: unknown): string {
  if (v === null || v === undefined || v === "") return "empty";
  return typeof v === "object" ? JSON.stringify(v) : String(v);
}

type FieldDiff = Record<string, { old: unknown; new: unknown }>;
interface ChangesShape {
  snapshot?: Record<string, unknown>;
  fields?: FieldDiff;
  lines?: { added?: Record<string, unknown>[]; edited?: Record<string, unknown>[]; removed?: Record<string, unknown>[] };
  note?: string;
}

/** Renders the stored `changes` object: a snapshot (create, delete) or a field and line diff (edit). */
export function ChangesView({ changes }: { changes: unknown }) {
  if (!changes || typeof changes !== "object") {
    return <p className="text-[13px] text-muted-foreground">No changes were recorded.</p>;
  }
  const c = changes as ChangesShape;
  const fields = Object.entries(c.fields ?? {});
  const edited = c.lines?.edited ?? [];
  const added = c.lines?.added ?? [];
  const removed = c.lines?.removed ?? [];
  const nothing = fields.length === 0 && edited.length === 0 && added.length === 0 && removed.length === 0;

  return (
    <div className="space-y-3">
      {c.note ? <p className="text-xs text-muted-foreground">{c.note}</p> : null}

      {c.snapshot ? (
        <dl className="divide-y divide-border rounded-md border border-border px-2">
          {Object.entries(c.snapshot).map(([k, v]) => (
            <div key={k} className="grid grid-cols-[120px_1fr] gap-2 py-1">
              <dt className="act-mono text-xs text-muted-foreground">{k}</dt>
              <dd className="act-mono break-words text-xs text-foreground">{show(v)}</dd>
            </div>
          ))}
        </dl>
      ) : null}

      {c.fields !== undefined && nothing ? (
        <p className="text-[13px] text-muted-foreground">Saved with no field changes.</p>
      ) : null}

      {fields.length > 0 ? (
        <ul className="space-y-1.5">
          {fields.map(([k, d]) => (
            <li key={k} className="rounded-md border border-border text-xs">
              <p className="act-mono border-b border-border px-2 py-1 font-medium text-foreground">{k}</p>
              <p className={cx("act-mono break-words px-2 py-1", OLD)}><span aria-hidden>- </span>{show(d.old)}</p>
              <p className={cx("act-mono break-words px-2 py-1", NEW)}><span aria-hidden>+ </span>{show(d.new)}</p>
            </li>
          ))}
        </ul>
      ) : null}

      <LineGroup title="Lines added" rows={added} tone={NEW} sign="+" />
      <LineGroup title="Lines removed" rows={removed} tone={OLD} sign="-" />
      {edited.length > 0 ? (
        <div>
          <h4 className="mb-1 text-[11px] font-medium text-muted-foreground">Lines edited</h4>
          <ul className="space-y-1.5">
            {edited.map((l, i) => (
              <li key={i} className="rounded-md border border-border text-xs">
                <p className="act-mono border-b border-border px-2 py-1 text-foreground">
                  line {show(l.invDetID)} (item {show(l.item_ID)})
                </p>
                {Object.entries(l)
                  .filter(([k]) => k !== "invDetID" && k !== "item_ID")
                  .map(([k, d]) => {
                    const dd = d as { old: unknown; new: unknown };
                    return (
                      <p key={k} className="act-mono break-words px-2 py-1">
                        {k}: <span className={cx("px-1", OLD)}>{show(dd.old)}</span>
                        <span className={cx("ml-1 px-1", NEW)}>{show(dd.new)}</span>
                      </p>
                    );
                  })}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}

function LineGroup({ title, rows, tone, sign }: { title: string; rows: Record<string, unknown>[]; tone: string; sign: string }) {
  if (rows.length === 0) return null;
  return (
    <div>
      <h4 className="mb-1 text-[11px] font-medium text-muted-foreground">{title}</h4>
      <ul className="space-y-1">
        {rows.map((l, i) => (
          <li key={i} className={cx("act-mono break-words rounded-md px-2 py-1 text-xs", tone)}>
            <span aria-hidden>{sign} </span>
            {show(l.name ?? `item ${show(l.item_ID)}`)}, qty {show(l.qty)} at {show(l.rate)}
          </li>
        ))}
      </ul>
    </div>
  );
}
