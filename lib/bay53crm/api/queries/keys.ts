// Query-key roots and cache lifetimes shared by every CRM query module.
// Each module builds its keys on its root (see lead.queries.ts) and mutations invalidate by root.

export const crmKeys = {
  accounts: ["crm", "accounts"],
  campaign: ["crm", "campaign"],
  common: ["crm", "common"],
  company: ["crm", "company"],
  contact: ["crm", "contact"],
  lead: ["crm", "lead"],
  leadCommon: ["crm", "lead-common"],
  masterValue: ["crm", "master-value"],
  notification: ["crm", "notification"],
  report: ["crm", "report"],
} as const;

export const staleTime = {
  /** Records and lists users edit: refetch soon after they change. */
  list: 30_000,
  /** Reports and dashboard numbers. */
  report: 5 * 60_000,
  /** Rarely-changing lookups: users, master values, financial years. */
  lookup: 30 * 60_000,
} as const;
