// ==================== CRM EmailSetting API ====================
// Mirrors the "EmailSetting" tag of the CRM swagger. Responses are untyped upstream: endpoints seen live default <T> to the DTO in ../dto.ts, the rest to `unknown`.

import { crmHttp } from "../client";
import type { CrmSchemas as S } from "../types";

export const emailSettingApi = {
  list: <T = unknown>(payload: S["EmailSettingSearchParams"]) =>
    crmHttp.post<T>("/EmailSetting/List", payload),
  get: <T = unknown>(id: number) =>
    crmHttp.post<T>("/EmailSetting/Get", id),
  add: <T = unknown>(payload: S["EmailSettingViewModel"]) =>
    crmHttp.post<T>("/EmailSetting/Add", payload),
  update: <T = unknown>(payload: S["EmailSettingViewModel"]) =>
    crmHttp.post<T>("/EmailSetting/Update", payload),
  delete: <T = unknown>(id: number) =>
    crmHttp.post<T>("/EmailSetting/Delete", id),
};
