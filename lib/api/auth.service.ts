// ==================== Auth Service ====================
// All auth-related API calls

import { apiClient } from "./client";
import type { LoginPayload, LoginResponse } from "@/lib/types/auth.types";

export const authService = {
  login: (payload: LoginPayload) =>
    apiClient.post<LoginResponse>("/Auth/Login", payload),
};
