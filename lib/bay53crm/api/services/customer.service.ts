// ==================== CRM Customer API ====================
// Mirrors the "Customer" tag of the CRM swagger. Responses are untyped upstream: pass the unwrapped `data` DTO as <T> when integrating.

import { crmHttp } from "../client";
import type { CrmSchemas as S } from "../types";

export const customerApi = {
  list: <T = unknown>(payload: S["CustomerSearchParams"]) =>
    crmHttp.post<T>("/Customer/List", payload),
};
