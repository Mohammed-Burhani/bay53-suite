import { ACTION_META, IMPORTANCE_LABEL, ROLE_LABEL, SOURCE_LABEL } from "@/lib/activity-catalog";
import { initials } from "@/lib/activity-format";
import type { ActionCode, ActorRole, Importance, Source } from "@/lib/activity-types";
import { ACTION_ICON, IMPORTANCE_STYLE, SOURCE_ICON, cx } from "./ui";

export function ImportanceChip({ importance }: { importance: Importance }) {
  const s = IMPORTANCE_STYLE[importance];
  const Icon = s.icon;
  return (
    <span
      className={cx(
        "inline-flex items-center gap-1 whitespace-nowrap rounded-md border px-1.5 py-0.5 text-[11px] font-medium leading-4",
        s.chip,
      )}
    >
      <Icon aria-hidden className="size-3" strokeWidth={2} />
      {IMPORTANCE_LABEL[importance]}
    </span>
  );
}

/** Small colored marker used on timelines. The text label stays available to screen readers. */
export function ImportanceDot({ importance }: { importance: Importance }) {
  return (
    <span className="inline-flex items-center">
      <span aria-hidden className={cx("size-2 rounded-full", IMPORTANCE_STYLE[importance].dot)} />
      <span className="sr-only">{IMPORTANCE_LABEL[importance]} importance</span>
    </span>
  );
}

export function ActionBadge({ action }: { action: ActionCode }) {
  const Icon = ACTION_ICON[action];
  return (
    <span
      title={action}
      className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-md border border-border bg-muted px-1.5 py-0.5 text-xs text-foreground"
    >
      <Icon aria-hidden className="size-3.5 shrink-0" strokeWidth={1.75} />
      {ACTION_META[action].label}
    </span>
  );
}

export function SourceIcon({ source, withLabel = false }: { source: Source; withLabel?: boolean }) {
  const Icon = SOURCE_ICON[source];
  return (
    <span className="inline-flex items-center gap-1.5 text-muted-foreground" title={SOURCE_LABEL[source]}>
      <Icon aria-hidden className="size-4" strokeWidth={1.75} />
      <span className={withLabel ? "text-xs" : "sr-only"}>{SOURCE_LABEL[source]}</span>
    </span>
  );
}

export function Avatar({ name, role }: { name: string; role: ActorRole }) {
  return (
    <span
      aria-hidden
      className={cx(
        "grid size-6 shrink-0 place-items-center rounded-md text-[10px] font-semibold",
        role === "system"
          ? "bg-sidebar text-sidebar-foreground"
          : "bg-muted text-foreground/80",
      )}
    >
      {role === "system" ? "SY" : initials(name)}
    </span>
  );
}

export function ActorCell({ name, role, isYou }: { name: string; role: ActorRole; isYou?: boolean }) {
  return (
    <span className="flex min-w-0 items-center gap-2">
      <Avatar name={name} role={role} />
      <span className="min-w-0 leading-tight">
        <span className="block truncate text-[13px] font-medium text-foreground">
          {name}
          {isYou ? <span className="ml-1 font-normal text-muted-foreground">(you)</span> : null}
        </span>
        <span className="block truncate text-[11px] text-muted-foreground">{ROLE_LABEL[role]}</span>
      </span>
    </span>
  );
}
