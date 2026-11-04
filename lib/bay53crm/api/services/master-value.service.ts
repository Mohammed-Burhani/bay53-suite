// ==================== CRM MasterValue API ====================
// Mirrors the "MasterValue" tag of the CRM swagger. Responses are untyped upstream: endpoints seen live default <T> to the DTO in ../dto.ts, the rest to `unknown`.

import { crmHttp } from "../client";
import type { CrmMasterValue } from "../dto";
import type { CrmSchemas as S } from "../types";

export const masterValueApi = {
  list: <T = unknown>(payload: S["MasterValueSearchParams"]) =>
    crmHttp.post<T>("/MasterValue/List", payload),
  get: <T = unknown>(id: number) =>
    crmHttp.post<T>("/MasterValue/Get", id),
  add: <T = unknown>(payload: S["MasterValueViewModel"]) =>
    crmHttp.post<T>("/MasterValue/Add", payload),
  update: <T = unknown>(payload: S["MasterValueViewModel"]) =>
    crmHttp.post<T>("/MasterValue/Update", payload),
  delete: <T = unknown>(id: number) =>
    crmHttp.post<T>("/MasterValue/Delete", id),
  activeList: <T = CrmMasterValue[]>(payload: S["MasterValueSearchParams"]) =>
    crmHttp.post<T>("/MasterValue/ActiveList", payload),
};
