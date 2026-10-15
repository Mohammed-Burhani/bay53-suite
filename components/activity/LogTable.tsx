"use client";

import Link from "next/link";
import { LoaderCircle } from "lucide-react";
import { formatIST, formatISTFull, invoiceHref, relativeTime } from "@/lib/activity-format";
import type { ActivityRow } from "@/lib/activity-types";
import { ActionBadge, ActorCell, ImportanceChip, SourceIcon } from "./badges";
import { btnCls, cx } from "./ui";

interface Props {
  rows: ActivityRow[];
  total: number;
  hasMore: boolean;
  loadingMore: boolean;
  onLoadMore: () => void;
  onSelect: (row: ActivityRow) => void;
  /** Marks the viewer's own rows with "(you)". */
  viewerId?: string;
}

const TH = "px-3 py-2 text-left text-[11px] font-medium text-muted-foreground";

export function LogTable({ rows, total, hasMore, loadingMore, onLoadMore, onSelect, viewerId }: Props) {
  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[820px] border-collapse text-[13px]">
          <caption className="sr-only">Activity log, newest first. Times are in IST.</caption>
          <thead className="border-b border-border bg-muted">
            <tr>
              <th scope="col" className={TH}>Time (IST)</th>
              <th scope="col" className={TH}>Actor</th>
              <th scope="col" className={TH}>Action</th>
              <th scope="col" className={TH}>Invoice</th>
              <th scope="col" className={TH}>Importance</th>
              <th scope="col" className={cx(TH, "w-14")}>Source</th>
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
                aria-label={`${r.action} on ${r.entityLabel}, open details`}
                className="cursor-pointer hover:bg-accent focus-visible:bg-accent focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-primary"
              >
                <td
                  className={cx(
                    "whitespace-nowrap px-3 py-2",
                    r.importance === "critical" && "shadow-[inset_2px_0_0_0_var(--color-red-500)]",
                  )}
                >
                  <span className="act-mono block text-xs text-foreground" title={formatISTFull(r.createdAt)}>
                    {formatIST(r.createdAt)}
                  </span>
                  <span className="block text-[11px] text-muted-foreground">{relativeTime(r.createdAt)}</span>
                </td>
                <td className="max-w-[200px] px-3 py-2">
                  <ActorCell name={r.actorName} role={r.actorRole} isYou={viewerId === r.actorId} />
                </td>
                <td className="px-3 py-2">
                  <ActionBadge action={r.action} />
                </td>
                <td className="whitespace-nowrap px-3 py-2">
                  {r.invoiceId ? (
                    <Link
                      href={invoiceHref(r.invoiceId, "activity")}
                      onClick={(e) => e.stopPropagation()}
                      className="act-mono text-xs font-medium text-foreground underline underline-offset-2 hover:no-underline"
                    >
                      {r.entityLabel}
                    </Link>
                  ) : (
                    <span className="text-xs text-muted-foreground">{r.entityLabel}</span>
                  )}
                </td>
                <td className="px-3 py-2">
                  <ImportanceChip importance={r.importance} />
                </td>
                <td className="px-3 py-2">
                  <SourceIcon source={r.source} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex items-center justify-between gap-3 border-t border-border px-3 py-2">
        <p className="act-mono text-xs text-muted-foreground" aria-live="polite">
          Showing {rows.length} of {total}
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
