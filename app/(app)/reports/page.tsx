"use client";

import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Package, BookOpen, FileText, AlertCircle, Receipt, Calendar, FileSpreadsheet } from "lucide-react";

export default function ReportsPage() {
  const inventoryReports = [
    { href: "/reports/current-stock", label: "Current Stock", icon: Package, description: "View current stock levels by category and item" },
    { href: "/reports/inventory-report", label: "Inventory Report", icon: FileText, description: "Detailed item transaction report" },
    { href: "/reports/item-register", label: "Item Register", icon: BookOpen, description: "Item-wise stock movement register" },
    { href: "/reports/pending-items", label: "Pending Items", icon: AlertCircle, description: "Unfulfilled and partially fulfilled orders" },
  ];

  const accountingReports = [
    { href: "/reports/ledger-outstanding", label: "Ledger Outstanding", icon: Receipt, description: "View outstanding balances by ledger" },
    { href: "/reports/day-book", label: "Day Book", icon: Calendar, description: "Daily transaction register" },
    { href: "/reports/gst-filing", label: "GST Filing", icon: FileSpreadsheet, description: "Generate GST-ready reports for filing" },
  ];

  return (
    <div className="flex flex-col gap-6 p-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Reports</h1>
        <p className="text-sm text-muted-foreground">Access all business reports and analytics</p>
      </div>

      <div className="space-y-8">
        <div>
          <h2 className="text-lg font-semibold mb-4">Inventory</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {inventoryReports.map((report) => (
              <Link key={report.href} href={report.href}>
                <Card className="card-hover h-full transition-all hover:shadow-md">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="rounded-lg bg-emerald-100 p-2">
                        <report.icon className="h-5 w-5 text-emerald-600" />
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

        <div>
          <h2 className="text-lg font-semibold mb-4">Accounting</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {accountingReports.map((report) => (
              <Link key={report.href} href={report.href}>
                <Card className="card-hover h-full transition-all hover:shadow-md">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="rounded-lg bg-blue-100 p-2">
                        <report.icon className="h-5 w-5 text-blue-600" />
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
      </div>
    </div>
  );
}
