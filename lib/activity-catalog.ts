import type { ActionCode, EntityType, Importance, Source, ActorRole } from "./activity-types";

export const ACTION_META: Record<
  ActionCode,
  { label: string; importance: Importance; entity: EntityType }
> = {
  "invoice.created": { label: "Invoice created", importance: "info", entity: "invoice" },
  "invoice.updated": { label: "Invoice updated", importance: "info", entity: "invoice" },
  "item.added": { label: "Item added", importance: "info", entity: "invoice_item" },
  "item.edited": { label: "Item edited", importance: "info", entity: "invoice_item" },
  "item.removed": { label: "Item removed", importance: "info", entity: "invoice_item" },
  "pdf.generated": { label: "PDF generated", importance: "info", entity: "invoice" },
  "pdf.downloaded": { label: "PDF downloaded", importance: "info", entity: "invoice" },

  "invoice.status_changed": { label: "Status changed", importance: "important", entity: "invoice" },
  "invoice.total_changed": { label: "Total changed", importance: "important", entity: "invoice" },
  "invoice.discount_changed": { label: "Discount changed", importance: "important", entity: "invoice" },
  "invoice.tax_changed": { label: "Tax changed", importance: "important", entity: "invoice" },
  "invoice.emailed": { label: "Invoice emailed", importance: "important", entity: "invoice" },
  "invoice.shared": { label: "Invoice shared", importance: "important", entity: "invoice" },

  "invoice.voided": { label: "Invoice voided", importance: "critical", entity: "invoice" },
  "invoice.deleted": { label: "Invoice deleted", importance: "critical", entity: "invoice" },
  "invoice.edited_after_sent": {
    label: "Edited after sent",
    importance: "critical",
    entity: "invoice",
  },
  "price.override": { label: "Price override", importance: "critical", entity: "invoice_item" },
  "export.csv": { label: "CSV exported", importance: "critical", entity: "invoice" },
};

export const ACTION_CODES = Object.keys(ACTION_META) as ActionCode[];

export const IMPORTANCE_ORDER: Importance[] = ["info", "important", "critical"];
export const IMPORTANCE_LABEL: Record<Importance, string> = {
  info: "Info",
  important: "Important",
  critical: "Critical",
};

export const SOURCES: Source[] = ["web", "mobile", "api", "system"];
export const SOURCE_LABEL: Record<Source, string> = {
  web: "Web app",
  mobile: "Mobile app",
  api: "API",
  system: "System job",
};

export const ROLE_LABEL: Record<ActorRole, string> = {
  admin: "Admin",
  accountant: "Accountant",
  sales: "Sales",
  system: "System",
};
