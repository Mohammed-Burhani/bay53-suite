// TanStack Query layer for the CRM API: key factories, queryOptions and hooks per module.
// Used by every CRM screen (leads, projects, dashboard, reports, CMS, company).
// Email, EmailSetting, CustomMessage and Customer have services but no query module yet.
export { crmKeys, staleTime } from "./keys";
export { useCrmMutation } from "./mutation";
export * from "./accounts.queries";
export * from "./campaign.queries";
export * from "./common.queries";
export * from "./company.queries";
export * from "./contact.queries";
export * from "./lead.queries";
export * from "./lead-common.queries";
export * from "./master-value.queries";
export * from "./notification.queries";
export * from "./report.queries";
