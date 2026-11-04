// ==================== CRM Accounts API ====================
// Mirrors the "Accounts" tag of the CRM swagger. Responses are untyped upstream: endpoints seen live default <T> to the DTO in ../dto.ts, the rest to `unknown`.

import { crmHttp } from "../client";
import type { CrmSchemas as S } from "../types";

export const accountsApi = {
  authenticate: <T = unknown>(payload: S["AuthenticateRequest"]) =>
    crmHttp.post<T>("/Accounts/Authenticate", payload),
  refreshToken: <T = unknown>() =>
    crmHttp.post<T>("/Accounts/refresh-token"),
  userList: <T = unknown>(payload: S["UserListRequestViewModel"]) =>
    crmHttp.post<T>("/Accounts/UserList", payload),
  listAllUser: <T = unknown>() =>
    crmHttp.post<T>("/Accounts/ListAllUser"),
};
