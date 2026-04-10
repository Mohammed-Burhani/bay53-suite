"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";
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
  Settings,
  LogOut,
} from "lucide-react";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useIsMobile } from "@/hooks/use-mobile";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Menu } from "lucide-react";
import { useSession, useLogout } from "@/lib/hooks/useAuth";
import { TabBar } from "@/components/TabBar";

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
      { href: "/sales", label: "Sales Invoices", icon: Receipt },
      { href: "/sales/create", label: "Create Invoice", icon: Plus },
      { href: "/sales/returns", label: "Sales Returns", icon: Trash2 },
      { href: "/sales/certificates", label: "Calibration Certificates", icon: FileText },
    ],
  },
  {
    id: "purchases",
    label: "Purchases",
    icon: IndianRupee,
    color: "text-violet-400",
    activeBg: "bg-violet-500/20",
    subItems: [
      { href: "/purchases", label: "Purchase Invoices", icon: Receipt },
      { href: "/purchases/create", label: "New Purchase", icon: Plus },
      { href: "/purchases/orders", label: "Purchase Orders", icon: FileText },
      { href: "/purchases/returns", label: "Purchase Returns", icon: Trash2 },
    ],
  },
  {
    id: "stock",
    label: "Stock",
    icon: Package,
    color: "text-emerald-400",
    activeBg: "bg-emerald-500/20",
    subItems: [
      { href: "/stock-invoices", label: "Stock Invoices", icon: Receipt },
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
    id: "certificates",
    label: "Certificates",
    icon: FileText,
    color: "text-teal-400",
    activeBg: "bg-teal-500/20",
    subItems: [
      { href: "/certificates", label: "All Certificates", icon: List },
      { href: "/sales/certificates", label: "Invoice Certificates", icon: Receipt },
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
      { href: "/reports/ledger-balances", label: "Ledger Balances", icon: FileBarChart },
      { href: "/reports/ledger-register", label: "Ledger Register", icon: FileText },
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
  {
    id: "settings",
    label: "Settings",
    icon: Settings,
    color: "text-slate-400",
    activeBg: "bg-slate-500/20",
    subItems: [
      { href: "/settings", label: "All Settings", icon: Settings },
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
  const session = useSession();
  const logout = useLogout();

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
        {/* <div className="flex items-center justify-center">
          <Image 
            src="/logo.png" 
            alt="Bay53 Logo" 
            width={500} 
            height={500}
            className="w-16 h-10"
          />
        </div> */}
        {!collapsed && (
          <div className="flex flex-col overflow-hidden">
            {/* <span className="text-sm font-bold tracking-tight text-white">Bay53</span> */}
            <Image 
            src="/logo.png" 
            alt="Bay53 Logo" 
            width={500} 
            height={500}
            className="w-16 h-10"
          />
            <span className="text-[10px] text-sidebar-foreground/60 ml-1">ERP SUITE</span>
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

      {/* User info + Logout + Collapse */}
      <div className="relative border-t border-sidebar-border p-2 space-y-1">
        {/* User info row */}
        {!collapsed && session && (
          <div className="flex items-center gap-2 px-2 py-1.5 rounded-lg">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-bold">
              {session.user.first_Name?.[0]?.toUpperCase() ?? "U"}
            </div>
            <div className="flex flex-col overflow-hidden flex-1 min-w-0">
              <span className="text-xs font-medium text-white truncate">
                {session.user.first_Name} {session.user.lastname}
              </span>
              <span className="text-[10px] text-sidebar-foreground/50 truncate">
                {session.company.compName}
              </span>
            </div>
          </div>
        )}

        <div className="flex gap-1">
          {/* Logout button */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className={cn(
                  "text-sidebar-foreground/60 hover:text-red-400 hover:bg-red-500/10",
                  collapsed ? "w-full justify-center" : "flex-1 justify-start gap-2"
                )}
                onClick={logout}
              >
                <LogOut className="h-4 w-4 shrink-0" />
                {!collapsed && <span className="text-xs">Logout</span>}
              </Button>
            </TooltipTrigger>
            {collapsed && (
              <TooltipContent side="right" sideOffset={8}>Logout</TooltipContent>
            )}
          </Tooltip>

          {/* Collapse toggle - desktop only */}
          {!isMobile && (
            <Button
              variant="ghost"
              size="sm"
              className="text-sidebar-foreground/60 hover:text-white hover:bg-sidebar-accent px-2"
              onClick={() => setCollapsed(!collapsed)}
            >
              {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
            </Button>
          )}
        </div>
      </div>
    </>
  );

  return (
    <TooltipProvider delayDuration={0}>
      <div className="flex h-screen overflow-hidden bg-background">
        {/* Mobile Sidebar - Sheet */}
        {isMobile ? (
          <>
            {/* Mobile Header with Menu Button */}
            <div className="fixed top-0 left-0 right-0 z-50 flex flex-col border-b bg-sidebar md:hidden">
              <div className="flex h-16 items-center gap-3 px-4">
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-sidebar-foreground hover:text-white hover:bg-sidebar-accent"
                  onClick={() => setMobileOpen(true)}
                >
                  <Menu className="h-5 w-5" />
                </Button>
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl overflow-hidden">
                  <Image 
                    src="/logo.png" 
                    alt="Bay53 Logo" 
                    width={36} 
                    height={36}
                    className="object-contain"
                  />
                </div>
                <div className="flex flex-col overflow-hidden">
                  <span className="text-sm font-bold tracking-tight text-white">Bay53</span>
                  <span className="text-[10px] text-sidebar-foreground/60">Inventory & Billing</span>
                </div>
              </div>
              <TabBar />
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
            <main className="flex-1 overflow-auto" style={{ paddingTop: "104px" }}>{children}</main>
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

            {/* Main content with tab bar */}
            <div className="flex-1 flex flex-col overflow-hidden">
              <TabBar />
              <main className="flex-1 overflow-auto">{children}</main>
            </div>
          </>
        )}
      </div>
    </TooltipProvider>
  );
}
