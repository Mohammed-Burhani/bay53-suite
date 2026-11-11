import { describe, expect, it } from "vitest";
import type { CrmContact } from "./api/dto";
import {
  contactProblems,
  EMPTY_CONTACT,
  filterCompanies,
  filterContacts,
  filterCustomers,
  toContactInput,
  toContactModel,
} from "./contacts";

const contact = (overrides: Partial<CrmContact> = {}): CrmContact => ({
  id: 1,
  companyName: "MEM ENGINEERING PRIVATE LIMITED | |",
  firstName: "Mr. GS RAO,",
  phone1: "",
  phone2: "",
  mobile1: "9900057855",
  email: "srao@memiotsolutions.com",
  companyRef: 15952,
  ...overrides,
});

describe("contact request", () => {
  it("turns blank fields into null and the company id into a number", () => {
    const model = toContactModel({ ...toContactInput(contact()), phone1: "  ", companyId: "15952" });
    expect(model).toEqual({
      id: 0,
      companyName: "MEM ENGINEERING PRIVATE LIMITED | |",
      firstName: "Mr. GS RAO,",
      phone1: null,
      phone2: null,
      mobile1: "9900057855",
      email: "srao@memiotsolutions.com",
      companyRef: 15952,
    });
  });

  it("keeps the id when updating and sends no company when none is chosen", () => {
    expect(toContactModel(EMPTY_CONTACT, 7)).toMatchObject({ id: 7, companyRef: null, companyName: null });
  });

  it("reads a contact with missing fields into an editable form", () => {
    const input = toContactInput(contact({ phone1: undefined, email: undefined, companyRef: 0 }));
    expect(input).toMatchObject({ phone1: "", email: "", companyId: "" });
  });
});

describe("contact checks", () => {
  it("asks for a name and a company and rejects a bad email", () => {
    expect(contactProblems(EMPTY_CONTACT)).toEqual(["Enter the contact's name", "Choose the company"]);
    expect(contactProblems({ ...toContactInput(contact()), email: "not-an-email" })).toEqual(["The email address is not valid"]);
    expect(contactProblems({ ...toContactInput(contact()), email: "" })).toEqual([]);
    expect(contactProblems(toContactInput(contact()))).toEqual([]);
  });
});

describe("searching", () => {
  const contacts = [
    contact({ id: 1 }),
    contact({ id: 2, firstName: "Mrs. Rani", companyName: "APOLLO WATER", mobile1: "9000000001", email: undefined }),
    contact({ id: 3, companyName: undefined as unknown as string, firstName: "No company" }),
  ];

  it("matches name, company, phone and email ignoring case, and keeps everything for an empty search", () => {
    expect(filterContacts(contacts, "").length).toBe(3);
    expect(filterContacts(contacts, " apollo ").map((c) => c.id)).toEqual([2]);
    expect(filterContacts(contacts, "9000000001").map((c) => c.id)).toEqual([2]);
    expect(filterContacts(contacts, "MEMIOT").map((c) => c.id)).toEqual([1, 3]);
    expect(filterContacts(contacts, "zzz")).toEqual([]);
  });

  it("matches customers by company or state", () => {
    const customers = [
      { id: "1", companyName: "VIKRAM HARDWARE | |", companyState: "Karnataka" },
      { id: "2", companyName: "APOLLO WATER", companyState: undefined },
    ];
    expect(filterCustomers(customers, "karnataka").map((c) => c.id)).toEqual(["1"]);
    expect(filterCustomers(customers, "apollo").map((c) => c.id)).toEqual(["2"]);
    expect(filterCustomers(customers, "  ")).toHaveLength(2);
  });

  it("lists at most a few matching companies and none for an empty search", () => {
    const companies = Array.from({ length: 20 }, (_, i) => ({ id: String(i), companyName: `LEHRY ${i}` }));
    expect(filterCompanies(companies, "")).toEqual([]);
    expect(filterCompanies(companies, "lehry")).toHaveLength(8);
    expect(filterCompanies(companies, "lehry 1", 3).map((c) => c.id)).toEqual(["1", "10", "11"]);
  });
});
