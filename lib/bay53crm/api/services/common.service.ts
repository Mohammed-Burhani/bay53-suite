// ==================== CRM Common API ====================
// Mirrors the "Common" tag of the CRM swagger. Responses are untyped upstream: endpoints seen live default <T> to the DTO in ../dto.ts, the rest to `unknown`.

import { crmHttp } from "../client";
import type { CrmDashboardResult, CrmEnquiryRef, CrmFinancialYear, CrmQuotationList } from "../dto";
import type { CrmSchemas as S } from "../types";

export const commonApi = {
  dashboardResult: <T = CrmDashboardResult>(payload: S["DashboardResultParams"]) =>
    crmHttp.post<T>("/Common/DashboardResult", payload),
  fyList: <T = CrmFinancialYear[]>() =>
    crmHttp.get<T>("/Common/FYList"),
  pieChartResult: <T = unknown>(payload: S["PieChartSearchParams"]) =>
    crmHttp.post<T>("/Common/PieChartResult", payload),
  quatationList: <T = CrmQuotationList>(payload: S["QuatationSearchParams"]) =>
    crmHttp.post<T>("/Common/QuatationList", payload),
  enquiryList: <T = CrmEnquiryRef[]>(payload: S["EnquiryListRequestViewModel"]) =>
    crmHttp.post<T>("/Common/EnquiryList", payload),
  externalSiteLink: <T = string>() =>
    crmHttp.post<T>("/Common/ExternalSiteLink"),
};
