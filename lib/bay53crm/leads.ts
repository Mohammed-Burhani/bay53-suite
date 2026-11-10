// ==================== CRM Leads (API-backed) ====================
// Stage names, list filtering and request builders for the leads screens, on top of lib/bay53crm/api.

import type { CrmLeadListItem } from "./api/dto";
import type { CrmSchemas } from "./api/types";
import type { CRMLeadsFilters } from "./types";

// ---- Stages ----
// The API sends stage as a numeric id on a single lead and as a label in lists; there is no lookup endpoint.
// Ids 1-10 and 13 were read off the stage API (Lead/List filtered by leadStage). Ids 11, 12 and 14+ had no leads,
// so their names are unknown and they are not offered.

export const LEAD_STAGES = [
  { id: 1, label: "New", bg: "bg-slate-100", text: "text-slate-700", chart: "#64748b" },
  { id: 2, label: "Verified", bg: "bg-sky-100", text: "text-sky-700", chart: "#0ea5e9" },
  { id: 3, label: "Planning To Meet", bg: "bg-indigo-100", text: "text-indigo-700", chart: "#6366f1" },
  { id: 4, label: "Cold Lead", bg: "bg-blue-100", text: "text-blue-700", chart: "#3b82f6" },
  { id: 5, label: "Warm Lead", bg: "bg-orange-100", text: "text-orange-700", chart: "#f97316" },
  { id: 6, label: "Hot Lead", bg: "bg-amber-100", text: "text-amber-700", chart: "#f59e0b" },
  { id: 7, label: "Demo Requested", bg: "bg-cyan-100", text: "text-cyan-700", chart: "#06b6d4" },
  { id: 8, label: "Quotation Sent", bg: "bg-teal-100", text: "text-teal-700", chart: "#14b8a6" },
  { id: 9, label: "In Progress", bg: "bg-lime-100", text: "text-lime-700", chart: "#84cc16" },
  { id: 10, label: "Negotiation", bg: "bg-fuchsia-100", text: "text-fuchsia-700", chart: "#d946ef" },
  { id: 13, label: "Tender", bg: "bg-purple-100", text: "text-purple-700", chart: "#a855f7" },
] as const;

export const DEFAULT_NEW_LEAD_STAGE_ID = 4; // Cold Lead

/** Lead/List sends stage "0" when no stage is set. */
export const NO_STAGE_LABEL = "No stage";

export const stageLabel = (stageId: number): string =>
  LEAD_STAGES.find((s) => s.id === stageId)?.label ?? (stageId === 0 ? NO_STAGE_LABEL : `Stage ${stageId}`);

/** Lead/List stage label as shown in the UI. */
export const listStageLabel = (stage: string): string => (stage === "0" ? NO_STAGE_LABEL : stage);

/** Chart colour for a stage label as shown in lists; grey for "No stage" and unknown labels. */
export const stageChartColor = (label: string): string => stageColors(label)?.chart ?? "#9ca3af";

export const stageColors = (label: string): { bg: string; text: string; chart: string } | undefined =>
  LEAD_STAGES.find((s) => s.label === label);

// ---- Filters ----

const isoStart = (date: string) => `${date}T00:00:00`;
const isoEnd = (date: string) => `${date}T23:59:59`;

/** Only the date range goes to the server; the other filters are applied to the returned rows. */
export const toLeadSearchParams = (filters: Pick<CRMLeadsFilters, "fromDate" | "toDate">): CrmSchemas["LeadSearchParams"] => ({
  fromDate: filters.fromDate ? isoStart(filters.fromDate) : undefined,
  toDate: filters.toDate ? isoEnd(filters.toDate) : undefined,
  isArchive: false,
});

export const filterLeads = (leads: CrmLeadListItem[], filters: CRMLeadsFilters): CrmLeadListItem[] =>
  leads.filter((lead) => {
    if (filters.stages.length > 0 && !filters.stages.includes(listStageLabel(lead.stage))) return false;
    if (filters.regions.length > 0 && !filters.regions.includes(lead.companyRegion ?? "")) return false;
    if (filters.customerStates.length > 0 && !filters.customerStates.includes(lead.customerState ?? "")) return false;
    if (filters.assignedTos.length > 0 && !filters.assignedTos.includes(lead.assignTo ?? "")) return false;
    if (filters.valueMin && lead.value < Number(filters.valueMin)) return false;
    if (filters.valueMax && lead.value > Number(filters.valueMax)) return false;
    return true;
  });

/** Distinct non-empty values, sorted: options for the region and state filters. */
export const distinct = (values: (string | undefined)[]): string[] =>
  [...new Set(values.filter((v): v is string => !!v))].sort((a, b) => a.localeCompare(b));

// ---- Create ----

export interface NewLeadInput {
  title: string;
  contact: { id: number; companyName: string; companyRef: number };
  assignTo: string;
  stageId: number;
  value: number;
  /** yyyy-mm-dd */
  date: string;
  customerState: string;
  companyRegion: string;
}

// source, vertical and department are numeric enums with no lookup endpoint, so new leads use the values the
// stage API accepts for "not set" (source, vertical) and the most common department.
const UNSET = 0;
const DEFAULT_DEPARTMENT = 1;
const ACTIVE_STATUS = 1;

export const toLeadCreateModel = (input: NewLeadInput): CrmSchemas["LeadCreateViewModel"] => ({
  id: 0,
  title: input.title,
  stage: input.stageId,
  source: UNSET,
  status: ACTIVE_STATUS,
  value: input.value,
  probability: 0,
  assignTo: input.assignTo,
  receivedBy: input.assignTo,
  owner: input.assignTo,
  leadDate: isoStart(input.date),
  contactId: input.contact.id,
  customer: input.contact.companyName,
  customerRef: input.contact.companyRef,
  customerState: input.customerState || undefined,
  companyRegion: input.companyRegion || undefined,
  department: DEFAULT_DEPARTMENT,
  vertical: UNSET,
  valueCurrency: "INR",
});

// ---- Follow-ups ----

// Follow-up types are numeric with no lookup; 1 is accepted by the stage API.
export const FOLLOW_UP_TYPE = 1;
