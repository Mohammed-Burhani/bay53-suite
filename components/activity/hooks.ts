"use client";

import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { getInvoice, getInvoiceTimeline, getMyActivity } from "@/lib/activity-api";
import { ActivityFetchError, fetchActivityLogs } from "@/lib/activity-log/client";
import type { RealLogFilters } from "@/lib/activity-log/filters";
import type { Importance } from "@/lib/activity-types";
import { useViewer } from "./ViewerProvider";

// Every key starts with "activity" so one invalidation refreshes the module.
const STALE = 15_000;

/** The admin log, read from Supabase through /api/activity/logs. Refreshes itself every 30 s while visible. */
export function useActivityLogs(filters: RealLogFilters) {
  return useInfiniteQuery({
    queryKey: ["activity-real", "logs", filters],
    queryFn: ({ pageParam }) => fetchActivityLogs(filters, pageParam),
    initialPageParam: null as string | null,
    getNextPageParam: (last) => last.next_cursor,
    staleTime: STALE,
    refetchInterval: 30_000,
    // A 401/503 will not fix itself by retrying; show it straight away.
    retry: (count, error) => !(error instanceof ActivityFetchError) && count < 2,
  });
}

export function useMyActivity(importance: Importance | undefined) {
  const { viewer, ready } = useViewer();
  return useInfiniteQuery({
    queryKey: ["activity", "mine", viewer.userId, importance ?? "all"],
    queryFn: ({ pageParam }) => getMyActivity(viewer, { importance }, pageParam),
    initialPageParam: null as string | null,
    getNextPageParam: (last) => last.nextCursor,
    enabled: ready,
    staleTime: STALE,
  });
}

export function useInvoice(id: string) {
  const { viewer, ready } = useViewer();
  return useQuery({
    queryKey: ["activity", "invoice", viewer.userId, id],
    queryFn: () => getInvoice(viewer, id),
    enabled: ready,
    staleTime: STALE,
    retry: false,
  });
}

export function useTimeline(id: string) {
  const { viewer, ready } = useViewer();
  return useQuery({
    queryKey: ["activity", "timeline", viewer.userId, id],
    queryFn: () => getInvoiceTimeline(viewer, id),
    enabled: ready,
    staleTime: STALE,
    retry: false,
  });
}
