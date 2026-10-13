"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { auth } from "@/lib/auth";
import { itemService } from "@/lib/api/item.service";
import type { ItemSaveBody } from "@/lib/types/item.types";

// The full item list comes from `useItems` (lib/hooks/useReports.ts), which
// caches under ["items", …]. Mutations here invalidate that prefix so the
// reports' item dropdowns refresh too.

export function useItemById(id: number | null) {
  return useQuery({
    queryKey: ["item", id],
    queryFn: () => {
      const sessionId = auth.getSessionId();
      if (!sessionId) throw new Error("No session");
      return itemService.getById({ id: id as number, sessionId });
    },
    enabled: typeof window !== "undefined" && !!auth.getSessionId() && !!id && id > 0,
    staleTime: 0,
  });
}

type SaveInput = ItemSaveBody;

export function useItemCreate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: SaveInput) => {
      const sessionId = auth.getSessionId();
      if (!sessionId) throw new Error("No session");
      return itemService.create({ ...data, sessionId });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["items"] }),
  });
}

export function useItemUpdate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: SaveInput) => {
      const sessionId = auth.getSessionId();
      if (!sessionId) throw new Error("No session");
      return itemService.update({ ...data, sessionId });
    },
    onSuccess: (_res, vars) => {
      queryClient.invalidateQueries({ queryKey: ["items"] });
      queryClient.invalidateQueries({ queryKey: ["item", vars.id] });
    },
  });
}

export function useItemDelete() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => {
      const sessionId = auth.getSessionId();
      if (!sessionId) throw new Error("No session");
      return itemService.delete({ id, sessionId });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["items"] }),
  });
}
