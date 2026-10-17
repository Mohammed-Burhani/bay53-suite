// ==================== API Client ====================
// Centralized HTTP client for all .NET API calls

import { auth } from "@/lib/auth";
import { captureResponse, responseMessage, type ActivityTrace } from "@/lib/activity-log/recorder";

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

/** fetch options plus an optional activity trace that records this call's status and response. */
export type ApiRequestOptions = RequestInit & { trace?: ActivityTrace };

async function request<T>(
  endpoint: string,
  { trace, ...options }: ApiRequestOptions = {}
): Promise<T> {
  const url = `${BASE_URL}${endpoint}`;
  const method = options.method ?? "GET";
  const startedAt = Date.now();
  const recordCall = (status: number | null, ok: boolean, body: unknown, message?: string) =>
    trace?.record({
      method,
      endpoint: endpoint.split("?")[0],
      http_status: status,
      ok,
      message: message ?? responseMessage(body, ok),
      response: captureResponse(body),
      started_at: new Date(startedAt).toISOString(),
      duration_ms: Date.now() - startedAt,
    });

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

  if (process.env.NODE_ENV === "development") {
    console.info(`[.NET API] ${options.method ?? "GET"} ${url}`, {
      body: options.body ? JSON.parse(options.body as string) : undefined,
    });
  }

  let response: Response;
  let text: string;
  try {
    response = await fetch(url, { ...options, headers });
    text = await response.text();
  } catch (error) {
    recordCall(null, false, null, error instanceof Error ? error.message : String(error));
    throw error;
  }

  // Parsed once for the trace; the branches below keep their own parsing.
  if (trace) {
    let body: unknown = text;
    try {
      body = text ? JSON.parse(text) : null;
    } catch {
      // keep as text
    }
    const sessionExpired = text === "Invalid Session or Session Expired";
    recordCall(sessionExpired ? 401 : response.status, response.ok && !sessionExpired, body);
  }

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
      console.error("API Error Response:", {
        status: response.status,
        url,
        data: errorData
      });
    } catch {
      // Keep as text
      console.error("API Error (non-JSON):", {
        status: response.status,
        url,
        text
      });
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
  get: <T>(endpoint: string, options?: ApiRequestOptions) =>
    request<T>(endpoint, { ...options, method: "GET" }),

  post: <T>(endpoint: string, body: unknown, options?: ApiRequestOptions) =>
    request<T>(endpoint, {
      ...options,
      method: "POST",
      body: JSON.stringify(body),
    }),

  put: <T>(endpoint: string, body: unknown, options?: ApiRequestOptions) =>
    request<T>(endpoint, {
      ...options,
      method: "PUT",
      body: JSON.stringify(body),
    }),

  delete: <T>(endpoint: string, options?: ApiRequestOptions) =>
    request<T>(endpoint, { ...options, method: "DELETE" }),
};
