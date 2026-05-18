// ==================== Auth Types ====================

export interface LoginPayload {
  userName: string;
  password: string;
}

export interface LoginResponse {
  user: AuthUser;
  company: AuthCompany;
  roles: AuthRole[];
  rights: AuthRight[];
}

export interface AuthUser {
  user_ID: number;
  first_Name: string;
  lastname: string;
  email_ID: string;
  mobileNo: string;
  isEmployee: boolean;
  isLedger: boolean;
  ledger_ID: number;
  isBlocked: boolean;
  description: string | null;
  isDeleted: boolean;
  departmentId: number | null;
  spCode: string | null;
  currentSessionId: string;
}

export interface AuthCompany {
  compName: string;
  address: string | null;
  area: string | null;
  city: string | null;
  state: string | null;
  pinCode: string | null;
  shortCode: string;
  gstNo: string;
  isTaxable: boolean;
  panCardNo: string;
  precision: number;
  id: number;
  sessionId: string | null;
  [key: string]: unknown;
}

export interface AuthRole {
  role_ID: number;
  name: string;
  parent_ID: number;
  bindToSPCode: number;
}

export interface AuthRight {
  right_ID: number;
  name: string;
  type: number;
  operationType: number;
  functionName: string;
  bindToSPCode: number;
}

export interface GenerateOtpPayload {
  userName: string;
}

export interface GenerateOtpResponse {
  message: string;
  expiresInMinutes: number;
  otp: string;
}

export interface VerifyOtpPayload {
  userName: string;
  otp: string;
}

export interface VerifyOtpResponse {
  user: AuthUser;
  company: AuthCompany;
  roles: AuthRole[];
  rights: AuthRight[];
}

export interface AuthSession {
  user: AuthUser;
  company: AuthCompany;
  roles: AuthRole[];
  rights: AuthRight[];
}

export interface CheckSessionPayload {
  id: number;
  sessionId: string;
}

export interface CheckSessionResponse {
  message: string;
}

export interface GoogleAuthPayload {
  email: string;
  name: string;
  googleId: string;
  picture?: string;
}

export interface GoogleAuthResponse {
  user: AuthUser;
  company: AuthCompany;
  roles: AuthRole[];
  rights: AuthRight[];
  isNewUser: boolean;
}
