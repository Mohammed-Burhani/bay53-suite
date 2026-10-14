// Pure helpers for the Ledger master form: GetById → form values → save payload,
// plus list filtering. Kept free of React so it is easy to test.

import type { Ledger } from "@/lib/types/reports.types";
import type { LedgerFormValues, LedgerSaveBody } from "@/lib/types/ledger.types";

type Raw = Record<string, unknown>;

export const EMPTY_LEDGER_FORM: LedgerFormValues = {
  name: "",
  group_ID: null,
  partyCode: "",
  partyType: 0,
  contact_Person: "",
  mobile: "",
  phone_1: "",
  phone_2: "",
  whatsappNo: "",
  email: "",
  website: "",
  fax: "",
  address: "",
  shipAddress: "",
  area: "",
  city: "",
  pinCode: "",
  gstNo: "",
  panNo: "",
  tinV: "",
  gstType: 0,
  state: 0,
  country: 0,
  opening_Date: "",
  opening_Bal: "",
  isCr: false,
  credit_Limit: "",
  creditDays: "",
  lock_Freeze: false,
  ledgerBankName: "",
  ledgerBankBranch: "",
  ledgerBankAccount: "",
  ledgerBankIFSC: "",
  transportBy: "",
  vendorCode: "",
};

// Every remaining LedgerCreateViewModel field the form does not expose, so a new ledger is
// created with explicit defaults rather than whatever the server infers for a missing key.
// `0` for an id / enum means "not set".
const LEDGER_CREATE_DEFAULTS: Raw = {
  customerCheckOnContactNo: false,
  tinC: "",
  vat_cst: false,
  account_No: "",
  account_Bal: 0,
  closingBal: 0,
  ecc_no: "",
  commisionarate_no: "",
  range: "",
  division: "",
  isProject: false,
  project_Parent: 0,
  isChildCompany: false,
  openingDetails: [],
  bankDetails: [],
  bankName: "",
  bankBranch: "",
  brankAccountNo: "",
  rateType: 0,
  schemePointValue: 0,
  isAccountHolder: false,
  useOnMultiPay: false,
  captionText: "",
  sqNo: 0,
  baseCurrency: 0,
  partyMainDetails: "",
  partyItemDetails: "",
  custPriceType: 0,
  gstCategory: 0,
  hasParant: false,
  parantLedgerID: 0,
  assignedUserID: 0,
  priceCategories: [],
  addresses: [],
  contactPersonNumber: "",
  oldSwRefId: 0,
  councilRegisterNumber: "",
  opening_Cur: 0,
  opening_Rate: 0,
  cap_PartyName: "",
  groupBy: "",
  msmeisledger: false,
  udyogaAadhaarNo: "",
  msmecategory: 0,
  msmesubcategory: 0,
};

// First defined value among differently-cased keys (the API is inconsistent).
function pick(raw: Raw, ...keys: string[]): unknown {
  for (const key of keys) {
    if (raw[key] !== undefined && raw[key] !== null) return raw[key];
  }
  return undefined;
}

// <input type="date"> value (yyyy-MM-dd) from an ISO string; the .NET default date means "unset".
function dateInput(v: unknown): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(str(v));
  return m && m[1] !== "0001" ? `${m[1]}-${m[2]}-${m[3]}` : "";
}

const str = (v: unknown) => (v === undefined || v === null ? "" : String(v));
const numStr = (v: unknown) => (v === undefined || v === null || v === "" ? "" : String(v));
// Formik turns <input type="number"> edits into numbers, so form values may be string or number.
const isBlank = (v: string | number) => String(v).trim() === "";
const num = (v: string | number) => (isBlank(v) ? 0 : Number(v));

export function getLedgerId(raw: Raw): number {
  return Number(pick(raw, "id", "ledger_ID", "ledger_id", "ledgerId") ?? 0);
}

export function rawToFormValues(raw: Raw): LedgerFormValues {
  const group = pick(raw, "group_ID", "group_id", "groupId");
  return {
    name: str(raw.name),
    group_ID: group === undefined ? null : Number(group),
    partyCode: str(raw.partyCode),
    partyType: Number(raw.partyType ?? 0),
    contact_Person: str(raw.contact_Person),
    mobile: str(raw.mobile),
    phone_1: str(raw.phone_1),
    phone_2: str(raw.phone_2),
    whatsappNo: str(raw.whatsappNo),
    email: str(raw.email),
    website: str(raw.website),
    fax: str(raw.fax),
    address: str(raw.address),
    shipAddress: str(raw.shipAddress),
    area: str(raw.area),
    city: str(raw.city),
    pinCode: str(raw.pinCode),
    gstNo: str(raw.gstNo),
    panNo: str(raw.panNo),
    tinV: str(raw.tinV),
    gstType: Number(raw.gstType ?? 0),
    state: Number(raw.state ?? 0) || 0,
    country: Number(raw.country ?? 0) || 0,
    opening_Date: dateInput(raw.opening_Date),
    opening_Bal: numStr(raw.opening_Bal),
    isCr: raw.isCr === true,
    credit_Limit: numStr(raw.credit_Limit),
    creditDays: numStr(raw.creditDays),
    lock_Freeze: raw.lock_Freeze === true,
    ledgerBankName: str(raw.ledgerBankName),
    ledgerBankBranch: str(raw.ledgerBankBranch),
    ledgerBankAccount: str(raw.ledgerBankAccount),
    ledgerBankIFSC: str(raw.ledgerBankIFSC),
    transportBy: str(raw.transportBy),
    vendorCode: str(raw.vendorCode),
  };
}

// A "Save as" copy starts from an existing record but must not inherit its id or
// the child rows that are keyed to it.
export function toCopyBase(raw: Raw): Raw {
  return {
    ...raw,
    id: 0,
    ledger_ID: 0,
    ledger_id: 0,
    openingDetails: [],
    bankDetails: [],
    addresses: [],
    priceCategories: [],
  };
}

// Builds the Create/Update body. `raw` is the record from GetById when editing
// (or the copy base); it is spread first so fields the form does not expose
// (state/country ids, GST type, opening details, …) are written back unchanged.
export function buildLedgerPayload(values: LedgerFormValues, raw: Raw | null): LedgerSaveBody {
  const now = new Date().toISOString();
  const base: Raw = raw ?? LEDGER_CREATE_DEFAULTS;
  return {
    ...base,
    id: raw ? getLedgerId(raw) : 0,
    name: values.name.trim(),
    group_ID: values.group_ID ?? 0,
    partyCode: values.partyCode.trim(),
    partyType: values.partyType,
    contact_Person: values.contact_Person.trim(),
    mobile: values.mobile.trim(),
    phone_1: values.phone_1.trim(),
    phone_2: values.phone_2.trim(),
    whatsappNo: values.whatsappNo.trim(),
    email: values.email.trim(),
    website: values.website.trim(),
    fax: values.fax.trim(),
    address: values.address.trim(),
    shipAddress: values.shipAddress.trim(),
    area: values.area.trim(),
    city: values.city.trim(),
    pinCode: values.pinCode.trim(),
    gstNo: values.gstNo.trim().toUpperCase(),
    panNo: values.panNo.trim().toUpperCase(),
    tinV: values.tinV.trim(),
    gstType: values.gstType,
    state: values.state,
    country: values.country,
    // Unedited dates are written back exactly as received; edited ones as a zone-less local date.
    ...(values.opening_Date && values.opening_Date !== dateInput(base.opening_Date)
      ? { opening_Date: `${values.opening_Date}T00:00:00` }
      : base.opening_Date
        ? {}
        : { opening_Date: now }),
    opening_Bal: num(values.opening_Bal),
    isCr: values.isCr,
    credit_Limit: num(values.credit_Limit),
    creditDays: Math.trunc(num(values.creditDays)),
    lock_Freeze: values.lock_Freeze,
    ledgerBankName: values.ledgerBankName.trim(),
    ledgerBankBranch: values.ledgerBankBranch.trim(),
    ledgerBankAccount: values.ledgerBankAccount.trim(),
    ledgerBankIFSC: values.ledgerBankIFSC.trim().toUpperCase(),
    transportBy: values.transportBy.trim(),
    vendorCode: values.vendorCode.trim(),
    created_Date: str(base.created_Date) || now,
    modified_Date: now,
  };
}

export interface LedgerFilters {
  name: string;
  area: string;
  city: string;
  partyType: string; // "" = all, otherwise the numeric partyType as a string
  status: "" | "active" | "locked";
}

export const EMPTY_LEDGER_FILTERS: LedgerFilters = { name: "", area: "", city: "", partyType: "", status: "" };

// The listing columns the old screen shows but /Ledger/Search does not document;
// each is read from whichever casing the API happens to use.
const ROW_KEYS = {
  area: ["area", "Area"],
  city: ["city", "City"],
  pinCode: ["pinCode", "pincode", "pin_Code", "PinCode"],
  partyCode: ["partyCode", "party_Code", "PartyCode"],
  shipAddress: ["shipAddress", "shippingAddress", "ship_Address", "ShippingAddress"],
  phone_1: ["phone_1", "phone1", "Phone1"],
  phone_2: ["phone_2", "phone2", "Phone2"],
  fax: ["fax", "Fax"],
  mobile: ["mobile", "Mobile"],
  email: ["email", "Email"],
  contact_Person: ["contact_Person", "contactPerson", "ContactPerson"],
  credit_Limit: ["credit_Limit", "creditLimit", "CreditLimit"],
  hsnNo: ["hsnNo", "hsn_No", "hsn", "HsnNo"],
  hsnDescription: ["hsnDescription", "hsn_Description", "HsnDescription"],
  taxPercent: ["taxPercent", "tax_Percent", "taxPer", "tax", "Tax"],
} as const;

export function rowValue(row: Ledger, field: keyof typeof ROW_KEYS): string | number | null {
  const rec = row as unknown as Raw;
  for (const key of ROW_KEYS[field]) {
    const v = rec[key];
    if (v !== undefined && v !== null && v !== "") return v as string | number;
  }
  return null;
}

export function filterLedgers(ledgers: Ledger[], f: LedgerFilters): Ledger[] {
  const contains = (value: unknown, query: string) => String(value ?? "").toLowerCase().includes(query);
  const name = f.name.trim().toLowerCase();
  const area = f.area.trim().toLowerCase();
  const city = f.city.trim().toLowerCase();
  return ledgers.filter((l) => {
    if (f.partyType !== "" && String(l.partyType) !== f.partyType) return false;
    if (f.status === "locked" && !l.lock_Freeze) return false;
    if (f.status === "active" && l.lock_Freeze) return false;
    if (name && !contains(l.name, name)) return false;
    if (area && !contains(rowValue(l, "area"), area)) return false;
    if (city && !contains(rowValue(l, "city"), city)) return false;
    return true;
  });
}
