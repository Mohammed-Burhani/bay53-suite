"use client";

import { useQuery } from "@tanstack/react-query";
import { auth } from "@/lib/auth";
import { dropdownService } from "@/lib/api/dropdown.service";
import type { DropdownItem } from "@/lib/types/dropdown.types";

/** Options for a /Common/Dropdown table; disabled (empty) while the table id is unknown (null). */
export function useDropdown(table: number | null, type = 0) {
  return useQuery<DropdownItem[]>({
    queryKey: ["dropdown", table, type],
    queryFn: async () => {
      const sessionId = auth.getSessionId();
      if (!sessionId) throw new Error("No session");
      return (await dropdownService.getDropdown({ id: 0, sessionId, table: table as number, type })) || [];
    },
    enabled: typeof window !== "undefined" && table !== null && !!auth.getSessionId(),
    staleTime: 10 * 60 * 1000,
  });
}
