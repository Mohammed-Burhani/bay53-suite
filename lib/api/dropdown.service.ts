// ==================== Dropdown Service ====================

import { apiClient } from "./client";
import type { DropdownPayload, DropdownItem } from "@/lib/types/dropdown.types";

export const dropdownService = {
  getDropdown: (payload: DropdownPayload) =>
    apiClient.post<DropdownItem[]>("/Common/Dropdown", payload),
};
