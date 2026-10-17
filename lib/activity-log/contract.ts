// Wire contract between the browser recorder and the /api/activity routes.
// Field names are snake_case so they map 1:1 onto the Supabase columns.

export type LogModule = "invoice";
export type LogImportance = "info" | "important" | "critical";
export type LogOutcome = "success" | "failure";

/** One .NET API call made while performing an activity. */
export interface ApiCallRecord {
  method: string;
  /** Path only, e.g. "/Invoice/Create". No host, no query string. */
  endpoint: string;
  /** null when no response arrived (network error, CORS, timeout). */
  http_status: number | null;
  ok: boolean;
  message: string | null;
  response: unknown;
  started_at: string;
  duration_ms: number;
}

/** A business action, e.g. an invoice being created, and every API call it made. */
export interface ActivityEntry {
  event_id: string;
  occurred_at: string;
  module: LogModule;
  action: string;
  importance: LogImportance;
  outcome: LogOutcome;
  entity_type?: string | null;
  entity_id?: string | null;
  entity_label?: string | null;
  inv_type?: number | null;
  summary?: string | null;
  error_message?: string | null;
  changes?: unknown;
  metadata?: Record<string, unknown>;
  duration_ms: number;
  page?: string | null;
  api_calls: ApiCallRecord[];
}

/** A lightweight UI event (button click, page open). No payloads. */
export interface UiEventEntry {
  event_id: string;
  occurred_at: string;
  module: LogModule;
  event: string;
  target?: string | null;
  page?: string | null;
  metadata?: Record<string, unknown>;
}

/**
 * Who the browser says is acting. user_id is confirmed server-side through /Auth/CheckSession;
 * the rest is taken from the login response until CheckSession returns it.
 */
export interface ActorClaim {
  user_id: number;
  name: string | null;
  email: string | null;
  company_code: string;
  company_name: string | null;
}

export interface IngestBody {
  activities?: ActivityEntry[];
  events?: UiEventEntry[];
}

/** Request header carrying the URI-encoded JSON ActorClaim. */
export const ACTOR_HEADER = "x-bay53-actor";

/** A stored activity as the admin read API returns it. */
export interface ActivityLogRow {
  id: number;
  event_id: string;
  occurred_at: string;
  recorded_at: string;
  company_code: string;
  company_name: string | null;
  actor_user_id: number;
  actor_name: string | null;
  actor_email: string | null;
  actor_verified: boolean;
  module: string;
  action: string;
  importance: LogImportance;
  outcome: LogOutcome;
  entity_type: string | null;
  entity_id: string | null;
  entity_label: string | null;
  inv_type: number | null;
  summary: string | null;
  error_message: string | null;
  changes: unknown;
  metadata: Record<string, unknown>;
  duration_ms: number | null;
  ip: string | null;
  user_agent: string | null;
  page: string | null;
  api_calls: (ApiCallRecord & { id: number; seq: number })[];
}

export interface ActivityLogPage {
  rows: ActivityLogRow[];
  /** Pass back as `cursor` to load the next (older) page; null when there is none. */
  next_cursor: string | null;
}
