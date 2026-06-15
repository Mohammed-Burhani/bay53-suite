// ==================== Group Service ====================

import { apiClient } from "./client";
import type {
  Group,
  GroupSearchPayload,
  GroupSearchResponse,
  GroupCreateUpdatePayload,
  GroupGetByIdPayload,
  GroupDeletePayload,
} from "@/lib/types/group.types";

export const groupService = {
  create: (payload: GroupCreateUpdatePayload) =>
    apiClient.post<unknown>("/Group/Create", payload),

  update: (payload: GroupCreateUpdatePayload) =>
    apiClient.post<unknown>("/Group/Update", payload),

  delete: (payload: GroupDeletePayload) =>
    apiClient.post<unknown>("/Group/Delete", payload),

  getById: (payload: GroupGetByIdPayload) =>
    apiClient.post<Group>("/Group/GetById", payload),

  search: (payload: GroupSearchPayload) =>
    apiClient.post<GroupSearchResponse>("/Group/Search", payload),

  sync: (payload: GroupSearchPayload) =>
    apiClient.post<GroupSearchResponse>("/Group/Sync", payload),

  export: (payload: GroupSearchPayload) =>
    apiClient.post<GroupSearchResponse>("/Group/Export", payload),
};
