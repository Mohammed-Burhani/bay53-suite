// ==================== CRM Common API ====================
// Mirrors the "Common" tag of the CRM swagger. Responses are untyped upstream: pass the unwrapped `data` DTO as <T> when integrating.

import { crmHttp } from "../client";
import type { CrmSchemas as S } from "../types";

export const commonApi = {
  dashboardResult: <T = unknown>(payload: S["DashboardResultParams"]) =>
    crmHttp.post<T>("/Common/DashboardResult", payload),
  fYList: <T = unknown>() =>
    crmHttp.get<T>("/Common/FYList"),
  pieChartResult: <T = unknown>(payload: S["PieChartSearchParams"]) =>
    crmHttp.post<T>("/Common/PieChartResult", payload),
  quatationList: <T = unknown>(payload: S["QuatationSearchParams"]) =>
    crmHttp.post<T>("/Common/QuatationList", payload),
  enquiryList: <T = unknown>(payload: S["EnquiryListRequestViewModel"]) =>
    crmHttp.post<T>("/Common/EnquiryList", payload),
  externalSiteLink: <T = unknown>() =>
    crmHttp.post<T>("/Common/ExternalSiteLink"),
};
