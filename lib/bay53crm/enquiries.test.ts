import { describe, expect, it } from "vitest";
import type { CrmEnquiryRef, CrmLeadDetailsReportRow } from "./api/dto";
import {
  buildEnquiryRows,
  distinctSorted,
  enquiryFiltersActive,
  enquiryQuoteRefs,
  filterEnquiryRows,
  NO_ENQUIRY_FILTERS,
  quoteAmount,
  quoteRefs,
  summariseEnquiries,
} from "./enquiries";

const enquiry = (id: number, no = `ENQ/${id}`): CrmEnquiryRef => ({ id: String(id), enquiryNo: no, enquiryDate: "0001-01-01T00:00:00" });

const lead = (overrides: Partial<CrmLeadDetailsReportRow>): CrmLeadDetailsReportRow =>
  ({
    particulars: "Lead",
    customer: "APOLLO WATER",
    stage: "HotLead",
    value: 100,
    assignedTo: "rani",
    quots: "",
    enquiryId: undefined,
    ...overrides,
  }) as CrmLeadDetailsReportRow;

describe("quotation amounts", () => {
  it("writes rupees with the symbol and Indian grouping, and other currencies with their code", () => {
    expect(quoteAmount(434232, "INR")).toBe("₹4,34,232");
    expect(quoteAmount(1500, "USD")).toBe("USD 1,500");
  });
});

describe("quotation references", () => {
  it("splits the report text by comma, semicolon or line, once each", () => {
    expect(quoteRefs("Q/1, Q/2;Q/1\n Q/3 ")).toEqual(["Q/1", "Q/2", "Q/3"]);
    expect(quoteRefs("")).toEqual([]);
    expect(quoteRefs(undefined)).toEqual([]);
  });
});

describe("enquiry rows", () => {
  const enquiries = [enquiry(88160), enquiry(97064), enquiry(50000), enquiry(97064, "DUPLICATE")];
  const report = [
    lead({ enquiryId: 97064, particulars: "A", quots: "Q/97064" }),
    lead({ enquiryId: 97064, particulars: "B", assignedTo: "romel" }),
    lead({ enquiryId: 12345, particulars: "Orphan" }),
    lead({ enquiryId: undefined, particulars: "No enquiry" }),
  ];
  const rows = buildEnquiryRows(enquiries, report);

  it("lists the highest enquiry number first, each enquiry once, with the leads linked to it", () => {
    expect(rows.map((r) => r.id)).toEqual([97064, 88160, 50000, 12345]);
    expect(rows.find((r) => r.id === 97064)?.leads.map((l) => l.particulars)).toEqual(["A", "B"]);
    expect(rows.find((r) => r.id === 50000)?.leads).toEqual([]);
  });

  it("keeps a linked enquiry that is missing from the enquiry list", () => {
    expect(rows.find((r) => r.id === 12345)).toMatchObject({ enquiryNo: "Enquiry 12345" });
  });

  it("counts linked, unlinked and quoted enquiries", () => {
    expect(summariseEnquiries(rows)).toEqual({ total: 4, linked: 2, unlinked: 2, quoted: 1 });
    expect(enquiryQuoteRefs(rows.find((r) => r.id === 97064)!)).toEqual(["Q/97064"]);
  });
});

describe("filtering", () => {
  const rows = buildEnquiryRows(
    [enquiry(1, "LIV-CHE/IN-ENQ/1"), enquiry(2), enquiry(3)],
    [
      lead({ enquiryId: 1, customer: "JEEVABHOY & SONS", particulars: "Pumps", quots: "LIV-CHE/Quote/1", assignedTo: "rani", stage: "ColdLead" }),
      lead({ enquiryId: 2, customer: "APOLLO WATER", assignedTo: "romel", stage: "HotLead" }),
    ]
  );
  const ids = (filters: Partial<typeof NO_ENQUIRY_FILTERS>) =>
    filterEnquiryRows(rows, { ...NO_ENQUIRY_FILTERS, ...filters }).map((r) => r.id);

  it("keeps everything without filters, highest number first", () => {
    expect(ids({})).toEqual([3, 2, 1]);
    expect(enquiryFiltersActive(NO_ENQUIRY_FILTERS)).toBe(false);
  });

  it("searches the enquiry number, customer, lead title and quotation reference", () => {
    expect(ids({ search: "in-enq/1" })).toEqual([1]);
    expect(ids({ search: "apollo" })).toEqual([2]);
    expect(ids({ search: "pumps" })).toEqual([1]);
    expect(ids({ search: "quote/1" })).toEqual([1]);
    expect(ids({ search: "zzz" })).toEqual([]);
  });

  it("filters by link status, and by assignee or stage only among linked enquiries", () => {
    expect(ids({ link: "linked" })).toEqual([2, 1]);
    expect(ids({ link: "unlinked" })).toEqual([3]);
    expect(ids({ assignedTo: "romel" })).toEqual([2]);
    expect(ids({ stage: "Cold Lead" })).toEqual([1]);
    expect(ids({ assignedTo: "rani", stage: "Hot Lead" })).toEqual([]);
    expect(enquiryFiltersActive({ ...NO_ENQUIRY_FILTERS, stage: "Hot Lead" })).toBe(true);
  });

  it("lists distinct filter values sorted", () => {
    expect(distinctSorted(["b", undefined, "a", "b", ""])).toEqual(["a", "b"]);
  });
});
