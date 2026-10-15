"use client";

import { ACTION_META } from "@/lib/activity-catalog";
import { relativeTime } from "@/lib/activity-format";
import type { ActivityRow } from "@/lib/activity-types";
import { useCriticalHead } from "./hooks";
import { EmptyState, ErrorState, Skeleton } from "./states";
import { ACTION_ICON, cx, panel } from "./ui";

interface Props {
  /** Events that arrived while this page was open, newest first. */
  live: ActivityRow[];
  onSelect: (row: ActivityRow) => void;
}

export function LiveCriticalFeed({ live, onSelect }: Props) {
  const head = useCriticalHead();

  const seen = new Set<string>();
  const items = [...live, ...(head.data?.rows ?? [])]
    .filter((r) => !seen.has(r.id) && !!seen.add(r.id))
    .slice(0, 10);
  const liveIds = new Set(live.map((r) => r.id));

  return (
    <section aria-label="Live critical feed" className={cx(panel, "overflow-hidden")}>
      <header className="flex items-center justify-between gap-2 border-b border-border px-3 py-2">
        <h2 className="text-[13px] font-semibold text-foreground">Live critical feed</h2>
        <span className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
          <span aria-hidden className="relative flex size-2">
            <span className="absolute inline-flex size-full rounded-full bg-red-500 opacity-60 motion-safe:animate-ping" />
            <span className="relative inline-flex size-2 rounded-full bg-red-500" />
          </span>
          Listening
        </span>
      </header>

      {head.isPending ? (
        <div role="status" aria-label="Loading feed" className="space-y-3 p-3">
          {Array.from({ length: 4 }, (_, i) => (
            <Skeleton key={i} className="h-9 w-full" />
          ))}
        </div>
      ) : head.isError ? (
        <ErrorState error={head.error} onRetry={() => head.refetch()} />
      ) : items.length === 0 ? (
        <EmptyState title="No critical events" hint="New critical events appear here as they happen." />
      ) : (
        <ul aria-live="polite" className="divide-y divide-border">
          {items.map((r) => {
            const Icon = ACTION_ICON[r.action];
            return (
              <li key={r.id}>
                <button
                  type="button"
                  onClick={() => onSelect(r)}
                  className="flex w-full items-start gap-2.5 px-3 py-2 text-left hover:bg-accent focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-primary"
                >
                  <span className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-md border border-red-300 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-950/60 dark:text-red-300">
                    <Icon aria-hidden className="size-3.5" strokeWidth={1.75} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-baseline justify-between gap-2">
                      <span className="truncate text-[13px] font-medium text-foreground">
                        {ACTION_META[r.action].label}
                      </span>
                      {liveIds.has(r.id) ? (
                        <span className="rounded-md bg-primary px-1 text-[10px] font-medium text-primary-foreground">
                          New
                        </span>
                      ) : null}
                    </span>
                    <span className="block truncate text-xs text-muted-foreground">
                      <span className="act-mono">{r.entityLabel}</span>, {r.actorName}
                    </span>
                    <span className="block text-[11px] text-muted-foreground">{relativeTime(r.createdAt)}</span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
      <p className="border-t border-border px-3 py-1.5 text-[11px] text-muted-foreground">
        Prototype: a simulated critical event arrives about every 15 seconds.
      </p>
    </section>
  );
}
