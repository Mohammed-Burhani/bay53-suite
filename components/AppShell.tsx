"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  FileText,
  BarChart3,
  ChevronLeft,
  ChevronRight,
  IndianRupee,
  Store,
} from "lucide-react";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, color: "text-indigo-400", activeBg: "bg-indigo-500/20" },
  { href: "/inventory", label: "Inventory", icon: Package, color: "text-emerald-400", activeBg: "bg-emerald-500/20" },
  { href: "/pos", label: "POS (Billing)", icon: ShoppingCart, color: "text-amber-400", activeBg: "bg-amber-500/20" },
  { href: "/sales", label: "Sales & Invoices", icon: FileText, color: "text-cyan-400", activeBg: "bg-cyan-500/20" },
  { href: "/purchases", label: "Purchases", icon: IndianRupee, color: "text-violet-400", activeBg: "bg-violet-500/20" },
  { href: "/parties", label: "Parties", icon: Users, color: "text-pink-400", activeBg: "bg-pink-500/20" },
  { href: "/reports", label: "Reports", icon: BarChart3, color: "text-orange-400", activeBg: "bg-orange-500/20" },
];

export default function AppShell({ children }: { children: React.ReactNode }) {
  const rawPathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Only use pathname for active styling after mount to avoid hydration mismatch
  const pathname = mounted ? rawPathname : "";

  return (
    <TooltipProvider delayDuration={0}>
      <div className="flex h-screen overflow-hidden bg-background">
        {/* Sidebar */}
        <aside
          className={cn(
            "flex flex-col bg-sidebar text-sidebar-foreground transition-all duration-300 ease-in-out relative",
            collapsed ? "w-[68px]" : "w-[240px]"
          )}
        >
          {/* Subtle gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-b from-indigo-600/10 via-transparent to-violet-600/10 pointer-events-none" />

          {/* Logo */}
          <div className="relative flex h-16 items-center gap-3 border-b border-sidebar-border px-4">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-lg shadow-indigo-500/25">
              <Store className="h-5 w-5" />
            </div>
            {!collapsed && (
              <div className="flex flex-col overflow-hidden">
                <span className="text-sm font-bold tracking-tight text-white">StockBuddy</span>
                <span className="text-[10px] text-sidebar-foreground/60">Inventory & Billing</span>
              </div>
            )}
          </div>

          {/* Nav */}
          <nav className="relative flex-1 space-y-1 overflow-y-auto px-2 py-4">
            {NAV_ITEMS.map((item) => {
              const isActive = pathname.startsWith(item.href);
              const link = (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200",
                    isActive
                      ? `${item.activeBg} text-white shadow-sm`
                      : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-white"
                  )}
                >
                  <item.icon className={cn(
                    "h-[18px] w-[18px] shrink-0 transition-colors duration-200",
                    isActive ? item.color : "text-sidebar-foreground/50 group-hover:text-sidebar-foreground/80"
                  )} />
                  {!collapsed && <span className="truncate">{item.label}</span>}
                  {isActive && !collapsed && (
                    <div className="ml-auto h-1.5 w-1.5 rounded-full bg-current opacity-80" />
                  )}
                </Link>
              );

              if (collapsed) {
                return (
                  <Tooltip key={item.href}>
                    <TooltipTrigger asChild>{link}</TooltipTrigger>
                    <TooltipContent side="right" sideOffset={8} className="font-medium">
                      {item.label}
                    </TooltipContent>
                  </Tooltip>
                );
              }

              return link;
            })}
          </nav>

          {/* Collapse button */}
          <div className="relative border-t border-sidebar-border p-2">
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-center text-sidebar-foreground/60 hover:text-white hover:bg-sidebar-accent"
              onClick={() => setCollapsed(!collapsed)}
            >
              {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
            </Button>
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 overflow-auto">{children}</main>
      </div>
    </TooltipProvider>
  );
}
