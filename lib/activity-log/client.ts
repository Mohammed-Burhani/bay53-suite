// Browser-side reader for GET /api/activity/logs.

import { auth } from "@/lib/auth";
import { ACTOR_HEADER, type ActivityLogPage } from "./contract";
import type { RealLogFilters } from "./filters";
import { currentActor, } from "./recorder";

export class ActivityFetchError extends Error {
  constructor(
    public status: number,
    message: string
  ) {
    super(message);
    this.name = "ActivityFetchError";
  }
}

/** True when this browser holds an ERP login the log routes can verify. */
export function hasErpSession(): boolean {
  return !!auth.getSessionId() && !!currentActor();
}

export async function fetchActivityLogs(
  filters: RealLogFilters,
  cursor: string | null,
  limit = 50
): Promise<ActivityLogPage> {
  const sessionId = auth.getSessionId();
  const actor = currentActor();
  if (!sessionId || !actor) throw new ActivityFetchError(401, "Log in to the ERP to view the activity log.");

  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(filters)) if (v) params.set(k, v);
  if (cursor) params.set("cursor", cursor);
  params.set("limit", String(limit));

  const res = await fetch(`/api/activity/logs?${params}`, {
    cache: "no-store",
    headers: { Authorization: sessionId, [ACTOR_HEADER]: encodeURIComponent(JSON.stringify(actor)) },
  });
  if (!res.ok) {
    let message = "Could not load the activity log.";
    try {
      message = ((await res.json()) as { error?: string }).error ?? message;
    } catch {
      // keep default
    }
    throw new ActivityFetchError(res.status, message);
  }
  return (await res.json()) as ActivityLogPage;
}
