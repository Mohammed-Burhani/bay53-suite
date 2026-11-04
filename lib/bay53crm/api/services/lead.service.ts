// ==================== CRM Lead API ====================
// Mirrors the "Lead" tag of the CRM swagger. Responses are untyped upstream: pass the unwrapped `data` DTO as <T> when integrating.

import { crmHttp } from "../client";
import type { CrmSchemas as S } from "../types";

export const leadApi = {
  list: <T = unknown>(payload: S["LeadSearchParams"]) =>
    crmHttp.post<T>("/Lead/List", payload),
  get: <T = unknown>(id: number) =>
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
