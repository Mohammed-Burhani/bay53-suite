// ==================== CRM Report API ====================
// Mirrors the "Report" tag of the CRM swagger. Responses are untyped upstream: endpoints seen live default <T> to the DTO in ../dto.ts, the rest to `unknown`.

import { crmHttp } from "../client";
import type { CrmLeadDetailsReportRow, CrmSalesStageStatusReportRow } from "../dto";
import type { CrmSchemas as S } from "../types";

export const reportApi = {
  campaignDetailsReportList: <T = unknown>(payload: S["CampaignDetailsReportViewModel"]) =>
    crmHttp.post<T>("/Report/CampaignDetailsReportList", payload),
  leadActivityReportList: <T = unknown>(payload: S["LeadActivityReportViewModel"]) =>
    crmHttp.post<T>("/Report/LeadActivityReportList", payload),
  leadDetailsReportList: <T = CrmLeadDetailsReportRow[]>(payload: S["LeadDetailsReportViewModel"]) =>
    crmHttp.post<T>("/Report/LeadDetailsReportList", payload),
  salesStageStatusReportList: <T = CrmSalesStageStatusReportRow[]>(payload: S["SalesStageStatusReportViewModel"]) =>
    crmHttp.post<T>("/Report/SalesStageStatusReportList", payload),
};
