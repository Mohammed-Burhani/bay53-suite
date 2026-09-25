"use client";

import { useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Layers, ShoppingCart, Contact, Check, Settings, LogOut, ArrowLeftRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useSession, useLogout } from "@/lib/hooks/useAuth";
import { useIsMobile } from "@/hooks/use-mobile";

type Platform = "erp" | "pos" | "crm";

const PLATFORMS = [
  {
    id: "erp" as Platform,
    name: "ERP Suite",
    description: "Inventory, Sales & Accounting",
    icon: Layers,
    color: "text-indigo-400",
    bgColor: "bg-indigo-500/10",
    activeColor: "bg-indigo-500/20 text-indigo-300",
  },
  {
    id: "pos" as Platform,
    name: "Point of Sale",
    description: "Billing & Checkout",
    icon: ShoppingCart,
    color: "text-teal-400",
    bgColor: "bg-teal-500/10",
    activeColor: "bg-teal-500/20 text-teal-300",
  },
  {
    id: "crm" as Platform,
    name: "CRM",
    description: "Leads & Projects",
    icon: Contact,
    color: "text-lime-400",
    bgColor: "bg-lime-500/10",
    activeColor: "bg-lime-500/20 text-lime-300",
  },
];

/**
 * Header variant — compact icon button near the logo.
 * Opens the platform switcher popover.
 */
export function PlatformSwitcherHeader() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const session = useSession();
  const logout = useLogout();
  const isMobile = useIsMobile();

  const currentPlatform: Platform = pathname.startsWith("/pos") ? "pos" : pathname.startsWith("/crm") ? "crm" : "erp";
  const activePlatform = PLATFORMS.find((p) => p.id === currentPlatform) || PLATFORMS[0];

  const handleSwitch = (platform: Platform) => {
    setOpen(false);
    if (platform === currentPlatform) return;
    switch (platform) {
      case "erp": router.push("/erp/dashboard"); break;
      case "pos": router.push("/pos"); break;
      case "crm": router.push("/crm/dashboard"); break;
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <Tooltip>
        <TooltipTrigger asChild>
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 gap-2 rounded-lg bg-sidebar-accent/50 px-2.5 text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-white transition-colors"
            >
              <activePlatform.icon className={cn("h-3.5 w-3.5", activePlatform.color)} />
              <ArrowLeftRight className="h-3 w-3 text-sidebar-foreground/40" />
            </Button>
          </PopoverTrigger>
        </TooltipTrigger>
        <TooltipContent side="bottom" sideOffset={8}>
          Switch Platform
        </TooltipContent>
      </Tooltip>

      <PopoverContent
        side={isMobile ? "bottom" : "bottom"}
        align="start"
        sideOffset={8}
        className="w-72 p-0 bg-sidebar border-sidebar-border"
      >
        <PlatformPopoverContent
          currentPlatform={currentPlatform}
          onSelect={handleSwitch}
          session={session}
          logout={logout}
        />
      </PopoverContent>
    </Popover>
  );
}

/**
 * Footer variant — shows user avatar + name (collapsed) or full user info (expanded).
 * Clicking opens the platform switcher popover.
 */
export function PlatformSwitcherFooter({ collapsed = false }: { collapsed?: boolean }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const session = useSession();
  const logout = useLogout();
  const isMobile = useIsMobile();

  const currentPlatform: Platform = pathname.startsWith("/pos") ? "pos" : pathname.startsWith("/crm") ? "crm" : "erp";
  const activePlatform = PLATFORMS.find((p) => p.id === currentPlatform) || PLATFORMS[0];

  const handleSwitch = (platform: Platform) => {
    setOpen(false);
    if (platform === currentPlatform) return;
    switch (platform) {
      case "erp": router.push("/erp/dashboard"); break;
      case "pos": router.push("/pos"); break;
      case "crm": router.push("/crm/dashboard"); break;
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <Tooltip>
        <TooltipTrigger asChild>
          <PopoverTrigger asChild>
            <button
              className={cn(
                "flex items-center gap-2.5 w-full rounded-xl p-2 transition-all duration-200 text-left",
                "hover:bg-sidebar-accent/50 group cursor-pointer",
                collapsed && "justify-center"
              )}
            >
              {/* User avatar */}
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--user-avatar-bg)] text-[var(--user-avatar-text)] text-xs font-bold">
                {session?.user?.first_Name?.[0]?.toUpperCase() ?? "U"}
              </div>

              {/* User info — hidden when collapsed */}
              {!collapsed && session && (
                <div className="flex flex-col overflow-hidden flex-1 min-w-0">
                  <span className="text-xs font-medium text-white truncate">
                    {session.user.first_Name} {session.user.lastname}
                  </span>
                  <span className="text-[10px] text-sidebar-foreground/50 truncate">
                    {activePlatform.name}
                  </span>
                </div>
              )}

              {/* Switch icon indicator */}
              {!collapsed && (
                <ArrowLeftRight className="h-3.5 w-3.5 text-sidebar-foreground/30 group-hover:text-sidebar-foreground/60 transition-colors shrink-0" />
              )}
            </button>
          </PopoverTrigger>
        </TooltipTrigger>
        {collapsed && (
          <TooltipContent side="right" sideOffset={8}>
            {session?.user?.first_Name ?? "User"} — Click to switch platform
          </TooltipContent>
        )}
      </Tooltip>

      <PopoverContent
        side={isMobile ? "top" : "right"}
        align="start"
        sideOffset={16}
        className="w-72 p-0 bg-sidebar border-sidebar-border"
      >
        <PlatformPopoverContent
          currentPlatform={currentPlatform}
          onSelect={handleSwitch}
          session={session}
          logout={logout}
        />
      </PopoverContent>
    </Popover>
  );
}

/* ───────────────── Shared popover body ───────────────── */

function PlatformPopoverContent({
  currentPlatform,
  onSelect,
  session,
  logout,
}: {
  currentPlatform: Platform;
  onSelect: (p: Platform) => void;
  session: ReturnType<typeof useSession>;
  logout: () => void;
}) {
  return (
    <div className="p-2">
      {/* User card at the top */}
      {session && (
        <div className="flex items-center gap-3 px-3 py-3 mb-2 rounded-lg bg-sidebar-accent/30">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--user-avatar-bg)] text-[var(--user-avatar-text)] text-sm font-bold">
            {session.user.first_Name?.[0]?.toUpperCase() ?? "U"}
          </div>
          <div className="flex flex-col overflow-hidden flex-1 min-w-0">
            <span className="text-sm font-semibold text-white truncate">
              {session.user.first_Name} {session.user.lastname}
            </span>
            <span className="text-xs text-sidebar-foreground/50 truncate">
              {session.company.compName}
            </span>
          </div>
        </div>
      )}

      {/* Section label */}
      <div className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-sidebar-foreground/40">
        Switch Platform
      </div>

      {/* Platform options */}
      <div className="space-y-0.5">
        {PLATFORMS.map((platform) => (
          <button
            key={platform.id}
            onClick={() => onSelect(platform.id)}
            className={cn(
              "w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors",
              currentPlatform === platform.id
                ? "bg-sidebar-accent"
                : "hover:bg-sidebar-accent/50"
            )}
          >
            <div
              className={cn(
                "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
                currentPlatform === platform.id ? platform.bgColor : "bg-sidebar-foreground/5"
              )}
            >
              <platform.icon
                className={cn(
                  "h-4 w-4",
                  currentPlatform === platform.id ? platform.color : "text-sidebar-foreground/50"
                )}
              />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-white">{platform.name}</div>
              <div className="text-xs text-sidebar-foreground/60">{platform.description}</div>
            </div>
            {currentPlatform === platform.id && (
              <Check className="h-4 w-4 text-white/80 shrink-0" />
            )}
          </button>
        ))}
      </div>

      {/* Footer actions */}
      <div className="mt-2 pt-2 border-t border-sidebar-border space-y-0.5">
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start gap-2.5 text-sidebar-foreground/60 hover:text-white hover:bg-sidebar-accent/50 h-9"
          onClick={() => {
            /* future: navigate to settings */
          }}
        >
          <Settings className="h-4 w-4" />
          <span className="text-xs">All Settings</span>
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start gap-2.5 text-sidebar-foreground/60 hover:text-red-400 hover:bg-red-500/10 h-9"
          onClick={logout}
        >
          <LogOut className="h-4 w-4" />
          <span className="text-xs">Logout</span>
        </Button>
      </div>
    </div>
  );
}
