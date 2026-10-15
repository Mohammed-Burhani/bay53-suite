import { fieldLabel, formatValue } from "@/lib/activity-format";
import { isSnapshot, type ActionCode, type Changes } from "@/lib/activity-types";
import { cx } from "./ui";

const REMOVAL: ActionCode[] = ["item.removed", "invoice.deleted", "invoice.voided"];

const OLD =
  "bg-red-50 text-red-900 dark:bg-red-950/50 dark:text-red-200";
const NEW =
  "bg-green-50 text-green-900 dark:bg-green-950/50 dark:text-green-200";

/** Old to new diff. Red and green carry a +/- sign too, so the meaning never depends on color alone. */
export function DiffViewer({ changes, action }: { changes: Changes | null; action: ActionCode }) {
  if (!changes) {
    return <p className="text-[13px] text-muted-foreground">No field changes were recorded for this event.</p>;
  }

  if (isSnapshot(changes)) {
    const removed = REMOVAL.includes(action);
    return (
      <dl className="overflow-hidden rounded-md border border-border text-[13px]">
        {Object.entries(changes.snapshot).map(([k, v]) => (
          <div key={k} className="grid grid-cols-[110px_1fr] border-b border-border last:border-b-0">
            <dt className="bg-muted px-2 py-1.5 text-muted-foreground">{fieldLabel(k)}</dt>
            <dd className={cx("act-mono flex gap-2 px-2 py-1.5", removed ? OLD : NEW)}>
              <span aria-hidden>{removed ? "-" : "+"}</span>
              <span className="sr-only">{removed ? "Removed value" : "Added value"}</span>
              <span className="min-w-0 break-words">{formatValue(k, v)}</span>
            </dd>
          </div>
        ))}
      </dl>
    );
  }

  return (
    <dl className="overflow-hidden rounded-md border border-border text-[13px]">
      {Object.entries(changes).map(([k, c]) => (
        <div key={k} className="border-b border-border last:border-b-0">
          <dt className="bg-muted px-2 py-1 text-xs font-medium text-foreground/80">
            {fieldLabel(k)}
          </dt>
          <dd className="grid sm:grid-cols-2">
            <div className={cx("act-mono flex gap-2 px-2 py-1.5", OLD)}>
              <span aria-hidden>-</span>
              <span className="sr-only">Old value</span>
              <span className="min-w-0 break-words">{formatValue(k, c.old)}</span>
            </div>
            <div className={cx("act-mono flex gap-2 px-2 py-1.5", NEW)}>
              <span aria-hidden>+</span>
              <span className="sr-only">New value</span>
              <span className="min-w-0 break-words">{formatValue(k, c.new)}</span>
            </div>
          </dd>
        </div>
      ))}
    </dl>
  );
}
