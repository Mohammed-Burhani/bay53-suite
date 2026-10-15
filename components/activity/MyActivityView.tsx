"use client";

import { useCallback, useMemo, useState } from "react";
import { IMPORTANCE_LABEL, IMPORTANCE_ORDER } from "@/lib/activity-catalog";
import type { ActivityRow, Importance } from "@/lib/activity-types";
import { useMyActivity } from "./hooks";
import { LogDrawer } from "./LogDrawer";
import { LogTable } from "./LogTable";
import { EmptyState, QueryError, TableSkeleton } from "./states";
import { cx, panel } from "./ui";
import { useViewer } from "./ViewerProvider";

const OPTIONS: { value: Importance | "all"; label: string }[] = [
  { value: "all", label: "All" },
  ...IMPORTANCE_ORDER.map((i) => ({ value: i, label: IMPORTANCE_LABEL[i] })),
];

export function MyActivityView() {
  const { user, viewer, isAdmin } = useViewer();
  const [level, setLevel] = useState<Importance | "all">("all");
  const q = useMyActivity(level === "all" ? undefined : level);
  const rows = useMemo(() => q.data?.pages.flatMap((p) => p.rows) ?? [], [q.data]);
  const total = q.data?.pages[q.data.pages.length - 1]?.total ?? 0;
  const [selected, setSelected] = useState<ActivityRow | null>(null);
  const closeDrawer = useCallback(() => setSelected(null), []);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold text-foreground">My activity</h1>
          <p className="max-w-2xl text-[13px] text-muted-foreground">
            {isAdmin
              ? "Your own actions, plus important and critical events on every invoice."
              : `Your own actions, plus important and critical events on invoices you own or manage, ${user.name}.`}{" "}
            All times are shown in IST.
          </p>
        </div>
        <div role="group" aria-label="Filter by importance" className="inline-flex rounded-md border border-border p-0.5">
          {OPTIONS.map((o) => (
            <button
              key={o.value}
              type="button"
              aria-pressed={level === o.value}
              onClick={() => setLevel(o.value)}
              className={cx(
                "h-7 rounded-md px-3 text-[13px] font-medium focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-primary",
                level === o.value
                  ? "bg-primary text-primary-foreground"
                  : "text-foreground/80 hover:bg-accent",
              )}
            >
              {o.label}
            </button>
          ))}
        </div>
      </div>

      <section aria-label="My log entries" className={cx(panel, "overflow-hidden")}>
        {q.isPending ? (
          <TableSkeleton />
        ) : q.isError ? (
          <QueryError error={q.error} onRetry={() => q.refetch()} />
        ) : rows.length === 0 ? (
          <EmptyState
            title="Nothing here yet"
            hint={
              level === "all"
                ? "Your actions and the important events on your invoices will appear here."
                : `No ${IMPORTANCE_LABEL[level].toLowerCase()} events to show. Try another level.`
            }
          />
        ) : (
          <LogTable
            rows={rows}
            total={total}
            hasMore={!!q.hasNextPage}
            loadingMore={q.isFetchingNextPage}
            onLoadMore={() => q.fetchNextPage()}
            onSelect={setSelected}
            viewerId={viewer.userId}
          />
        )}
      </section>

      <LogDrawer log={selected} onClose={closeDrawer} />
    </div>
  );
}
