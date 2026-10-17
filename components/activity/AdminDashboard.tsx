"use client";

import { useCallback, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { LogIn, RefreshCw, SearchX } from "lucide-react";
import { ActivityFetchError, hasErpSession } from "@/lib/activity-log/client";
import type { ActivityLogRow } from "@/lib/activity-log/contract";
import { parseRealFilters, realFiltersToParams, type RealLogFilters } from "@/lib/activity-log/filters";
import { AdminFilterBar } from "./AdminFilterBar";
import { AdminLogDrawer } from "./AdminLogDrawer";
import { AdminLogTable } from "./AdminLogTable";
import { useActivityLogs } from "./hooks";
import { EmptyState, ErrorState, TableSkeleton } from "./states";
import { btnCls, cx, panel } from "./ui";

export function AdminDashboard() {
  // Logs are read with the ERP login this browser already holds; there is no separate sign-in.
  if (!hasErpSession()) {
    return (
      <div className={cx(panel, "p-3")}>
        <EmptyState
          title="Log in to the ERP first"
          hint="The activity log is read with your ERP session. Log in, then open this page again."
          action={
            <Link href="/login" className={cx(btnCls, "mt-1")}>
              <LogIn aria-hidden className="size-3.5" />
              Go to login
            </Link>
          }
        />
      </div>
    );
  }
  return <Dashboard />;
}

function Dashboard() {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();
  const qc = useQueryClient();

  // Filters live in the URL so views can be shared and survive reloads.
  const spKey = sp.toString();
  const filters = useMemo(() => parseRealFilters(new URLSearchParams(spKey)), [spKey]);
  const [resetCount, setResetCount] = useState(0);

  const setFilters = useCallback(
    (patch: Partial<RealLogFilters>) => {
      const next = { ...parseRealFilters(new URLSearchParams(spKey)), ...patch };
      const qs = realFiltersToParams(next).toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [spKey, router, pathname],
  );
  const reset = useCallback(() => {
    router.replace(pathname, { scroll: false });
    setResetCount((n) => n + 1);
  }, [router, pathname]);

  const logs = useActivityLogs(filters);
  const rows = useMemo(() => logs.data?.pages.flatMap((p) => p.rows) ?? [], [logs.data]);

  // Keep the open row in sync with refetches by storing only its id.
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const selected = useMemo(() => rows.find((r) => r.id === selectedId) ?? null, [rows, selectedId]);
  const closeDrawer = useCallback(() => setSelectedId(null), []);
  const select = useCallback((r: ActivityLogRow) => setSelectedId(r.id), []);

  const refreshing = logs.isFetching && !logs.isPending && !logs.isFetchingNextPage;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold text-foreground">Activity log</h1>
          <p className="text-[13px] text-muted-foreground">
            Immutable record of invoice actions and the API calls behind them. All times are shown in IST.
          </p>
        </div>
        <button
          type="button"
          onClick={() => qc.invalidateQueries({ queryKey: ["activity-real"] })}
          disabled={logs.isFetching}
          className={btnCls}
        >
          <RefreshCw aria-hidden className={cx("size-3.5", refreshing && "motion-safe:animate-spin")} />
          Refresh
        </button>
      </div>

      <div className={cx(panel, "p-3")}>
        <AdminFilterBar key={resetCount} filters={filters} onChange={setFilters} onReset={reset} />
      </div>

      <section aria-label="Log entries" className={cx(panel, "overflow-hidden")}>
        {logs.isPending ? (
          <TableSkeleton />
        ) : logs.isError ? (
          <ErrorState
            error={logs.error}
            onRetry={logs.error instanceof ActivityFetchError && logs.error.status === 401 ? undefined : () => logs.refetch()}
          />
        ) : rows.length === 0 ? (
          <EmptyState
            title="No matching activity"
            hint="Nothing has been logged yet, or no entry matches these filters. Create, edit or delete an invoice to see it here."
            action={
              <button type="button" onClick={reset} className={cx(btnCls, "mt-1")}>
                <SearchX aria-hidden className="size-3.5" />
                Clear filters
              </button>
            }
          />
        ) : (
          <AdminLogTable
            rows={rows}
            hasMore={!!logs.hasNextPage}
            loadingMore={logs.isFetchingNextPage}
            onLoadMore={() => logs.fetchNextPage()}
            onSelect={select}
          />
        )}
      </section>

      <AdminLogDrawer log={selected} onClose={closeDrawer} />
    </div>
  );
}
