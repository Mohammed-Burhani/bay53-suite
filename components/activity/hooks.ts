"use client";

import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import {
  getInvoice,
  getInvoiceTimeline,
  getKpis,
  getMyActivity,
  listLogs,
  listUsers,
} from "@/lib/activity-api";
import type { Importance, LogFilters } from "@/lib/activity-types";
import { useViewer } from "./ViewerProvider";

// Every key starts with "activity" so one invalidation refreshes the module.
const STALE = 15_000;

export function useLogs(filters: LogFilters) {
  const { viewer, ready } = useViewer();
  return useInfiniteQuery({
    queryKey: ["activity", "logs", viewer.userId, filters],
    queryFn: ({ pageParam }) => listLogs(viewer, filters, pageParam),
    initialPageParam: null as string | null,
    getNextPageParam: (last) => last.nextCursor,
    enabled: ready,
    staleTime: STALE,
  });
}

export function useCriticalHead() {
  const { viewer, ready } = useViewer();
  return useQuery({
    queryKey: ["activity", "critical-head", viewer.userId],
    queryFn: () => listLogs(viewer, { importance: "critical" }, null, 6),
    enabled: ready,
    staleTime: STALE,
  });
}

export function useKpis() {
  const { viewer, ready } = useViewer();
  return useQuery({
    queryKey: ["activity", "kpis", viewer.userId],
    queryFn: () => getKpis(viewer),
    enabled: ready,
    staleTime: STALE,
  });
}

export function useUsers() {
  const { viewer, ready } = useViewer();
  return useQuery({
    queryKey: ["activity", "users", viewer.userId],
    queryFn: () => listUsers(viewer),
    enabled: ready,
    staleTime: 5 * 60_000,
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
