// ==================== Auth Service ====================
// All auth-related API calls

import { apiClient } from "./client";
import type { LoginPayload, LoginResponse, CheckSessionPayload, CheckSessionResponse } from "@/lib/types/auth.types";

export const authService = {
  login: (payload: LoginPayload) =>
    apiClient.post<LoginResponse>("/Auth/Login", payload),
  
  checkSession: (payload: CheckSessionPayload) =>
    apiClient.post<CheckSessionResponse>("/Auth/CheckSession", payload),
};
