// ==================== CRM Customer API ====================
// Mirrors the "Customer" tag of the CRM swagger. Responses are untyped upstream: endpoints seen live default <T> to the DTO in ../dto.ts, the rest to `unknown`.

import { crmHttp } from "../client";
import type { CrmCustomerRef } from "../dto";
import type { CrmSchemas as S } from "../types";

export const customerApi = {
  list: <T = CrmCustomerRef[]>(payload: S["CustomerSearchParams"]) =>
    crmHttp.post<T>("/Customer/List", payload),
};
