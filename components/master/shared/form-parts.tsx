"use client";

import type { FormikErrors, FormikTouched } from "formik";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

// Small building blocks shared by the master data forms (items, ledgers, …).

export function fieldError<T>(
  errors: FormikErrors<T>,
  touched: FormikTouched<T>,
  name: keyof T
): string | undefined {
  const message = errors[name] as unknown;
  return touched[name] && typeof message === "string" ? message : undefined;
}

export function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <h3 className="border-b pb-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">{title}</h3>
      {children}
    </section>
  );
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
    <div className={className}>
      <Label className="mb-1.5 text-xs text-muted-foreground">
        {label}
        {required && <span className="ml-0.5 text-destructive">*</span>}
      </Label>
      {children}
      {error && <p className="mt-1 text-xs text-destructive">{error}</p>}
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
