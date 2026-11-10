// ==================== CRM API Client ====================
// HTTP client for the Bay53 CRM API (https://baycrmapi.bay53.in/swagger).
// Calls go through the same-origin proxy at app/api/crm/[...path]/route.ts because the upstream sends no CORS headers.
// Auth is a Bearer JWT (valid ~30 days). On a 401 the token is dropped so the caller can send the user to log in.

import { crmTokenStore } from "./token-store";

const BASE_URL = "/api/crm";

export class CrmApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public data?: unknown
  ) {
    super(message);
    this.name = "CrmApiError";
  }
}

/**
 * Lead saves (Add, UpdateLead, UpdateLeadTitle) store the record, then email the assignee. A bad address makes the call
 * answer `hasError` ("Invalid domain token at offset 11") although the record is saved.
 */
export const isNotificationFailure = (error: unknown): error is CrmApiError =>
  error instanceof CrmApiError && /invalid domain token|mailbox|smtp/i.test(error.message);

/** Every endpoint answers 200 with `{ hasError, message?, data? }`; failures are in the body, not the status. */
interface Envelope {
  hasError: boolean;
  message?: string;
  data?: unknown;
}

const isEnvelope = (body: unknown): body is Envelope =>
  typeof body === "object" && body !== null && typeof (body as Envelope).hasError === "boolean";

/** The payload of a successful envelope; throws on `hasError`. Bodies without an envelope pass through. */
const unwrap = (body: unknown, status: number): unknown => {
  if (!isEnvelope(body)) return body;
  if (body.hasError) throw new CrmApiError(status, body.message ?? "CRM API request failed", body);
  return body.data;
};

type Query = Record<string, string | number | boolean | undefined>;

interface RequestOptions {
  method: "GET" | "POST";
  /** Plain values are sent as JSON; FormData is sent as multipart. */
  body?: unknown;
  query?: Query;
  /** Return the raw Blob (file downloads) instead of parsed JSON/text. */
  asBlob?: boolean;
}

const buildUrl = (endpoint: string, query?: Query) => {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query ?? {})) {
    if (value !== undefined) params.set(key, String(value));
  }
  const qs = params.toString();
  return `${BASE_URL}${endpoint}${qs ? `?${qs}` : ""}`;
};

const send = (endpoint: string, { method, body, query }: RequestOptions) => {
  const headers: Record<string, string> = { accept: "application/json" };
  const token = crmTokenStore.get();
  if (token) headers.Authorization = `Bearer ${token}`;

  let payload: BodyInit | undefined;
  if (body instanceof FormData) {
    payload = body; // the browser sets the multipart boundary
  } else if (body !== undefined) {
    headers["Content-Type"] = "application/json";
    payload = JSON.stringify(body);
  }

  return fetch(buildUrl(endpoint, query), { method, headers, body: payload });
};

async function request<T>(endpoint: string, options: RequestOptions): Promise<T> {
  const response = await send(endpoint, options);

  if (response.status === 401) crmTokenStore.clear();

  if (!response.ok) {
    const text = await response.text();
    let data: unknown = text;
    try {
      data = JSON.parse(text);
    } catch {
      // keep as text
    }
    throw new CrmApiError(response.status, `CRM API Error: ${response.status}`, data);
  }

  if (options.asBlob) return (await response.blob()) as T;

  const text = await response.text();
  if (!text) return undefined as T;
  try {
    return unwrap(JSON.parse(text), response.status) as T;
  } catch (error) {
    if (error instanceof CrmApiError) throw error;
    return text as T; // not JSON
  }
}

export const crmHttp = {
  get: <T>(endpoint: string, query?: Query) => request<T>(endpoint, { method: "GET", query }),

  post: <T>(endpoint: string, body?: unknown) => request<T>(endpoint, { method: "POST", body }),

  upload: <T>(endpoint: string, form: FormData) => request<T>(endpoint, { method: "POST", body: form }),

  download: (endpoint: string, query?: Query) => request<Blob>(endpoint, { method: "GET", query, asBlob: true }),
};
