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

// ---- Lookups and reference lists ----

/** Accounts/ListAllUser, Accounts/UserList */
export interface CrmUserRef {
  userName: string;
  fullName: string;
}

/** Common/FYList */
export interface CrmFinancialYear {
  fromDate: string;
  toDate: string;
  /** e.g. "FY 26-27" */
  title: string;
}

/** Customer/List */
export interface CrmCustomerRef {
  id: string;
  companyName: string;
  companyState?: string;
}

/** Contact/CompanyList */
export interface CrmCompanyRef {
  id: string;
  companyName: string;
}

/** Contact/ContactEmailList */
export interface CrmContactEmail {
  email: string;
}

/** Common/EnquiryList */
export interface CrmEnquiryRef {
  id: string;
  enquiryNo: string;
  enquiryDate: string;
}

/** Common/QuatationList */
export interface CrmQuotationList {
  totalCount: number;
  quotations: {
    id: number;
    refno: string;
    totalValue: number;
    isLatest: boolean;
    currency: string;
  }[];
}

// ---- Company, dashboard ----

/** Company/Get */
export interface CrmCompany {
  id: number;
  name: string;
  yearlyTargetRevenue: number;
}

/** Common/DashboardResult */
export interface CrmDashboardResult {
  totalLeads: number;
  openLeads: number;
  valueOfOffers: number;
  valueOfTenders: number;
  taskAssigned: number;
  taskCompleted: number;
  pendingLeads: number;
  ordersWon: number;
  ordersLost: number;
  monthlyTargetRevenue: number;
  yearlyActualRevenue: number;
}

// ---- Lead sub-resources ----

/** LeadCommon/ListLeadNote */
export interface CrmLeadNote {
  id: number;
  description: string;
  createdDate: string;
}

/** LeadCommon/LeadResult. Follow-ups, activities and emails come back empty on stage, so they stay untyped. */
export interface CrmLeadResultItem {
  id: number;
  type: number;
  leadType: number;
  description: string;
  createdDate: string;
}

// ---- Notifications ----

/** Notification/List, Notification/ActiveList (a notification rule) */
export interface CrmNotification {
  id?: number;
  currentStatus: boolean;
  listName: string;
  fullName: string;
  description?: string;
  dNotificationSeverity: number;
  dSubject?: string;
  dPriorNotifications: number;
  dExpirationDays: number;
  sNotificationSeverity: number;
  sPriorNotifications: number;
  sExpirationDays: number;
  sIfNoResults: boolean;
  repeatsEvery: number;
  repeatsType: number;
  /** A .NET TimeSpan serialised as { value: { ticks, days, hours, ... } }. */
  repeatsAt?: unknown;
}

/** Notification/List */
export interface CrmNotificationList {
  list: CrmNotification[];
  totalCount?: number;
}

/** Notification/UserNotificationList. Empty on stage, so rows stay untyped. */
export interface CrmUserNotificationList {
  list: unknown[];
  totalCount: number;
}

// ---- Reports ----

/** Report/LeadDetailsReportList */
export interface CrmLeadDetailsReportRow {
  particulars: string;
  customer: string;
  contactDetails?: string;
  date: string;
  status: string;
  stage: string;
  source: string;
  vertical: string;
  value: number;
  probability: number;
  assignedTo: string;
  createdOn: string;
  updatedOn: string;
  leadDate: string;
  quots?: string;
  companyRegion?: string;
  customerState?: string;
  enquiryId?: number;
  campaignType?: string;
  consultantName?: string;
  contractorDetails?: string;
}

/** Report/SalesStageStatusReportList */
export interface CrmSalesStageStatusReportRow {
  status: number;
  stage: number;
  user: string;
  noofLeads: number;
  value: number;
  avgTimeSpent: number;
  companyRegion?: string;
  customerState?: string;
}
