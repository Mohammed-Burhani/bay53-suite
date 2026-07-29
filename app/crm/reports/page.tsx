"use client";

import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { FileText, Activity, FolderKanban, BarChart3 } from "lucide-react";

const REPORTS = [
  { href: "/crm/reports/lead-details", label: "Lead Details", icon: FileText, description: "Detailed lead table with export" },
  { href: "/crm/reports/lead-activity", label: "Lead Activity", icon: Activity, description: "Follow-up activity log" },
  { href: "/crm/reports/project-details", label: "Project Details", icon: FolderKanban, description: "Project list with all fields" },
  { href: "/crm/reports/sales-stage-status", label: "Sales Stage Status", icon: BarChart3, description: "Pivot table and chart by stage" },
];

export default function CRMReportsPage() {
  return (
    <div className="flex flex-col gap-6 p-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">CRM Reports</h1>
        <p className="text-sm text-muted-foreground">Lead and project analytics</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {REPORTS.map((report) => (
          <Link key={report.href} href={report.href}>
            <Card className="card-hover h-full transition-all hover:shadow-md">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="rounded-lg bg-sky-100 p-2">
                    <report.icon className="h-5 w-5 text-sky-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-sm mb-1">{report.label}</h3>
                    <p className="text-xs text-muted-foreground">{report.description}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
