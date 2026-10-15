"use client";

import Link from "next/link";
import { Lock } from "lucide-react";
import { ACTION_META, ROLE_LABEL } from "@/lib/activity-catalog";
import { formatISTFull, invoiceHref } from "@/lib/activity-format";
import type { ActivityRow } from "@/lib/activity-types";
import { ActionBadge, ImportanceChip, SourceIcon } from "./badges";
import { DiffViewer } from "./DiffViewer";
import { useViewer } from "./ViewerProvider";

function Fact({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[96px_1fr] gap-2 py-1">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="min-w-0 break-words text-[13px] text-foreground">{children}</dd>
    </div>
  );
}

/**
 * Read-only detail for one log row. IP, user agent and metadata render only for admins,
 * and only when the API actually sent them (it strips them for everyone else).
 */
export function LogDetail({ log, compact = false }: { log: ActivityRow; compact?: boolean }) {
  const { isAdmin } = useViewer();
  const showTech = isAdmin && log.ip !== undefined;

  return (
    <div className="space-y-4">
      {!compact && (
        <div className="flex flex-wrap items-center gap-2">
          <ActionBadge action={log.action} />
          <ImportanceChip importance={log.importance} />
        </div>
      )}

      <section aria-label="Event facts">
        <dl className="divide-y divide-border">
          <Fact label="When">
            <span className="act-mono">{formatISTFull(log.createdAt)}</span>
            <span className="act-mono block text-xs text-muted-foreground">{log.createdAt} (UTC)</span>
          </Fact>
          <Fact label="Actor">
            {log.actorName}, {ROLE_LABEL[log.actorRole]}
          </Fact>
          <Fact label="Source">
            <SourceIcon source={log.source} withLabel />
          </Fact>
          <Fact label="Invoice">
            {log.invoiceId ? (
              <Link
                href={invoiceHref(log.invoiceId, "activity")}
                className="act-mono font-medium underline underline-offset-2 hover:no-underline"
              >
                {log.entityLabel}
              </Link>
            ) : (
              <span className="text-muted-foreground">{log.entityLabel}</span>
            )}
          </Fact>
          <Fact label="Entity">
            <span className="act-mono text-xs">
              {log.entityType} / {log.entityId}
            </span>
          </Fact>
          <Fact label="Log ID">
            <span className="act-mono text-xs">{log.id}</span>
          </Fact>
        </dl>
      </section>

      <section aria-label="Changes">
        <h3 className="mb-1.5 text-xs font-semibold text-foreground/80">
          {ACTION_META[log.action].label}: changes
        </h3>
        <DiffViewer changes={log.changes} action={log.action} />
      </section>

      {showTech ? (
        <section aria-label="Technical details, admin only">
          <h3 className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-foreground/80">
            <Lock aria-hidden className="size-3" strokeWidth={2} />
            Technical details (admin only)
          </h3>
          <dl className="divide-y divide-border rounded-md border border-border px-2">
            <Fact label="IP address">
              <span className="act-mono">{log.ip}</span>
            </Fact>
            <Fact label="User agent">
              <span className="act-mono text-xs">{log.userAgent}</span>
            </Fact>
          </dl>
          <pre
            tabIndex={0}
            aria-label="Raw metadata"
            className="act-mono mt-2 max-h-56 overflow-auto rounded-md border border-border bg-muted p-2 text-xs text-foreground"
          >
            {JSON.stringify(log.metadata ?? {}, null, 2)}
          </pre>
        </section>
      ) : isAdmin ? null : (
        <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Lock aria-hidden className="size-3" strokeWidth={2} />
          Network and raw technical details are visible to admins only.
        </p>
      )}
    </div>
  );
}
