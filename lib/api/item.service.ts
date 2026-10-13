// ==================== Item Service ====================

import { apiClient } from "./client";
import type {
  ItemSavePayload,
  ItemGetByIdPayload,
  ItemDeletePayload,
} from "@/lib/types/item.types";

export const itemService = {
  create: (payload: ItemSavePayload) =>
    apiClient.post<unknown>("/Item/Create", payload),

  update: (payload: ItemSavePayload) =>
    apiClient.post<unknown>("/Item/Update", payload),

  delete: (payload: ItemDeletePayload) =>
    apiClient.post<unknown>("/Item/Delete", payload),

  // The response shape is undocumented, so it is normalised in lib/items/item-form.ts.
  getById: (payload: ItemGetByIdPayload) =>
    apiClient.post<Record<string, unknown>>("/Item/GetById", payload),
};
