// ==================== CRM Projects (API-backed) ====================
// The screens call them projects; the CRM API calls them campaigns. Status ids, make-list ids and the request builder
// for the projects screens, on top of lib/bay53crm/api.

import type { CrmCampaignListItem } from "./api/dto";
import type { CrmSchemas } from "./api/types";
import type { CRMProjectsFilters } from "./types";

// ---- Statuses ----
// Campaign/List sends currentStatus as a number and there is no lookup endpoint. The names below were matched against
// Report/CampaignDetailsReportList, which sends the status as text. "Closed" shows up in that report but no project in the
// list carried its id (2 or 6), so it is not offered.

export const PROJECT_STATUSES = [
  { id: 1, label: "Active" },
  { id: 3, label: "Awarded" },
  { id: 4, label: "Partially Awarded" },
  { id: 5, label: "Not Awarded" },
  { id: 7, label: "Under Finalization" },
] as const;

export const DEFAULT_NEW_PROJECT_STATUS_ID = 5; // Not Awarded: the most common status

export const projectStatusLabel = (statusId: number): string =>
  PROJECT_STATUSES.find((s) => s.id === statusId)?.label ?? `Status ${statusId}`;

/** Badge colours by status id, in the same classes the lead stage badges use. */
export const projectStatusColors = (statusId: number): string => {
  switch (statusId) {
    case 3:
      return "border-green-500 text-green-600";
    case 4:
      return "border-teal-500 text-teal-600";
    case 7:
      return "border-amber-500 text-amber-600";
    case 1:
      return "border-blue-500 text-blue-600";
    default:
      return "border-gray-400 text-gray-500";
  }
};

// ---- Make list ----
// availabilityStatus is set on only a few projects (1 and 2). The names are the ones the old mock screens used.

export const MAKE_LIST_OPTIONS = [
  { id: 1, label: "Available" },
  { id: 2, label: "Not Available" },
] as const;

export const NOT_SET = "Not set";

export const makeListLabel = (availabilityStatus?: number | null): string =>
  MAKE_LIST_OPTIONS.find((o) => o.id === availabilityStatus)?.label ?? NOT_SET;

// ---- Approval segments ----
// campaignType is a master value of type 4: "Approved - PHE", "Approved - FPS", "Not Approved", ...

export const APPROVAL_MASTER_VALUE_TYPE = 4;

// ---- Filters ----

/** Only archived goes to the server; the other filters are applied to the returned rows. */
export const toProjectSearchParams = (filters: Pick<CRMProjectsFilters, "archived">): CrmSchemas["CampaignSearchParams"] => ({
  isArchive: filters.archived,
});

export const filterProjects = (projects: CrmCampaignListItem[], filters: CRMProjectsFilters): CrmCampaignListItem[] => {
  const search = filters.search.trim().toLowerCase();
  return projects.filter((p) => {
    if (search && !p.name.toLowerCase().includes(search) && !(p.description ?? "").toLowerCase().includes(search)) return false;
    if (filters.assignedTo && p.assignedTo !== filters.assignedTo) return false;
    if (filters.status && p.currentStatus !== Number(filters.status)) return false;
    return true;
  });
};

// ---- Create and edit ----

export interface ProjectInput {
  name: string;
  /** The API keeps the consultant name in the description. */
  consultant: string;
  campaignTypeId: number;
  statusId: number;
  /** MAKE_LIST_OPTIONS id, or 0 for not set. */
  makeListId: number;
  assignedTo: string;
  contractorDetails: string;
  note: string;
  /** yyyy-mm-dd, or empty. */
  startDate: string;
  /** yyyy-mm-dd, or empty. */
  endDate: string;
}

const isoStart = (date: string) => (date ? `${date}T00:00:00` : null);

/**
 * The consultants worth suggesting. Campaign/ConsultantNameList returns every description ever typed, including
 * placeholders ("-") and multi-line notes, so only short single-line names are kept, once each.
 */
export const consultantSuggestions = (names: string[] | undefined, maxLength = 60): string[] => {
  const seen = new Set<string>();
  for (const raw of names ?? []) {
    const name = raw.trim();
    if (name.length < 2 || name.length > maxLength || /[\r\n]/.test(name)) continue;
    seen.add(name);
  }
  return [...seen].sort((a, b) => a.localeCompare(b));
};

/** yyyy-mm-dd part of an API date-time, for date inputs. */
export const toDateInput = (value?: string | null): string => (value ? value.slice(0, 10) : "");

export const toCampaignModel = (input: ProjectInput, id = 0): CrmSchemas["CampaignCreateViewModel"] => ({
  id,
  name: input.name,
  description: input.consultant || null,
  campaignTypeId: input.campaignTypeId,
  startdate: isoStart(input.startDate),
  enddate: isoStart(input.endDate),
  assignedTo: input.assignedTo || null,
  currentStatus: input.statusId,
  contractorDetails: input.contractorDetails || null,
  note: input.note || null,
  availabilityStatus: input.makeListId || null,
});
