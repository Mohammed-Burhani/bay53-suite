// Browser-side activity recorder.
//
// recordActivity() wraps one business action (create invoice, delete invoice …). Every .NET
// call made through apiClient with `{ trace }` lands in that action's api_calls, with its
// status and message. Finished entries are queued and uploaded in batches to
// /api/activity/ingest, which verifies the session and writes them to Supabase.
//
// Logging must never break the ERP: every failure in here is swallowed.

import { auth } from "@/lib/auth";
import {
  ACTOR_HEADER,
  type ActivityEntry,
  type ActorClaim,
  type ApiCallRecord,
  type LogImportance,
  type LogModule,
  type UiEventEntry,
} from "./contract";

// ---------- Trace ----------

/** Collects the API calls made while one activity runs. Passed to apiClient as `{ trace }`. */
export class ActivityTrace {
  readonly calls: ApiCallRecord[] = [];
  record(call: ApiCallRecord) {
    this.calls.push(call);
  }
}

// Responses bigger than this are stored as a text preview only.
const MAX_RESPONSE_CHARS = 8000;

/** Shrinks a response body to something worth storing. The server redacts it again. */
export function captureResponse(body: unknown): unknown {
  if (body === undefined || body === null || body === "") return null;
  const text = typeof body === "string" ? body : safeStringify(body);
  if (text.length <= MAX_RESPONSE_CHARS) return body;
  return { truncated: true, preview: text.slice(0, 2000), length: text.length };
}

/** A human-readable message from a .NET response: plain text, `message`, or ASP.NET validation errors. */
export function responseMessage(body: unknown, ok: boolean): string | null {
  if (typeof body === "string") return body.trim().slice(0, 500) || null;
  if (!body || typeof body !== "object") return null;
  const b = body as Record<string, unknown>;
  if (typeof b.message === "string") return b.message;
  if (ok) return null;
  const parts: string[] = [];
  if (typeof b.title === "string") parts.push(b.title);
  if (b.errors && typeof b.errors === "object") {
    for (const [field, msgs] of Object.entries(b.errors as Record<string, unknown>).slice(0, 5)) {
      const first = Array.isArray(msgs) ? msgs[0] : msgs;
      parts.push(`${field}: ${String(first)}`);
    }
  }
  return parts.join(" | ").slice(0, 500) || null;
}

// ---------- Activities ----------

export interface ActivityMeta {
  module: LogModule;
  action: string;
  importance?: LogImportance;
  entity_type?: string | null;
  entity_id?: string | null;
  entity_label?: string | null;
  inv_type?: number | null;
  summary?: string | null;
  changes?: unknown;
  metadata?: Record<string, unknown>;
}

/**
 * Runs `run` as one logged activity. The result (or error) of `run` is returned (or rethrown)
 * unchanged; `describe` can fill in details that are only known afterwards, like the new id.
 */
export async function recordActivity<T>(
  meta: ActivityMeta,
  run: (trace: ActivityTrace) => Promise<T>,
  describe?: (result: T) => Partial<ActivityMeta>
): Promise<T> {
  const trace = new ActivityTrace();
  const startedAt = new Date();
  const finish = (outcome: "success" | "failure", extra: Partial<ActivityMeta>, error?: unknown) => {
    try {
      const m = { ...meta, ...extra };
      enqueueActivity({
        event_id: newId(),
        occurred_at: startedAt.toISOString(),
        module: m.module,
        action: m.action,
        importance: m.importance ?? "info",
        outcome,
        entity_type: m.entity_type ?? null,
        entity_id: m.entity_id ?? null,
        entity_label: m.entity_label ?? null,
        inv_type: m.inv_type ?? null,
        summary: m.summary ?? null,
        error_message: error === undefined ? null : errorMessage(error),
        changes: m.changes ?? null,
        metadata: m.metadata ?? {},
        duration_ms: Date.now() - startedAt.getTime(),
        page: currentPage(),
        api_calls: trace.calls,
      });
    } catch {
      // Never let logging break the action.
    }
  };

  let result: T;
  try {
    result = await run(trace);
  } catch (error) {
    finish("failure", {}, error);
    throw error;
  }
  let extra: Partial<ActivityMeta> = {};
  try {
    extra = describe?.(result) ?? {};
  } catch {
    // A broken describe() must not turn a successful action into a failure.
  }
  finish("success", extra);
  return result;
}

/** Records a UI event such as a button click. Cheap: no API trace, no payload. */
export function trackEvent(module: LogModule, event: string, target?: string, metadata?: Record<string, unknown>) {
  try {
    enqueueEvent({
      event_id: newId(),
      occurred_at: new Date().toISOString(),
      module,
      event,
      target: target ?? null,
      page: currentPage(),
      metadata: metadata ?? {},
    });
  } catch {
    // ignore
  }
}

// ---------- Upload queue ----------

const FLUSH_DELAY_MS = 1500;
// fetch keepalive bodies are capped at 64 KB, so batches stay below that.
const MAX_BATCH_BYTES = 56_000;
const MAX_QUEUED = 300;
const MAX_ATTEMPTS = 4;

interface Queued<T> {
  entry: T;
  attempts: number;
}
const activityQueue: Queued<ActivityEntry>[] = [];
const eventQueue: Queued<UiEventEntry>[] = [];
let flushTimer: ReturnType<typeof setTimeout> | null = null;
let flushing = false;

function enqueueActivity(entry: ActivityEntry) {
  push(activityQueue, entry);
}
function enqueueEvent(entry: UiEventEntry) {
  push(eventQueue, entry);
}
function push<T>(queue: Queued<T>[], entry: T) {
  if (typeof window === "undefined") return;
  queue.push({ entry, attempts: 0 });
  // Under a long outage, drop the oldest entries rather than grow without bound.
  if (queue.length > MAX_QUEUED) queue.splice(0, queue.length - MAX_QUEUED);
  installUnloadFlush();
  scheduleFlush();
}

function scheduleFlush(delay = FLUSH_DELAY_MS) {
  if (flushTimer) return;
  flushTimer = setTimeout(() => {
    flushTimer = null;
    void flush();
  }, delay);
}

/** Takes entries off the front of a queue until the batch is about `budget` bytes. */
function takeBatch<T>(queue: Queued<T>[], budget: number): Queued<T>[] {
  const batch: Queued<T>[] = [];
  let size = 0;
  while (queue.length) {
    const len = safeStringify(queue[0].entry).length;
    if (batch.length && size + len > budget) break;
    batch.push(queue.shift()!);
    size += len;
  }
  return batch;
}

async function flush() {
  if (flushing) return;
  const sessionId = auth.getSessionId();
  const actor = currentActor();
  if (!sessionId || !actor) {
    // Logged out: nothing can be attributed, so drop what is queued.
    activityQueue.length = 0;
    eventQueue.length = 0;
    return;
  }
  flushing = true;
  try {
    while (activityQueue.length || eventQueue.length) {
      const activities = takeBatch(activityQueue, MAX_BATCH_BYTES);
      const events = takeBatch(eventQueue, Math.max(4000, MAX_BATCH_BYTES - safeStringify(activities).length));
      const status = await send(sessionId, actor, activities.map((q) => q.entry), events.map((q) => q.entry));
      if (status === "retry") {
        requeue(activityQueue, activities);
        requeue(eventQueue, events);
        scheduleFlush(10_000);
        return;
      }
    }
  } finally {
    flushing = false;
  }
}

function requeue<T>(queue: Queued<T>[], batch: Queued<T>[]) {
  const keep = batch.filter((q) => ++q.attempts < MAX_ATTEMPTS);
  queue.unshift(...keep);
}

async function send(
  sessionId: string,
  actor: ActorClaim,
  activities: ActivityEntry[],
  events: UiEventEntry[]
): Promise<"done" | "retry"> {
  try {
    const res = await fetch("/api/activity/ingest", {
      method: "POST",
      keepalive: true,
      headers: {
        "Content-Type": "application/json",
        Authorization: sessionId,
        [ACTOR_HEADER]: encodeURIComponent(JSON.stringify(actor)),
      },
      body: JSON.stringify({ activities, events }),
    });
    // 4xx means the batch itself is unacceptable (bad session, bad shape): retrying cannot help.
    if (res.ok || (res.status >= 400 && res.status < 500)) {
      if (!res.ok) console.warn("[activity-log] batch rejected", res.status);
      return "done";
    }
    return "retry";
  } catch {
    return "retry";
  }
}

let unloadHooked = false;
function installUnloadFlush() {
  if (unloadHooked || typeof document === "undefined") return;
  unloadHooked = true;
  // Send what is queued when the tab is hidden or closed; keepalive lets it outlive the page.
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") void flush();
  });
  window.addEventListener("pagehide", () => void flush());
}

// ---------- Helpers ----------

/** The acting user as the login response described them. */
export function currentActor(): ActorClaim | null {
  const session = auth.getSession();
  const user = session?.user;
  if (!user?.user_ID) return null;
  const name = [user.first_Name, user.lastname].filter(Boolean).join(" ").trim();
  return {
    user_id: user.user_ID,
    name: name || null,
    email: user.email_ID || null,
    company_code: session?.company?.shortCode || "unknown",
    company_name: session?.company?.compName || null,
  };
}

function currentPage(): string | null {
  return typeof window === "undefined" ? null : window.location.pathname;
}

function errorMessage(error: unknown): string {
  if (error && typeof error === "object") {
    const e = error as { message?: unknown; data?: unknown; status?: unknown };
    const fromData = e.data !== undefined ? responseMessage(e.data, false) : null;
    if (fromData) return fromData;
    if (typeof e.message === "string") return e.message.slice(0, 500);
  }
  return String(error).slice(0, 500);
}

function safeStringify(value: unknown): string {
  try {
    return JSON.stringify(value) ?? "";
  } catch {
    return "";
  }
}

/** RFC 4122 v4 id. crypto.randomUUID only exists on secure origins, so fall back to getRandomValues. */
function newId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") return crypto.randomUUID();
  const b = crypto.getRandomValues(new Uint8Array(16));
  b[6] = (b[6] & 0x0f) | 0x40;
  b[8] = (b[8] & 0x3f) | 0x80;
  const h = Array.from(b, (x) => x.toString(16).padStart(2, "0")).join("");
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
}
