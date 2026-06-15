"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { auth } from "@/lib/auth";
import { groupService } from "@/lib/api/group.service";
import { dropdownService } from "@/lib/api/dropdown.service";
import type {
  Group,
  GroupSearchPayload,
  GroupCreateUpdatePayload,
  GroupGetByIdPayload,
  GroupDeletePayload,
} from "@/lib/types/group.types";
import type { DropdownItem } from "@/lib/types/dropdown.types";

export function useGroupSearch() {
  return useMutation({
    mutationFn: (filters: Omit<GroupSearchPayload, "sessionId">) => {
      const sessionId = auth.getSessionId();
      if (!sessionId) throw new Error("No session");
      return groupService.search({ ...filters, sessionId });
    },
  });
}

export function useGroupSync() {
  return useMutation({
    mutationFn: (filters: Omit<GroupSearchPayload, "sessionId">) => {
      const sessionId = auth.getSessionId();
      if (!sessionId) throw new Error("No session");
      return groupService.sync({ ...filters, sessionId });
    },
  });
}

export function useGroupExport() {
  return useMutation({
    mutationFn: (filters: Omit<GroupSearchPayload, "sessionId">) => {
      const sessionId = auth.getSessionId();
      if (!sessionId) throw new Error("No session");
      return groupService.export({ ...filters, sessionId });
    },
  });
}

export function useGroupCreate() {
  return useMutation({
    mutationFn: (data: Omit<GroupCreateUpdatePayload, "sessionId">) => {
      const sessionId = auth.getSessionId();
      if (!sessionId) throw new Error("No session");
      return groupService.create({ ...data, sessionId });
    },
  });
}

export function useGroupUpdate() {
  return useMutation({
    mutationFn: (data: Omit<GroupCreateUpdatePayload, "sessionId">) => {
      const sessionId = auth.getSessionId();
      if (!sessionId) throw new Error("No session");
      return groupService.update({ ...data, sessionId });
    },
  });
}

export function useGroupDelete() {
  return useMutation({
    mutationFn: (data: Omit<GroupDeletePayload, "sessionId">) => {
      const sessionId = auth.getSessionId();
      if (!sessionId) throw new Error("No session");
      return groupService.delete({ ...data, sessionId });
    },
  });
}

export function useGroupById(id: number) {
  return useQuery<Group>({
    queryKey: ["group", id],
    queryFn: () => {
      const sessionId = auth.getSessionId();
      if (!sessionId) throw new Error("No session");
      return groupService.getById({ id, sessionId });
    },
    enabled: typeof window !== "undefined" && !!auth.getSessionId() && id > 0,
  });
}

export function useParentGroups() {
  return useQuery<DropdownItem[]>({
    queryKey: ["parent-groups"],
    queryFn: async () => {
      const sessionId = auth.getSessionId();
      if (!sessionId) throw new Error("No session");
      const response = await dropdownService.getDropdown({
        id: 0,
        sessionId,
        table: 10,
        type: 0,
      });
      return response || [];
    },
    enabled: typeof window !== "undefined" && !!auth.getSessionId(),
    staleTime: 10 * 60 * 1000,
  });
}
