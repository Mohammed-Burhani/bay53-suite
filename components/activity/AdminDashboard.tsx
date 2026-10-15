"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Download, LoaderCircle, RefreshCw, SearchX } from "lucide-react";
import { toast } from "sonner";
import { exportLogs, subscribeToCritical } from "@/lib/activity-api";
import { ACTION_META } from "@/lib/activity-catalog";
import { filtersToParams, parseFilters } from "@/lib/activity-filters";
import type { ActionCode, ActivityRow, LogFilters } from "@/lib/activity-types";
import { FilterBar } from "./FilterBar";
import { useLogs, useUsers } from "./hooks";
import { KpiStrip } from "./KpiStrip";
import { LiveCriticalFeed } from "./LiveCriticalFeed";
import { LogDrawer } from "./LogDrawer";
import { LogTable } from "./LogTable";
import { EmptyState, ForbiddenState, QueryError, TableSkeleton } from "./states";
import { btnCls, btnPrimaryCls, cx, panel } from "./ui";
import { useViewer } from "./ViewerProvider";

function downloadCsv(filename: string, csv: string) {
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export function AdminDashboard() {
  const { isAdmin } = useViewer();
  if (!isAdmin) {
    return <ForbiddenState message="The activity log dashboard is for admins. Use the role switcher in the top bar to view it as Admin, or open My activity." />;
  }
  return <Dashboard />;
}

function Dashboard() {
  const { viewer } = useViewer();
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();
  const qc = useQueryClient();

  // Filters live in the URL so views can be shared and survive reloads.
  const spKey = sp.toString();
  const filters = useMemo(() => parseFilters(new URLSearchParams(spKey)), [spKey]);
  const [resetCount, setResetCount] = useState(0);

  const setFilters = useCallback(
    (patch: Partial<LogFilters>) => {
      const next = { ...parseFilters(new URLSearchParams(spKey)), ...patch };
      const qs = filtersToParams(next).toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [spKey, router, pathname],
  );
  const reset = useCallback(() => {
    router.replace(pathname, { scroll: false });
    setResetCount((n) => n + 1);
  }, [router, pathname]);

  const logs = useLogs(filters);
  const users = useUsers();
  const rows = useMemo(() => logs.data?.pages.flatMap((p) => p.rows) ?? [], [logs.data]);
  const total = logs.data?.pages[logs.data.pages.length - 1]?.total ?? 0;

  const [selected, setSelected] = useState<ActivityRow | null>(null);
  const closeDrawer = useCallback(() => setSelected(null), []);

  // Live critical feed: subscribe once per admin; every event toasts and refreshes the metrics.
  const [live, setLive] = useState<ActivityRow[]>([]);
  const [pendingNew, setPendingNew] = useState(0);
  useEffect(() => {
    return subscribeToCritical(viewer, (row) => {
      setLive((prev) => [row, ...prev].slice(0, 20));
      setPendingNew((n) => n + 1);
      toast.error(ACTION_META[row.action].label, {
        description: `${row.entityLabel}, ${row.actorName} via ${row.source}`,
        action: { label: "View", onClick: () => setSelected(row) },
      });
      qc.invalidateQueries({ queryKey: ["activity", "kpis"] });
      qc.invalidateQueries({ queryKey: ["activity", "critical-head"] });
    });
  }, [viewer, qc]);

  const refreshLog = () => {
    setPendingNew(0);
    qc.invalidateQueries({ queryKey: ["activity", "logs"] });
  };

  const exportMutation = useMutation({
    mutationFn: () => exportLogs(viewer, filters),
    onSuccess: ({ filename, csv, rowCount }) => {
      downloadCsv(filename, csv);
      toast.success(`Exported ${rowCount} rows`, { description: "An export.csv entry was added to the log." });
      qc.invalidateQueries({ queryKey: ["activity"] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Export failed"),
  });

  const filterByAction = (action: ActionCode) => setFilters({ action, importance: undefined });

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold text-foreground">Activity log</h1>
          <p className="text-[13px] text-muted-foreground">
            Immutable record of every meaningful invoice change. All times are shown in IST.
          </p>
        </div>
        <button
          type="button"
          onClick={() => exportMutation.mutate()}
          disabled={exportMutation.isPending || logs.isPending || total === 0}
          className={cx(btnCls, btnPrimaryCls)}
        >
          {exportMutation.isPending ? (
            <LoaderCircle aria-hidden className="size-3.5 motion-safe:animate-spin" />
          ) : (
            <Download aria-hidden className="size-3.5" />
          )}
          Export CSV{total > 0 && !logs.isPending ? ` (${total})` : ""}
        </button>
      </div>

      <KpiStrip onFilterAction={filterByAction} />

      <div className={cx(panel, "p-3")}>
        <FilterBar key={resetCount} filters={filters} users={users.data ?? []} onChange={setFilters} onReset={reset} />
      </div>

      <div className="grid items-start gap-3 xl:grid-cols-[minmax(0,1fr)_320px]">
        <section aria-label="Log entries" className={cx(panel, "overflow-hidden")}>
          {pendingNew > 0 ? (
            <div className="flex items-center justify-between gap-2 border-b border-border bg-muted px-3 py-1.5 text-xs">
              <span className="text-foreground">
                {pendingNew} new critical {pendingNew === 1 ? "event" : "events"} since you loaded this view
              </span>
              <button type="button" onClick={refreshLog} className={cx(btnCls, "!h-6 !px-2 !text-xs")}>
                <RefreshCw aria-hidden className="size-3" />
                Refresh
              </button>
            </div>
          ) : null}
          {logs.isPending ? (
            <TableSkeleton />
          ) : logs.isError ? (
            <QueryError error={logs.error} onRetry={() => logs.refetch()} />
          ) : rows.length === 0 ? (
            <EmptyState
              title="No matching activity"
              hint="No log entries match these filters. Widen the date range or clear a filter."
              action={
                <button type="button" onClick={reset} className={cx(btnCls, "mt-1")}>
                  <SearchX aria-hidden className="size-3.5" />
                  Clear filters
                </button>
              }
            />
          ) : (
            <LogTable
              rows={rows}
              total={total}
              hasMore={!!logs.hasNextPage}
              loadingMore={logs.isFetchingNextPage}
              onLoadMore={() => logs.fetchNextPage()}
              onSelect={setSelected}
            />
          )}
        </section>

        <div className="xl:sticky xl:top-16">
          <LiveCriticalFeed live={live} onSelect={setSelected} />
        </div>
      </div>

      <LogDrawer log={selected} onClose={closeDrawer} />
    </div>
  );
}
