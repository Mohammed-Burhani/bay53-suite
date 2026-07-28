"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { FileText, Activity, FolderKanban, BarChart3 } from "lucide-react";

const REPORT_NAV_ITEMS = [
  { href: "/bay53crm/reports/lead-details", label: "Lead Details", icon: FileText },
  { href: "/bay53crm/reports/lead-activity", label: "Lead Activity", icon: Activity },
  { href: "/bay53crm/reports/project-details", label: "Project Details", icon: FolderKanban },
  { href: "/bay53crm/reports/sales-stage-status", label: "Sales Stage Status", icon: BarChart3 },
];

export function ReportsLeftNav() {
  const pathname = usePathname();

  return (
    <nav className="space-y-1">
      {REPORT_NAV_ITEMS.map((item) => {
        const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors",
              isActive
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:bg-accent hover:text-foreground"
            )}
          >
            <item.icon className="h-4 w-4" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
