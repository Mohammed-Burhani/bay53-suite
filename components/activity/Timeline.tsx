"use client";

import { useId, useState } from "react";
import { ChevronDown } from "lucide-react";
import { ACTION_META, ROLE_LABEL } from "@/lib/activity-catalog";
import { formatIST, formatISTDay, formatISTFull, istDateKey, relativeTime, summarizeChanges } from "@/lib/activity-format";
import type { ActivityRow } from "@/lib/activity-types";
import { ImportanceDot } from "./badges";
import { LogDetail } from "./LogDetail";
import { ACTION_ICON, IMPORTANCE_STYLE, cx } from "./ui";

function TimelineItem({ log, last }: { log: ActivityRow; last: boolean }) {
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const Icon = ACTION_ICON[log.action];
  const summary = summarizeChanges(log.changes);

  return (
    <li className="relative flex gap-3 pb-5 last:pb-0">
      {!last && <span aria-hidden className="absolute left-[13px] top-7 bottom-0 w-px bg-muted" />}
      <span
        className={cx(
          "relative z-[1] grid size-7 shrink-0 place-items-center rounded-md border bg-card",
          IMPORTANCE_STYLE[log.importance].iconBox,
        )}
      >
        <Icon aria-hidden className="size-3.5" strokeWidth={1.75} />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
          <ImportanceDot importance={log.importance} />
          <span className="text-[13px] font-medium text-foreground">{ACTION_META[log.action].label}</span>
          <time
            dateTime={log.createdAt}
            title={formatISTFull(log.createdAt)}
            className="text-xs text-muted-foreground"
          >
            {relativeTime(log.createdAt)}
          </time>
          <span className="act-mono text-xs text-muted-foreground">{formatIST(log.createdAt)}</span>
        </div>
        <p className="text-xs text-muted-foreground">
          {log.actorName}, {ROLE_LABEL[log.actorRole]}
        </p>
        {summary ? (
          <p className="act-mono mt-1 break-words rounded-md bg-muted px-2 py-1 text-xs text-foreground">
            {summary}
          </p>
        ) : null}
        <button
          type="button"
          aria-expanded={open}
          aria-controls={panelId}
          onClick={() => setOpen((o) => !o)}
          className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-foreground/80 underline-offset-2 hover:underline"
        >
          <ChevronDown aria-hidden className={cx("size-3.5 transition-transform motion-reduce:transition-none", open && "rotate-180")} />
          {open ? "Hide details" : "Details"}
        </button>
        {open ? (
          <div id={panelId} className="mt-2 rounded-md border border-border p-3">
            <LogDetail log={log} compact />
          </div>
        ) : null}
      </div>
    </li>
  );
}

export function Timeline({ rows }: { rows: ActivityRow[] }) {
  // Group by IST calendar day, newest first (the API already returns newest first).
  const groups: { key: string; label: string; rows: ActivityRow[] }[] = [];
  for (const r of rows) {
    const key = istDateKey(r.createdAt);
    const g = groups[groups.length - 1];
    if (g && g.key === key) g.rows.push(r);
    else groups.push({ key, label: formatISTDay(r.createdAt), rows: [r] });
  }

  return (
    <div className="space-y-5 p-4">
      {groups.map((g) => (
        <section key={g.key} aria-label={g.label}>
          <h3 className="mb-3 text-xs font-semibold text-foreground/80">{g.label}</h3>
          <ol>
            {g.rows.map((r, i) => (
              <TimelineItem key={r.id} log={r} last={i === g.rows.length - 1} />
            ))}
          </ol>
        </section>
      ))}
    </div>
  );
}
