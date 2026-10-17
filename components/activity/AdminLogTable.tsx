"use client";

import { LoaderCircle } from "lucide-react";
import { actionLabel, invoiceTypeLabel } from "@/lib/activity-log/catalog";
import type { ActivityLogRow } from "@/lib/activity-log/contract";
import { formatIST, formatISTFull, relativeTime } from "@/lib/activity-format";
import { ApiCallsSummary, ImportanceBadge, OutcomeBadge } from "./AdminLogParts";
import { btnCls, cx } from "./ui";

interface Props {
  rows: ActivityLogRow[];
  hasMore: boolean;
  loadingMore: boolean;
  onLoadMore: () => void;
  onSelect: (row: ActivityLogRow) => void;
}

const TH = "px-3 py-2 text-left text-[11px] font-medium text-muted-foreground";

export function AdminLogTable({ rows, hasMore, loadingMore, onLoadMore, onSelect }: Props) {
  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[900px] border-collapse text-[13px]">
          <caption className="sr-only">Activity log, newest first. Times are in IST.</caption>
          <thead className="border-b border-border bg-muted">
            <tr>
              <th scope="col" className={TH}>Time (IST)</th>
              <th scope="col" className={TH}>Actor</th>
              <th scope="col" className={TH}>Action</th>
              <th scope="col" className={TH}>Invoice</th>
              <th scope="col" className={TH}>Outcome</th>
              <th scope="col" className={TH}>API calls</th>
              <th scope="col" className={TH}>Importance</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {rows.map((r) => (
              <tr
                key={r.id}
                tabIndex={0}
                onClick={() => onSelect(r)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    onSelect(r);
                  }
                }}
                aria-label={`${actionLabel(r.action)}${r.entity_label ? ` on ${r.entity_label}` : ""}, open details`}
                className="cursor-pointer hover:bg-accent focus-visible:bg-accent focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-primary"
              >
                <td
                  className={cx(
                    "whitespace-nowrap px-3 py-2",
                    r.outcome === "failure" && "shadow-[inset_2px_0_0_0_var(--color-red-500)]",
                  )}
                >
                  <span className="act-mono block text-xs text-foreground" title={formatISTFull(r.occurred_at)}>
                    {formatIST(r.occurred_at)}
                  </span>
                  <span className="block text-[11px] text-muted-foreground">{relativeTime(r.occurred_at)}</span>
                </td>
                <td className="max-w-[200px] px-3 py-2">
                  <span className="block truncate text-[13px] text-foreground">{r.actor_name ?? `User ${r.actor_user_id}`}</span>
                  {!r.actor_verified ? (
                    <span className="block text-[11px] text-muted-foreground" title="The ERP API could not confirm this session when the entry was stored">
                      unverified
                    </span>
                  ) : null}
                </td>
                <td className="px-3 py-2">{actionLabel(r.action)}</td>
                <td className="px-3 py-2">
                  <span className="act-mono block text-xs font-medium text-foreground">{r.entity_label ?? "-"}</span>
                  <span className="block text-[11px] text-muted-foreground">{invoiceTypeLabel(r.inv_type)}</span>
                </td>
                <td className="px-3 py-2">
                  <OutcomeBadge outcome={r.outcome} />
                </td>
                <td className="px-3 py-2">
                  <ApiCallsSummary calls={r.api_calls} />
                </td>
                <td className="px-3 py-2">
                  <ImportanceBadge importance={r.importance} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex items-center justify-between gap-3 border-t border-border px-3 py-2">
        <p className="act-mono text-xs text-muted-foreground" aria-live="polite">
          Showing {rows.length}
        </p>
        {hasMore ? (
          <button type="button" onClick={onLoadMore} disabled={loadingMore} className={btnCls}>
            {loadingMore ? <LoaderCircle aria-hidden className="size-3.5 motion-safe:animate-spin" /> : null}
            {loadingMore ? "Loading" : "Load more"}
          </button>
        ) : (
          <p className="text-xs text-muted-foreground">End of log</p>
        )}
      </div>
    </>
  );
}
