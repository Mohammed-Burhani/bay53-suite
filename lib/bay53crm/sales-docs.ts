// ==================== Enquiries & Quotations (demo data) ====================

export type EnquiryStatus = "New" | "In Progress" | "Quoted" | "Converted" | "Closed";
export type EnquiryPriority = "High" | "Medium" | "Low";

export interface EnquiryRequirement {
  item: string;
  discipline: string;
  qty: number;
  unit: string;
}

export interface SalesActivity {
  date: string;
  by: string;
  note: string;
}

export interface CRMEnquiry {
  id: string;
  enquiryNo: string;
  date: string;
  customerName: string;
  contactPerson: string;
  designation: string;
  phone: string;
  email: string;
  customerState: string;
  regionId: string;
  subject: string;
  vertical: string;
  source: string;
  priority: EnquiryPriority;
  status: EnquiryStatus;
  assignedTo: string;
  estimatedValue: number;
  responseDue: string;
  projectLocation: string;
  consultant: string;
  disciplines: string[];
  requirements: EnquiryRequirement[];
  details: string;
  attachments: string[];
  activities: SalesActivity[];
  quotationNo?: string;
}

export type QuotationStatus = "Draft" | "Sent" | "Under Negotiation" | "Accepted" | "Rejected" | "Expired";

export interface QuotationLineItem {
  id: string;
  description: string;
  hsn: string;
  qty: number;
  unit: string;
  rate: number;
  discount: number; // percent
}

export interface QuotationRevision {
  rev: number;
  date: string;
  by: string;
  note: string;
}

export interface CRMQuotation {
  id: string;
  quotationNo: string;
  revision: number;
  date: string;
  validUntil: string;
  enquiryNo?: string;
  customerName: string;
  contactPerson: string;
  email: string;
  phone: string;
  gstin: string;
  billingAddress: string;
  customerState: string;
  regionId: string;
  title: string;
  preparedBy: string;
  status: QuotationStatus;
  items: QuotationLineItem[];
  additionalDiscount: number; // percent on subtotal after line discounts
  freight: number;
  gstRate: number;
  paymentTerms: string;
  deliveryPeriod: string;
  warranty: string;
  notes: string;
  revisions: QuotationRevision[];
}

// ==================== Constants ====================

export const ENQUIRY_STATUSES: EnquiryStatus[] = ["New", "In Progress", "Quoted", "Converted", "Closed"];
export const ENQUIRY_PRIORITIES: EnquiryPriority[] = ["High", "Medium", "Low"];
export const QUOTATION_STATUSES: QuotationStatus[] = ["Draft", "Sent", "Under Negotiation", "Accepted", "Rejected", "Expired"];
export const UNITS = ["Nos", "Set", "Lot", "Rmt", "Sqft", "Sqm", "Kg", "TR", "Job"];

export const ENQUIRY_STATUS_COLORS: Record<EnquiryStatus, { bg: string; text: string }> = {
  "New": { bg: "bg-blue-100", text: "text-blue-700" },
  "In Progress": { bg: "bg-amber-100", text: "text-amber-700" },
  "Quoted": { bg: "bg-purple-100", text: "text-purple-700" },
  "Converted": { bg: "bg-green-100", text: "text-green-700" },
  "Closed": { bg: "bg-gray-100", text: "text-gray-600" },
};

export const PRIORITY_COLORS: Record<EnquiryPriority, { bg: string; text: string }> = {
  "High": { bg: "bg-red-100", text: "text-red-700" },
  "Medium": { bg: "bg-amber-100", text: "text-amber-700" },
  "Low": { bg: "bg-slate-100", text: "text-slate-600" },
};

export const QUOTATION_STATUS_COLORS: Record<QuotationStatus, { bg: string; text: string }> = {
  "Draft": { bg: "bg-gray-100", text: "text-gray-600" },
  "Sent": { bg: "bg-blue-100", text: "text-blue-700" },
  "Under Negotiation": { bg: "bg-amber-100", text: "text-amber-700" },
  "Accepted": { bg: "bg-green-100", text: "text-green-700" },
  "Rejected": { bg: "bg-red-100", text: "text-red-700" },
  "Expired": { bg: "bg-orange-100", text: "text-orange-700" },
};

export const SELLER = {
  name: "Bay53 Industrial Solutions",
  address: "No. 53, 2nd Floor, Outer Ring Road, Marathahalli, Bengaluru – 560037",
  state: "Karnataka",
  gstin: "29AAKCB5353L1Z9",
  phone: "+91 80 4153 5353",
  email: "sales@bay53.in",
};

export const DEFAULT_TERMS = {
  paymentTerms: "30% advance with PO, 60% against delivery, 10% after testing & commissioning",
  deliveryPeriod: "6–8 weeks from date of PO and advance",
  warranty: "12 months from commissioning or 18 months from supply, whichever is earlier",
};

// ==================== Helpers ====================

export function lineAmount(item: QuotationLineItem): number {
  return item.qty * item.rate * (1 - item.discount / 100);
}

export function calcQuotationTotals(q: Pick<CRMQuotation, "items" | "additionalDiscount" | "freight" | "gstRate" | "customerState">) {
  const gross = q.items.reduce((sum, i) => sum + i.qty * i.rate, 0);
  const subtotal = q.items.reduce((sum, i) => sum + lineAmount(i), 0);
  const lineDiscount = gross - subtotal;
  const extraDiscount = subtotal * (q.additionalDiscount / 100);
  const taxable = subtotal - extraDiscount + q.freight;
  const tax = taxable * (q.gstRate / 100);
  const interState = !!q.customerState && q.customerState !== SELLER.state;
  const grandTotal = Math.round(taxable + tax);
  return { gross, subtotal, lineDiscount, extraDiscount, taxable, tax, interState, grandTotal };
}

export function daysUntil(dateStr: string, from: Date = new Date()): number {
  const target = new Date(dateStr + "T00:00:00");
  const today = new Date(from.getFullYear(), from.getMonth(), from.getDate());
  return Math.round((target.getTime() - today.getTime()) / 86400000);
}

export function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr + "T00:00:00");
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

export function nextDocNo(prefix: "ENQ" | "QT", existing: string[]): string {
  const max = existing.reduce((m, no) => Math.max(m, Number(no.split("/").pop()) || 0), 0);
  return `${prefix}/26-27/${String(max + 1).padStart(3, "0")}`;
}

let itemSeq = 0;
export function newLineItem(partial: Partial<QuotationLineItem> = {}): QuotationLineItem {
  itemSeq++;
  return { description: "", hsn: "", qty: 1, unit: "Nos", rate: 0, discount: 0, ...partial, id: `li_${itemSeq}` };
}

const li = (description: string, hsn: string, qty: number, unit: string, rate: number, discount = 0) =>
  newLineItem({ description, hsn, qty, unit, rate, discount });

// ==================== Seed: Enquiries ====================

export const SEED_ENQUIRIES: CRMEnquiry[] = [
  {
    id: "enq_1", enquiryNo: "ENQ/26-27/001", date: "2026-07-02",
    customerName: "Prestige Estates Projects", contactPerson: "Karthik Rao", designation: "Project Manager – MEP",
    phone: "+91 98450 21733", email: "karthik.rao@prestigeconstructions.com", customerState: "Karnataka", regionId: "LIV-BNG",
    subject: "Lakeside Habitat Clubhouse – VRF HVAC Package", vertical: "Residential", source: "Consultant",
    priority: "Medium", status: "Converted", assignedTo: "Rahul Sharma", estimatedValue: 6400000,
    responseDue: "2026-07-07", projectLocation: "Varthur, Bengaluru", consultant: "Spectral MEP Consultants",
    disciplines: ["HVAC"],
    requirements: [
      { item: "VRF Outdoor Unit 20HP", discipline: "HVAC", qty: 3, unit: "Nos" },
      { item: "VRF Indoor Cassette 2.0TR", discipline: "HVAC", qty: 18, unit: "Nos" },
      { item: "GI Ducting 24G", discipline: "HVAC", qty: 1800, unit: "Sqft" },
    ],
    details: "Clubhouse G+2 with banquet, gym and indoor pool deck. Client prefers Daikin / Mitsubishi VRF. Heat-pump models required for the pool deck.",
    attachments: ["Clubhouse_HVAC_Layout_R2.pdf", "BOQ_HVAC_Clubhouse.xlsx"],
    activities: [
      { date: "2026-07-02", by: "Rahul Sharma", note: "Enquiry received via Spectral MEP with drawings & BOQ." },
      { date: "2026-07-04", by: "Rahul Sharma", note: "Site visit done, heat load verified with consultant." },
      { date: "2026-07-06", by: "Rahul Sharma", note: "Quotation QT/26-27/001 submitted." },
      { date: "2026-08-12", by: "Rahul Sharma", note: "PO received — handed over to execution." },
    ],
    quotationNo: "QT/26-27/001",
  },
  {
    id: "enq_2", enquiryNo: "ENQ/26-27/002", date: "2026-07-08",
    customerName: "Apollo Hospitals Enterprise", contactPerson: "Dr. Meena Sundaram", designation: "Head – Facilities",
    phone: "+91 94440 18256", email: "meena.s@apollohospitals.com", customerState: "Tamil Nadu", regionId: "LIV-CHN",
    subject: "OT Block – Fire Fighting & Sprinkler System", vertical: "Healthcare", source: "Existing Customer",
    priority: "High", status: "Converted", assignedTo: "Deepa Nair", estimatedValue: 4200000,
    responseDue: "2026-07-12", projectLocation: "Greams Road, Chennai", consultant: "—",
    disciplines: ["Fire Fighting", "Plumbing"],
    requirements: [
      { item: "Sprinkler Pendent 68°C (K-80)", discipline: "Fire Fighting", qty: 420, unit: "Nos" },
      { item: "MS ERW Pipe Heavy Class", discipline: "Fire Fighting", qty: 1250, unit: "Rmt" },
      { item: "Fire Pump Set 2280 LPM", discipline: "Fire Fighting", qty: 1, unit: "Set" },
    ],
    details: "New 6-theatre OT block. NBC 2016 compliance and hospital NOC timeline — needs completion before 15 Oct.",
    attachments: ["OT_Block_FireLayout.dwg", "Fire_NOC_Checklist.pdf"],
    activities: [
      { date: "2026-07-08", by: "Deepa Nair", note: "Enquiry from facilities team, repeat customer." },
      { date: "2026-07-14", by: "Deepa Nair", note: "Quotation QT/26-27/003 sent." },
      { date: "2026-07-30", by: "Deepa Nair", note: "Order confirmed after 3% negotiation." },
    ],
    quotationNo: "QT/26-27/003",
  },
  {
    id: "enq_3", enquiryNo: "ENQ/26-27/003", date: "2026-07-15",
    customerName: "Infosys Ltd", contactPerson: "Suresh Kulkarni", designation: "Sr. Manager – Infrastructure",
    phone: "+91 99005 44120", email: "suresh_kulkarni@infosys.com", customerState: "Karnataka", regionId: "LIV-BNG",
    subject: "Mysuru Campus – BMS Upgrade (Phase 1)", vertical: "Commercial", source: "Tender Portal",
    priority: "High", status: "Quoted", assignedTo: "Amit Kumar", estimatedValue: 11500000,
    responseDue: "2026-07-24", projectLocation: "Hebbal Industrial Area, Mysuru", consultant: "Infosys In-house",
    disciplines: ["BMS", "ELV"],
    requirements: [
      { item: "DDC Controller (BACnet IP)", discipline: "BMS", qty: 64, unit: "Nos" },
      { item: "BMS Head-end Software & Graphics", discipline: "BMS", qty: 1, unit: "Lot" },
      { item: "Energy Meter Integration", discipline: "BMS", qty: 220, unit: "Nos" },
    ],
    details: "Replace legacy Honeywell EBI with open-protocol BMS across 8 buildings. Phase 1 covers SDB 1–4. Technical bid + commercial bid via e-procurement portal.",
    attachments: ["RFP_BMS_Mysuru.pdf", "Point_Schedule.xlsx", "Tech_Compliance.docx"],
    activities: [
      { date: "2026-07-15", by: "Amit Kumar", note: "RFP downloaded from Infosys supplier portal." },
      { date: "2026-07-19", by: "Amit Kumar", note: "Pre-bid meeting attended, 14 queries raised." },
      { date: "2026-07-25", by: "Amit Kumar", note: "Techno-commercial bid submitted." },
      { date: "2026-09-10", by: "Amit Kumar", note: "Shortlisted — negotiation round scheduled 30 Sep." },
    ],
    quotationNo: "QT/26-27/004",
  },
  {
    id: "enq_4", enquiryNo: "ENQ/26-27/004", date: "2026-07-22",
    customerName: "Lodha Developers", contactPerson: "Nikhil Deshmukh", designation: "Purchase Head",
    phone: "+91 98200 67731", email: "nikhil.d@lodhagroup.com", customerState: "Maharashtra", regionId: "LIV-MUM",
    subject: "World Towers Wing C – Plumbing & Drainage Package", vertical: "Residential", source: "Reference",
    priority: "Medium", status: "Quoted", assignedTo: "Vikram Singh", estimatedValue: 8800000,
    responseDue: "2026-07-31", projectLocation: "Lower Parel, Mumbai", consultant: "Mahimtura Consultants",
    disciplines: ["Plumbing"],
    requirements: [
      { item: "CPVC Pipe SDR 11 (15–50mm)", discipline: "Plumbing", qty: 9600, unit: "Rmt" },
      { item: "uPVC SWR Pipe 110mm", discipline: "Plumbing", qty: 4200, unit: "Rmt" },
      { item: "Hydro-pneumatic System", discipline: "Plumbing", qty: 2, unit: "Set" },
    ],
    details: "Wing C, floors 20–58. Material make list: Astral / Supreme / Grundfos. Labour-inclusive rates required.",
    attachments: ["WingC_Plumbing_Schematic.pdf"],
    activities: [
      { date: "2026-07-22", by: "Vikram Singh", note: "Referred by Mahimtura; BOQ received." },
      { date: "2026-07-29", by: "Vikram Singh", note: "Quotation QT/26-27/005 emailed." },
    ],
    quotationNo: "QT/26-27/005",
  },
  {
    id: "enq_5", enquiryNo: "ENQ/26-27/005", date: "2026-08-01",
    customerName: "IHCL – Taj Hotels", contactPerson: "Farhan Ali", designation: "Chief Engineer",
    phone: "+91 90000 31542", email: "farhan.ali@tajhotels.com", customerState: "Telangana", regionId: "LIV-HYD",
    subject: "Taj Falaknuma – Kitchen Exhaust & Fresh Air", vertical: "Hospitality", source: "Consultant",
    priority: "Medium", status: "Closed", assignedTo: "Sneha Reddy", estimatedValue: 2800000,
    responseDue: "2026-08-06", projectLocation: "Falaknuma, Hyderabad", consultant: "AECOM India",
    disciplines: ["HVAC"],
    requirements: [
      { item: "Kitchen Exhaust Hood with ESP", discipline: "HVAC", qty: 4, unit: "Nos" },
      { item: "Inline Fresh Air Fan 6000 CFM", discipline: "HVAC", qty: 4, unit: "Nos" },
    ],
    details: "Heritage property — no external ducting visible on façade. Night-shift work only.",
    attachments: ["Kitchen_Layout.pdf"],
    activities: [
      { date: "2026-08-01", by: "Sneha Reddy", note: "Enquiry via AECOM." },
      { date: "2026-08-07", by: "Sneha Reddy", note: "Quotation QT/26-27/006 submitted." },
      { date: "2026-08-28", by: "Sneha Reddy", note: "Lost to competitor on price (~9% lower)." },
    ],
    quotationNo: "QT/26-27/006",
  },
  {
    id: "enq_6", enquiryNo: "ENQ/26-27/006", date: "2026-08-06",
    customerName: "Nxtra Data Ltd", contactPerson: "Rohit Joshi", designation: "DC Projects Lead",
    phone: "+91 98224 90871", email: "rohit.joshi@nxtra.in", customerState: "Maharashtra", regionId: "LIV-PUN",
    subject: "Pune DC Hall 3 – Precision Cooling & CRAH", vertical: "Data Center", source: "Website",
    priority: "High", status: "Quoted", assignedTo: "Priya Patel", estimatedValue: 24000000,
    responseDue: "2026-08-16", projectLocation: "Hinjewadi Phase 2, Pune", consultant: "Jacobs Engineering",
    disciplines: ["HVAC", "BMS", "Electrical"],
    requirements: [
      { item: "Chilled Water CRAH 150kW", discipline: "HVAC", qty: 12, unit: "Nos" },
      { item: "In-row Cooler 40kW", discipline: "HVAC", qty: 16, unit: "Nos" },
      { item: "Leak Detection & DCIM Integration", discipline: "BMS", qty: 1, unit: "Lot" },
    ],
    details: "N+1 redundancy, Tier III. Vendor must have 2 similar DC references. FAT at OEM factory mandatory.",
    attachments: ["Hall3_Cooling_Spec.pdf", "Vendor_Qualification.xlsx"],
    activities: [
      { date: "2026-08-06", by: "Priya Patel", note: "Web enquiry, call scheduled with Jacobs." },
      { date: "2026-08-12", by: "Priya Patel", note: "Vendor qualification docs submitted." },
      { date: "2026-08-18", by: "Priya Patel", note: "Quotation QT/26-27/007 submitted." },
    ],
    quotationNo: "QT/26-27/007",
  },
  {
    id: "enq_7", enquiryNo: "ENQ/26-27/007", date: "2026-08-14",
    customerName: "Amity University", contactPerson: "Col. R. P. Tyagi (Retd.)", designation: "Director – Estates",
    phone: "+91 98110 42290", email: "rptyagi@amity.edu", customerState: "Uttar Pradesh", regionId: "LIV-DEL",
    subject: "Noida Hostel Block H – LT Panels & Distribution", vertical: "Education", source: "Cold Call",
    priority: "Low", status: "Quoted", assignedTo: "Vikram Singh", estimatedValue: 3600000,
    responseDue: "2026-08-25", projectLocation: "Sector 125, Noida", consultant: "—",
    disciplines: ["Electrical"],
    requirements: [
      { item: "LT Panel 1600A ACB Incomer", discipline: "Electrical", qty: 1, unit: "Nos" },
      { item: "Floor DB – 8 way TPN", discipline: "Electrical", qty: 14, unit: "Nos" },
      { item: "XLPE Cable 3.5C x 300 sqmm", discipline: "Electrical", qty: 380, unit: "Rmt" },
    ],
    details: "G+13 hostel. Budgetary quote first; final after drawings are frozen.",
    attachments: [],
    activities: [
      { date: "2026-08-14", by: "Vikram Singh", note: "Cold call converted to enquiry." },
      { date: "2026-09-12", by: "Vikram Singh", note: "Draft budgetary quote prepared (QT/26-27/009)." },
    ],
    quotationNo: "QT/26-27/009",
  },
  {
    id: "enq_8", enquiryNo: "ENQ/26-27/008", date: "2026-08-21",
    customerName: "Brigade Enterprises", contactPerson: "Anjali Menon", designation: "GM – Projects",
    phone: "+91 97450 11862", email: "anjali.menon@brigadegroup.com", customerState: "Kerala", regionId: "LIV-KOC",
    subject: "WTC Kochi Tower 3 – ELV, CCTV & Access Control", vertical: "Commercial", source: "Trade Show",
    priority: "Medium", status: "Quoted", assignedTo: "Deepa Nair", estimatedValue: 5200000,
    responseDue: "2026-08-30", projectLocation: "Infopark, Kochi", consultant: "Synergy Designs",
    disciplines: ["ELV"],
    requirements: [
      { item: "IP Dome Camera 4MP", discipline: "ELV", qty: 180, unit: "Nos" },
      { item: "NVR 64 Ch with 96TB", discipline: "ELV", qty: 3, unit: "Nos" },
      { item: "Access Control Door Controller", discipline: "ELV", qty: 42, unit: "Nos" },
    ],
    details: "Met at ACREX 2026. Integration with existing Brigade central command centre required.",
    attachments: ["Tower3_ELV_Layout.pdf"],
    activities: [
      { date: "2026-08-21", by: "Deepa Nair", note: "Lead from ACREX booth, enquiry formalised." },
      { date: "2026-09-04", by: "Deepa Nair", note: "Quotation QT/26-27/008 submitted." },
    ],
    quotationNo: "QT/26-27/008",
  },
  {
    id: "enq_9", enquiryNo: "ENQ/26-27/009", date: "2026-09-02",
    customerName: "ITC Ltd", contactPerson: "Sourav Banerjee", designation: "Engineering Manager",
    phone: "+91 98310 55412", email: "sourav.banerjee@itc.in", customerState: "West Bengal", regionId: "LIV-KOL",
    subject: "ITC Green Centre – HVAC Retrofit (AHU Replacement)", vertical: "Commercial", source: "Existing Customer",
    priority: "Medium", status: "In Progress", assignedTo: "Amit Kumar", estimatedValue: 7400000,
    responseDue: "2026-09-30", projectLocation: "Salt Lake Sector V, Kolkata", consultant: "—",
    disciplines: ["HVAC", "BMS"],
    requirements: [
      { item: "Double-skin AHU 12000 CFM with EC fans", discipline: "HVAC", qty: 8, unit: "Nos" },
      { item: "VFD Panel", discipline: "Electrical", qty: 8, unit: "Nos" },
    ],
    details: "Replace 15-year-old AHUs. Must maintain LEED Platinum — EC fans and MERV-14 filtration mandatory.",
    attachments: ["AHU_Schedule.xlsx"],
    activities: [
      { date: "2026-09-02", by: "Amit Kumar", note: "Enquiry received from ITC engineering." },
      { date: "2026-09-18", by: "Amit Kumar", note: "Joint site survey done, awaiting OEM pricing." },
    ],
  },
  {
    id: "enq_10", enquiryNo: "ENQ/26-27/010", date: "2026-09-09",
    customerName: "Manipal Health Enterprises", contactPerson: "Vinay Hegde", designation: "Project Engineer",
    phone: "+91 99860 23174", email: "vinay.hegde@manipalhospitals.com", customerState: "Karnataka", regionId: "LIV-BNG",
    subject: "Whitefield Hospital – Medical Gas Pipeline & Plumbing", vertical: "Healthcare", source: "Reference",
    priority: "High", status: "In Progress", assignedTo: "Rahul Sharma", estimatedValue: 5800000,
    responseDue: "2026-10-01", projectLocation: "Whitefield, Bengaluru", consultant: "HOK India",
    disciplines: ["Plumbing"],
    requirements: [
      { item: "MGPS Copper Pipe (Degreased)", discipline: "Plumbing", qty: 2600, unit: "Rmt" },
      { item: "Medical Gas Outlet (O2 / VAC / AIR)", discipline: "Plumbing", qty: 340, unit: "Nos" },
      { item: "Area Alarm Panel", discipline: "Plumbing", qty: 12, unit: "Nos" },
    ],
    details: "HTM 02-01 compliant. 220-bed expansion wing.",
    attachments: ["MGPS_Schematic.pdf", "Outlet_Schedule.xlsx"],
    activities: [
      { date: "2026-09-09", by: "Rahul Sharma", note: "Enquiry received, referred by Apollo facilities team." },
      { date: "2026-09-20", by: "Rahul Sharma", note: "Clarifications on outlet make sent to HOK." },
    ],
  },
  {
    id: "enq_11", enquiryNo: "ENQ/26-27/011", date: "2026-09-16",
    customerName: "Adani Realty", contactPerson: "Pooja Shah", designation: "Asst. Manager – Procurement",
    phone: "+91 98795 32410", email: "pooja.shah@adani.com", customerState: "Gujarat", regionId: "LIV-MUM",
    subject: "Shantigram Villas – Solar Water Heating", vertical: "Residential", source: "Social Media",
    priority: "Low", status: "New", assignedTo: "Priya Patel", estimatedValue: 1800000,
    responseDue: "2026-10-03", projectLocation: "Shantigram, Ahmedabad", consultant: "—",
    disciplines: ["Plumbing"],
    requirements: [
      { item: "ETC Solar Water Heater 300 LPD", discipline: "Plumbing", qty: 60, unit: "Nos" },
    ],
    details: "60 villas, roof-top units with electrical backup.",
    attachments: [],
    activities: [
      { date: "2026-09-16", by: "Priya Patel", note: "LinkedIn enquiry — requested villa roof drawings." },
    ],
  },
  {
    id: "enq_12", enquiryNo: "ENQ/26-27/012", date: "2026-09-21",
    customerName: "L&T Construction", contactPerson: "S. Venkatesh", designation: "Package Manager – TVS",
    phone: "+91 94442 70816", email: "venkatesh.s@lntecc.com", customerState: "Tamil Nadu", regionId: "LIV-CHN",
    subject: "Chennai Metro Ph-2 – Station Tunnel Ventilation", vertical: "Infrastructure", source: "Tender Portal",
    priority: "High", status: "New", assignedTo: "Sneha Reddy", estimatedValue: 32000000,
    responseDue: "2026-09-26", projectLocation: "Corridor 4, Chennai", consultant: "Systra MVA",
    disciplines: ["HVAC", "Electrical", "BMS"],
    requirements: [
      { item: "Tunnel Ventilation Fan 90kW (Reversible)", discipline: "HVAC", qty: 8, unit: "Nos" },
      { item: "Motorised Damper 3m x 3m", discipline: "HVAC", qty: 16, unit: "Nos" },
      { item: "Fan Control Panel with SCADA I/O", discipline: "Electrical", qty: 4, unit: "Nos" },
    ],
    details: "Sub-contract enquiry from L&T for 4 underground stations. EN 12101-3 F400 fans required.",
    attachments: ["TVS_Spec_Vol3.pdf", "Station_GA.pdf"],
    activities: [
      { date: "2026-09-21", by: "Sneha Reddy", note: "Enquiry received via L&T vendor portal." },
    ],
  },
  {
    id: "enq_13", enquiryNo: "ENQ/26-27/013", date: "2026-09-24",
    customerName: "WeWork India", contactPerson: "Arjun Kapoor", designation: "Design & Build Manager",
    phone: "+91 99499 18230", email: "arjun.kapoor@wework.co.in", customerState: "Telangana", regionId: "LIV-HYD",
    subject: "Hitec City Coworking Fit-out – MEP Works", vertical: "Commercial", source: "Website",
    priority: "Medium", status: "New", assignedTo: "Deepa Nair", estimatedValue: 4600000,
    responseDue: "2026-10-04", projectLocation: "Hitec City, Hyderabad", consultant: "—",
    disciplines: ["HVAC", "Electrical", "Fire Fighting"],
    requirements: [
      { item: "Ductable Split 11TR", discipline: "HVAC", qty: 6, unit: "Nos" },
      { item: "Lighting & Power Wiring", discipline: "Electrical", qty: 42000, unit: "Sqft" },
    ],
    details: "42,000 sqft bare-shell to fit-out. 10-week handover target.",
    attachments: ["Floor_Plan_L7.pdf"],
    activities: [
      { date: "2026-09-24", by: "Deepa Nair", note: "Web form enquiry; intro call done." },
    ],
  },
  {
    id: "enq_14", enquiryNo: "ENQ/26-27/014", date: "2026-09-26",
    customerName: "The Phoenix Mills", contactPerson: "Rakesh Iyer", designation: "Facility Head",
    phone: "+91 98191 77402", email: "rakesh.iyer@phoenixmills.com", customerState: "Maharashtra", regionId: "LIV-MUM",
    subject: "Palladium Mall – Chiller Plant Comprehensive AMC", vertical: "Commercial", source: "Existing Customer",
    priority: "Medium", status: "In Progress", assignedTo: "Vikram Singh", estimatedValue: 2200000,
    responseDue: "2026-10-05", projectLocation: "Lower Parel, Mumbai", consultant: "—",
    disciplines: ["HVAC"],
    requirements: [
      { item: "Screw Chiller 500TR – CAMC", discipline: "HVAC", qty: 4, unit: "Nos" },
      { item: "Cooling Tower – CAMC", discipline: "HVAC", qty: 4, unit: "Nos" },
    ],
    details: "Annual contract renewal, includes quarterly tube cleaning and 24x7 breakdown support.",
    attachments: ["Chiller_Logbook_2025.pdf"],
    activities: [
      { date: "2026-09-26", by: "Vikram Singh", note: "Renewal request received, previous contract expires 31 Oct." },
    ],
  },
];

// ==================== Seed: Quotations ====================

export const SEED_QUOTATIONS: CRMQuotation[] = [
  {
    id: "qt_1", quotationNo: "QT/26-27/001", revision: 1, date: "2026-07-06", validUntil: "2026-08-05",
    enquiryNo: "ENQ/26-27/001", customerName: "Prestige Estates Projects", contactPerson: "Karthik Rao",
    email: "karthik.rao@prestigeconstructions.com", phone: "+91 98450 21733", gstin: "29AABCP9471J1ZA",
    billingAddress: "Falcon House, No. 1 Main Guard Cross Road, Bengaluru – 560001", customerState: "Karnataka", regionId: "LIV-BNG",
    title: "Lakeside Habitat Clubhouse – VRF HVAC Package", preparedBy: "Rahul Sharma", status: "Accepted",
    items: [
      li("VRF Outdoor Unit 20HP (Heat Pump)", "8415", 3, "Nos", 685000, 5),
      li("VRF Indoor Cassette Unit 2.0TR", "8415", 18, "Nos", 72000, 5),
      li("VRF Ducted Unit 4.0TR", "8415", 6, "Nos", 118000, 5),
      li("Refrigerant Copper Piping with Insulation", "7411", 420, "Rmt", 1850),
      li("GI Ducting 24G incl. Supports", "7308", 1800, "Sqft", 245),
      li("Installation, Testing & Commissioning", "9954", 1, "Lot", 480000),
    ],
    additionalDiscount: 2, freight: 35000, gstRate: 18, ...DEFAULT_TERMS,
    notes: "Civil works, core cutting and electrical supply up to isolator in client scope.",
    revisions: [
      { rev: 0, date: "2026-07-06", by: "Rahul Sharma", note: "Initial submission" },
      { rev: 1, date: "2026-07-28", by: "Rahul Sharma", note: "Additional 2% discount on negotiation" },
    ],
  },
  {
    id: "qt_2", quotationNo: "QT/26-27/002", revision: 0, date: "2026-07-10", validUntil: "2026-08-09",
    customerName: "Sobha Ltd", contactPerson: "Mahesh Pillai",
    email: "mahesh.pillai@sobha.com", phone: "+91 98860 33019", gstin: "29AAACS7302L1ZJ",
    billingAddress: "Sobha, Sarjapur–Marathahalli Outer Ring Road, Bengaluru – 560103", customerState: "Karnataka", regionId: "LIV-BNG",
    title: "Dream Acres Tower 14 – Pump Room Upgrade", preparedBy: "Amit Kumar", status: "Expired",
    items: [
      li("Vertical Multistage Pump 15HP", "8413", 4, "Nos", 164000, 3),
      li("Pump Control Panel with VFD", "8537", 2, "Nos", 212000),
      li("DI Flanged Valves & Fittings", "8481", 1, "Lot", 185000),
      li("Dismantling & Installation", "9954", 1, "Job", 95000),
    ],
    additionalDiscount: 0, freight: 12000, gstRate: 18, ...DEFAULT_TERMS,
    notes: "Budgetary offer. Customer did not respond within validity.",
    revisions: [{ rev: 0, date: "2026-07-10", by: "Amit Kumar", note: "Initial submission" }],
  },
  {
    id: "qt_3", quotationNo: "QT/26-27/003", revision: 1, date: "2026-07-14", validUntil: "2026-08-13",
    enquiryNo: "ENQ/26-27/002", customerName: "Apollo Hospitals Enterprise", contactPerson: "Dr. Meena Sundaram",
    email: "meena.s@apollohospitals.com", phone: "+91 94440 18256", gstin: "33AAACA5443N1ZH",
    billingAddress: "No. 21, Greams Lane, Off Greams Road, Chennai – 600006", customerState: "Tamil Nadu", regionId: "LIV-CHN",
    title: "OT Block – Fire Fighting & Sprinkler System", preparedBy: "Deepa Nair", status: "Accepted",
    items: [
      li("Sprinkler Pendent 68°C K-80 (UL/FM)", "8424", 420, "Nos", 690, 3),
      li("MS ERW Pipe Heavy Class (25–150mm)", "7306", 1250, "Rmt", 1380),
      li("Fire Pump Set 2280 LPM (Main + Jockey + Diesel)", "8413", 1, "Set", 1150000),
      li("Alarm Valve & Flow Switch Assembly", "8481", 6, "Nos", 42500),
      li("Hydro-testing, Painting & Commissioning", "9954", 1, "Lot", 310000),
    ],
    additionalDiscount: 3, freight: 18000, gstRate: 18, ...DEFAULT_TERMS,
    notes: "Rates valid for work completion before 15 Oct 2026. Fire NOC liaison included.",
    revisions: [
      { rev: 0, date: "2026-07-14", by: "Deepa Nair", note: "Initial submission" },
      { rev: 1, date: "2026-07-29", by: "Deepa Nair", note: "3% negotiated discount applied" },
    ],
  },
  {
    id: "qt_4", quotationNo: "QT/26-27/004", revision: 2, date: "2026-07-25", validUntil: "2026-10-23",
    enquiryNo: "ENQ/26-27/003", customerName: "Infosys Ltd", contactPerson: "Suresh Kulkarni",
    email: "suresh_kulkarni@infosys.com", phone: "+91 99005 44120", gstin: "29AAACI4798L1ZL",
    billingAddress: "Electronics City, Hosur Road, Bengaluru – 560100", customerState: "Karnataka", regionId: "LIV-BNG",
    title: "Mysuru Campus – BMS Upgrade (Phase 1)", preparedBy: "Amit Kumar", status: "Under Negotiation",
    items: [
      li("DDC Controller BACnet/IP (48 I/O)", "9032", 64, "Nos", 68500, 4),
      li("BMS Head-end Server, Software & Graphics", "8471", 1, "Lot", 1850000),
      li("Energy Meter Integration (Modbus)", "9028", 220, "Nos", 6200),
      li("Field Devices – Sensors & Actuators", "9025", 1, "Lot", 2240000),
      li("Cabling, Containment & Commissioning", "9954", 1, "Lot", 1650000),
      li("Operator Training & 1-year AMC", "9983", 1, "Lot", 280000),
    ],
    additionalDiscount: 0, freight: 0, gstRate: 18,
    paymentTerms: "10% advance against BG, 70% pro-rata supply, 20% on handover",
    deliveryPeriod: "12 weeks from LOI", warranty: DEFAULT_TERMS.warranty,
    notes: "Validity extended to 90 days as per RFP. Open protocol, no proprietary licences.",
    revisions: [
      { rev: 0, date: "2026-07-25", by: "Amit Kumar", note: "Technical + commercial bid" },
      { rev: 1, date: "2026-08-20", by: "Amit Kumar", note: "Revised after technical clarifications" },
      { rev: 2, date: "2026-09-12", by: "Amit Kumar", note: "Field device scope optimised, 4% discount on controllers" },
    ],
  },
  {
    id: "qt_5", quotationNo: "QT/26-27/005", revision: 0, date: "2026-07-29", validUntil: "2026-10-27",
    enquiryNo: "ENQ/26-27/004", customerName: "Lodha Developers", contactPerson: "Nikhil Deshmukh",
    email: "nikhil.d@lodhagroup.com", phone: "+91 98200 67731", gstin: "27AAACL1490J1Z5",
    billingAddress: "Lodha Excelus, N. M. Joshi Marg, Mahalaxmi, Mumbai – 400011", customerState: "Maharashtra", regionId: "LIV-MUM",
    title: "World Towers Wing C – Plumbing & Drainage Package", preparedBy: "Vikram Singh", status: "Sent",
    items: [
      li("CPVC Pipe SDR 11 (15–50mm) with Fittings", "3917", 9600, "Rmt", 310),
      li("uPVC SWR Pipe 110mm with Fittings", "3917", 4200, "Rmt", 480),
      li("Hydro-pneumatic System (3W + 1S)", "8413", 2, "Set", 685000),
      li("GI Clamps, Supports & Sleeves", "7326", 1, "Lot", 420000),
      li("Installation & Pressure Testing", "9954", 1, "Lot", 1450000),
    ],
    additionalDiscount: 0, freight: 45000, gstRate: 18, ...DEFAULT_TERMS,
    notes: "Rates based on Astral / Supreme / Grundfos makes as per approved make list.",
    revisions: [{ rev: 0, date: "2026-07-29", by: "Vikram Singh", note: "Initial submission" }],
  },
  {
    id: "qt_6", quotationNo: "QT/26-27/006", revision: 0, date: "2026-08-07", validUntil: "2026-09-06",
    enquiryNo: "ENQ/26-27/005", customerName: "IHCL – Taj Hotels", contactPerson: "Farhan Ali",
    email: "farhan.ali@tajhotels.com", phone: "+91 90000 31542", gstin: "36AAACT3957G1ZQ",
    billingAddress: "Taj Falaknuma Palace, Engine Bowli, Hyderabad – 500053", customerState: "Telangana", regionId: "LIV-HYD",
    title: "Taj Falaknuma – Kitchen Exhaust & Fresh Air", preparedBy: "Sneha Reddy", status: "Rejected",
    items: [
      li("SS 304 Kitchen Exhaust Hood with ESP Unit", "8414", 4, "Nos", 385000),
      li("Inline Fresh Air Fan 6000 CFM", "8414", 4, "Nos", 96000),
      li("GI / SS Ducting with Fire-rated Insulation", "7308", 2200, "Sqft", 390),
      li("Night-shift Installation & Commissioning", "9954", 1, "Lot", 260000),
    ],
    additionalDiscount: 0, freight: 15000, gstRate: 18, ...DEFAULT_TERMS,
    notes: "Heritage conservation compliance included.",
    revisions: [{ rev: 0, date: "2026-08-07", by: "Sneha Reddy", note: "Initial submission" }],
  },
  {
    id: "qt_7", quotationNo: "QT/26-27/007", revision: 1, date: "2026-08-18", validUntil: "2026-10-02",
    enquiryNo: "ENQ/26-27/006", customerName: "Nxtra Data Ltd", contactPerson: "Rohit Joshi",
    email: "rohit.joshi@nxtra.in", phone: "+91 98224 90871", gstin: "27AAECN3346Q1ZP",
    billingAddress: "Plot 25, Rajiv Gandhi Infotech Park, Hinjewadi Ph-2, Pune – 411057", customerState: "Maharashtra", regionId: "LIV-PUN",
    title: "Pune DC Hall 3 – Precision Cooling & CRAH", preparedBy: "Priya Patel", status: "Sent",
    items: [
      li("Chilled Water CRAH 150kW with EC Fans", "8415", 12, "Nos", 1120000, 6),
      li("In-row Cooler 40kW", "8415", 16, "Nos", 465000, 6),
      li("Leak Detection System & DCIM Integration", "9032", 1, "Lot", 980000),
      li("CHW Piping – MS Sch 40 with Insulation", "7306", 640, "Rmt", 3900),
      li("FAT, Installation, Testing & Commissioning", "9954", 1, "Lot", 1850000),
    ],
    additionalDiscount: 1.5, freight: 120000, gstRate: 18,
    paymentTerms: "20% advance, 70% against delivery, 10% after IST sign-off",
    deliveryPeriod: "14–16 weeks from PO (OEM import lead time)",
    warranty: "24 months comprehensive from commissioning",
    notes: "FAT at OEM factory (Italy) — travel for 2 client reps included.",
    revisions: [
      { rev: 0, date: "2026-08-18", by: "Priya Patel", note: "Initial submission" },
      { rev: 1, date: "2026-09-08", by: "Priya Patel", note: "Warranty extended to 24 months, 1.5% special discount" },
    ],
  },
  {
    id: "qt_8", quotationNo: "QT/26-27/008", revision: 0, date: "2026-09-04", validUntil: "2026-10-04",
    enquiryNo: "ENQ/26-27/008", customerName: "Brigade Enterprises", contactPerson: "Anjali Menon",
    email: "anjali.menon@brigadegroup.com", phone: "+91 97450 11862", gstin: "32AAACB2894G1ZB",
    billingAddress: "WTC Kochi, Infopark Phase 2, Kakkanad, Kochi – 682042", customerState: "Kerala", regionId: "LIV-KOC",
    title: "WTC Kochi Tower 3 – ELV, CCTV & Access Control", preparedBy: "Deepa Nair", status: "Sent",
    items: [
      li("IP Dome Camera 4MP IR (Hikvision / Honeywell)", "8525", 180, "Nos", 7800, 5),
      li("NVR 64 Ch with 96TB Storage", "8521", 3, "Nos", 385000),
      li("Access Control Door Controller + Reader", "8543", 42, "Nos", 28500),
      li("Cat6 Cabling & Containment", "8544", 1, "Lot", 620000),
      li("Integration with Central Command Centre", "9983", 1, "Lot", 340000),
    ],
    additionalDiscount: 0, freight: 25000, gstRate: 18, ...DEFAULT_TERMS,
    notes: "",
    revisions: [{ rev: 0, date: "2026-09-04", by: "Deepa Nair", note: "Initial submission" }],
  },
  {
    id: "qt_9", quotationNo: "QT/26-27/009", revision: 0, date: "2026-09-12", validUntil: "2026-10-12",
    enquiryNo: "ENQ/26-27/007", customerName: "Amity University", contactPerson: "Col. R. P. Tyagi (Retd.)",
    email: "rptyagi@amity.edu", phone: "+91 98110 42290", gstin: "09AAATR0090B1ZN",
    billingAddress: "Amity University Campus, Sector 125, Noida – 201313", customerState: "Uttar Pradesh", regionId: "LIV-DEL",
    title: "Noida Hostel Block H – LT Panels & Distribution", preparedBy: "Vikram Singh", status: "Draft",
    items: [
      li("LT Panel 1600A ACB Incomer, 12 MCCB Outgoings", "8537", 1, "Nos", 1480000),
      li("Floor DB – 8 way TPN with RCBO", "8537", 14, "Nos", 38500),
      li("XLPE Armoured Cable 3.5C x 300 sqmm", "8544", 380, "Rmt", 2650),
      li("Rising Mains 400A", "8537", 1, "Lot", 520000),
    ],
    additionalDiscount: 0, freight: 18000, gstRate: 18, ...DEFAULT_TERMS,
    notes: "Budgetary — final quote after drawing freeze.",
    revisions: [{ rev: 0, date: "2026-09-12", by: "Vikram Singh", note: "Draft prepared" }],
  },
];
