// Server-only helpers for the activity log routes. Holds the service-role key, so this module
// must never be imported from client code.

import { createHash } from "node:crypto";
import { isIP } from "node:net";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { ACTOR_HEADER, type ActorClaim } from "./contract";

if (typeof window !== "undefined") {
  throw new Error("lib/activity-log/server is server-only");
}

// ---------- Supabase (service role) ----------

let admin: SupabaseClient | null = null;

export function logsDb(): SupabaseClient {
  if (admin) return admin;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set");
  admin = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  return admin;
}

// ---------- Caller identity ----------

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "https://bay53service.bay53.com/api";
const VALID_TTL_MS = 5 * 60_000;
const UNKNOWN_TTL_MS = 30_000;

type SessionState = "valid" | "invalid" | "unknown";
const sessionCache = new Map<string, { state: SessionState; until: number }>();

/**
 * Asks the .NET API whether `sessionId` is a live session for `userId`.
 * "unknown" means the API could not be reached or answered unexpectedly.
 */
async function checkSession(userId: number, sessionId: string): Promise<SessionState> {
  const key = `${userId}:${createHash("sha256").update(sessionId).digest("hex")}`;
  const hit = sessionCache.get(key);
  if (hit && hit.until > Date.now()) return hit.state;

  let state: SessionState = "unknown";
  try {
    const res = await fetch(`${API_BASE}/Auth/CheckSession`, {
      method: "POST",
      headers: { "Content-Type": "application/json", accept: "*/*", Authorization: sessionId },
      body: JSON.stringify({ id: userId, sessionId }),
      signal: AbortSignal.timeout(5000),
      cache: "no-store",
    });
    const text = await res.text();
    // The API refuses a bad session with 400 "Invalid session id" or a 200 carrying this text.
    if (text === "Invalid Session or Session Expired" || [400, 401, 403].includes(res.status)) {
      state = "invalid";
    } else if (res.ok) {
      let message: unknown = text;
      try {
        message = (JSON.parse(text) as { message?: unknown }).message;
      } catch {
        // plain text
      }
      state = message === "Session is valid" ? "valid" : "invalid";
    }
  } catch {
    state = "unknown";
  }

  if (sessionCache.size > 5000) sessionCache.clear();
  sessionCache.set(key, { state, until: Date.now() + (state === "unknown" ? UNKNOWN_TTL_MS : VALID_TTL_MS) });
  return state;
}

export type CallerResult =
  | { ok: true; actor: ActorClaim; verified: boolean }
  | { ok: false; status: number; error: string };

/**
 * Reads the session id and actor claim from the request and checks them against the .NET API.
 * `requireVerified` (reads) refuses when the API cannot be reached; writes accept the claim
 * and store it as unverified so an outage does not lose the audit trail.
 */
export async function identifyCaller(req: Request, requireVerified: boolean): Promise<CallerResult> {
  const sessionId = req.headers.get("authorization")?.trim();
  const actor = parseActor(req.headers.get(ACTOR_HEADER));
  if (!sessionId || !actor) return { ok: false, status: 401, error: "Missing session or actor" };

  const state = await checkSession(actor.user_id, sessionId);
  if (state === "invalid") return { ok: false, status: 401, error: "Invalid or expired session" };
  if (state === "unknown" && requireVerified) {
    return { ok: false, status: 503, error: "Could not verify the session with the ERP API" };
  }
  return { ok: true, actor, verified: state === "valid" };
}

function parseActor(raw: string | null): ActorClaim | null {
  if (!raw) return null;
  try {
    const a = JSON.parse(decodeURIComponent(raw)) as Partial<ActorClaim>;
    if (!Number.isInteger(a.user_id) || (a.user_id as number) <= 0) return null;
    if (typeof a.company_code !== "string" || !a.company_code.trim()) return null;
    return {
      user_id: a.user_id as number,
      name: str(a.name, 200),
      email: str(a.email, 200),
      company_code: a.company_code.trim().slice(0, 100),
      company_name: str(a.company_name, 200),
    };
  } catch {
    return null;
  }
}

// ---------- Request metadata ----------

export function clientIp(req: Request): string | null {
  const forwarded = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const ip = forwarded || req.headers.get("x-real-ip")?.trim() || "";
  return isIP(ip) ? ip : null;
}

// ---------- Redaction ----------

// Keys whose values are credentials or secrets anywhere in a stored payload.
const SECRET_KEY = /pass(word)?|otp|token|secret|session|api_?key|authenticate|credential|authorization/i;
const MAX_STORED_CHARS = 16_000;

/** Removes secrets and bounds size before a client-supplied payload is stored. */
export function sanitize(value: unknown): unknown {
  const clean = scrub(value, 0);
  const text = JSON.stringify(clean) ?? "null";
  if (text.length <= MAX_STORED_CHARS) return clean;
  return { truncated: true, preview: text.slice(0, 4000), length: text.length };
}

function scrub(value: unknown, depth: number): unknown {
  if (value === null || value === undefined) return null;
  if (typeof value === "string") return value.length > 2000 ? `${value.slice(0, 2000)}…` : value;
  if (typeof value === "number" || typeof value === "boolean") return value;
  if (depth >= 8) return "[depth limit]";
  if (Array.isArray(value)) return value.slice(0, 200).map((v) => scrub(v, depth + 1));
  if (typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>).slice(0, 200)) {
      out[k] = SECRET_KEY.test(k) ? "[redacted]" : scrub(v, depth + 1);
    }
    return out;
  }
  return null;
}

// ---------- Small validators ----------

export function str(v: unknown, max: number): string | null {
  if (typeof v !== "string") return null;
  const t = v.trim();
  return t ? t.slice(0, max) : null;
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
export const isUuid = (v: unknown): v is string => typeof v === "string" && UUID.test(v);

/** A client timestamp, refused when unparseable and clamped so it cannot be in the future. */
export function timestamp(v: unknown): string | null {
  if (typeof v !== "string") return null;
  const t = Date.parse(v);
  if (Number.isNaN(t)) return null;
  return new Date(Math.min(t, Date.now())).toISOString();
}

export function int(v: unknown, min: number, max: number): number | null {
  return typeof v === "number" && Number.isInteger(v) && v >= min && v <= max ? v : null;
}
