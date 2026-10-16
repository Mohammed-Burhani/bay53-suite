"use client";

import { Ban, Clock3, FileWarning, Percent, Trash2, type LucideIcon } from "lucide-react";
import { ROLE_LABEL } from "@/lib/activity-catalog";
import type { ActionCode, KpiValue } from "@/lib/activity-types";
import { Avatar } from "./badges";
import { useKpis } from "./hooks";
import { ErrorState, KpiSkeleton } from "./states";
import { cx, panel } from "./ui";

interface Props {
  /** Clicking a metric filters the log to the matching action. */
  onFilterAction: (action: ActionCode) => void;
}

function Delta({ v }: { v: KpiValue }) {
  const diff = v.current - v.previous;
  const text = diff === 0 ? "No change" : `${diff > 0 ? "+" : "-"}${Math.abs(diff)}`;
  return (
    <span className="act-mono text-[11px] text-muted-foreground">
      {text} vs prior 7 days ({v.previous})
    </span>
  );
}

function Metric({
  label,
  value,
  icon: Icon,
  tone,
  action,
  onFilterAction,
}: {
  label: string;
  value: KpiValue;
  icon: LucideIcon;
  tone: "critical" | "important";
  action?: ActionCode;
  onFilterAction: (a: ActionCode) => void;
}) {
  const body = (
    <>
      <span className="flex items-center gap-1.5 text-xs text-foreground/80">
        <Icon
          aria-hidden
          className={cx("size-3.5", tone === "critical" ? "text-red-600 dark:text-red-400" : "text-amber-600 dark:text-amber-400")}
          strokeWidth={2}
        />
        {label}
      </span>
      <span className="act-mono mt-1 block text-2xl font-semibold leading-none text-foreground">
        {value.current}
      </span>
      <span className="mt-1.5 block">
        <Delta v={value} />
      </span>
    </>
  );
  const cell = "block w-full bg-card p-3 text-left";
  return action ? (
    <button
      type="button"
      onClick={() => onFilterAction(action)}
      title={`Show ${action} events`}
      className={cx(cell, "hover:bg-accent focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-primary")}
    >
      {body}
    </button>
  ) : (
    <div className={cell}>{body}</div>
  );
}

export function KpiStrip({ onFilterAction }: Props) {
  const { data, isPending, isError, error, refetch } = useKpis();

  return (
    <section aria-label="Key metrics, last 7 days" className={cx(panel, "overflow-hidden")}>
      {isPending ? (
        <KpiSkeleton />
      ) : isError ? (
        <ErrorState error={error} onRetry={() => refetch()} />
      ) : (
        <div className="grid grid-cols-2 gap-px bg-border md:grid-cols-3 xl:grid-cols-6">
          <Metric label="Voids" value={data.voids} icon={Ban} tone="critical" action="invoice.voided" onFilterAction={onFilterAction} />
          <Metric label="Edits after sent" value={data.editsAfterSentOrPaid} icon={FileWarning} tone="critical" action="invoice.edited_after_sent" onFilterAction={onFilterAction} />
          <Metric label="Discount overrides" value={data.discountOverrides} icon={Percent} tone="critical" action="price.override" onFilterAction={onFilterAction} />
          <Metric label="After-hours activity" value={data.afterHours} icon={Clock3} tone="important" onFilterAction={onFilterAction} />
          <Metric label="Invoices deleted" value={data.deletions} icon={Trash2} tone="critical" action="invoice.deleted" onFilterAction={onFilterAction} />
          <div className="bg-card p-3">
            <span className="text-xs text-foreground/80">Top actors, 7 days</span>
            <ol className="mt-1.5 space-y-1">
              {data.topActors.map((a) => (
                <li key={a.actorId} className="flex items-center gap-2">
                  <Avatar name={a.name} role={a.role} />
                  <span className="min-w-0 flex-1 truncate text-[13px] text-foreground" title={ROLE_LABEL[a.role]}>
                    {a.name}
                  </span>
                  <span className="act-mono text-xs text-foreground/80">{a.count}</span>
                </li>
              ))}
            </ol>
          </div>
        </div>
      )}
      {!isPending && !isError ? (
        <p className="border-t border-border px-3 py-1.5 text-[11px] text-muted-foreground">
          Rolling 7 days. After-hours means a person acted outside 09:00 to 20:00 IST.
        </p>
      ) : null}
    </section>
  );
}
