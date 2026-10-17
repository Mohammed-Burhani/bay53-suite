"use client";

import { useEffect, useId, useRef } from "react";
import { Lock, X } from "lucide-react";
import { actionLabel, invoiceTypeLabel } from "@/lib/activity-log/catalog";
import type { ActivityLogRow } from "@/lib/activity-log/contract";
import { formatISTFull } from "@/lib/activity-format";
import { ApiCallList, ChangesView, ImportanceBadge, OutcomeBadge } from "./AdminLogParts";
import { btnCls, cx } from "./ui";

const FOCUSABLE = 'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])';

function Fact({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[96px_1fr] gap-2 py-1">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="min-w-0 break-words text-[13px] text-foreground">{children}</dd>
    </div>
  );
}

/** Right-side drawer. Esc or backdrop closes it; focus is trapped and restored. Read-only. */
export function AdminLogDrawer({ log, onClose }: { log: ActivityLogRow | null; onClose: () => void }) {
  const titleId = useId();
  const panelRef = useRef<HTMLElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!log) return;
    const opener = document.activeElement as HTMLElement | null;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
        return;
      }
      if (e.key !== "Tab" || !panelRef.current) return;
      const nodes = panelRef.current.querySelectorAll<HTMLElement>(FOCUSABLE);
      if (nodes.length === 0) return;
      const first = nodes[0];
      const last = nodes[nodes.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
      opener?.focus?.();
    };
  }, [log, onClose]);

  if (!log) return null;

  return (
    <div className="fixed inset-0 z-40 flex justify-end">
      <div aria-hidden onClick={onClose} className="act-backdrop absolute inset-0 bg-zinc-950/40" />
      <aside
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="act-drawer relative flex h-full w-full max-w-[560px] flex-col border-l border-border bg-card shadow-xl"
      >
        <header className="flex items-start justify-between gap-3 border-b border-border px-4 py-3">
          <div className="min-w-0">
            <h2 id={titleId} className="truncate text-sm font-semibold text-foreground">
              {actionLabel(log.action)}
            </h2>
            <p className="act-mono truncate text-xs text-muted-foreground">
              {log.action}
              {log.entity_label ? ` on ${log.entity_label}` : ""}
            </p>
          </div>
          <button ref={closeRef} type="button" onClick={onClose} className={cx(btnCls, "!px-2")} aria-label="Close details">
            <X aria-hidden className="size-4" />
          </button>
        </header>

        <div className="flex-1 space-y-4 overflow-y-auto px-4 py-3">
          <div className="flex flex-wrap items-center gap-2">
            <OutcomeBadge outcome={log.outcome} />
            <ImportanceBadge importance={log.importance} />
          </div>

          {log.summary ? <p className="text-[13px] text-foreground">{log.summary}</p> : null}
          {log.error_message ? (
            <p role="alert" className="rounded-md border border-red-300 bg-red-50 px-3 py-2 text-[13px] text-red-800 dark:border-red-800 dark:bg-red-950/50 dark:text-red-200">
              {log.error_message}
            </p>
          ) : null}

          <section aria-label="Event facts">
            <dl className="divide-y divide-border">
              <Fact label="When">
                <span className="act-mono">{formatISTFull(log.occurred_at)}</span>
                <span className="act-mono block text-xs text-muted-foreground">{log.occurred_at} (UTC)</span>
              </Fact>
              <Fact label="Actor">
                {log.actor_name ?? `User ${log.actor_user_id}`}
                <span className="act-mono block text-xs text-muted-foreground">
                  {log.actor_email ? `${log.actor_email}, ` : ""}user {log.actor_user_id}
                  {log.actor_verified ? "" : ", session not verified"}
                </span>
              </Fact>
              <Fact label="Company">{log.company_name ?? log.company_code}</Fact>
              <Fact label="Invoice">
                <span className="act-mono font-medium">{log.entity_label ?? "-"}</span>
                <span className="block text-xs text-muted-foreground">
                  {invoiceTypeLabel(log.inv_type)}
                  {log.entity_id ? `, id ${log.entity_id}` : ""}
                </span>
              </Fact>
              <Fact label="Page">
                <span className="act-mono text-xs">{log.page ?? "-"}</span>
              </Fact>
              <Fact label="Duration">
                <span className="act-mono text-xs">{log.duration_ms ?? "-"} ms</span>
              </Fact>
              <Fact label="Log ID">
                <span className="act-mono text-xs">{log.id}</span>
              </Fact>
            </dl>
          </section>

          <section aria-label="API calls">
            <h3 className="mb-1.5 text-xs font-semibold text-foreground/80">API calls ({log.api_calls.length})</h3>
            <ApiCallList calls={log.api_calls} />
          </section>

          <section aria-label="Changes">
            <h3 className="mb-1.5 text-xs font-semibold text-foreground/80">Changes</h3>
            <ChangesView changes={log.changes} />
          </section>

          <section aria-label="Technical details">
            <h3 className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-foreground/80">
              <Lock aria-hidden className="size-3" strokeWidth={2} />
              Technical details
            </h3>
            <dl className="divide-y divide-border rounded-md border border-border px-2">
              <Fact label="IP address">
                <span className="act-mono">{log.ip ?? "-"}</span>
              </Fact>
              <Fact label="User agent">
                <span className="act-mono text-xs">{log.user_agent ?? "-"}</span>
              </Fact>
            </dl>
            {Object.keys(log.metadata ?? {}).length > 0 ? (
              <pre
                tabIndex={0}
                aria-label="Raw metadata"
                className="act-mono mt-2 max-h-56 overflow-auto rounded-md border border-border bg-muted p-2 text-xs text-foreground"
              >
                {JSON.stringify(log.metadata, null, 2)}
              </pre>
            ) : null}
          </section>
        </div>

        <footer className="border-t border-border px-4 py-2 text-xs text-muted-foreground">
          Log entries are immutable and cannot be edited or deleted.
        </footer>
      </aside>
    </div>
  );
}
