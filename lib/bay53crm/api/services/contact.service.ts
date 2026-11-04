// ==================== CRM Contact API ====================
// Mirrors the "Contact" tag of the CRM swagger. Responses are untyped upstream: endpoints seen live default <T> to the DTO in ../dto.ts, the rest to `unknown`.

import { crmHttp } from "../client";
import type { CrmContact } from "../dto";
import type { CrmSchemas as S } from "../types";

export const contactApi = {
  list: <T = CrmContact[]>(payload: S["ContactSearchParams"]) =>
    crmHttp.post<T>("/Contact/List", payload),
  get: <T = CrmContact>(id: number) =>
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
