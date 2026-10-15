import { Inbox, ShieldX, TriangleAlert } from "lucide-react";
import { ActivityError } from "@/lib/activity-types";
import { btnCls, cx, panel } from "./ui";

export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={cx("rounded-md bg-muted motion-safe:animate-pulse", className)}
    />
  );
}

export function TableSkeleton({ rows = 8 }: { rows?: number }) {
  return (
    <div role="status" aria-label="Loading activity" className="divide-y divide-border">
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="flex items-center gap-4 px-3 py-2.5">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="size-6" />
          <Skeleton className="h-4 w-32" />
          <Skeleton className="hidden h-5 w-36 sm:block" />
          <Skeleton className="hidden h-4 w-20 md:block" />
          <Skeleton className="ml-auto h-5 w-20" />
        </div>
      ))}
    </div>
  );
}

export function KpiSkeleton() {
  return (
    <div role="status" aria-label="Loading metrics" className="grid grid-cols-2 gap-px md:grid-cols-3 xl:grid-cols-6">
      {Array.from({ length: 6 }, (_, i) => (
        <div key={i} className="space-y-2 bg-card p-3">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-7 w-12" />
          <Skeleton className="h-3 w-20" />
        </div>
      ))}
    </div>
  );
}

export function TimelineSkeleton() {
  return (
    <div role="status" aria-label="Loading timeline" className="space-y-5 p-4">
      {Array.from({ length: 5 }, (_, i) => (
        <div key={i} className="flex gap-3">
          <Skeleton className="size-7 shrink-0" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-3 w-3/4" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function EmptyState({
  title,
  hint,
  action,
}: {
  title: string;
  hint: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-2 px-4 py-14 text-center">
      <Inbox aria-hidden className="size-7 text-muted-foreground" strokeWidth={1.5} />
      <p className="text-sm font-medium text-foreground">{title}</p>
      <p className="max-w-sm text-[13px] text-muted-foreground">{hint}</p>
      {action}
    </div>
  );
}

export function ErrorState({ error, onRetry }: { error: unknown; onRetry?: () => void }) {
  const msg = error instanceof Error ? error.message : "Something went wrong.";
  return (
    <div role="alert" className="flex flex-col items-center gap-2 px-4 py-14 text-center">
      <TriangleAlert aria-hidden className="size-7 text-red-600 dark:text-red-400" strokeWidth={1.5} />
      <p className="text-sm font-medium text-foreground">Could not load activity</p>
      <p className="max-w-sm text-[13px] text-muted-foreground">{msg}</p>
      {onRetry ? (
        <button type="button" onClick={onRetry} className={cx(btnCls, "mt-1")}>
          Try again
        </button>
      ) : null}
    </div>
  );
}

/** Picks the right empty-ish state for an API failure (forbidden, missing, or generic). */
export function QueryError({ error, onRetry }: { error: unknown; onRetry?: () => void }) {
  if (error instanceof ActivityError && error.code === "forbidden") {
    return <ForbiddenState message={error.message} />;
  }
  if (error instanceof ActivityError && error.code === "not_found") {
    return (
      <div className={cx(panel, "mt-4")}>
        <EmptyState title="Not found" hint={error.message} />
      </div>
    );
  }
  return <ErrorState error={error} onRetry={onRetry} />;
}

export function ForbiddenState({ message }: { message: string }) {
  return (
    <div className={cx(panel, "mt-4")}>
      <div role="alert" className="flex flex-col items-center gap-2 px-4 py-14 text-center">
        <ShieldX aria-hidden className="size-7 text-muted-foreground" strokeWidth={1.5} />
        <p className="text-sm font-medium text-foreground">No access</p>
        <p className="max-w-sm text-[13px] text-muted-foreground">{message}</p>
      </div>
    </div>
  );
}
