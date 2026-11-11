// ==================== CRM Dashboard (API-backed) ====================
// Financial-year selection and the chart data the dashboard builds from the lead list of the year. Common/DashboardResult
// supplies the headline counts; it has no stage, owner or month breakdown, and Common/PieChartResult is not implemented
// on the server, so those charts are computed here from Lead/List.

import type { CrmFinancialYear, CrmLeadListItem } from "./api/dto";
import { ALL_STAGES, listStageLabel, stageChartColor } from "./leads";

// ---- Financial year ----

/** The value kept in the filters store for a year, e.g. "2026-2027". */
export const fyValue = (fy: CrmFinancialYear): string => `${fy.fromDate.slice(0, 4)}-${fy.toDate.slice(0, 4)}`;

/** The year stored in the filters, or the first one the API lists (the newest) when it is unknown. */
export const findFinancialYear = (years: CrmFinancialYear[], value: string): CrmFinancialYear | undefined =>
  years.find((y) => fyValue(y) === value) ?? years[0];

// ---- Headline numbers ----

export const winRate = (won: number, lost: number): number => (won + lost > 0 ? Math.round((won / (won + lost)) * 100) : 0);

export const sumValue = (leads: CrmLeadListItem[]): number => leads.reduce((sum, lead) => sum + lead.value, 0);

// ---- Charts ----

export interface StageTotal {
  stage: string;
  count: number;
  value: number;
  color: string;
}

/** Leads grouped by stage label, in pipeline order; stages with no lead are left out. */
export const leadsByStage = (leads: CrmLeadListItem[]): StageTotal[] => {
  const totals = new Map<string, { count: number; value: number }>();
  for (const lead of leads) {
    const stage = listStageLabel(lead.stage);
    const total = totals.get(stage) ?? { count: 0, value: 0 };
    total.count += 1;
    total.value += lead.value;
    totals.set(stage, total);
  }
  const order = (stage: string) => {
    const index = ALL_STAGES.findIndex((s) => s.label === stage);
    return index === -1 ? ALL_STAGES.length : index;
  };
  return [...totals.entries()]
    .map(([stage, total]) => ({ stage, ...total, color: stageChartColor(stage) }))
    .sort((a, b) => order(a.stage) - order(b.stage));
};

export const MONTH_LABELS = ["Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec", "Jan", "Feb", "Mar"] as const;

export interface MonthTotal {
  label: string;
  leads: number;
  value: number;
}

/** Leads and pipeline value per month of the financial year (April to March), by lead date. */
export const monthlyTotals = (leads: CrmLeadListItem[]): MonthTotal[] => {
  const months: MonthTotal[] = MONTH_LABELS.map((label) => ({ label, leads: 0, value: 0 }));
  for (const lead of leads) {
    const month = Number(lead.leadDate.slice(5, 7)); // 1-12
    const index = (month + 8) % 12; // April is 0, March is 11
    months[index].leads += 1;
    months[index].value += lead.value;
  }
  return months;
};

export interface OwnerTotal {
  assignTo: string;
  leads: number;
  value: number;
}

/** The owners with the biggest pipeline value (ties: most leads first). */
export const topOwners = (leads: CrmLeadListItem[], limit = 5): OwnerTotal[] => {
  const totals = new Map<string, OwnerTotal>();
  for (const lead of leads) {
    const assignTo = lead.assignTo || "Unassigned";
    const total = totals.get(assignTo) ?? { assignTo, leads: 0, value: 0 };
    total.leads += 1;
    total.value += lead.value;
    totals.set(assignTo, total);
  }
  return [...totals.values()].sort((a, b) => b.value - a.value || b.leads - a.leads).slice(0, limit);
};

// ---- Pipeline analytics (the user reports screen) ----

/** Empty string means "all". `month` is a MONTH_LABELS entry. */
export interface PipelineFilters {
  region: string;
  state: string;
  assignTo: string;
  stage: string;
  month: string;
}

export const NO_PIPELINE_FILTERS: PipelineFilters = { region: "", state: "", assignTo: "", stage: "", month: "" };

export const pipelineFiltersActive = (filters: PipelineFilters): boolean => Object.values(filters).some(Boolean);

export const filterPipeline = (leads: CrmLeadListItem[], filters: PipelineFilters): CrmLeadListItem[] =>
  leads.filter(
    (lead) =>
      (!filters.region || lead.companyRegion === filters.region) &&
      (!filters.state || lead.customerState === filters.state) &&
      (!filters.assignTo || lead.assignTo === filters.assignTo) &&
      (!filters.stage || listStageLabel(lead.stage) === filters.stage) &&
      (!filters.month || MONTH_LABELS[(Number(lead.leadDate.slice(5, 7)) + 8) % 12] === filters.month)
  );

export interface GroupTotal {
  name: string;
  count: number;
  value: number;
  /** Share of the value of all the leads, in percent with one decimal. */
  pct: number;
}

export const NOT_SET_LABEL = "Not set";

/** The groups (by the picked field) with the biggest value; leads without the field go to "Not set". */
export const groupTotals = (
  leads: CrmLeadListItem[],
  pick: (lead: CrmLeadListItem) => string | undefined,
  limit = 6
): GroupTotal[] => {
  const groups = new Map<string, { count: number; value: number }>();
  for (const lead of leads) {
    const name = pick(lead) || NOT_SET_LABEL;
    const group = groups.get(name) ?? { count: 0, value: 0 };
    group.count += 1;
    group.value += lead.value;
    groups.set(name, group);
  }
  const total = sumValue(leads);
  return [...groups.entries()]
    .map(([name, g]) => ({ name, ...g, pct: total > 0 ? Math.round((g.value / total) * 1000) / 10 : 0 }))
    .sort((a, b) => b.value - a.value || b.count - a.count)
    .slice(0, limit);
};

// ---- Notifications ----

/** First line is the headline; the rest is the body. */
export const splitNotification = (text: string): { headline: string; body: string } => {
  const [headline = "", ...rest] = text.split("\n").map((line) => line.trim()).filter(Boolean);
  return { headline, body: rest.join(" ") };
};
