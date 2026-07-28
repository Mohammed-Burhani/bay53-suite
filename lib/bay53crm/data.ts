import type {
  CRMLead,
  CRMFollowUp,
  CRMProject,
  MasterLookupItem,
  MasterLookupType,
  LeadStage,
  CRMNotification,
  CRMCompanyConfig,
} from "./types";
import { DEFAULT_MASTER_VALUES, generateId, getCurrentFY } from "./constants";

// ==================== In-Memory Stores ====================

let leads: CRMLead[] = [];
let followUps: CRMFollowUp[] = [];
let projects: CRMProject[] = [];
let masterValues: MasterLookupItem[] = [];
let notifications: CRMNotification[] = [];
let companyConfig: CRMCompanyConfig | null = null;
let initialized = false;

// ==================== Seed Data ====================

function initSeedData() {
  if (initialized) return;
  initialized = true;

  // Seed master values
  let sortOrder = 0;
  Object.entries(DEFAULT_MASTER_VALUES).forEach(([type, items]) => {
    items.forEach((item) => {
      sortOrder++;
      masterValues.push({
        id: generateId("mv"),
        type: type as MasterLookupType,
        code: item.code,
        name: item.name,
        color: item.color,
        sortOrder,
        isActive: true,
      });
    });
  });

  // Seed leads — realistic spread across FY 26-27 (Apr 2026 – Mar 2027)
  const seedLeads: Omit<CRMLead, "id" | "createdAt" | "updatedAt">[] = [
    // ─────────── APRIL 2026 ───────────
    {
      regionId: "LIV-MUM", title: "Tata Vivanta Hotel MEP", customerState: "Maharashtra",
      vertical: "Hospitality", value: 8200000, customerName: "IHCL Hotels", contactPerson: "Sanjay Mehta",
      stage: "Hot Lead", source: "Consultant", date: "2026-04-03", assignedTo: "Rahul Sharma",
      lastFollowUp: "Design brief received from architect", lastFollowUpDate: "2026-07-20", status: "active", archived: false,
    },
    {
      regionId: "LIV-DEL", title: "Indigo Airlines HQ Electrical", customerState: "Delhi",
      vertical: "Commercial", value: 5400000, customerName: "InterGlobe Aviation", contactPerson: "Rajat Bhatia",
      stage: "Won", source: "Reference", date: "2026-04-10", assignedTo: "Sneha Reddy",
      lastFollowUp: "Work order signed, mobilisation underway", lastFollowUpDate: "2026-07-15", status: "active", archived: false,
    },
    {
      regionId: "LIV-BNG", title: "Embassy Tech Village HVAC", customerState: "Karnataka",
      vertical: "Commercial", value: 11500000, customerName: "Embassy Group", contactPerson: "Deepak Jain",
      stage: "Tender", source: "Tender Portal", date: "2026-04-15", assignedTo: "Rahul Sharma",
      lastFollowUp: "Technical bid submitted", lastFollowUpDate: "2026-07-22", status: "active", archived: false,
    },
    {
      regionId: "LIV-HYD", title: "Raheja Cybercity Fire Systems", customerState: "Telangana",
      vertical: "Commercial", value: 4700000, customerName: "Raheja Corp", contactPerson: "Venu Gopal",
      stage: "Lost", source: "Existing Customer", date: "2026-04-20", assignedTo: "Amit Kumar",
      lastFollowUp: "Lost — client went with lower bidder", lastFollowUpDate: "2026-06-10", status: "closed", archived: false,
    },
    {
      regionId: "LIV-PUN", title: "Magarpatta IT Park ELV Systems", customerState: "Maharashtra",
      vertical: "Commercial", value: 5800000, customerName: "Magarpatta City Dev", contactPerson: "Sunil Magar",
      stage: "Hot Lead", source: "Trade Show", date: "2026-04-22", assignedTo: "Vikram Singh",
      lastFollowUp: "Demo scheduled for next week", lastFollowUpDate: "2026-07-22", status: "active", archived: false,
    },
    {
      regionId: "LIV-KOC", title: "Cochin Shipyard Plant HVAC", customerState: "Kerala",
      vertical: "Industrial", value: 9800000, customerName: "Cochin Shipyard Ltd", contactPerson: "Capt. Menon",
      stage: "Cold Lead", source: "Website", date: "2026-04-28", assignedTo: "Deepa Nair",
      lastFollowUp: "Inquiry via website, awaiting callback", lastFollowUpDate: "2026-04-28", status: "active", archived: false,
    },

    // ─────────── MAY 2026 ───────────
    {
      regionId: "LIV-MUM", title: "Hiranandani Schools Electrical", customerState: "Maharashtra",
      vertical: "Education", value: 1800000, customerName: "Hiranandani Foundation", contactPerson: "Niranjan H",
      stage: "Won", source: "Existing Customer", date: "2026-05-02", assignedTo: "Deepa Nair",
      lastFollowUp: "Work order received, mobilization in progress", lastFollowUpDate: "2026-07-12", status: "active", archived: false,
    },
    {
      regionId: "LIV-HYD", title: "Amazon Data Center Electrical", customerState: "Telangana",
      vertical: "Data Center", value: 15000000, customerName: "Amazon Web Services", contactPerson: "Vikash Sharma",
      stage: "Tender", source: "Tender Portal", date: "2026-05-10", assignedTo: "Rahul Sharma",
      lastFollowUp: "Bid submitted, shortlisted for technical presentation", lastFollowUpDate: "2026-07-22", status: "active", archived: false,
    },
    {
      regionId: "LIV-CHN", title: "TCS SEZ Fire Fighting", customerState: "Tamil Nadu",
      vertical: "Commercial", value: 3600000, customerName: "TCS", contactPerson: "Krishnamurthy",
      stage: "Hot Lead", source: "Website", date: "2026-05-15", assignedTo: "Sneha Reddy",
      lastFollowUp: "Technical specs shared with client", lastFollowUpDate: "2026-07-18", status: "active", archived: false,
    },
    {
      regionId: "LIV-DEL", title: "Oberoi Hotels Smart Building", customerState: "Delhi",
      vertical: "Hospitality", value: 6700000, customerName: "Oberoi Group", contactPerson: "Vikram Oberoi",
      stage: "Hot Lead", source: "Reference", date: "2026-05-18", assignedTo: "Sneha Reddy",
      lastFollowUp: "Client reviewing our case studies", lastFollowUpDate: "2026-07-24", status: "active", archived: false,
    },
    {
      regionId: "LIV-BNG", title: "Brigade Gateway Plumbing", customerState: "Karnataka",
      vertical: "Residential", value: 3400000, customerName: "Brigade Group", contactPerson: "Murali K",
      stage: "Won", source: "Reference", date: "2026-05-22", assignedTo: "Deepa Nair",
      lastFollowUp: "Installation 70% complete", lastFollowUpDate: "2026-07-23", status: "active", archived: false,
    },
    {
      regionId: "LIV-PUN", title: "Bajaj Auto Plant HVAC", customerState: "Maharashtra",
      vertical: "Industrial", value: 11000000, customerName: "Bajaj Auto", contactPerson: "Rajiv Bajaj",
      stage: "Cold Lead", source: "Cold Call", date: "2026-05-28", assignedTo: "Vikram Singh",
      lastFollowUp: "Cold call completed, client interested", lastFollowUpDate: "2026-05-28", status: "active", archived: false,
    },
    {
      regionId: "LIV-KOL", title: "ITC Sonar HVAC Replacement", customerState: "West Bengal",
      vertical: "Hospitality", value: 5200000, customerName: "ITC Hotels", contactPerson: "Arijit Bose",
      stage: "Hot Lead", source: "Existing Customer", date: "2026-05-25", assignedTo: "Priya Patel",
      lastFollowUp: "Site survey completed, proposal being prepared", lastFollowUpDate: "2026-07-16", status: "active", archived: false,
    },

    // ─────────── JUNE 2026 ───────────
    {
      regionId: "LIV-CHN", title: "Chennai Airport Terminal 2 MEP", customerState: "Tamil Nadu",
      vertical: "Infrastructure", value: 22000000, customerName: "AAI / GMR Airports", contactPerson: "Ramanathan",
      stage: "Tender", source: "Tender Portal", date: "2026-06-01", assignedTo: "Vikram Singh",
      lastFollowUp: "Pre-bid meeting completed, queries raised", lastFollowUpDate: "2026-07-20", status: "active", archived: false,
    },
    {
      regionId: "LIV-MUM", title: "Jio World Centre ELV", customerState: "Maharashtra",
      vertical: "Commercial", value: 8800000, customerName: "Reliance Jio", contactPerson: "Mukesh P",
      stage: "Tender", source: "Consultant", date: "2026-06-05", assignedTo: "Amit Kumar",
      lastFollowUp: "Clarification round 2 responded", lastFollowUpDate: "2026-07-19", status: "active", archived: false,
    },
    {
      regionId: "LIV-BNG", title: "Narayana Health City Fire Safety", customerState: "Karnataka",
      vertical: "Healthcare", value: 4200000, customerName: "Narayana Health", contactPerson: "Dr. Devi Shetty",
      stage: "Hot Lead", source: "Consultant", date: "2026-06-12", assignedTo: "Priya Patel",
      lastFollowUp: "Client comparing our proposal with 2 others", lastFollowUpDate: "2026-07-18", status: "active", archived: false,
    },
    {
      regionId: "LIV-HYD", title: "Wipro Cyber Gateway BMS", customerState: "Telangana",
      vertical: "Commercial", value: 6100000, customerName: "Wipro Ltd", contactPerson: "Raghunath M",
      stage: "Tender Won", source: "Existing Customer", date: "2026-06-18", assignedTo: "Sneha Reddy",
      lastFollowUp: "PO received, vendor onboarding in progress", lastFollowUpDate: "2026-07-25", status: "active", archived: false,
    },
    {
      regionId: "LIV-DEL", title: "DLF Cyber Hub BMS Upgrade", customerState: "Delhi",
      vertical: "Commercial", value: 4100000, customerName: "DLF Ltd", contactPerson: "Pradeep Yadav",
      stage: "Tender Lost", source: "Consultant", date: "2026-06-22", assignedTo: "Amit Kumar",
      lastFollowUp: "Project awarded to competitor", lastFollowUpDate: "2026-07-10", status: "closed", archived: false,
    },
    {
      regionId: "LIV-PUN", title: "Tata Motors Plant Electrical", customerState: "Maharashtra",
      vertical: "Industrial", value: 14500000, customerName: "Tata Motors", contactPerson: "Girish Wagh",
      stage: "Won", source: "Reference", date: "2026-06-25", assignedTo: "Rahul Sharma",
      lastFollowUp: "Contract executed, site mobilisation next week", lastFollowUpDate: "2026-07-26", status: "active", archived: false,
    },
    {
      regionId: "LIV-KOC", title: "Leela Hotel Renovation MEP", customerState: "Kerala",
      vertical: "Hospitality", value: 9500000, customerName: "Leela Palaces", contactPerson: "Mohammed Ali",
      stage: "Hot Lead", source: "Consultant", date: "2026-06-28", assignedTo: "Vikram Singh",
      lastFollowUp: "Design review meeting planned for August", lastFollowUpDate: "2026-07-25", status: "active", archived: false,
    },

    // ─────────── JULY 2026 ───────────
    {
      regionId: "LIV-CHN", title: "Apollo Hospital Plumbing", customerState: "Tamil Nadu",
      vertical: "Healthcare", value: 8500000, customerName: "Apollo Hospitals", contactPerson: "Dr. Suresh Kumar",
      stage: "Cold Lead", source: "Website", date: "2026-07-01", assignedTo: "Amit Kumar",
      lastFollowUp: "Initial inquiry received via website form", lastFollowUpDate: "2026-07-01", status: "active", archived: false,
    },
    {
      regionId: "LIV-DEL", title: "Jaypee Infratech Hospital Fire", customerState: "Delhi",
      vertical: "Healthcare", value: 3900000, customerName: "Jaypee Group", contactPerson: "Manoj Gaur",
      stage: "Tender Won", source: "Tender Portal", date: "2026-07-03", assignedTo: "Sneha Reddy",
      lastFollowUp: "L1 confirmed, awaiting formal award letter", lastFollowUpDate: "2026-07-26", status: "active", archived: false,
    },
    {
      regionId: "LIV-BNG", title: "Prestige Tech Park Plumbing", customerState: "Karnataka",
      vertical: "Commercial", value: 7200000, customerName: "Prestige Estates", contactPerson: "Irfan Razack",
      stage: "Hot Lead", source: "Trade Show", date: "2026-07-05", assignedTo: "Rahul Sharma",
      lastFollowUp: "Follow-up meeting scheduled for next Tuesday", lastFollowUpDate: "2026-07-24", status: "active", archived: false,
    },
    {
      regionId: "LIV-MUM", title: "Lodha World One - Fire Fighting", customerState: "Maharashtra",
      vertical: "Residential", value: 12000000, customerName: "Lodha Group", contactPerson: "Amit Deshmukh",
      stage: "Tender", source: "Tender Portal", date: "2026-07-08", assignedTo: "Priya Patel",
      lastFollowUp: "Tender submitted, awaiting technical evaluation", lastFollowUpDate: "2026-07-18", status: "active", archived: false,
    },
    {
      regionId: "LIV-HYD", title: "Phoenix Marketcity Hyd HVAC", customerState: "Telangana",
      vertical: "Commercial", value: 6900000, customerName: "Phoenix Mills", contactPerson: "Harsh Patodia",
      stage: "Cold Lead", source: "Cold Call", date: "2026-07-10", assignedTo: "Amit Kumar",
      lastFollowUp: "Cold call — decision expected in 3 months", lastFollowUpDate: "2026-07-10", status: "active", archived: false,
    },
    {
      regionId: "LIV-KOL", title: "Tata Medical Center Plumbing", customerState: "West Bengal",
      vertical: "Healthcare", value: 6200000, customerName: "Tata Trust", contactPerson: "Arijit Das",
      stage: "Cold Lead", source: "Reference", date: "2026-07-10", assignedTo: "Priya Patel",
      lastFollowUp: "Referred by Apollo Hospitals team", lastFollowUpDate: "2026-07-10", status: "active", archived: false,
    },
    {
      regionId: "LIV-DEL", title: "IGI Airport Terminal 3 HVAC", customerState: "Delhi",
      vertical: "Infrastructure", value: 28000000, customerName: "GMR Group", contactPerson: "Anil Kapoor",
      stage: "Tender", source: "Tender Portal", date: "2026-07-12", assignedTo: "Rahul Sharma",
      lastFollowUp: "Pre-bid meeting attended, clarification submitted", lastFollowUpDate: "2026-07-15", status: "active", archived: false,
    },
    {
      regionId: "LIV-BNG", title: "Manipal Hospital Data Center Cooling", customerState: "Karnataka",
      vertical: "Healthcare", value: 7800000, customerName: "Manipal Health", contactPerson: "Dr. Prasad",
      stage: "Tender Won", source: "Tender Portal", date: "2026-07-15", assignedTo: "Rahul Sharma",
      lastFollowUp: "PO received, procurement initiated", lastFollowUpDate: "2026-07-20", status: "active", archived: false,
    },
    {
      regionId: "LIV-PUN", title: "Wipro Campus Fire Safety", customerState: "Maharashtra",
      vertical: "Commercial", value: 2800000, customerName: "Wipro Ltd", contactPerson: "Naveen Holla",
      stage: "Lost", source: "Existing Customer", date: "2026-07-18", assignedTo: "Deepa Nair",
      lastFollowUp: "Lost to competitor — pricing issue", lastFollowUpDate: "2026-07-18", status: "closed", archived: false,
    },
    {
      regionId: "LIV-CHN", title: "Chennai Metro Phase 2 Fire", customerState: "Tamil Nadu",
      vertical: "Infrastructure", value: 18000000, customerName: "CMRL", contactPerson: "Senthil Kumar",
      stage: "Tender Lost", source: "Tender Portal", date: "2026-07-20", assignedTo: "Vikram Singh",
      lastFollowUp: "Lowest bidder but lost on technical grounds", lastFollowUpDate: "2026-07-20", status: "closed", archived: false,
    },
    {
      regionId: "LIV-MUM", title: "Bajaj Finserv Office MEP", customerState: "Maharashtra",
      vertical: "Commercial", value: 3100000, customerName: "Bajaj Finserv", contactPerson: "Tarun Chugh",
      stage: "Hot Lead", source: "Reference", date: "2026-07-22", assignedTo: "Deepa Nair",
      lastFollowUp: "Requirement walkthrough with facility head", lastFollowUpDate: "2026-07-26", status: "active", archived: false,
    },
    {
      regionId: "LIV-DEL", title: "HCL Roshni Campus ELV", customerState: "Delhi",
      vertical: "Commercial", value: 4800000, customerName: "HCL Technologies", contactPerson: "C Vijayakumar",
      stage: "Cold Lead", source: "Website", date: "2026-07-25", assignedTo: "Sneha Reddy",
      lastFollowUp: "Inquiry received, introductory call planned", lastFollowUpDate: "2026-07-25", status: "active", archived: false,
    },
    {
      regionId: "LIV-HYD", title: "Cyber Towers BMS Upgrade", customerState: "Telangana",
      vertical: "Commercial", value: 3200000, customerName: "Raheja Corp", contactPerson: "Venu Gopal",
      stage: "Won", source: "Consultant", date: "2026-07-28", assignedTo: "Sneha Reddy",
      lastFollowUp: "Contract signed, project kickoff scheduled", lastFollowUpDate: "2026-07-28", status: "active", archived: false,
    },
  ];

  seedLeads.forEach((lead) => {
    const now = new Date().toISOString();
    leads.push({
      ...lead,
      id: generateId("lead"),
      createdAt: now,
      updatedAt: now,
    });
  });

  // Seed follow-ups — spread across multiple leads for realistic activity
  const seedFollowUps: Omit<CRMFollowUp, "id">[] = [
    // Tata Vivanta (Apr lead — hot)
    { leadId: leads[0].id, date: "2026-07-20T10:00:00Z", notes: "Design brief received from architect, reviewing HVAC specifications", stage: "Hot Lead", createdBy: "Rahul Sharma" },
    { leadId: leads[0].id, date: "2026-06-28T14:00:00Z", notes: "Meeting with IHCL facilities team at hotel site", createdBy: "Rahul Sharma" },
    { leadId: leads[0].id, date: "2026-05-15T09:30:00Z", notes: "Cold call — hotel renovation project identified", stage: "Cold Lead", createdBy: "Rahul Sharma" },
    // Indigo Airlines HQ (Won)
    { leadId: leads[1].id, date: "2026-07-15T11:00:00Z", notes: "Work order signed, mobilisation team deployed", stage: "Won", createdBy: "Sneha Reddy" },
    { leadId: leads[1].id, date: "2026-06-20T09:00:00Z", notes: "Negotiation finalised — ₹54L final value confirmed", stage: "Hot Lead", createdBy: "Sneha Reddy" },
    // Embassy Tech Village HVAC (Tender)
    { leadId: leads[2].id, date: "2026-07-22T16:30:00Z", notes: "Technical bid submitted, waiting for commercial round", stage: "Tender", createdBy: "Rahul Sharma" },
    // Magarpatta IT Park (Hot Lead — trade show)
    { leadId: leads[4].id, date: "2026-07-22T11:00:00Z", notes: "Product demo of ELV systems scheduled for next week", stage: "Hot Lead", createdBy: "Vikram Singh" },
    { leadId: leads[4].id, date: "2026-06-10T10:00:00Z", notes: "Connected at Smart Building Expo in Pune, exchanged details", createdBy: "Vikram Singh" },
    // Hiranandani Schools (Won)
    { leadId: leads[6].id, date: "2026-07-12T14:00:00Z", notes: "Work order received, mobilisation in progress", stage: "Won", createdBy: "Deepa Nair" },
    // Amazon Data Center (Tender — big ticket)
    { leadId: leads[7].id, date: "2026-07-22T09:00:00Z", notes: "Shortlisted for technical presentation — 3 vendors left", stage: "Tender", createdBy: "Rahul Sharma" },
    { leadId: leads[7].id, date: "2026-06-15T11:00:00Z", notes: "Pre-bid meeting attended, clarification on power specs submitted", createdBy: "Rahul Sharma" },
    // TCS SEZ Fire Fighting (Hot)
    { leadId: leads[8].id, date: "2026-07-18T15:00:00Z", notes: "Technical specs shared, client evaluating our proposal", stage: "Hot Lead", createdBy: "Sneha Reddy" },
    // Jio World Centre (Tender)
    { leadId: leads[11].id, date: "2026-07-19T10:00:00Z", notes: "Clarification round 2 responded, awaiting shortlist result", stage: "Tender", createdBy: "Amit Kumar" },
    // Tata Motors Plant (Won — big)
    { leadId: leads[13].id, date: "2026-07-26T16:00:00Z", notes: "Contract executed, site mobilisation starting next week", stage: "Won", createdBy: "Rahul Sharma" },
    { leadId: leads[13].id, date: "2026-07-10T10:00:00Z", notes: "Price negotiation finalised — best deal of the quarter", stage: "Hot Lead", createdBy: "Rahul Sharma" },
    // Leela Hotel (Hot)
    { leadId: leads[14].id, date: "2026-07-25T16:00:00Z", notes: "Design review meeting planned for August, architect to confirm", stage: "Hot Lead", createdBy: "Vikram Singh" },
    // Apollo Hospital (Cold — Jul)
    { leadId: leads[15].id, date: "2026-07-01T09:00:00Z", notes: "Initial inquiry received via website form — plumbing requirement", createdBy: "Amit Kumar" },
    // Jaypee Infratech (Tender Won)
    { leadId: leads[16].id, date: "2026-07-26T11:00:00Z", notes: "L1 confirmed, formal award letter expected within a week", stage: "Tender Won", createdBy: "Sneha Reddy" },
    // Prestige Tech Park (Hot)
    { leadId: leads[17].id, date: "2026-07-24T14:00:00Z", notes: "Follow-up meeting scheduled for next Tuesday with MEP head", stage: "Hot Lead", createdBy: "Rahul Sharma" },
    // Lodha World One (Tender)
    { leadId: leads[18].id, date: "2026-07-18T09:00:00Z", notes: "Tender submitted, awaiting technical evaluation results", stage: "Tender", createdBy: "Priya Patel" },
    // IGI Airport (Tender — big)
    { leadId: leads[20].id, date: "2026-07-15T14:00:00Z", notes: "Pre-bid meeting attended with 40+ attendees, clarification submitted", stage: "Tender", createdBy: "Rahul Sharma" },
    // Wipro BMS Hyderabad (Tender Won)
    { leadId: leads[12].id, date: "2026-07-25T10:00:00Z", notes: "PO received, vendor onboarding in progress", stage: "Tender Won", createdBy: "Sneha Reddy" },
    // Cyber Towers BMS (Won)
    { leadId: leads[26].id, date: "2026-07-28T09:00:00Z", notes: "Contract signed, project kickoff scheduled for Aug 5", stage: "Won", createdBy: "Sneha Reddy" },
    // ITC Sonar (Hot)
    { leadId: leads[10].id, date: "2026-07-16T11:00:00Z", notes: "Site survey completed, proposal being prepared — detailed BoQ ready", stage: "Hot Lead", createdBy: "Priya Patel" },
    // Bajaj Finserv (Hot)
    { leadId: leads[24].id, date: "2026-07-26T14:00:00Z", notes: "Requirement walkthrough with facility head, scope finalized", stage: "Hot Lead", createdBy: "Deepa Nair" },
  ];
  seedFollowUps.forEach((fu) => {
    followUps.push({ ...fu, id: generateId("fu") });
  });

  // Seed projects
  const seedProjects: Omit<CRMProject, "id" | "createdAt" | "updatedAt">[] = [
    {
      regionId: "LIV-BNG", name: "Embassy Tech Village HVAC",
      consultantName: "Sterling Consultants",
      contractorDetails: [
        { name: "L&T Construction", scope: "HVAC & Plumbing" },
        { name: "JTC Electrical", scope: "Electrical & ELV" },
      ],
      brandApproval: [
        { status: "Approved", discipline: "HVAC" },
        { status: "Pending", discipline: "Plumbing" },
        { status: "Approved", discipline: "Electrical" },
      ],
      status: "Awarded", makeListAvailability: "Available",
      assignedTo: "Rahul Sharma", notes: [], archived: false,
    },
    {
      regionId: "LIV-HYD", name: "Cyber Towers BMS Integration",
      consultantName: "Feedback Consultants",
      contractorDetails: [{ name: "Smart Building Solutions", scope: "BMS & ELV" }],
      brandApproval: [
        { status: "Approved", discipline: "BMS" },
        { status: "Approved", discipline: "ELV" },
      ],
      status: "Awarded", makeListAvailability: "Available",
      assignedTo: "Sneha Reddy", notes: [], archived: false,
    },
    {
      regionId: "LIV-MUM", name: "Lodha World One Fire Systems",
      consultantName: "Combustion Gas & Fire Engineers",
      contractorDetails: [{ name: "FirePro Systems", scope: "Fire Fighting & Detection" }],
      brandApproval: [{ status: "Pending", discipline: "Fire Fighting" }],
      status: "Not Awarded", makeListAvailability: "Not Available",
      assignedTo: "Priya Patel", notes: [], archived: false,
    },
    {
      regionId: "LIV-BNG", name: "Manipal Hospital Data Center",
      consultantName: "AECOM",
      contractorDetails: [
        { name: "Vertiv India", scope: "Cooling Systems" },
        { name: "Schneider Electric", scope: "Power & Electrical" },
      ],
      brandApproval: [
        { status: "Approved", discipline: "HVAC" },
        { status: "Approved", discipline: "Electrical" },
      ],
      status: "Awarded", makeListAvailability: "Available",
      assignedTo: "Rahul Sharma", notes: [], archived: false,
    },
    {
      regionId: "LIV-MUM", name: "Tata Vivanta Hotel MEP",
      consultantName: "Buro Happold",
      contractorDetails: [
        { name: "Voltas Limited", scope: "HVAC" },
        { name: "Havells India", scope: "Electrical" },
      ],
      brandApproval: [
        { status: "Pending", discipline: "HVAC" },
        { status: "Pending", discipline: "Electrical" },
      ],
      status: "Not Awarded", makeListAvailability: "Available",
      assignedTo: "Rahul Sharma", notes: [], archived: false,
    },
    {
      regionId: "LIV-DEL", name: "Indigo Airlines HQ Electrical",
      consultantName: "AECOM India",
      contractorDetails: [{ name: "C&S Electric", scope: "Electrical & ELV" }],
      brandApproval: [{ status: "Approved", discipline: "Electrical" }],
      status: "Awarded", makeListAvailability: "Available",
      assignedTo: "Sneha Reddy", notes: [], archived: false,
    },
    {
      regionId: "LIV-PUN", name: "Tata Motors Plant Electrical",
      consultantName: "Feedback Consultants",
      contractorDetails: [
        { name: "ABB India", scope: "Power Distribution" },
        { name: "Schneider Electric", scope: "BMS & Control" },
      ],
      brandApproval: [
        { status: "Approved", discipline: "Electrical" },
        { status: "Pending", discipline: "BMS" },
        { status: "Approved", discipline: "HVAC" },
      ],
      status: "Awarded", makeListAvailability: "Available",
      assignedTo: "Rahul Sharma", notes: [], archived: false,
    },
    {
      regionId: "LIV-CHN", name: "TCS SEZ Fire Fighting",
      consultantName: "Sterling Consultants",
      contractorDetails: [{ name: "Tyco Fire & Security", scope: "Fire Fighting & Detection" }],
      brandApproval: [{ status: "Pending", discipline: "Fire Fighting" }],
      status: "Not Awarded", makeListAvailability: "Not Available",
      assignedTo: "Sneha Reddy", notes: [], archived: false,
    },
  ];

  seedProjects.forEach((proj) => {
    const now = new Date().toISOString();
    projects.push({
      ...proj,
      id: generateId("proj"),
      notes: [
        { id: generateId("note"), date: "2026-07-20T10:00:00Z", notes: "Project kickoff meeting completed", createdBy: proj.assignedTo },
      ],
      createdAt: now,
      updatedAt: now,
    });
  });

  // Seed notifications
  notifications = [
    { id: generateId("notif"), type: "lead_won", title: "Tata Motors Plant — Won! 🎉", message: "Congratulations! Deal closed at ₹1.45Cr — project team to mobilise next week", targetRole: "All", isActive: true, createdAt: "2026-07-26T14:30:00Z" },
    { id: generateId("notif"), type: "tender_deadline", title: "IGI Airport Tender Deadline", message: "Terminal 3 HVAC submission deadline in 5 days — Rahul Sharma is lead", targetRole: "Sales Executive", isActive: true, createdAt: "2026-07-25T09:00:00Z" },
    { id: generateId("notif"), type: "lead_assignment", title: "Lead Assigned: Cyber Towers BMS", message: "Cyber Towers BMS Upgrade (₹32L) awarded to Sneha Reddy — contract signed", targetRole: "Sales Manager", isActive: true, createdAt: "2026-07-24T11:00:00Z" },
    { id: generateId("notif"), type: "follow_up_reminder", title: "Follow-up Reminder", message: "Follow-up due for Bajaj Finserv Office MEP — Deepa Nair to meet facility head", targetRole: "Sales Manager", isActive: true, createdAt: "2026-07-24T08:00:00Z" },
    { id: generateId("notif"), type: "project_update", title: "Project Awarded: Indigo HQ", message: "Indigo Airlines HQ Electrical project awarded to Sneha Reddy — ₹54L", targetRole: "Project Manager", isActive: true, createdAt: "2026-07-23T16:00:00Z" },
    { id: generateId("notif"), type: "lead_won", title: "Jaypee Infratech — L1 Confirmed!", message: "Fire protection project at ₹39L — formal award letter expected this week", targetRole: "All", isActive: true, createdAt: "2026-07-22T10:00:00Z" },
    { id: generateId("notif"), type: "tender_deadline", title: "Chennai Airport Tender Response", message: "Clarification round 3 received from AAI — response due in 48 hours", targetRole: "Sales Executive", isActive: true, createdAt: "2026-07-21T09:00:00Z" },
    { id: generateId("notif"), type: "lead_assignment", title: "New Lead: Phoenix Marketcity Hyd", message: "New HVAC lead (₹69L) from Phoenix Mills, Hyderabad — assigned to Amit Kumar", targetRole: "Sales Executive", isActive: true, createdAt: "2026-07-20T09:00:00Z" },
    { id: generateId("notif"), type: "lead_assignment", title: "HCL Roshni Campus Enquiry", message: "ELV enquiry from HCL Technologies (₹48L) — assigned to Sneha Reddy for initial call", targetRole: "Sales Executive", isActive: true, createdAt: "2026-07-18T10:00:00Z" },
    { id: generateId("notif"), type: "follow_up_reminder", title: "Manipal Hospital Follow-up", message: "Manipal Health data center PO received — procurement team to initiate ordering", targetRole: "Sales Executive", isActive: true, createdAt: "2026-07-17T08:30:00Z" },
  ];

  // Seed company config
  companyConfig = {
    id: generateId("cc"),
    companyName: "Bay53 Industrial Solutions",
    yearlyTargetRevenue: 150000000,
    updatedAt: new Date().toISOString(),
  };
}

// ==================== CRUD: Leads ====================

export function getLeads(): CRMLead[] {
  initSeedData();
  return [...leads];
}

export function getLeadById(id: string): CRMLead | undefined {
  initSeedData();
  return leads.find((l) => l.id === id);
}

export function createLead(data: Omit<CRMLead, "id" | "createdAt" | "updatedAt">): CRMLead {
  initSeedData();
  const now = new Date().toISOString();
  const lead: CRMLead = { ...data, id: generateId("lead"), createdAt: now, updatedAt: now };
  leads.push(lead);
  return lead;
}

export function updateLead(id: string, data: Partial<CRMLead>): CRMLead | null {
  initSeedData();
  const idx = leads.findIndex((l) => l.id === id);
  if (idx === -1) return null;
  leads[idx] = { ...leads[idx], ...data, updatedAt: new Date().toISOString() };
  return leads[idx];
}

export function deleteLead(id: string): boolean {
  initSeedData();
  const idx = leads.findIndex((l) => l.id === id);
  if (idx === -1) return false;
  leads.splice(idx, 1);
  followUps = followUps.filter((f) => f.leadId !== id);
  return true;
}

// ==================== CRUD: FollowUps ====================

export function getFollowUps(leadId?: string, projectId?: string): CRMFollowUp[] {
  initSeedData();
  let result = [...followUps];
  if (leadId) result = result.filter((f) => f.leadId === leadId);
  if (projectId) result = result.filter((f) => f.projectId === projectId);
  return result.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export function addFollowUp(data: Omit<CRMFollowUp, "id">): CRMFollowUp {
  initSeedData();
  const fu: CRMFollowUp = { ...data, id: generateId("fu") };
  followUps.push(fu);
  return fu;
}

// ==================== CRUD: Projects ====================

export function getProjects(): CRMProject[] {
  initSeedData();
  return [...projects];
}

export function getProjectById(id: string): CRMProject | undefined {
  initSeedData();
  return projects.find((p) => p.id === id);
}

export function createProject(data: Omit<CRMProject, "id" | "createdAt" | "updatedAt">): CRMProject {
  initSeedData();
  const now = new Date().toISOString();
  const proj: CRMProject = { ...data, id: generateId("proj"), createdAt: now, updatedAt: now };
  projects.push(proj);
  return proj;
}

export function updateProject(id: string, data: Partial<CRMProject>): CRMProject | null {
  initSeedData();
  const idx = projects.findIndex((p) => p.id === id);
  if (idx === -1) return null;
  projects[idx] = { ...projects[idx], ...data, updatedAt: new Date().toISOString() };
  return projects[idx];
}

export function deleteProject(id: string): boolean {
  initSeedData();
  const idx = projects.findIndex((p) => p.id === id);
  if (idx === -1) return false;
  projects.splice(idx, 1);
  followUps = followUps.filter((f) => f.projectId !== id);
  return true;
}

// ==================== CRUD: Master Values ====================

export function getMasterValues(type?: MasterLookupType): MasterLookupItem[] {
  initSeedData();
  if (type) return masterValues.filter((m) => m.type === type).sort((a, b) => a.sortOrder - b.sortOrder);
  return [...masterValues].sort((a, b) => a.sortOrder - b.sortOrder);
}

export function addMasterValue(data: Omit<MasterLookupItem, "id">): MasterLookupItem {
  initSeedData();
  const item: MasterLookupItem = { ...data, id: generateId("mv") };
  masterValues.push(item);
  return item;
}

export function updateMasterValue(id: string, data: Partial<MasterLookupItem>): MasterLookupItem | null {
  initSeedData();
  const idx = masterValues.findIndex((m) => m.id === id);
  if (idx === -1) return null;
  masterValues[idx] = { ...masterValues[idx], ...data };
  return masterValues[idx];
}

export function deleteMasterValue(id: string): boolean {
  initSeedData();
  const idx = masterValues.findIndex((m) => m.id === id);
  if (idx === -1) return false;
  masterValues.splice(idx, 1);
  return true;
}

// ==================== CRUD: Notifications ====================

export function getNotifications(): CRMNotification[] {
  initSeedData();
  return [...notifications].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export function addNotification(data: Omit<CRMNotification, "id" | "createdAt">): CRMNotification {
  initSeedData();
  const notif: CRMNotification = { ...data, id: generateId("notif"), createdAt: new Date().toISOString() };
  notifications.push(notif);
  return notif;
}

export function updateNotification(id: string, data: Partial<CRMNotification>): CRMNotification | null {
  initSeedData();
  const idx = notifications.findIndex((n) => n.id === id);
  if (idx === -1) return null;
  notifications[idx] = { ...notifications[idx], ...data };
  return notifications[idx];
}

export function deleteNotification(id: string): boolean {
  initSeedData();
  const idx = notifications.findIndex((n) => n.id === id);
  if (idx === -1) return false;
  notifications.splice(idx, 1);
  return true;
}

// ==================== CRUD: Company Config ====================

export function getCompanyConfig(): CRMCompanyConfig | null {
  initSeedData();
  return companyConfig;
}

export function updateCompanyConfig(data: Partial<CRMCompanyConfig>): CRMCompanyConfig {
  initSeedData();
  if (!companyConfig) {
    companyConfig = { id: generateId("cc"), companyName: "", yearlyTargetRevenue: 0, updatedAt: new Date().toISOString() };
  }
  companyConfig = { ...companyConfig, ...data, updatedAt: new Date().toISOString() };
  return companyConfig;
}

// ==================== Dashboard Helpers ====================

export function getLeadsByStage(leads: CRMLead[]): { stage: LeadStage; count: number; value: number }[] {
  const map = new Map<LeadStage, { count: number; value: number }>();
  leads.forEach((l) => {
    const existing = map.get(l.stage) || { count: 0, value: 0 };
    map.set(l.stage, { count: existing.count + 1, value: existing.value + l.value });
  });
  return Array.from(map.entries()).map(([stage, data]) => ({ stage, ...data }));
}

export function getLeadsBySource(leads: CRMLead[]): { source: string; count: number }[] {
  const map = new Map<string, number>();
  leads.forEach((l) => {
    map.set(l.source, (map.get(l.source) || 0) + 1);
  });
  return Array.from(map.entries()).map(([source, count]) => ({ source, count }));
}

// ==================== Reset ====================

export function resetCRMData(): void {
  leads = [];
  followUps = [];
  projects = [];
  masterValues = [];
  notifications = [];
  companyConfig = null;
  initialized = false;
}
