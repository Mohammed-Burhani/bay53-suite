import { describe, expect, it } from "vitest";
import type { CrmCampaignDetailsReportRow, CrmSalesStageStatusReportRow } from "./api/dto";
import {
  consultantOf,
  contactNameOf,
  EMPTY_LEAD_ACTIVITY_CRITERIA,
  EMPTY_LEAD_DETAILS_CRITERIA,
  EMPTY_PROJECT_REPORT_CRITERIA,
  EMPTY_SALES_STAGE_CRITERIA,
  filterLeadDetailRows,
  filterProjectReportRows,
  reportStage,
  reportStatusColors,
  reportText,
  summariseByStage,
  summariseByUser,
  toLeadActivityParams,
  toLeadDetailsParams,
  toProjectReportParams,
  toSalesStageParams,
} from "./reports";

describe("request builders", () => {
  it("leave out every empty criterion", () => {
    const empty = { fromDate: undefined, toDate: undefined };
    expect(toLeadDetailsParams(EMPTY_LEAD_DETAILS_CRITERIA)).toEqual({
      ...empty,
      customer: undefined,
      fromValue: undefined,
      toValue: undefined,
      companyRegion: undefined,
      customerState: undefined,
      stage: undefined,
      assignedTo: undefined,
    });
    expect(toLeadActivityParams(EMPTY_LEAD_ACTIVITY_CRITERIA)).toEqual({ ...empty, assignedTo: undefined });
    expect(toProjectReportParams(EMPTY_PROJECT_REPORT_CRITERIA)).toEqual({
      ...empty,
      status: undefined,
      campaignType: undefined,
      consultantName: undefined,
    });
    expect(toSalesStageParams(EMPTY_SALES_STAGE_CRITERIA)).toEqual({
      ...empty,
      salesManager: undefined,
      companyRegion: undefined,
    });
  });

  it("turns lead detail criteria into numbers, ids and whole-day dates", () => {
    const params = toLeadDetailsParams({
      ...EMPTY_LEAD_DETAILS_CRITERIA,
      fromDate: "2026-04-01",
      toDate: "2026-04-30",
      customer: "  Metro  ",
      worthMin: "100000",
      worthMax: "abc",
      stageIds: ["6", "13"],
      regions: ["South"],
      assignedTos: ["rani"],
    });
    expect(params.fromDate).toBe("2026-04-01T00:00:00");
    expect(params.toDate).toBe("2026-04-30T23:59:59");
    expect(params).not.toHaveProperty("customer", "Metro");
    expect(params.fromValue).toBe(100000);
    expect(params.toValue).toBeUndefined();
    expect(params.stage).toEqual([6, 13]);
    expect(params.companyRegion).toEqual(["South"]);
    expect(params.assignedTo).toEqual(["rani"]);
  });

  it("sends the project criteria as ids and the sales managers as the user names", () => {
    expect(
      toProjectReportParams({ ...EMPTY_PROJECT_REPORT_CRITERIA, statusIds: ["3", "5"], campaignTypeId: "8", consultant: "Kausi" })
    ).toMatchObject({ status: [3, 5], campaignType: 8, consultantName: "Kausi" });
    expect(toSalesStageParams({ ...EMPTY_SALES_STAGE_CRITERIA, assignedTos: ["rani"], regions: ["North"] })).toMatchObject({
      salesManager: ["rani"],
      companyRegion: ["North"],
    });
  });
});

const projectRow = (overrides: Partial<CrmCampaignDetailsReportRow>): CrmCampaignDetailsReportRow => ({
  campaignName: "Theme park",
  campaignType: "Not Approved",
  status: "NotAwarded",
  assignTo: "rani",
  total: 1,
  open: 1,
  won: 0,
  lost: 0,
  ...overrides,
});

describe("project report rows", () => {
  it("filters by assignee on the client and keeps all rows when none is chosen", () => {
    const rows = [projectRow({ assignTo: "rani" }), projectRow({ assignTo: "romel" }), projectRow({ assignTo: undefined })];
    expect(filterProjectReportRows(rows, [])).toHaveLength(3);
    expect(filterProjectReportRows(rows, ["romel"]).map((r) => r.assignTo)).toEqual(["romel"]);
  });

  it("spaces camel-case report text, treats 0 as not set and colours known and unknown statuses", () => {
    expect(reportText("PartiallyAwarded")).toBe("Partially Awarded");
    expect(reportText("Awarded")).toBe("Awarded");
    expect(reportText("InActive")).toBe("Inactive");
    expect(reportText("0")).toBe("");
    expect(reportText(undefined)).toBe("");
    expect(reportStatusColors("Awarded")).not.toBe(reportStatusColors("Closed"));
  });

  it("writes lead stages as the lead screens do", () => {
    expect(reportStage("ColdLead")).toBe("Cold Lead");
    expect(reportStage("TenderWon")).toBe("Tender Won");
    expect(reportStage("InProgress")).toBe("In Progress");
    expect(reportStage("0")).toBe("No stage");
  });

  it("reads the consultant from the description", () => {
    expect(consultantOf("Consultant Name : Taamaesek Engineering.\n\nMake List NA")).toBe("Taamaesek Engineering.");
    expect(consultantOf("PEMS")).toBe("PEMS");
    expect(consultantOf(undefined)).toBe("");
  });
});

describe("lead detail rows", () => {
  const row = (customer: string) => ({ customer }) as Parameters<typeof filterLeadDetailRows>[0][number];

  it("matches the customer by part of the name, ignoring case", () => {
    const rows = [row("JEEVABHOY & SONS | Chennai|600001"), row("Apollo Water Engineering")];
    expect(filterLeadDetailRows(rows, "  jeeva ")).toHaveLength(1);
    expect(filterLeadDetailRows(rows, "chennai")).toHaveLength(1);
    expect(filterLeadDetailRows(rows, "")).toHaveLength(2);
    expect(filterLeadDetailRows(rows, "zzz")).toHaveLength(0);
  });
});

describe("activity rows", () => {
  it("takes the contact name from the first line", () => {
    expect(contactNameOf("Mr-Prasad Reddy B  \n (Mobile 1) - 9502005599 \n (Email) - a@b.com")).toBe("Mr-Prasad Reddy B");
    expect(contactNameOf(undefined)).toBe("");
  });
});

const stageRow = (overrides: Partial<CrmSalesStageStatusReportRow>): CrmSalesStageStatusReportRow => ({
  status: 1,
  stage: 6,
  user: "rani",
  noofLeads: 2,
  value: 100,
  avgTimeSpent: 10,
  ...overrides,
});

describe("sales stage summaries", () => {
  it("adds up rows of one stage and follows the pipeline order", () => {
    const summary = summariseByStage([
      stageRow({ stage: 13, noofLeads: 1, value: 50 }),
      stageRow({ stage: 6, noofLeads: 3, value: 300 }),
      stageRow({ stage: 6, noofLeads: 1, value: 100, user: "romel" }),
    ]);
    expect(summary.map((s) => s.label)).toEqual(["Hot Lead", "Tender"]);
    expect(summary[0]).toMatchObject({ leads: 4, value: 400 });
  });

  it("lists unknown stages after the known ones", () => {
    const summary = summariseByStage([stageRow({ stage: 99 }), stageRow({ stage: 0 }), stageRow({ stage: 12 }), stageRow({ stage: 4 })]);
    expect(summary.map((s) => s.label)).toEqual(["Cold Lead", "Lost", "No stage", "Stage 99"]);
  });

  it("ranks managers by value", () => {
    const users = summariseByUser([
      stageRow({ user: "rani", value: 100 }),
      stageRow({ user: "romel", value: 500 }),
      stageRow({ user: "rani", value: 100, noofLeads: 3 }),
    ]);
    expect(users).toEqual([
      { user: "romel", leads: 2, value: 500 },
      { user: "rani", leads: 5, value: 200 },
    ]);
  });
});
