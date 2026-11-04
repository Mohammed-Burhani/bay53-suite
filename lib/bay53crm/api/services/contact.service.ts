// ==================== CRM Contact API ====================
// Mirrors the "Contact" tag of the CRM swagger. Responses are untyped upstream: pass the unwrapped `data` DTO as <T> when integrating.

import { crmHttp } from "../client";
import type { CrmSchemas as S } from "../types";

export const contactApi = {
  list: <T = unknown>(payload: S["ContactSearchParams"]) =>
    crmHttp.post<T>("/Contact/List", payload),
  get: <T = unknown>(id: number) =>
    crmHttp.post<T>("/Contact/Get", id),
  add: <T = unknown>(payload: S["ContactCreateViewModel"]) =>
    crmHttp.post<T>("/Contact/Add", payload),
  update: <T = unknown>(payload: S["ContactCreateViewModel"]) =>
    crmHttp.post<T>("/Contact/Update", payload),
  delete: <T = unknown>(id: number) =>
    crmHttp.post<T>("/Contact/Delete", id),
  contactEmailList: <T = unknown>() =>
    crmHttp.post<T>("/Contact/ContactEmailList"),
  companyList: <T = unknown>() =>
    crmHttp.post<T>("/Contact/CompanyList"),
};
