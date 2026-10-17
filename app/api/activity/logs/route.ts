// GET /api/activity/logs
// Admin read of the activity log for the caller's company, newest first, with every API call
// each activity made. Keyset-paginated: pass `next_cursor` back as `cursor`.
//
// Query params (all optional): from, to (ISO date or datetime), action, outcome, importance,
// user (actor user id), inv_type, entity_id, q (bill number contains), cursor, limit (1–100).
//
// Any valid ERP session can read its own company's log for now; role checks come later.

import { NextResponse } from "next/server";
import type { ActivityLogPage, ActivityLogRow } from "@/lib/activity-log/contract";
import { identifyCaller, logsDb } from "@/lib/activity-log/server";

const COLUMNS = `
  id, event_id, occurred_at, recorded_at, company_code, company_name,
  actor_user_id, actor_name, actor_email, actor_verified,
  module, action, importance, outcome, entity_type, entity_id, entity_label, inv_type,
  summary, error_message, changes, metadata, duration_ms, ip, user_agent, page,
  api_calls:activity_api_calls (id, seq, method, endpoint, http_status, ok, message, response, started_at, duration_ms)
`;

export async function GET(req: Request) {
  const caller = await identifyCaller(req, true);
  if (!caller.ok) return NextResponse.json({ error: caller.error }, { status: caller.status });

  const p = new URL(req.url).searchParams;
  const limit = clamp(Number(p.get("limit") ?? 50), 1, 100);

  let query = logsDb()
    .from("activity_logs")
    .select(COLUMNS)
    .eq("company_code", caller.actor.company_code)
    .order("occurred_at", { ascending: false })
    .order("id", { ascending: false })
    .limit(limit + 1);

  const from = date(p.get("from"));
  const to = date(p.get("to"), true);
  if (from) query = query.gte("occurred_at", from);
  if (to) query = query.lte("occurred_at", to);

  const action = p.get("action");
  if (action && /^[a-z_]+\.[a-z_]+$/.test(action)) query = query.eq("action", action);
  const outcome = p.get("outcome");
  if (outcome === "success" || outcome === "failure") query = query.eq("outcome", outcome);
  const importance = p.get("importance");
  if (importance === "info" || importance === "important" || importance === "critical") {
    query = query.eq("importance", importance);
  }
  const user = Number(p.get("user"));
  if (Number.isInteger(user) && user > 0) query = query.eq("actor_user_id", user);
  const invType = Number(p.get("inv_type"));
  if (Number.isInteger(invType) && invType > 0) query = query.eq("inv_type", invType);
  const entityId = p.get("entity_id");
  if (entityId) query = query.eq("entity_type", "invoice").eq("entity_id", entityId.slice(0, 100));
  const q = p.get("q")?.trim();
  if (q) query = query.ilike("entity_label", `%${q.slice(0, 100).replace(/[%_\\]/g, "\\$&")}%`);

  const cursor = parseCursor(p.get("cursor"));
  if (cursor) {
    query = query.or(`occurred_at.lt."${cursor.at}",and(occurred_at.eq."${cursor.at}",id.lt.${cursor.id})`);
  }

  const { data, error } = await query;
  if (error) {
    console.error("[activity-log] read failed", error);
    return NextResponse.json({ error: "Could not load the activity log" }, { status: 500 });
  }

  const rows = (data ?? []) as unknown as ActivityLogRow[];
  for (const r of rows) r.api_calls?.sort((a, b) => a.seq - b.seq);
  const page = rows.slice(0, limit);
  const last = page[page.length - 1];
  const body: ActivityLogPage = {
    rows: page,
    next_cursor: rows.length > limit && last ? `${last.occurred_at}|${last.id}` : null,
  };
  return NextResponse.json(body);
}

function clamp(n: number, min: number, max: number) {
  return Number.isFinite(n) ? Math.min(max, Math.max(min, Math.trunc(n))) : min;
}

/** A YYYY-MM-DD day (start or end of day in IST) or a full ISO datetime. */
function date(v: string | null, endOfDay = false): string | null {
  if (!v) return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(v)) {
    return new Date(`${v}T${endOfDay ? "23:59:59.999" : "00:00:00.000"}+05:30`).toISOString();
  }
  const t = Date.parse(v);
  return Number.isNaN(t) ? null : new Date(t).toISOString();
}

function parseCursor(v: string | null): { at: string; id: number } | null {
  if (!v) return null;
  const [at, id] = v.split("|");
  const t = Date.parse(at);
  const n = Number(id);
  if (Number.isNaN(t) || !Number.isInteger(n)) return null;
  return { at: new Date(t).toISOString(), id: n };
}
