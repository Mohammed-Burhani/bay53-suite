// ==================== CRM Lead API ====================
// Mirrors the "Lead" tag of the CRM swagger. Responses are untyped upstream: endpoints seen live default <T> to the DTO in ../dto.ts, the rest to `unknown`.

import { crmHttp } from "../client";
import type { CrmLead, CrmLeadListItem } from "../dto";
import type { CrmSchemas as S } from "../types";

export const leadApi = {
  list: <T = CrmLeadListItem[]>(payload: S["LeadSearchParams"]) =>
    crmHttp.post<T>("/Lead/List", payload),
  get: <T = CrmLead>(id: number) =>
    crmHttp.post<T>("/Lead/Get", id),
  add: <T = unknown>(payload: S["LeadCreateViewModel"]) =>
    crmHttp.post<T>("/Lead/Add", payload),
  update: <T = unknown>(payload: S["LeadCreateViewModel"]) =>
    crmHttp.post<T>("/Lead/Update", payload),
  delete: <T = unknown>(id: number) =>
    crmHttp.post<T>("/Lead/Delete", id),
  updateLead: <T = unknown>(payload: S["LeadUpdateViewModel"]) =>
    crmHttp.post<T>("/Lead/UpdateLead", payload),
  updateLeadTitle: <T = unknown>(payload: S["LeadUpdateViewModel"]) =>
    crmHttp.post<T>("/Lead/UpdateLeadTitle", payload),
  addQsoft: <T = unknown>(payload: S["LeadCreateViewModel"]) =>
    crmHttp.post<T>("/Lead/Add/Qsoft", payload),
};
