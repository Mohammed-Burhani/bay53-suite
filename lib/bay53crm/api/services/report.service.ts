// ==================== CRM Report API ====================
// Mirrors the "Report" tag of the CRM swagger. Responses are untyped upstream: pass the unwrapped `data` DTO as <T> when integrating.

import { crmHttp } from "../client";
import type { CrmSchemas as S } from "../types";

export const reportApi = {
  campaignDetailsReportList: <T = unknown>(payload: S["CampaignDetailsReportViewModel"]) =>
    crmHttp.post<T>("/Report/CampaignDetailsReportList", payload),
  leadActivityReportList: <T = unknown>(payload: S["LeadActivityReportViewModel"]) =>
    crmHttp.post<T>("/Report/LeadActivityReportList", payload),
  leadDetailsReportList: <T = unknown>(payload: S["LeadDetailsReportViewModel"]) =>
    crmHttp.post<T>("/Report/LeadDetailsReportList", payload),
  salesStageStatusReportList: <T = unknown>(payload: S["SalesStageStatusReportViewModel"]) =>
    crmHttp.post<T>("/Report/SalesStageStatusReportList", payload),
};
