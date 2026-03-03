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
  ChevronDown,
  Plus,
  List,
  Trash2,
  Eye,
  TrendingUp,
  TrendingDown,
  Receipt,
  UserPlus,
  FileBarChart,
  Sparkles,
  Rocket,
} from "lucide-react";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useIsMobile } from "@/hooks/use-mobile";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Menu } from "lucide-react";

interface SubMenuItem {
  href: string;
  label: string;
  icon: React.ElementType;
}

interface NavModule {
  id: string;
  label: string;
  icon: React.ElementType;
  color: string;
  activeBg: string;
  subItems: SubMenuItem[];
}

const NAV_MODULES: NavModule[] = [
  {
    id: "onboarding",
    label: "Get Started",
    icon: Rocket,
    color: "text-purple-400",
    activeBg: "bg-purple-500/20",
    subItems: [
      { href: "/onboarding", label: "Onboarding Tour", icon: Rocket },
    ],
  },
  {
    id: "dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
    color: "text-indigo-400",
    activeBg: "bg-indigo-500/20",
    subItems: [
      { href: "/dashboard", label: "Overview", icon: Eye },
    ],
  },
  {
    id: "inventory",
    label: "Inventory",
    icon: Package,
    color: "text-emerald-400",
    activeBg: "bg-emerald-500/20",
    subItems: [
      { href: "/inventory", label: "All Products", icon: List },
      { href: "/inventory/add", label: "Add Product", icon: Plus },
      { href: "/inventory/categories", label: "Categories", icon: FileText },
      { href: "/inventory/low-stock", label: "Low Stock Alert", icon: TrendingDown },
    ],
  },
  {
    id: "sales",
    label: "Sales",
    icon: TrendingUp,
    color: "text-cyan-400",
    activeBg: "bg-cyan-500/20",
    subItems: [
      { href: "/pos", label: "POS (Billing)", icon: ShoppingCart },
      { href: "/sales", label: "All Invoices", icon: Receipt },
      { href: "/sales/create", label: "Create Invoice", icon: Plus },
      { href: "/sales/returns", label: "Sales Returns", icon: Trash2 },
    ],
  },
  {
    id: "purchases",
    label: "Purchases",
    icon: IndianRupee,
    color: "text-violet-400",
    activeBg: "bg-violet-500/20",
    subItems: [
      { href: "/purchases", label: "All Purchases", icon: List },
      { href: "/purchases/create", label: "New Purchase", icon: Plus },
      { href: "/purchases/orders", label: "Purchase Orders", icon: FileText },
      { href: "/purchases/returns", label: "Purchase Returns", icon: Trash2 },
    ],
  },
  {
    id: "parties",
    label: "Parties",
    icon: Users,
    color: "text-pink-400",
    activeBg: "bg-pink-500/20",
    subItems: [
      { href: "/parties", label: "All Parties", icon: List },
      { href: "/parties/customers", label: "Customers", icon: Users },
      { href: "/parties/suppliers", label: "Suppliers", icon: Users },
      { href: "/parties/add", label: "Add Party", icon: UserPlus },
    ],
  },
  {
    id: "reports",
    label: "Reports",
    icon: BarChart3,
    color: "text-orange-400",
    activeBg: "bg-orange-500/20",
    subItems: [
      { href: "/reports", label: "All Reports", icon: FileBarChart },
      { href: "/reports/current-stock", label: "Current Stock", icon: Package },
      { href: "/reports/inventory-report", label: "Inventory Report", icon: FileText },
      { href: "/reports/item-register", label: "Item Register", icon: FileText },
      { href: "/reports/pending-items", label: "Pending Items", icon: TrendingDown },
      { href: "/reports/ledger-outstanding", label: "Ledger Outstanding", icon: Receipt },
      { href: "/reports/day-book", label: "Day Book", icon: FileText },
      { href: "/reports/gst-filing", label: "GST Filing", icon: FileText },
    ],
  },
  {
    id: "ai-assistant",
    label: "AI Assistant",
    icon: Sparkles,
    color: "text-fuchsia-400",
    activeBg: "bg-fuchsia-500/20",
    subItems: [
      { href: "/ai-assistant", label: "Chat Assistant", icon: Sparkles },
    ],
  },
];

export default function AppShell({ children }: { children: React.ReactNode }) {
  const rawPathname = usePathname();
  const isMobile = useIsMobile();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [openModules, setOpenModules] = useState<string[]>([]);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Auto-close mobile sidebar on route change
  useEffect(() => {
    if (isMobile) {
      setMobileOpen(false);
    }
  }, [rawPathname, isMobile]);

  useEffect(() => {
    // Auto-open the module that matches current path
    const activeModule = NAV_MODULES.find(module => 
      module.subItems.some(item => rawPathname.startsWith(item.href))
    );
    if (activeModule && !openModules.includes(activeModule.id)) {
      setOpenModules(prev => [...prev, activeModule.id]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rawPathname]);

  // Only use pathname for active styling after mount to avoid hydration mismatch
  const pathname = mounted ? rawPathname : "";

  const toggleModule = (moduleId: string) => {
    setOpenModules(prev => 
      prev.includes(moduleId) 
        ? prev.filter(id => id !== moduleId)
        : [...prev, moduleId]
    );
  };

  const sidebarContent = (
    <>
      {/* Subtle gradient overlay */}
      <div className="absolute inset-0 bg-linear-to-b from-indigo-600/10 via-transparent to-violet-600/10 pointer-events-none" />

      {/* Logo */}
      <div className="relative flex h-16 items-center gap-3 border-b border-sidebar-border px-4">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-linear-to-br from-indigo-500 to-violet-600 text-white shadow-lg shadow-indigo-500/25">
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
        {NAV_MODULES.map((module) => {
              const isModuleActive = module.subItems.some(item => pathname.startsWith(item.href));
              const isOpen = openModules.includes(module.id);

              if (collapsed) {
                // Collapsed view - show tooltip with sub-items
                return (
                  <Tooltip key={module.id}>
                    <TooltipTrigger asChild>
                      <div
                        className={cn(
                          "group flex items-center justify-center rounded-xl px-3 py-2.5 cursor-pointer transition-all duration-200",
                          isModuleActive
                            ? `${module.activeBg} text-white shadow-sm`
                            : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-white"
                        )}
                        onClick={() => toggleModule(module.id)}
                      >
                        <module.icon className={cn(
                          "h-[18px] w-[18px] shrink-0 transition-colors duration-200",
                          isModuleActive ? module.color : "text-sidebar-foreground/50 group-hover:text-sidebar-foreground/80"
                        )} />
                      </div>
                    </TooltipTrigger>
                    <TooltipContent side="right" sideOffset={8} className="p-2">
                      <div className="font-medium mb-2">{module.label}</div>
                      <div className="space-y-1">
                        {module.subItems.map(subItem => (
                          <Link
                            key={subItem.href}
                            href={subItem.href}
                            className="flex items-center gap-2 px-2 py-1 text-xs rounded hover:bg-accent"
                          >
                            <subItem.icon className="h-3 w-3" />
                            {subItem.label}
                          </Link>
                        ))}
                      </div>
                    </TooltipContent>
                  </Tooltip>
                );
              }

              // Expanded view - show collapsible module
              return (
                <Collapsible
                  key={module.id}
                  open={isOpen}
                  onOpenChange={() => toggleModule(module.id)}
                >
                  <CollapsibleTrigger asChild>
                    <div
                      className={cn(
                        "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 cursor-pointer",
                        isModuleActive
                          ? `${module.activeBg} text-white shadow-sm`
                          : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-white"
                      )}
                    >
                      <module.icon className={cn(
                        "h-[18px] w-[18px] shrink-0 transition-colors duration-200",
                        isModuleActive ? module.color : "text-sidebar-foreground/50 group-hover:text-sidebar-foreground/80"
                      )} />
                      <span className="truncate flex-1">{module.label}</span>
                      <ChevronDown className={cn(
                        "h-4 w-4 transition-transform duration-200",
                        isOpen && "rotate-180"
                      )} />
                    </div>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="mt-1 space-y-1">
                    {module.subItems.map(subItem => {
                      const isSubItemActive = pathname === subItem.href || pathname.startsWith(subItem.href + '/');
                      return (
                        <Link
                          key={subItem.href}
                          href={subItem.href}
                          className={cn(
                            "flex items-center gap-3 rounded-lg px-3 py-2 pl-10 text-xs font-medium transition-all duration-200",
                            isSubItemActive
                              ? "bg-sidebar-accent/50 text-white"
                              : "text-sidebar-foreground/60 hover:bg-sidebar-accent/30 hover:text-white"
                          )}
                        >
                          <subItem.icon className="h-3.5 w-3.5 shrink-0" />
                          <span className="truncate">{subItem.label}</span>
                        </Link>
                      );
                    })}
                  </CollapsibleContent>
                </Collapsible>
              );
            })}
      </nav>

      {/* Collapse button - only on desktop */}
      {!isMobile && (
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
      )}
    </>
  );

  return (
    <TooltipProvider delayDuration={0}>
      <div className="flex h-screen overflow-hidden bg-background">
        {/* Mobile Sidebar - Sheet */}
        {isMobile ? (
          <>
            {/* Mobile Header with Menu Button */}
            <div className="fixed top-0 left-0 right-0 z-50 flex h-16 items-center gap-3 border-b bg-sidebar px-4 md:hidden">
              <Button
                variant="ghost"
                size="icon"
                className="text-sidebar-foreground hover:text-white hover:bg-sidebar-accent"
                onClick={() => setMobileOpen(true)}
              >
                <Menu className="h-5 w-5" />
              </Button>
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-linear-to-br from-indigo-500 to-violet-600 text-white shadow-lg shadow-indigo-500/25">
                <Store className="h-5 w-5" />
              </div>
              <div className="flex flex-col overflow-hidden">
                <span className="text-sm font-bold tracking-tight text-white">StockBuddy</span>
                <span className="text-[10px] text-sidebar-foreground/60">Inventory & Billing</span>
              </div>
            </div>

            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetContent 
                side="left" 
                className="w-[260px] p-0 bg-sidebar text-sidebar-foreground"
              >
                <aside className="flex flex-col h-full relative">
                  {sidebarContent}
                </aside>
              </SheetContent>
            </Sheet>

            {/* Main content with top padding for fixed header */}
            <main className="flex-1 overflow-auto pt-16">{children}</main>
          </>
        ) : (
          <>
            {/* Desktop Sidebar */}
            <aside
              className={cn(
                "flex flex-col bg-sidebar text-sidebar-foreground transition-all duration-300 ease-in-out relative",
                collapsed ? "w-[68px]" : "w-[260px]"
              )}
            >
              {sidebarContent}
            </aside>

            {/* Main content */}
            <main className="flex-1 overflow-auto">{children}</main>
          </>
        )}
      </div>
    </TooltipProvider>
  );
}
