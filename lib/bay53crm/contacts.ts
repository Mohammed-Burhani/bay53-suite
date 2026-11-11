// Contacts of the CRM: the people at the customers a lead is raised for.

import type { CrmCompanyRef, CrmContact, CrmCustomerRef } from "./api/dto";
import type { CrmSchemas } from "./api/types";

export interface ContactInput {
  firstName: string;
  /** Contact/CompanyList id of the company the person works for; "" while none is chosen. */
  companyId: string;
  companyName: string;
  phone1: string;
  phone2: string;
  mobile1: string;
  email: string;
}

export const EMPTY_CONTACT: ContactInput = {
  firstName: "",
  companyId: "",
  companyName: "",
  phone1: "",
  phone2: "",
  mobile1: "",
  email: "",
};

export const toContactInput = (contact: CrmContact): ContactInput => ({
  firstName: contact.firstName ?? "",
  companyId: contact.companyRef ? String(contact.companyRef) : "",
  companyName: contact.companyName ?? "",
  phone1: contact.phone1 ?? "",
  phone2: contact.phone2 ?? "",
  mobile1: contact.mobile1 ?? "",
  email: contact.email ?? "",
});

const blankToNull = (value: string) => value.trim() || null;

/** The request for Contact/Add (id 0) and Contact/Update. Only the fields the API gives back are sent. */
export const toContactModel = (input: ContactInput, id = 0): CrmSchemas["ContactCreateViewModel"] => ({
  id,
  companyName: blankToNull(input.companyName),
  firstName: input.firstName.trim(),
  phone1: blankToNull(input.phone1),
  phone2: blankToNull(input.phone2),
  mobile1: blankToNull(input.mobile1),
  email: blankToNull(input.email),
  companyRef: input.companyId ? Number(input.companyId) : null,
});

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** What is wrong with a contact before it is sent; an empty list means it can be saved. */
export function contactProblems(input: ContactInput): string[] {
  const problems: string[] = [];
  if (!input.firstName.trim()) problems.push("Enter the contact's name");
  if (!input.companyId) problems.push("Choose the company");
  if (input.email.trim() && !EMAIL.test(input.email.trim())) problems.push("The email address is not valid");
  return problems;
}

/** Contacts whose name, company, phone numbers or email contain the text (ignoring case). */
export function filterContacts(contacts: CrmContact[], search: string): CrmContact[] {
  const term = search.trim().toLowerCase();
  if (!term) return contacts;
  return contacts.filter((c) =>
    [c.firstName, c.companyName, c.mobile1, c.phone1, c.phone2, c.email].some((v) => (v ?? "").toLowerCase().includes(term))
  );
}

/** Customers whose company name or state contains the text (ignoring case). */
export function filterCustomers(customers: CrmCustomerRef[], search: string): CrmCustomerRef[] {
  const term = search.trim().toLowerCase();
  if (!term) return customers;
  return customers.filter((c) => c.companyName.toLowerCase().includes(term) || (c.companyState ?? "").toLowerCase().includes(term));
}

/** Companies whose name contains the text, at most `limit` of them. */
export function filterCompanies(companies: CrmCompanyRef[], search: string, limit = 8): CrmCompanyRef[] {
  const term = search.trim().toLowerCase();
  if (!term) return [];
  const matches: CrmCompanyRef[] = [];
  for (const company of companies) {
    if (company.companyName.toLowerCase().includes(term)) {
      matches.push(company);
      if (matches.length === limit) break;
    }
  }
  return matches;
}
