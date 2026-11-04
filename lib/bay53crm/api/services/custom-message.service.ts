// ==================== CRM CustomMessage API ====================
// Mirrors the "CustomMessage" tag of the CRM swagger. Responses are untyped upstream: pass the unwrapped `data` DTO as <T> when integrating.

import { crmHttp } from "../client";
import type { CrmSchemas as S } from "../types";

export const customMessageApi = {
  list: <T = unknown>(payload: S["CustomMessageSearchParams"]) =>
    crmHttp.post<T>("/CustomMessage/List", payload),
  get: <T = unknown>(id: number) =>
    crmHttp.post<T>("/CustomMessage/Get", id),
  add: <T = unknown>(payload: S["CustomMessageViewModel"]) =>
    crmHttp.post<T>("/CustomMessage/Add", payload),
  update: <T = unknown>(payload: S["CustomMessageViewModel"]) =>
    crmHttp.post<T>("/CustomMessage/Update", payload),
  delete: <T = unknown>(id: number) =>
    crmHttp.post<T>("/CustomMessage/Delete", id),
};
