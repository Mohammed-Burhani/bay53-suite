// ==================== Auth Service ====================
// All auth-related API calls

import { apiClient } from "./client";
import type { 
  LoginPayload,
  LoginResponse,
  GenerateOtpPayload, 
  GenerateOtpResponse, 
  VerifyOtpPayload, 
  VerifyOtpResponse,
  CheckSessionPayload, 
  CheckSessionResponse 
} from "@/lib/types/auth.types";

export const authService = {
  login: (payload: LoginPayload) =>
    apiClient.post<LoginResponse>("/Auth/Login", payload),

  generateOtp: (payload: GenerateOtpPayload) =>
    apiClient.post<GenerateOtpResponse>("/Auth/GenerateOtp", payload),
  
  verifyOtpLogin: (payload: VerifyOtpPayload) =>
    apiClient.post<VerifyOtpResponse>("/Auth/VerifyOtpLogin", payload),
  
  checkSession: (payload: CheckSessionPayload) =>
    apiClient.post<CheckSessionResponse>("/Auth/CheckSession", payload),
};
