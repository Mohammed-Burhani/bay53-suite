// ==================== CRM MasterValue API ====================
// Mirrors the "MasterValue" tag of the CRM swagger. Responses are untyped upstream: pass the unwrapped `data` DTO as <T> when integrating.

import { crmHttp } from "../client";
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
  activeList: <T = unknown>(payload: S["MasterValueSearchParams"]) =>
    crmHttp.post<T>("/MasterValue/ActiveList", payload),
};
