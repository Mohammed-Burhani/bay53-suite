"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { useTabStore } from "@/lib/stores/tab-store";
import { getRouteTitle } from "@/lib/utils/route-config";

export function useTabNavigation() {
  const pathname = usePathname();
  const { addTab, tabs } = useTabStore();

  useEffect(() => {
    // Skip auth routes
    if (pathname.startsWith("/login") || pathname === "/") {
      return;
    }

    // Generate tab ID from path
    const tabId = pathname;
    const title = getRouteTitle(pathname);

    // Add or activate tab
    addTab({
      id: tabId,
      path: pathname,
      title,
    });
  }, [pathname, addTab]);

  return { tabs };
}
