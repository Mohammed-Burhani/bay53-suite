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
  CheckSessionResponse,
  GoogleAuthPayload,
  GoogleAuthResponse,
  CompanySetupPayload,
  CompanySetupResponse
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
  
  googleAuth: (payload: GoogleAuthPayload) =>
    apiClient.post<GoogleAuthResponse>("/Auth/GoogleAuth", payload),
  
  companySetup: async (payload: CompanySetupPayload) => {
    const formData = new FormData();
    
    // Append all fields
    formData.append("companyName", payload.companyName);
    formData.append("country", payload.country);
    formData.append("address", payload.address);
    formData.append("email", payload.email);
    formData.append("phoneNumber", payload.phoneNumber);
    formData.append("contactPerson", payload.contactPerson);
    formData.append("gstNumber", payload.gstNumber);
    formData.append("state", payload.state);
    formData.append("pinCode", payload.pinCode);
    formData.append("currency", payload.currency);
    formData.append("adminUser", payload.adminUser);
    formData.append("password", payload.password);
    formData.append("natureOfBusiness", payload.natureOfBusiness);
    
    if (payload.logo) {
      formData.append("logo", payload.logo);
    }
    
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/Auth/CompanySetup`, {
      method: "POST",
      body: formData,
    });
    
    if (!response.ok) {
      throw new Error(`Company setup failed: ${response.status}`);
    }
    
    return response.json() as Promise<CompanySetupResponse>;
  },
};
