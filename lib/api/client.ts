// ==================== API Client ====================
// Centralized HTTP client for all .NET API calls

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://52.172.96.142:8352/api";

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

  // Attach session token if available
  if (typeof window !== "undefined") {
    const session = localStorage.getItem("auth_session");
    if (session) {
      try {
        const parsed = JSON.parse(session);
        const sessionId = parsed?.user?.currentSessionId;
        if (sessionId) {
          headers["Authorization"] = `Bearer ${sessionId}`;
        }
      } catch {
        // ignore parse errors
      }
    }
  }

  const response = await fetch(url, { ...options, headers });

  if (!response.ok) {
    let errorData: unknown;
    try {
      errorData = await response.json();
    } catch {
      errorData = await response.text();
    }
    throw new ApiError(response.status, `API Error: ${response.status}`, errorData);
  }

  // Handle empty responses
  const text = await response.text();
  if (!text) return undefined as T;

  return JSON.parse(text) as T;
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
