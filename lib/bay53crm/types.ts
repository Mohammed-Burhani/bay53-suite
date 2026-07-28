// ==================== CRM Types ====================

export type LeadStage =
  | "Cold Lead"
  | "Hot Lead"
  | "Tender"
  | "Tender Won"
  | "Tender Lost"
  | "Won"
  | "Lost";

export type ProjectStatus = "Awarded" | "Not Awarded";

export type MasterLookupType =
  | "region"
  | "vertical"
  | "lead_source"
  | "lead_stage"
  | "project_status"
  | "brand_approval_discipline"
  | "customer_state"
  | "assigned_to";

export type LeadStatus = "active" | "closed";

export type BrandApprovalStatus = "Pending" | "Approved" | "Rejected";

export type MakeListAvailability = "Available" | "Not Available";

// ==================== Data Models ====================

export interface CRMLead {
  id: string;
  regionId: string;
  title: string;
  customerState: string;
  vertical: string;
  value: number;
  customerName: string;
  contactPerson: string;
  stage: LeadStage;
  source: string;
  date: string;
  assignedTo: string;
  lastFollowUp: string;
  lastFollowUpDate: string;
  status: LeadStatus;
  createdAt: string;
  updatedAt: string;
  archived: boolean;
}

export interface CRMFollowUp {
  id: string;
  leadId?: string;
  projectId?: string;
  date: string;
  notes: string;
  stage?: LeadStage;
  createdBy: string;
}

export interface CRMProject {
  id: string;
  regionId: string;
  name: string;
  consultantName: string;
  contractorDetails: { name: string; scope: string }[];
  brandApproval: { status: BrandApprovalStatus; discipline: string }[];
  status: ProjectStatus;
  makeListAvailability: MakeListAvailability;
  assignedTo: string;
  notes: CRMFollowUp[];
  createdAt: string;
  updatedAt: string;
  archived: boolean;
}

export interface MasterLookupItem {
  id: string;
  type: MasterLookupType;
  code?: string;
  name: string;
  color?: string;
  sortOrder: number;
  isActive: boolean;
}

export interface CRMNotification {
  id: string;
  type: string;
  title: string;
  message: string;
  targetRole: string;
  isActive: boolean;
  createdAt: string;
}

export interface CRMCompanyConfig {
  id: string;
  companyName: string;
  yearlyTargetRevenue: number;
  updatedAt: string;
}

// ==================== Filter Types ====================

export interface CRMLeadsFilters {
  fromDate: string;
  toDate: string;
  regionIds: string[];
  verticals: string[];
  stages: LeadStage[];
  assignedTos: string[];
  sources: string[];
  status: LeadStatus | "all";
  valueMin: string;
  valueMax: string;
}

export interface CRMProjectsFilters {
  assignedTo: string;
  name: string;
  status: string;
  regionId: string;
  archived: boolean;
  search: string;
}

export interface CRMLeadsReportFilters {
  fromDate: string;
  toDate: string;
  probability: string;
  worthMin: string;
  worthMax: string;
  customer: string;
  regionIds: string[];
  stateRegion: string;
  customerStates: string[];
  stages: LeadStage[];
  assignedTos: string[];
  sources: string[];
  statuses: string[];
}

export interface CRMLeadActivityFilters {
  fromDate: string;
  toDate: string;
  assignedTos: string[];
}

export interface CRMProjectReportFilters {
  regionIds: string[];
  statuses: string[];
  assignedTos: string[];
  fromDate: string;
  toDate: string;
}

export interface CRMSalesStageFilters {
  fromDate: string;
  toDate: string;
  regionIds: string[];
  assignedTos: string[];
}

// ==================== Dashboard Types ====================

export interface CRMKPI {
  label: string;
  value: string | number;
  icon: React.ElementType;
  color: string;
  bgColor: string;
  change?: string;
}

export interface CRMStageData {
  stage: LeadStage;
  count: number;
  value: number;
}
