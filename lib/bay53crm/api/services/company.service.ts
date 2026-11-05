// ==================== CRM Company API ====================
// Mirrors the "Company" tag of the CRM swagger. Responses are untyped upstream: endpoints seen live default <T> to the DTO in ../dto.ts, the rest to `unknown`.

import { crmHttp } from "../client";
import type { CrmCompany } from "../dto";
import type { CrmSchemas as S } from "../types";

export const companyApi = {
  get: <T = CrmCompany>(id: number) =>
    crmHttp.post<T>("/Company/Get", id),
  update: <T = unknown>(payload: S["CompanyCreateViewModel"]) =>
    crmHttp.post<T>("/Company/Update", payload),
  add: <T = unknown>(payload: S["CompanyCreateViewModel"]) =>
    crmHttp.post<T>("/Company/Add", payload),
};
