"use client";

import { useTabStore } from "@/lib/stores/tab-store";
import { useRouter, usePathname } from "next/navigation";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useEffect, useRef, useState } from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export function TabBar() {
  const { tabs, activeTabId, setActiveTab, removeTab } = useTabStore();
  const router = useRouter();
  const pathname = usePathname();
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [showLeftScroll, setShowLeftScroll] = useState(false);
  const [showRightScroll, setShowRightScroll] = useState(false);

  // Check scroll position
  const checkScroll = () => {
    const container = scrollContainerRef.current;
    if (!container) return;

    setShowLeftScroll(container.scrollLeft > 0);
    setShowRightScroll(
      container.scrollLeft < container.scrollWidth - container.clientWidth - 1
    );
  };

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    checkScroll();
    container.addEventListener("scroll", checkScroll);
    window.addEventListener("resize", checkScroll);

    return () => {
      container.removeEventListener("scroll", checkScroll);
      window.removeEventListener("resize", checkScroll);
    };
  }, [tabs]);

  const scroll = (direction: "left" | "right") => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const scrollAmount = 200;
    container.scrollBy({
      left: direction === "left" ? -scrollAmount : scrollAmount,
      behavior: "smooth",
    });
  };

  const handleTabClick = (tabId: string, path: string) => {
    setActiveTab(tabId);
    router.push(path);
  };

  const handleTabClose = (e: React.MouseEvent, tabId: string) => {
    e.stopPropagation();
    
    const tabIndex = tabs.findIndex((t) => t.id === tabId);
    const isActive = tabs[tabIndex]?.isActive;
    
    removeTab(tabId);
    
    // Navigate to new active tab if we closed the active one
    if (isActive && tabs.length > 1) {
      const newActiveIndex = Math.min(tabIndex, tabs.length - 2);
      const newActiveTab = tabs.filter((t) => t.id !== tabId)[newActiveIndex];
      if (newActiveTab) {
        router.push(newActiveTab.path);
      }
    }
  };

  if (tabs.length === 0) return null;

  return (
    <TooltipProvider delayDuration={300}>
      <div className="flex items-center h-10 bg-muted/30 border-b border-border relative">
        {/* Left scroll button */}
        {showLeftScroll && (
          <Button
            variant="ghost"
            size="icon"
            className="h-10 w-8 rounded-none shrink-0 hover:bg-muted"
            onClick={() => scroll("left")}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
        )}

        {/* Tabs container */}
        <div
          ref={scrollContainerRef}
          className="flex-1 flex items-center overflow-x-auto scrollbar-hide"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {tabs.map((tab) => (
            <Tooltip key={tab.id}>
              <TooltipTrigger asChild>
                <div
                  className={cn(
                    "group flex items-center gap-2 px-3 h-10 border-r border-border cursor-pointer transition-colors shrink-0 min-w-[120px] max-w-[200px]",
                    tab.isActive
                      ? "bg-background text-foreground"
                      : "bg-muted/30 text-muted-foreground hover:bg-muted/50"
                  )}
                  onClick={() => handleTabClick(tab.id, tab.path)}
                >
                  <span className="text-xs font-medium truncate flex-1">
                    {tab.title}
                  </span>
                  <button
                    className={cn(
                      "shrink-0 rounded-sm opacity-0 group-hover:opacity-100 hover:bg-muted-foreground/20 p-0.5 transition-opacity",
                      tab.isActive && "opacity-70"
                    )}
                    onClick={(e) => handleTabClose(e, tab.id)}
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="text-xs">
                {tab.title}
              </TooltipContent>
            </Tooltip>
          ))}
        </div>

        {/* Right scroll button */}
        {showRightScroll && (
          <Button
            variant="ghost"
            size="icon"
            className="h-10 w-8 rounded-none shrink-0 hover:bg-muted"
            onClick={() => scroll("right")}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        )}
      </div>
    </TooltipProvider>
  );
}
