"use client";

import { useEffect, useId, useRef } from "react";
import { X } from "lucide-react";
import { ACTION_META } from "@/lib/activity-catalog";
import type { ActivityRow } from "@/lib/activity-types";
import { LogDetail } from "./LogDetail";
import { btnCls, cx } from "./ui";

const FOCUSABLE = 'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])';

/** Right-side drawer. Esc or backdrop closes it; focus is trapped and restored. Read-only: no edit or delete actions. */
export function LogDrawer({ log, onClose }: { log: ActivityRow | null; onClose: () => void }) {
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
      <div
        aria-hidden
        onClick={onClose}
        className="act-backdrop absolute inset-0 bg-zinc-950/40"
      />
      <aside
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={cx(
          "act-drawer relative flex h-full w-full max-w-[520px] flex-col border-l border-border bg-card shadow-xl",
          "",
        )}
      >
        <header className="flex items-start justify-between gap-3 border-b border-border px-4 py-3">
          <div className="min-w-0">
            <h2 id={titleId} className="truncate text-sm font-semibold text-foreground">
              {ACTION_META[log.action].label}
            </h2>
            <p className="act-mono truncate text-xs text-muted-foreground">
              {log.action} on {log.entityLabel}
            </p>
          </div>
          <button ref={closeRef} type="button" onClick={onClose} className={cx(btnCls, "!px-2")} aria-label="Close details">
            <X aria-hidden className="size-4" />
          </button>
        </header>
        <div className="flex-1 overflow-y-auto px-4 py-3">
          <LogDetail log={log} />
        </div>
        <footer className="border-t border-border px-4 py-2 text-xs text-muted-foreground">
          Log entries are immutable and cannot be edited or deleted.
        </footer>
      </aside>
    </div>
  );
}
