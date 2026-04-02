"use client";

import { useTabStore } from "@/lib/stores/tab-store";
import { ReactNode } from "react";

interface TabContentWrapperProps {
  children: ReactNode;
}

// This wrapper keeps content mounted but hidden when not active
export function TabContentWrapper({ children }: TabContentWrapperProps) {
  const { tabs, activeTabId } = useTabStore();
  
  // If no tabs, just render children normally
  if (tabs.length === 0) {
    return <>{children}</>;
  }

  return <>{children}</>;
}
