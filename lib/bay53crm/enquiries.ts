// Enquiries and their quotations, as the CRM exposes them.
//
// Common/EnquiryList gives every enquiry's number and nothing else (no customer, no date), and Common/QuatationList
// only answers for one enquiry at a time. The lead details report is the one place that ties an enquiry to a customer,
// a lead and its quotations, so the browsable list joins the two.

import type { CrmEnquiryRef, CrmLeadDetailsReportRow } from "./api/dto";
import { reportStage } from "./reports";

export interface EnquiryRow {
  id: number;
  enquiryNo: string;
  /** The leads raised against the enquiry: none when it is not linked to a lead. */
  leads: CrmLeadDetailsReportRow[];
}

/** A quotation's total with its own currency: ₹ for INR, the code in front of anything else. */
export const quoteAmount = (value: number, currency: string): string =>
  `${currency === "INR" ? "₹" : `${currency} `}${new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(value)}`;

/** The quotation references the lead report gives for a lead: one text, several joined by commas, semicolons or lines. */
export const quoteRefs = (quots?: string | null): string[] =>
  [...new Set((quots ?? "").split(/[,;\n]+/).map((ref) => ref.trim()).filter(Boolean))];

/** Every enquiry with the leads linked to it, newest (highest number) first. Linked enquiries missing from the list are added. */
export function buildEnquiryRows(enquiries: CrmEnquiryRef[], reportRows: CrmLeadDetailsReportRow[]): EnquiryRow[] {
  const leadsByEnquiry = new Map<number, CrmLeadDetailsReportRow[]>();
  for (const row of reportRows) {
    if (!row.enquiryId) continue;
    const leads = leadsByEnquiry.get(row.enquiryId);
    if (leads) leads.push(row);
    else leadsByEnquiry.set(row.enquiryId, [row]);
  }

  const rows: EnquiryRow[] = [];
  const seen = new Set<number>();
  for (const enquiry of enquiries) {
    const id = Number(enquiry.id);
    if (!Number.isFinite(id) || seen.has(id)) continue;
    seen.add(id);
    rows.push({ id, enquiryNo: enquiry.enquiryNo, leads: leadsByEnquiry.get(id) ?? [] });
  }
  for (const [id, leads] of leadsByEnquiry) {
    if (!seen.has(id)) rows.push({ id, enquiryNo: `Enquiry ${id}`, leads });
  }
  return rows.sort((a, b) => b.id - a.id);
}

export type LinkFilter = "all" | "linked" | "unlinked";

export interface EnquiryFilters {
  search: string;
  link: LinkFilter;
  assignedTo: string;
  stage: string;
}

export const NO_ENQUIRY_FILTERS: EnquiryFilters = { search: "", link: "all", assignedTo: "", stage: "" };

export const enquiryFiltersActive = (filters: EnquiryFilters): boolean =>
  !!filters.search.trim() || filters.link !== "all" || !!filters.assignedTo || !!filters.stage;

/** Rows matching the search text (number, customer, lead title or quotation reference) and the chosen filters. */
export function filterEnquiryRows(rows: EnquiryRow[], filters: EnquiryFilters): EnquiryRow[] {
  const term = filters.search.trim().toLowerCase();
  // A lead filter (assignee, stage) can only match enquiries that have a lead.
  const needsLead = !!filters.assignedTo || !!filters.stage;
  return rows.filter((row) => {
    if (filters.link === "linked" && row.leads.length === 0) return false;
    if (filters.link === "unlinked" && row.leads.length > 0) return false;
    if (needsLead) {
      const match = row.leads.some(
        (lead) =>
          (!filters.assignedTo || lead.assignedTo === filters.assignedTo) &&
          (!filters.stage || reportStage(lead.stage) === filters.stage)
      );
      if (!match) return false;
    }
    if (!term) return true;
    return (
      row.enquiryNo.toLowerCase().includes(term) ||
      row.leads.some((lead) =>
        [lead.customer, lead.particulars, lead.quots].some((text) => (text ?? "").toLowerCase().includes(term))
      )
    );
  });
}

export interface EnquirySummary {
  total: number;
  linked: number;
  unlinked: number;
  /** Enquiries with at least one quotation reference on a linked lead. */
  quoted: number;
}

export function summariseEnquiries(rows: EnquiryRow[]): EnquirySummary {
  let linked = 0;
  let quoted = 0;
  for (const row of rows) {
    if (row.leads.length === 0) continue;
    linked++;
    if (row.leads.some((lead) => quoteRefs(lead.quots).length > 0)) quoted++;
  }
  return { total: rows.length, linked, unlinked: rows.length - linked, quoted };
}

/** The quotation references across an enquiry's leads, once each. */
export const enquiryQuoteRefs = (row: EnquiryRow): string[] => [...new Set(row.leads.flatMap((lead) => quoteRefs(lead.quots)))];

/** Distinct values for a filter list, sorted. */
export const distinctSorted = (values: (string | undefined)[]): string[] =>
  [...new Set(values.filter((v): v is string => !!v))].sort((a, b) => a.localeCompare(b));
