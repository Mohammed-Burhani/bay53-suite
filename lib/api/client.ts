// ==================== API Client ====================
// Centralized HTTP client for all .NET API calls

import { auth } from "@/lib/auth";

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "https://bay53service.bay53.com/api";

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public data?: unknown
  ) {
    super(message);
    this.name = "ApiError";
  }
}

async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${BASE_URL}${endpoint}`;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    accept: "*/*",
    ...(options.headers as Record<string, string>),
  };

  // Attach session token
  const sessionId = auth.getSessionId();
  if (sessionId) {
    headers["Authorization"] = sessionId;
  }

  const response = await fetch(url, { ...options, headers });

  // Handle response
  const text = await response.text();
  
  // Check for session errors (API returns 200 with error text)
  if (text === "Invalid Session or Session Expired") {
    auth.clearSession();
    if (typeof window !== "undefined") {
      window.location.href = "/login";
    }
    throw new ApiError(401, "Session expired", text);
  }

  // Handle HTTP errors
  if (!response.ok) {
    let errorData: unknown = text;
    try {
      errorData = JSON.parse(text);
    } catch {
      // Keep as text
    }
    
    // Handle session expiration on 400/401/403 status codes
    // API returns 400 with "Invalid Session or Session Expired" text
    if (response.status === 400 || response.status === 401 || response.status === 403) {
      if (text === "Invalid Session or Session Expired") {
        auth.clearSession();
        if (typeof window !== "undefined") {
          window.location.href = "/login";
        }
      }
    }
    
    throw new ApiError(response.status, `API Error: ${response.status}`, errorData);
  }

  // Parse successful response
  if (!text) return undefined as T;
  
  try {
    return JSON.parse(text) as T;
  } catch {
    return text as T;
  }
}

export const apiClient = {
  get: <T>(endpoint: string, options?: RequestInit) =>
    request<T>(endpoint, { ...options, method: "GET" }),

  post: <T>(endpoint: string, body: unknown, options?: RequestInit) =>
    request<T>(endpoint, {
      ...options,
      method: "POST",
      body: JSON.stringify(body),
    }),

  put: <T>(endpoint: string, body: unknown, options?: RequestInit) =>
    request<T>(endpoint, {
      ...options,
      method: "PUT",
      body: JSON.stringify(body),
    }),

  delete: <T>(endpoint: string, options?: RequestInit) =>
    request<T>(endpoint, { ...options, method: "DELETE" }),
};
