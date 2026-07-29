"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Users,
  BarChart3,
  FileText,
  FolderKanban,
  Activity,
  Settings,
  Database,
  Bell,
  Building2,
  Contact,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
} from "lucide-react";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useIsMobile } from "@/hooks/use-mobile";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Menu } from "lucide-react";
import { TabBar } from "@/components/TabBar";
import { PlatformSwitcherHeader, PlatformSwitcherFooter } from "@/components/bay53-platform-switcher";

interface SubMenuItem {
  href: string;
  label: string;
  icon: React.ElementType;
  isGroupLabel?: boolean;
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
    id: "crm-dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
    color: "text-lime-400",
    activeBg: "bg-lime-500/20",
    subItems: [
      { href: "/crm/dashboard", label: "Dashboard", icon: LayoutDashboard },
    ],
  },
  {
    id: "crm-leads",
    label: "Leads",
    icon: Users,
    color: "text-lime-400",
    activeBg: "bg-lime-500/20",
    subItems: [
      { href: "/crm/leads", label: "All Leads", icon: Users },
    ],
  },
  {
    id: "crm-projects",
    label: "Projects",
    icon: FolderKanban,
    color: "text-lime-400",
    activeBg: "bg-lime-500/20",
    subItems: [
      { href: "/crm/projects", label: "All Projects", icon: FolderKanban },
    ],
  },
  {
    id: "crm-reports",
    label: "Reports",
    icon: BarChart3,
    color: "text-lime-400",
    activeBg: "bg-lime-500/20",
    subItems: [
      { href: "", label: "Reports", icon: BarChart3, isGroupLabel: true },
      { href: "/crm/reports/lead-details", label: "Lead Details", icon: FileText },
      { href: "/crm/reports/lead-activity", label: "Lead Activity", icon: Activity },
      { href: "/crm/reports/project-details", label: "Project Details", icon: FolderKanban },
      { href: "/crm/reports/sales-stage-status", label: "Sales Stage Status", icon: BarChart3 },
    ],
  },
  {
    id: "crm-cms",
    label: "CMS",
    icon: Settings,
    color: "text-lime-400",
    activeBg: "bg-lime-500/20",
    subItems: [
      { href: "", label: "CMS", icon: Settings, isGroupLabel: true },
      { href: "/crm/cms/master-values", label: "Master Values", icon: Database },
      { href: "/crm/cms/notification-master", label: "Notification Master", icon: Bell },
    ],
  },
  {
    id: "crm-company",
    label: "Company",
    icon: Building2,
    color: "text-lime-400",
    activeBg: "bg-lime-500/20",
    subItems: [
      { href: "/crm/company", label: "Company Settings", icon: Building2 },
    ],
  },
];

export default function CrmAppShell({ children }: { children: React.ReactNode }) {
  const rawPathname = usePathname();
  const isMobile = useIsMobile();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [openModules, setOpenModules] = useState<string[]>([]);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isMobile) {
      setMobileOpen(false);
    }
  }, [rawPathname, isMobile]);

  useEffect(() => {
    const activeModule = NAV_MODULES.find(module =>
      module.subItems.some(item => rawPathname.startsWith(item.href))
    );
    if (activeModule && !openModules.includes(activeModule.id)) {
      setOpenModules(prev => [...prev, activeModule.id]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rawPathname]);

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
      <div className="absolute inset-0 bg-linear-to-b from-[var(--sidebar-glow-from)]/10 via-transparent to-[var(--sidebar-glow-to)]/10 pointer-events-none" />

      <div className="relative flex h-16 items-center gap-3 border-b border-sidebar-border px-4">
        {!collapsed && (
          <div className="flex flex-col overflow-hidden">
            <Image
              src="/logo.png"
              alt="Bay53 Logo"
              width={500}
              height={500}
              className="w-16 h-10"
            />
            <span className="text-[10px] text-sidebar-foreground/60 ml-1">CRM</span>
          </div>
        )}

        {!collapsed && (
          <div className="ml-auto">
            <PlatformSwitcherHeader />
          </div>
        )}
      </div>

      <nav className="relative flex-1 space-y-1 overflow-y-auto px-2 py-4">
        {NAV_MODULES.map((module) => {
          const isModuleActive = module.subItems.some(item => !item.isGroupLabel && (pathname.startsWith(item.href)));
          const isOpen = openModules.includes(module.id);

          if (collapsed) {
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
                      subItem.isGroupLabel ? (
                        <div key={subItem.label} className="px-2 pt-2 pb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                          {subItem.label}
                        </div>
                      ) : (
                        <Link
                          key={subItem.href}
                          href={subItem.href}
                          className="flex items-center gap-2 px-2 py-1 text-xs rounded hover:bg-accent"
                        >
                          <subItem.icon className="h-3 w-3" />
                          {subItem.label}
                        </Link>
                      )
                    ))}
                  </div>
                </TooltipContent>
              </Tooltip>
            );
          }

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
                  if (subItem.isGroupLabel) {
                    return (
                      <div key={subItem.label} className="px-3 pt-3 pb-1 text-[10px] font-semibold uppercase tracking-wider text-sidebar-foreground/40">
                        {subItem.label}
                      </div>
                    );
                  }
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

      <div className="relative border-t border-sidebar-border p-2 space-y-1">
        <PlatformSwitcherFooter collapsed={collapsed} />

        {!isMobile && (
          <Button
            variant="ghost"
            size="sm"
            className="w-full text-sidebar-foreground/60 hover:text-white hover:bg-sidebar-accent px-2"
            onClick={() => setCollapsed(!collapsed)}
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </Button>
        )}
      </div>
    </>
  );

  return (
    <TooltipProvider delayDuration={0}>
      <div data-theme="crm" className="flex h-screen overflow-hidden bg-background">
        {isMobile ? (
          <>
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
                  <span className="text-[10px] text-sidebar-foreground/60">CRM</span>
                </div>

                <div className="ml-auto">
                  <PlatformSwitcherHeader />
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

            <main className="flex-1 overflow-auto" style={{ paddingTop: "104px" }}>{children}</main>
          </>
        ) : (
          <>
            <aside
              className={cn(
                "flex flex-col bg-sidebar text-sidebar-foreground transition-all duration-300 ease-in-out relative",
                collapsed ? "w-[68px]" : "w-[260px]"
              )}
            >
              {sidebarContent}
            </aside>

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
