// Response shapes observed from the live CRM API. The swagger has no response schemas, so these are hand-maintained.
// Only endpoints that were reachable and returned data are typed here; add the rest as each module is integrated.
// Fields are `?` when a sampled record omitted them (the server drops null properties).

/** A row of the "master values" lookup tables, also embedded in other records (e.g. a campaign's type). */
export interface CrmMasterValue {
  id: number;
  text: string;
  description?: string;
  type: number;
  isPublished: boolean;
}

/** Lead/List */
export interface CrmLeadListItem {
  id: number;
  title: string;
  vertical: number;
  value: number;
  customer: string;
  customerState?: string;
  contactName?: string;
  /** Stage label (e.g. "Hot Lead"), unlike CrmLead.stage which is the numeric id. */
  stage: string;
  leadDate: string;
  assignTo?: string;
  companyRegion?: string;
  valueCurrency?: string;
  lastActivityDate?: string;
  lastActivityDescription?: string;
}

/** Contact/List, Contact/Get, and the contact embedded in a lead. */
export interface CrmContact {
  id: number;
  companyName: string;
  firstName: string;
  phone1?: string;
  phone2?: string;
  mobile1?: string;
  email?: string;
  companyRef: number;
}

/** Lead/Get */
export interface CrmLead {
  id: number;
  title: string;
  stage: number;
  source: number;
  status: number;
  value: number;
  probability: number;
  assignTo?: string;
  receivedBy?: string;
  leadDate: string;
  contact: CrmContact;
  customer: string;
  customerState?: string;
  customerRef: number;
  department: number;
  enquiryId?: number;
  owner?: string;
  vertical: number;
  companyRegion?: string;
}

/** LeadCommon/LeadDetailsCount */
export interface CrmLeadDetailsCount {
  leadCallCount: number;
  leadEmailCount: number;
  leadMeetingCount: number;
  leadActivityCount: number;
  leadNoteCount: number;
  leadFollowupCount: number;
  leadAttachmentCount: number;
  leadTotalCount: number;
  assignTo?: string;
  createdDate?: string;
  modifiedDate?: string;
  lastUpdatedBy?: string;
}

/** LeadCommon/LeadAttachmentList */
export interface CrmLeadAttachment {
  id: number;
  name: string;
  path: string;
  leadId: number;
  filePath: string;
}

/** LeadCommon/ListLeadHistory */
export interface CrmLeadHistoryEntry {
  id: number;
  updatedOn: string;
  updatedBy: string;
  stage: number;
  status: number;
}

/** Campaign/Get */
export interface CrmCampaign {
  id: number;
  name: string;
  description?: string;
  campaignType: CrmMasterValue;
  startdate: string;
  assignedTo?: string;
  currentStatus: number;
  contractorDetails?: string;
  note?: string;
  availabilityStatus: number;
  companyRegion?: string;
}

/** Campaign/List */
export interface CrmCampaignListItem extends CrmCampaign {
  lastActivityDate?: string;
  lastActivityDescription?: string;
  expectedRevenue?: number;
  enddate?: string;
}
