"use client";

import { createContext, useContext, ReactNode, useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useTabStore } from "@/lib/stores/tab-store";
import { getRouteTitle } from "@/lib/utils/route-config";

interface TabNavigationContextType {
  navigateToTab: (path: string) => void;
}

const TabNavigationContext = createContext<TabNavigationContextType | null>(null);

export function TabNavigationProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { addTab, tabs, activeTabId, setActiveTab } = useTabStore();
  const isInitialMount = useRef(true);

  // Register current route as a tab
  useEffect(() => {
    // Skip auth routes
    if (pathname.startsWith("/login") || pathname === "/") {
      return;
    }

    const tabId = pathname;
    const title = getRouteTitle(pathname);

    // Check if tab already exists
    const existingTab = tabs.find((t) => t.path === pathname);
    
    if (existingTab) {
      // Just activate it
      if (existingTab.id !== activeTabId) {
        setActiveTab(existingTab.id);
      }
    } else {
      // Add new tab
      addTab({
        id: tabId,
        path: pathname,
        title,
      });
    }
  }, [pathname]);

  const navigateToTab = (path: string) => {
    const existingTab = tabs.find((t) => t.path === path);
    
    if (existingTab) {
      // Tab exists, just activate it
      setActiveTab(existingTab.id);
      router.push(path);
    } else {
      // New tab, router.push will trigger the effect above
      router.push(path);
    }
  };

  return (
    <TabNavigationContext.Provider value={{ navigateToTab }}>
      {children}
    </TabNavigationContext.Provider>
  );
}

export function useTabNavigation() {
  const context = useContext(TabNavigationContext);
  if (!context) {
    throw new Error("useTabNavigation must be used within TabNavigationProvider");
  }
  return context;
}
