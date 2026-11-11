import { describe, expect, it } from "vitest";
import type { CrmFinancialYear, CrmLeadListItem } from "./api/dto";
import {
  filterPipeline,
  findFinancialYear,
  fyValue,
  groupTotals,
  leadsByStage,
  monthlyTotals,
  NO_PIPELINE_FILTERS,
  pipelineFiltersActive,
  splitNotification,
  sumValue,
  topOwners,
  winRate,
} from "./dashboard";

const lead = (overrides: Partial<CrmLeadListItem>): CrmLeadListItem => ({
  id: 1,
  title: "Plant room, Pune",
  vertical: 0,
  value: 1000,
  customer: "Apollo Water Engineering",
  stage: "Cold Lead",
  leadDate: "2026-07-22T00:00:00",
  assignTo: "adnan",
  ...overrides,
});

const years: CrmFinancialYear[] = [
  { title: "FY 26-27", fromDate: "2026-04-01T00:00:00", toDate: "2027-03-31T23:59:59" },
  { title: "FY 25-26", fromDate: "2025-04-01T00:00:00", toDate: "2026-03-31T23:59:59" },
];

describe("financial year", () => {
  it("keeps the store value in the start-end form", () => {
    expect(fyValue(years[0])).toBe("2026-2027");
  });

  it("finds the stored year, and falls back to the newest when it is unknown", () => {
    expect(findFinancialYear(years, "2025-2026")?.title).toBe("FY 25-26");
    expect(findFinancialYear(years, "2019-2020")?.title).toBe("FY 26-27");
    expect(findFinancialYear([], "2025-2026")).toBeUndefined();
  });
});

describe("headline numbers", () => {
  it("rates wins against closed orders, and is 0 when nothing closed", () => {
    expect(winRate(1, 3)).toBe(25);
    expect(winRate(0, 0)).toBe(0);
  });

  it("sums lead values", () => {
    expect(sumValue([lead({ value: 250 }), lead({ value: 750 })])).toBe(1000);
  });
});

describe("leadsByStage", () => {
  it("groups by stage in pipeline order, with no-stage leads last", () => {
    const totals = leadsByStage([
      lead({ stage: "Hot Lead", value: 100 }),
      lead({ stage: "0", value: 5 }),
      lead({ stage: "Cold Lead", value: 10 }),
      lead({ stage: "Hot Lead", value: 200 }),
    ]);
    expect(totals.map((t) => [t.stage, t.count, t.value])).toEqual([
      ["Cold Lead", 1, 10],
      ["Hot Lead", 2, 300],
      ["No stage", 1, 5],
    ]);
  });

  it("gives every stage a colour, grey for the unknown ones", () => {
    const [known, none] = leadsByStage([lead({ stage: "Hot Lead" }), lead({ stage: "0" })]);
    expect(known.color).toBe("#f59e0b");
    expect(none.color).toBe("#9ca3af");
  });
});

describe("monthlyTotals", () => {
  it("runs April to March: April is first, March is last", () => {
    const months = monthlyTotals([
      lead({ leadDate: "2026-04-01T00:00:00", value: 10 }),
      lead({ leadDate: "2027-03-31T00:00:00", value: 20 }),
      lead({ leadDate: "2026-12-05T00:00:00", value: 30 }),
      lead({ leadDate: "2026-12-20T00:00:00", value: 40 }),
    ]);
    expect(months).toHaveLength(12);
    expect(months[0]).toEqual({ label: "Apr", leads: 1, value: 10 });
    expect(months[8]).toEqual({ label: "Dec", leads: 2, value: 70 });
    expect(months[11]).toEqual({ label: "Mar", leads: 1, value: 20 });
  });
});

describe("topOwners", () => {
  it("ranks by pipeline value, then lead count, and keeps the top five", () => {
    const leads = [
      lead({ assignTo: "rani", value: 500 }),
      lead({ assignTo: "adnan", value: 100 }),
      lead({ assignTo: "adnan", value: 100 }),
      lead({ assignTo: undefined, value: 900 }),
      ...["a", "b", "c", "d"].map((name) => lead({ assignTo: name, value: 1 })),
    ];
    const owners = topOwners(leads);
    expect(owners).toHaveLength(5);
    expect(owners.map((o) => o.assignTo).slice(0, 3)).toEqual(["Unassigned", "rani", "adnan"]);
    expect(owners[2]).toEqual({ assignTo: "adnan", leads: 2, value: 200 });
  });
});

describe("splitNotification", () => {
  it("uses the first line as headline and joins the rest", () => {
    expect(splitNotification("Lead - 6666 updated. \nTitle : A ---> B \n\nStage : Cold ---> Warm")).toEqual({
      headline: "Lead - 6666 updated.",
      body: "Title : A ---> B Stage : Cold ---> Warm",
    });
  });

  it("copes with an empty message", () => {
    expect(splitNotification("")).toEqual({ headline: "", body: "" });
  });
});

describe("pipeline analytics", () => {
  const leads = [
    lead({ id: 1, stage: "Hot Lead", value: 600, companyRegion: "South", customerState: "Tamil Nadu", leadDate: "2026-04-10T00:00:00" }),
    lead({ id: 2, stage: "Tender", value: 300, companyRegion: "North", customerState: "Delhi", assignTo: "rani", leadDate: "2026-01-05T00:00:00" }),
    lead({ id: 3, stage: "0", value: 100, leadDate: "2026-04-20T00:00:00" }),
  ];

  it("keeps every lead when no filter is set", () => {
    expect(pipelineFiltersActive(NO_PIPELINE_FILTERS)).toBe(false);
    expect(filterPipeline(leads, NO_PIPELINE_FILTERS)).toHaveLength(3);
  });

  it("combines the filters; month is a financial-year month label and stage the label as listed", () => {
    expect(filterPipeline(leads, { ...NO_PIPELINE_FILTERS, month: "Apr" }).map((l) => l.id)).toEqual([1, 3]);
    expect(filterPipeline(leads, { ...NO_PIPELINE_FILTERS, month: "Jan" }).map((l) => l.id)).toEqual([2]);
    expect(filterPipeline(leads, { ...NO_PIPELINE_FILTERS, stage: "No stage" }).map((l) => l.id)).toEqual([3]);
    expect(filterPipeline(leads, { ...NO_PIPELINE_FILTERS, region: "South", assignTo: "adnan" }).map((l) => l.id)).toEqual([1]);
    expect(filterPipeline(leads, { ...NO_PIPELINE_FILTERS, state: "Delhi", region: "South" })).toEqual([]);
    expect(pipelineFiltersActive({ ...NO_PIPELINE_FILTERS, state: "Delhi" })).toBe(true);
  });

  it("groups by a field with the share of the total value, biggest first, with a Not set group", () => {
    const groups = groupTotals(leads, (l) => l.companyRegion);
    expect(groups).toEqual([
      { name: "South", count: 1, value: 600, pct: 60 },
      { name: "North", count: 1, value: 300, pct: 30 },
      { name: "Not set", count: 1, value: 100, pct: 10 },
    ]);
    expect(groupTotals(leads, (l) => l.companyRegion, 1)).toHaveLength(1);
  });

  it("reports 0 percent when there is no value at all", () => {
    expect(groupTotals([lead({ value: 0 })], (l) => l.customerState)[0].pct).toBe(0);
  });
});
