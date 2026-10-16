"use client";

import { useRef, useState } from "react";
import { ROLE_LABEL } from "@/lib/activity-catalog";
import { formatINR } from "@/lib/activity-format";
import { USERS_BY_ID } from "@/lib/mock/users";
import type { Invoice } from "@/lib/activity-types";
import { useInvoice, useTimeline } from "./hooks";
import { EmptyState, QueryError, Skeleton, TimelineSkeleton } from "./states";
import { Timeline } from "./Timeline";
import { cx, panel } from "./ui";
import { useViewer } from "./ViewerProvider";

type Tab = "details" | "activity";
const TABS: { id: Tab; label: string }[] = [
  { id: "details", label: "Details" },
  { id: "activity", label: "Activity" },
];

const dateFmt = new Intl.DateTimeFormat("en-IN", { timeZone: "Asia/Kolkata", day: "2-digit", month: "short", year: "numeric" });

function StatusPill({ status }: { status: Invoice["status"] }) {
  return (
    <span className="rounded-md border border-border bg-muted px-2 py-0.5 text-xs font-medium text-foreground">
      {status}
    </span>
  );
}

function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-6 py-1">
      <dt className="text-[13px] text-muted-foreground">{label}</dt>
      <dd className={cx("act-mono text-[13px] text-foreground", strong && "font-semibold")}>{value}</dd>
    </div>
  );
}

function DetailsTab({ inv }: { inv: Invoice }) {
  return (
    <div className="grid gap-4 p-4 lg:grid-cols-[minmax(0,1fr)_300px]">
      <div className="space-y-4">
        <div className="overflow-x-auto rounded-md border border-border">
          <table className="w-full min-w-[480px] text-[13px]">
            <caption className="sr-only">Invoice line items</caption>
            <thead className="bg-muted text-[11px] text-muted-foreground">
              <tr>
                <th scope="col" className="px-3 py-2 text-left font-medium">Item</th>
                <th scope="col" className="px-3 py-2 text-left font-medium">HSN</th>
                <th scope="col" className="px-3 py-2 text-right font-medium">Qty</th>
                <th scope="col" className="px-3 py-2 text-right font-medium">Rate</th>
                <th scope="col" className="px-3 py-2 text-right font-medium">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {inv.items.map((i) => (
                <tr key={i.id}>
                  <td className="px-3 py-2 text-foreground">{i.name}</td>
                  <td className="act-mono px-3 py-2 text-muted-foreground">{i.hsn}</td>
                  <td className="act-mono px-3 py-2 text-right">{i.qty}</td>
                  <td className="act-mono px-3 py-2 text-right">{formatINR(i.rate)}</td>
                  <td className="act-mono px-3 py-2 text-right">{formatINR(i.qty * i.rate)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <dl className="h-fit rounded-md border border-border px-3 py-2">
        <Row label="Subtotal" value={formatINR(inv.subtotal)} />
        <Row label={`Discount (${inv.discountPct}%)`} value={`-${formatINR(inv.discount)}`} />
        <Row label={`GST (${inv.taxPct}%)`} value={formatINR(inv.tax)} />
        <div className="my-1 border-t border-border" />
        <Row label="Total" value={formatINR(inv.total)} strong />
      </dl>
    </div>
  );
}

function ActivityTab({ id }: { id: string }) {
  const { isAdmin } = useViewer();
  const t = useTimeline(id);
  if (t.isPending) return <TimelineSkeleton />;
  if (t.isError) return <QueryError error={t.error} onRetry={() => t.refetch()} />;
  return (
    <>
      <p className="border-b border-border px-4 py-2 text-xs text-muted-foreground">
        {isAdmin
          ? "Showing every event for this invoice, including technical details."
          : "Showing your own actions and all important and critical events on this invoice."}
      </p>
      {t.data.length === 0 ? (
        <EmptyState title="No activity yet" hint="Changes to this invoice will appear here as they happen." />
      ) : (
        <Timeline rows={t.data} />
      )}
    </>
  );
}

export function InvoiceDetailView({ id, initialTab }: { id: string; initialTab: Tab }) {
  const q = useInvoice(id);
  const timeline = useTimeline(id);
  const [tab, setTab] = useState<Tab>(initialTab);
  const tabRefs = useRef<Record<Tab, HTMLButtonElement | null>>({ details: null, activity: null });

  if (q.isPending) {
    return (
      <div role="status" aria-label="Loading invoice" className="space-y-3">
        <Skeleton className="h-7 w-56" />
        <Skeleton className="h-4 w-80" />
        <div className={cx(panel, "p-4")}>
          <Skeleton className="h-40 w-full" />
        </div>
      </div>
    );
  }
  if (q.isError) return <QueryError error={q.error} onRetry={() => q.refetch()} />;

  const inv = q.data;
  const owner = USERS_BY_ID[inv.ownerId];
  const acc = USERS_BY_ID[inv.accountantId];

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
    const next: Tab = tab === "details" ? "activity" : "details";
    setTab(next);
    tabRefs.current[next]?.focus();
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="act-mono text-xl font-semibold text-foreground">{inv.number}</h1>
            <StatusPill status={inv.status} />
          </div>
          <p className="text-[13px] text-foreground/80">{inv.customer}</p>
        </div>
        <dl className="grid grid-cols-[auto_auto] gap-x-4 gap-y-0.5 text-xs">
          <dt className="text-muted-foreground">Created</dt>
          <dd className="act-mono">{dateFmt.format(new Date(inv.createdAt))}</dd>
          <dt className="text-muted-foreground">Due</dt>
          <dd className="act-mono">{dateFmt.format(new Date(`${inv.dueDate}T00:00:00+05:30`))}</dd>
          <dt className="text-muted-foreground">Sales owner</dt>
          <dd>{owner.name}</dd>
          <dt className="text-muted-foreground">{ROLE_LABEL.accountant}</dt>
          <dd>{acc.name}</dd>
        </dl>
      </div>

      <div className={cx(panel, "overflow-hidden")}>
        <div role="tablist" aria-label="Invoice sections" onKeyDown={onKey} className="flex border-b border-border">
          {TABS.map((t) => (
            <button
              key={t.id}
              ref={(el) => {
                tabRefs.current[t.id] = el;
              }}
              id={`tab-${t.id}`}
              role="tab"
              type="button"
              aria-selected={tab === t.id}
              aria-controls={`panel-${t.id}`}
              tabIndex={tab === t.id ? 0 : -1}
              onClick={() => setTab(t.id)}
              className={cx(
                "-mb-px border-b-2 px-4 py-2 text-[13px] font-medium focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-primary",
                tab === t.id
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground",
              )}
            >
              {t.label}
              {t.id === "activity" && timeline.data ? (
                <span className="act-mono ml-1.5 rounded-md bg-muted px-1.5 py-0.5 text-[11px] text-foreground/80">
                  {timeline.data.length}
                </span>
              ) : null}
            </button>
          ))}
        </div>
        <div role="tabpanel" id={`panel-${tab}`} aria-labelledby={`tab-${tab}`}>
          {tab === "details" ? <DetailsTab inv={inv} /> : <ActivityTab id={id} />}
        </div>
      </div>
    </div>
  );
}
