import { describe, expect, it } from "vitest";
import type { CrmCampaignListItem } from "./api/dto";
import {
  consultantSuggestions,
  filterProjects,
  makeListLabel,
  projectStatusLabel,
  toCampaignModel,
  toDateInput,
  toProjectSearchParams,
  type ProjectInput,
} from "./projects";
import type { CRMProjectsFilters } from "./types";

const project = (overrides: Partial<CrmCampaignListItem>): CrmCampaignListItem => ({
  id: 1,
  name: "Metro depot, Pune",
  description: "Kausi consultants",
  campaignType: { id: 8, text: "Not Approved", type: 4, isPublished: true },
  currentStatus: 5,
  assignedTo: "mustansir",
  ...overrides,
});

const noFilters: CRMProjectsFilters = { assignedTo: "", status: "", archived: false, search: "" };

describe("filterProjects", () => {
  const rows = [
    project({ id: 1 }),
    project({ id: 2, name: "Airport terminal", description: "Rallys Engineering", currentStatus: 3, assignedTo: "rani" }),
  ];

  it("keeps everything when no filter is set", () => {
    expect(filterProjects(rows, noFilters)).toHaveLength(2);
  });

  it("searches the name and the consultant, ignoring case", () => {
    expect(filterProjects(rows, { ...noFilters, search: "PUNE" }).map((p) => p.id)).toEqual([1]);
    expect(filterProjects(rows, { ...noFilters, search: "rallys" }).map((p) => p.id)).toEqual([2]);
  });

  it("filters by assignee and by status id", () => {
    expect(filterProjects(rows, { ...noFilters, assignedTo: "rani" }).map((p) => p.id)).toEqual([2]);
    expect(filterProjects(rows, { ...noFilters, status: "3" }).map((p) => p.id)).toEqual([2]);
  });

  it("copes with a project that has no consultant", () => {
    expect(filterProjects([project({ description: undefined })], { ...noFilters, search: "x" })).toEqual([]);
  });
});

describe("labels", () => {
  it("names the known statuses and falls back for the rest", () => {
    expect(projectStatusLabel(3)).toBe("Awarded");
    expect(projectStatusLabel(2)).toBe("Status 2");
  });

  it("names the make list and shows a project without one as not set", () => {
    expect(makeListLabel(2)).toBe("Not Available");
    expect(makeListLabel(undefined)).toBe("Not set");
  });
});

describe("request builders", () => {
  const input: ProjectInput = {
    name: "Metro depot, Pune",
    consultant: "Kausi consultants",
    campaignTypeId: 4,
    statusId: 3,
    makeListId: 1,
    assignedTo: "mustansir",
    contractorDetails: "L&T: HVAC",
    note: "Site visit done",
    startDate: "2026-04-01",
    endDate: "",
  };

  it("sends the search params for the archived switch", () => {
    expect(toProjectSearchParams({ archived: true })).toEqual({ isArchive: true });
  });

  it("builds a campaign: the consultant goes in the description, empty dates and make list become null", () => {
    expect(toCampaignModel({ ...input, makeListId: 0 }, 961)).toEqual({
      id: 961,
      name: "Metro depot, Pune",
      description: "Kausi consultants",
      campaignTypeId: 4,
      startdate: "2026-04-01T00:00:00",
      enddate: null,
      assignedTo: "mustansir",
      currentStatus: 3,
      contractorDetails: "L&T: HVAC",
      note: "Site visit done",
      availabilityStatus: null,
    });
  });

  it("creates with id 0", () => {
    expect(toCampaignModel(input).id).toBe(0);
  });

  it("cuts an API date-time to a date input value", () => {
    expect(toDateInput("2024-06-10T00:00:00")).toBe("2024-06-10");
    expect(toDateInput(undefined)).toBe("");
  });
});

describe("consultantSuggestions", () => {
  it("keeps short single-line names once, sorted, and drops placeholders and notes", () => {
    const names = [
      "-",
      "  Kausi consultants ",
      "Hyderabad consulting Engineers",
      "Kausi consultants",
      "Location: Karnataka\nConsultant: Kausi consultants\n",
      "x".repeat(80),
      "",
    ];
    expect(consultantSuggestions(names)).toEqual(["Hyderabad consulting Engineers", "Kausi consultants"]);
    expect(consultantSuggestions(undefined)).toEqual([]);
  });
});
