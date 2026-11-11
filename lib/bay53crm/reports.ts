// ==================== CRM Reports (API-backed) ====================
// Criteria shapes, request builders and row helpers for the four report screens, on top of lib/bay53crm/api.
// The screens keep their criteria as strings (inputs and multi-selects), so the builders below turn them into the
// request bodies; empty criteria are left out so the server applies no filter for them.

import type { CrmCampaignDetailsReportRow, CrmLeadDetailsReportRow, CrmSalesStageStatusReportRow } from "./api/dto";
import type { CrmSchemas } from "./api/types";
import { ALL_STAGES, NO_STAGE_LABEL } from "./leads";
import { PROJECT_STATUSES, projectStatusColors } from "./projects";

const isoStart = (date: string) => (date ? `${date}T00:00:00` : undefined);
const isoEnd = (date: string) => (date ? `${date}T23:59:59` : undefined);

/** An empty selection means "no filter", which the API expects as a missing property. */
const selected = <T>(values: T[]): T[] | undefined => (values.length > 0 ? values : undefined);

const toNumber = (value: string): number | undefined => {
  if (value.trim() === "") return undefined;
  const n = Number(value);
  return Number.isFinite(n) ? n : undefined;
};

const text = (value: string): string | undefined => value.trim() || undefined;

// ---- Lead details ----

export interface LeadDetailsCriteria {
  /** yyyy-mm-dd, or empty */
  fromDate: string;
  toDate: string;
  customer: string;
  worthMin: string;
  worthMax: string;
  regions: string[];
  states: string[];
  /** ALL_STAGES ids as strings (the multi-select values) */
  stageIds: string[];
  /** CRM user names */
  assignedTos: string[];
}

export const EMPTY_LEAD_DETAILS_CRITERIA: LeadDetailsCriteria = {
  fromDate: "",
  toDate: "",
  customer: "",
  worthMin: "",
  worthMax: "",
  regions: [],
  states: [],
  stageIds: [],
  assignedTos: [],
};

export const toLeadDetailsParams = (c: LeadDetailsCriteria): CrmSchemas["LeadDetailsReportViewModel"] => ({
  fromDate: isoStart(c.fromDate),
  toDate: isoEnd(c.toDate),
  // `customer` is not sent: the server matches it exactly ("Name | City|Pincode"), see filterLeadDetailRows.
  fromValue: toNumber(c.worthMin),
  toValue: toNumber(c.worthMax),
  companyRegion: selected(c.regions),
  customerState: selected(c.states),
  stage: selected(c.stageIds.map(Number)),
  assignedTo: selected(c.assignedTos),
});

/** Rows whose customer contains the text, ignoring case; every row when the text is empty. */
export const filterLeadDetailRows = (rows: CrmLeadDetailsReportRow[], customer: string): CrmLeadDetailsReportRow[] => {
  const needle = customer.trim().toLowerCase();
  return needle === "" ? rows : rows.filter((r) => r.customer.toLowerCase().includes(needle));
};

// ---- Lead activity ----

export interface LeadActivityCriteria {
  fromDate: string;
  toDate: string;
  assignedTos: string[];
}

export const EMPTY_LEAD_ACTIVITY_CRITERIA: LeadActivityCriteria = { fromDate: "", toDate: "", assignedTos: [] };

export const toLeadActivityParams = (c: LeadActivityCriteria): CrmSchemas["LeadActivityReportViewModel"] => ({
  fromDate: isoStart(c.fromDate),
  toDate: isoEnd(c.toDate),
  assignedTo: selected(c.assignedTos),
});

/** The name on the first line of an activity's contact ("Mr.X \n (Mobile 1) - 99..." gives "Mr.X"). */
export const contactNameOf = (contact?: string): string => (contact ?? "").split(/\r?\n/)[0].trim();

// ---- Project details ----

export interface ProjectReportCriteria {
  /** PROJECT_STATUSES ids as strings */
  statusIds: string[];
  /** Brand approval master value id as a string; empty for all */
  campaignTypeId: string;
  consultant: string;
  /** Start date range */
  fromDate: string;
  toDate: string;
  /** CRM user names. The report has no such filter, so it is applied to the returned rows. */
  assignedTos: string[];
}

export const EMPTY_PROJECT_REPORT_CRITERIA: ProjectReportCriteria = {
  statusIds: [],
  campaignTypeId: "",
  consultant: "",
  fromDate: "",
  toDate: "",
  assignedTos: [],
};

export const toProjectReportParams = (c: ProjectReportCriteria): CrmSchemas["CampaignDetailsReportViewModel"] => ({
  status: selected(c.statusIds.map(Number)),
  campaignType: toNumber(c.campaignTypeId),
  consultantName: text(c.consultant),
  fromDate: isoStart(c.fromDate),
  toDate: isoEnd(c.toDate),
});

export const filterProjectReportRows = (
  rows: CrmCampaignDetailsReportRow[],
  assignedTos: string[]
): CrmCampaignDetailsReportRow[] =>
  assignedTos.length === 0 ? rows : rows.filter((r) => r.assignTo !== undefined && assignedTos.includes(r.assignTo));

/**
 * The reports send stage, status and source as text without spaces ("NotAwarded", "ColdLead", "InActive"), and "0" for
 * "not set". This gives the wording the screens show: "Not Awarded", "Cold Lead", "Inactive", "".
 */
export const reportText = (value?: string | null): string => {
  if (!value || value === "0") return "";
  const spaced = value.replace(/([a-z])([A-Z])/g, "$1 $2");
  return spaced === "In Active" ? "Inactive" : spaced;
};

/** A lead's stage in the lead details report, in the wording of the lead screens. */
export const reportStage = (stage?: string | null): string => reportText(stage) || NO_STAGE_LABEL;

/** Badge colours for a report status text; unknown statuses (e.g. "Closed") get the neutral colours. */
export const reportStatusColors = (status: string): string => {
  const known = PROJECT_STATUSES.find((s) => s.label.replace(/ /g, "") === status);
  return projectStatusColors(known?.id ?? 0);
};

const CONSULTANT_PREFIX = /^\s*Consultant Name\s*:\s*/i;

/** The consultant's name from a report description ("Consultant Name : X.\n\nMake List NA" gives "X."). */
export const consultantOf = (description?: string): string => {
  if (!description) return "";
  return description.replace(CONSULTANT_PREFIX, "").split(/\r?\n/)[0].trim();
};

// ---- Sales stage status ----

export interface SalesStageCriteria {
  fromDate: string;
  toDate: string;
  /** CRM user names (the API calls them sales managers) */
  assignedTos: string[];
  regions: string[];
}

export const EMPTY_SALES_STAGE_CRITERIA: SalesStageCriteria = { fromDate: "", toDate: "", assignedTos: [], regions: [] };

export const toSalesStageParams = (c: SalesStageCriteria): CrmSchemas["SalesStageStatusReportViewModel"] => ({
  fromDate: isoStart(c.fromDate),
  toDate: isoEnd(c.toDate),
  salesManager: selected(c.assignedTos),
  companyRegion: selected(c.regions),
});

export interface StageSummary {
  stageId: number;
  label: string;
  color: string;
  leads: number;
  value: number;
}

const UNKNOWN_COLOR = "#9ca3af";

const stageInfo = (stageId: number) => {
  const known = ALL_STAGES.find((s) => s.id === stageId);
  return {
    label: known?.label ?? (stageId === 0 ? "No stage" : `Stage ${stageId}`),
    color: known?.chart ?? UNKNOWN_COLOR,
    // Known stages come first, in pipeline order (closed ones last); the rest follow by id.
    order: known ? ALL_STAGES.indexOf(known) : ALL_STAGES.length + stageId,
  };
};

/** One summary per stage that has leads, in pipeline order. */
export const summariseByStage = (rows: CrmSalesStageStatusReportRow[]): StageSummary[] => {
  const byStage = new Map<number, { leads: number; value: number }>();
  for (const row of rows) {
    const entry = byStage.get(row.stage) ?? { leads: 0, value: 0 };
    entry.leads += row.noofLeads;
    entry.value += row.value;
    byStage.set(row.stage, entry);
  }
  return [...byStage.entries()]
    .map(([stageId, e]) => {
      const { order, ...info } = stageInfo(stageId);
      return { order, summary: { stageId, ...info, leads: e.leads, value: e.value } };
    })
    .sort((a, b) => a.order - b.order)
    .map((e) => e.summary);
};

export interface UserSummary {
  user: string;
  leads: number;
  value: number;
}

/** Leads and value per sales manager, biggest value first. */
export const summariseByUser = (rows: CrmSalesStageStatusReportRow[]): UserSummary[] => {
  const byUser = new Map<string, UserSummary>();
  for (const row of rows) {
    const entry = byUser.get(row.user) ?? { user: row.user, leads: 0, value: 0 };
    entry.leads += row.noofLeads;
    entry.value += row.value;
    byUser.set(row.user, entry);
  }
  return [...byUser.values()].sort((a, b) => b.value - a.value || b.leads - a.leads);
};
