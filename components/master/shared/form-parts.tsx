"use client";

import { useEffect, useRef } from "react";
import { Form, useFormikContext, type FormikErrors, type FormikTouched } from "formik";
import { toast } from "sonner";
import { Loader2, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

// Building blocks shared by the master data forms (items, ledgers, groups…):
// dense layout primitives plus keyboard handling (Enter → next field, Ctrl+S, Esc).

export function fieldError<T>(
  errors: FormikErrors<T>,
  touched: FormikTouched<T>,
  name: keyof T
): string | undefined {
  const message = errors[name] as unknown;
  return touched[name] && typeof message === "string" ? message : undefined;
}

export function Section({ title, children, className }: { title: string; children: React.ReactNode; className?: string }) {
  return (
    <section className={cn("rounded-lg border bg-card p-3", className)}>
      <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{title}</h3>
      {children}
    </section>
  );
}

/** Two-column field grid used inside a Section; give a Row `className="col-span-2"` to span both. */
export function FieldGrid({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn("grid grid-cols-2 gap-x-3 gap-y-2", className)}>{children}</div>;
}

export function Row({
  label,
  required,
  error,
  className,
  children,
}: {
  label: string;
  required?: boolean;
  error?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("min-w-0", className)}>
      <Label className="mb-1 block truncate text-[11px] leading-none text-muted-foreground">
        {label}
        {required && <span className="ml-0.5 text-destructive">*</span>}
      </Label>
      {children}
      {error && <p className="mt-0.5 text-[11px] leading-tight text-destructive">{error}</p>}
    </div>
  );
}

export function NumberInput(props: React.ComponentProps<typeof Input>) {
  return <Input type="number" inputMode="decimal" step="any" min="0" className="text-right tabular-nums" {...props} />;
}

export function Flag({ id, label, checked, onChange }: { id: string; label: string; checked: boolean; onChange: (c: boolean) => void }) {
  return (
    <label htmlFor={id} className="flex cursor-pointer items-center gap-2 text-sm">
      <Checkbox id={id} checked={checked} onCheckedChange={(c) => onChange(c === true)} />
      {label}
    </label>
  );
}

// ---------- keyboard ----------

const FOCUSABLE = 'input, textarea, select, button[role="combobox"], button[role="checkbox"]';

// Fields the keyboard can land on, in DOM order (Radix's hidden mirror inputs are aria-hidden).
function focusableFields(form: HTMLElement): HTMLElement[] {
  return Array.from(form.querySelectorAll<HTMLElement>(FOCUSABLE)).filter((el) => {
    if (el.getAttribute("aria-hidden") === "true" || el.tabIndex < 0) return false;
    if ((el as HTMLInputElement).disabled || (el as HTMLInputElement).readOnly) return false;
    if ((el as HTMLInputElement).type === "hidden") return false;
    return el.offsetParent !== null;
  });
}

/**
 * Formik `<Form>` with keyboard handling:
 *  - Enter moves to the next field (on the last field it submits; in a textarea it adds a line)
 *  - Ctrl/Cmd+S submits
 *  - Esc cancels (a second Esc is needed when there are unsaved changes)
 * The first field is focused on mount. Also applies the compact control sizing used by master forms.
 */
export function KeyboardForm({ onCancel, className, children }: { onCancel: () => void; className?: string; children: React.ReactNode }) {
  const { dirty, submitCount, validateForm } = useFormikContext();
  const ref = useRef<HTMLFormElement>(null);
  const escArmed = useRef(false);

  useEffect(() => {
    if (ref.current) focusableFields(ref.current)[0]?.focus();
  }, []);

  // A failed submit must never be silent: say what is wrong and jump to the first bad field.
  useEffect(() => {
    if (submitCount === 0) return;
    let cancelled = false;
    validateForm().then((errors) => {
      const messages = Object.entries(errors).filter(([, m]) => typeof m === "string") as [string, string][];
      if (cancelled || messages.length === 0) return;
      toast.error(`Cannot save yet — ${messages.map(([n, m]) => `${n.replace(/_ID$/, "").replace(/_/g, " ")}: ${m}`).slice(0, 3).join(" · ")}${messages.length > 3 ? ` (+${messages.length - 3} more)` : ""}`);
      const form = ref.current;
      const first = messages.map(([name]) => form?.querySelector<HTMLElement>(`[name="${name}"]`)).find(Boolean) ?? form?.querySelector<HTMLElement>("[aria-invalid=true]");
      first?.focus();
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [submitCount]);

  const onKeyDown = (e: React.KeyboardEvent<HTMLFormElement>) => {
    const form = e.currentTarget;
    const target = e.target as HTMLElement;
    // Popovers and selects render in portals but still bubble through React; leave their keys alone.
    if (!form.contains(target) || e.defaultPrevented) return;

    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
      e.preventDefault();
      form.requestSubmit();
      return;
    }

    if (e.key === "Escape") {
      if (dirty && !escArmed.current) {
        escArmed.current = true;
        toast.info("Unsaved changes — press Esc again to discard");
        window.setTimeout(() => (escArmed.current = false), 2500);
        return;
      }
      onCancel();
      return;
    }

    if (e.key === "Enter" && !e.shiftKey && !e.ctrlKey && !e.altKey) {
      const isTextarea = target.tagName === "TEXTAREA";
      const isField = target.tagName === "INPUT" || target.tagName === "SELECT" || target.getAttribute("role") === "checkbox";
      if (isTextarea || !isField) return; // buttons keep their own Enter behaviour
      const fields = focusableFields(form);
      const next = fields[fields.indexOf(target) + 1];
      if (next) {
        e.preventDefault();
        next.focus();
        if (next instanceof HTMLInputElement) next.select();
      } // last field: fall through to the native submit
    }
  };

  return (
    <Form
      ref={ref}
      noValidate
      onKeyDown={onKeyDown}
      className={cn(
        "[&_[data-slot=input]]:h-8 [&_[data-slot=input]]:px-2.5 [&_[data-slot=select-trigger]]:h-8! [&_[data-slot=select-trigger]]:px-2.5 [&_button[role=combobox]]:h-8 [&_button[role=combobox]]:px-2.5 [&_button[role=combobox]]:font-normal",
        className
      )}
    >
      {children}
    </Form>
  );
}

/** Sticky action bar for the top of a form card. */
export function FormToolbar({
  saving,
  submitLabel,
  onCancel,
  note,
}: {
  saving: boolean;
  submitLabel: string;
  onCancel: () => void;
  note?: string;
}) {
  return (
    <div className="sticky top-0 z-10 flex flex-wrap items-center gap-2 border-b bg-card/95 px-3 py-2 backdrop-blur">
      <p className="mr-auto min-w-0 truncate text-xs text-muted-foreground">
        {note ?? (
          <span className="hidden sm:inline">
            <kbd className="rounded border bg-muted px-1">Enter</kbd> next field · <kbd className="rounded border bg-muted px-1">Ctrl+S</kbd> save ·{" "}
            <kbd className="rounded border bg-muted px-1">Esc</kbd> cancel
          </span>
        )}
      </p>
      <Button type="button" variant="outline" size="sm" disabled={saving} onClick={onCancel} title="Cancel (Esc)">
        Cancel
      </Button>
      <Button type="submit" size="sm" disabled={saving} title="Save (Ctrl+S)">
        {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
        {submitLabel}
      </Button>
    </div>
  );
}
