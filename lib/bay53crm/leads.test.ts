import { describe, expect, it } from "vitest";
import type { CrmLeadListItem } from "./api/dto";
import { distinct, filterLeads, listStageLabel, stageLabel, toLeadCreateModel, toLeadSearchParams } from "./leads";
import type { CRMLeadsFilters } from "./types";

const lead = (overrides: Partial<CrmLeadListItem>): CrmLeadListItem => ({
  id: 1,
  title: "Lead",
  vertical: 0,
  value: 1000,
  customer: "ACME",
  stage: "Cold Lead",
  leadDate: "2026-11-01T00:00:00",
  ...overrides,
});

const noFilters: CRMLeadsFilters = {
  fromDate: "",
  toDate: "",
  stages: [],
  regions: [],
  customerStates: [],
  assignedTos: [],
  valueMin: "",
  valueMax: "",
};

describe("stage labels", () => {
  it("maps ids and falls back for unknown ones", () => {
    expect(stageLabel(6)).toBe("Hot Lead");
    expect(stageLabel(13)).toBe("Tender");
    expect(stageLabel(0)).toBe("No stage");
    expect(stageLabel(12)).toBe("Stage 12");
  });

  it("shows the API's '0' list label as no stage", () => {
    expect(listStageLabel("0")).toBe("No stage");
    expect(listStageLabel("Tender")).toBe("Tender");
  });
});

describe("toLeadSearchParams", () => {
  it("covers the whole last day and excludes archived leads", () => {
    expect(toLeadSearchParams({ fromDate: "2026-04-01", toDate: "2027-03-31" })).toEqual({
      fromDate: "2026-04-01T00:00:00",
      toDate: "2027-03-31T23:59:59",
      isArchive: false,
    });
  });

  it("leaves open ends undefined", () => {
    const params = toLeadSearchParams({ fromDate: "", toDate: "" });
    expect(params.fromDate).toBeUndefined();
    expect(params.toDate).toBeUndefined();
  });
});

describe("filterLeads", () => {
  const leads = [
    lead({ id: 1, stage: "Hot Lead", companyRegion: "LIV-BNG | Bangalore", customerState: "Karnataka", assignTo: "zainab", value: 500 }),
    lead({ id: 2, stage: "Tender", companyRegion: "LIV-MUM | Mumbai", customerState: "Gujarat", assignTo: "adnan", value: 5000 }),
    lead({ id: 3, stage: "0", value: 100 }),
  ];
  const ids = (filters: Partial<CRMLeadsFilters>) => filterLeads(leads, { ...noFilters, ...filters }).map((l) => l.id);

  it("returns everything without filters", () => expect(ids({})).toEqual([1, 2, 3]));
  it("filters by stage label, including 'No stage'", () => {
    expect(ids({ stages: ["Hot Lead", "Tender"] })).toEqual([1, 2]);
    expect(ids({ stages: ["No stage"] })).toEqual([3]);
  });
  it("filters by region, state and assignee", () => {
    expect(ids({ regions: ["LIV-MUM | Mumbai"] })).toEqual([2]);
    expect(ids({ customerStates: ["Karnataka"] })).toEqual([1]);
    expect(ids({ assignedTos: ["adnan"] })).toEqual([2]);
  });
  it("filters by value range", () => {
    expect(ids({ valueMin: "400" })).toEqual([1, 2]);
    expect(ids({ valueMax: "600" })).toEqual([1, 3]);
    expect(ids({ valueMin: "400", valueMax: "600" })).toEqual([1]);
  });
});

describe("distinct", () => {
  it("drops empties and duplicates, sorted", () => {
    expect(distinct(["b", undefined, "a", "b", ""])).toEqual(["a", "b"]);
  });
});

describe("toLeadCreateModel", () => {
  it("builds a new, active lead for the chosen contact", () => {
    const model = toLeadCreateModel({
      title: "T",
      contact: { id: 5562, companyName: "PIERO", companyRef: 19 },
      assignTo: "zainab",
      stageId: 4,
      value: 10,
      date: "2026-11-05",
      customerState: "",
      companyRegion: "LIV-BNG | Bangalore",
    });
    expect(model).toMatchObject({
      id: 0,
      title: "T",
      stage: 4,
      status: 1,
      value: 10,
      contactId: 5562,
      customer: "PIERO",
      customerRef: 19,
      assignTo: "zainab",
      receivedBy: "zainab",
      owner: "zainab",
      leadDate: "2026-11-05T00:00:00",
      companyRegion: "LIV-BNG | Bangalore",
      valueCurrency: "INR",
    });
    expect(model.customerState).toBeUndefined();
  });
});
