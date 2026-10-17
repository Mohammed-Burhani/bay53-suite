// POST /api/activity/ingest
// Receives batches of activity entries and UI events from the browser recorder, checks the
// caller's .NET session, and writes them to Supabase. Retried batches are deduplicated by event_id.

import { NextResponse } from "next/server";
import type { ActivityEntry, UiEventEntry } from "@/lib/activity-log/contract";
import { clientIp, identifyCaller, int, isUuid, logsDb, sanitize, str, timestamp } from "@/lib/activity-log/server";

const MAX_BODY_BYTES = 256_000;
const MAX_ACTIVITIES = 50;
const MAX_EVENTS = 200;
const MAX_CALLS = 30;

const MODULES = new Set(["invoice"]);
const IMPORTANCE = new Set(["info", "important", "critical"]);
const OUTCOMES = new Set(["success", "failure"]);
const ACTION = /^[a-z][a-z_]*\.[a-z][a-z_]*$/;
const EVENT = /^[a-z][a-z0-9_.:-]{0,79}$/;

export async function POST(req: Request) {
  const caller = await identifyCaller(req, false);
  if (!caller.ok) return NextResponse.json({ error: caller.error }, { status: caller.status });

  const raw = await req.text();
  if (raw.length > MAX_BODY_BYTES) return NextResponse.json({ error: "Batch too large" }, { status: 413 });
  let body: { activities?: unknown; events?: unknown };
  try {
    body = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const activitiesIn = Array.isArray(body.activities) ? body.activities : [];
  const eventsIn = Array.isArray(body.events) ? body.events : [];
  if (activitiesIn.length > MAX_ACTIVITIES || eventsIn.length > MAX_EVENTS) {
    return NextResponse.json({ error: "Too many entries in one batch" }, { status: 413 });
  }

  const { actor, verified } = caller;
  const ip = clientIp(req);
  const userAgent = str(req.headers.get("user-agent"), 500);
  const common = {
    company_code: actor.company_code,
    actor_user_id: actor.user_id,
    actor_name: actor.name,
    actor_verified: verified,
  };

  const activities = activitiesIn.map((a) => toActivityRow(a as ActivityEntry)).filter((a) => a !== null);
  const events = eventsIn.map((e) => toEventRow(e as UiEventEntry)).filter((e) => e !== null);
  const rejected = activitiesIn.length - activities.length + (eventsIn.length - events.length);

  const db = logsDb();
  let storedActivities = 0;
  if (activities.length) {
    const rows = activities.map((a) => ({
      ...a,
      ...common,
      company_name: actor.company_name,
      actor_email: actor.email,
      ip,
      user_agent: userAgent,
    }));
    const { data, error } = await db.rpc("insert_activity_logs", { entries: rows });
    if (error) {
      console.error("[activity-log] insert_activity_logs failed", error);
      return NextResponse.json({ error: "Could not store activities" }, { status: 500 });
    }
    storedActivities = typeof data === "number" ? data : 0;
  }

  if (events.length) {
    const rows = events.map((e) => ({ ...e, ...common }));
    const { error } = await db.from("event_logs").upsert(rows, { onConflict: "event_id", ignoreDuplicates: true });
    if (error) {
      console.error("[activity-log] event_logs insert failed", error);
      return NextResponse.json({ error: "Could not store events" }, { status: 500 });
    }
  }

  return NextResponse.json({ stored_activities: storedActivities, stored_events: events.length, rejected });
}

function toActivityRow(a: ActivityEntry) {
  if (!a || typeof a !== "object") return null;
  const occurredAt = timestamp(a.occurred_at);
  if (!isUuid(a.event_id) || !occurredAt) return null;
  if (!MODULES.has(a.module) || typeof a.action !== "string" || !ACTION.test(a.action)) return null;
  if (!OUTCOMES.has(a.outcome)) return null;

  const calls = Array.isArray(a.api_calls) ? a.api_calls.slice(0, MAX_CALLS) : [];
  return {
    event_id: a.event_id,
    occurred_at: occurredAt,
    module: a.module,
    action: a.action,
    importance: IMPORTANCE.has(a.importance) ? a.importance : "info",
    outcome: a.outcome,
    entity_type: str(a.entity_type, 50),
    entity_id: str(a.entity_id, 100),
    entity_label: str(a.entity_label, 200),
    inv_type: int(a.inv_type, 0, 32767),
    summary: str(a.summary, 500),
    error_message: str(a.error_message, 1000),
    changes: a.changes === undefined ? null : sanitize(a.changes),
    metadata: sanitize(a.metadata ?? {}) ?? {},
    duration_ms: int(a.duration_ms, 0, 86_400_000),
    page: str(a.page, 300),
    api_calls: calls
      .filter((c) => c && typeof c === "object" && typeof c.endpoint === "string" && timestamp(c.started_at))
      .map((c) => ({
        method: str(c.method, 10) ?? "POST",
        // Path only: drop any host or query string a caller might send.
        endpoint: c.endpoint.replace(/^https?:\/\/[^/]+/i, "").split("?")[0].slice(0, 200),
        http_status: int(c.http_status, 0, 999),
        ok: c.ok === true,
        message: str(c.message, 1000),
        response: sanitize(c.response),
        started_at: timestamp(c.started_at),
        duration_ms: int(c.duration_ms, 0, 3_600_000),
      })),
  };
}

function toEventRow(e: UiEventEntry) {
  if (!e || typeof e !== "object") return null;
  const occurredAt = timestamp(e.occurred_at);
  if (!isUuid(e.event_id) || !occurredAt) return null;
  if (!MODULES.has(e.module) || typeof e.event !== "string" || !EVENT.test(e.event)) return null;
  return {
    event_id: e.event_id,
    occurred_at: occurredAt,
    module: e.module,
    event: e.event,
    target: str(e.target, 200),
    page: str(e.page, 300),
    metadata: sanitize(e.metadata ?? {}) ?? {},
  };
}
