// Labels for the real activity log: which actions exist, and what each invoice type is called.
// Add an entry here whenever a new action starts being logged.

import type { LogImportance, LogOutcome } from "./contract";

export const LOG_ACTIONS: Record<string, { label: string; importance: LogImportance }> = {
  "invoice.created": { label: "Invoice created", importance: "info" },
  "invoice.updated": { label: "Invoice updated", importance: "important" },
  "invoice.deleted": { label: "Invoice deleted", importance: "critical" },
};

export const actionLabel = (action: string) => LOG_ACTIONS[action]?.label ?? action;

export const IMPORTANCE_LEVELS: LogImportance[] = ["info", "important", "critical"];
export const IMPORTANCE_TEXT: Record<LogImportance, string> = {
  info: "Info",
  important: "Important",
  critical: "Critical",
};

export const OUTCOMES: LogOutcome[] = ["success", "failure"];
export const OUTCOME_TEXT: Record<LogOutcome, string> = { success: "Success", failure: "Failed" };

// Same ids the invoice create routes use (sales side 1 to 7 and 23, purchase side 8 to 10).
export const INVOICE_TYPE_LABELS: Record<number, string> = {
  1: "Sales invoice",
  2: "Cash sales",
  4: "Sales quotation",
  5: "Sales order",
  6: "Proforma invoice",
  7: "Delivery challan",
  8: "Purchase order",
  9: "Purchase invoice",
  10: "Purchase return",
  23: "Sales enquiry",
};

export const invoiceTypeLabel = (t: number | null | undefined) =>
  t == null ? "" : (INVOICE_TYPE_LABELS[t] ?? `Type ${t}`);
