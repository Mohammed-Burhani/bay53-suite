"use client";

import Link from "next/link";
import { ArrowRight, Gauge, IndianRupee, Lock, PackageCheck, ShoppingCart, Store, Truck } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/store";
import { PORTAL_SUMMARY, LIMIT_REQUESTS } from "@/lib/admin-proto/mock";
import { DealerPortalSummary } from "@/components/admin-proto/DealerPortalSummary";

export default function DealerPortalOverviewPage() {
  const s = PORTAL_SUMMARY;
  const pending = LIMIT_REQUESTS.filter((r) => r.status === "Pending");

  return (
    <div className="flex flex-col gap-6 p-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dealer Portal</h1>
        <p className="text-sm text-muted-foreground">Orders, credit and activity coming in from the dealer portal.</p>
      </div>

      <DealerPortalSummary />

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="py-4">
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base font-semibold">
              <div className="rounded-lg bg-amber-100 p-1.5">
                <Gauge className="h-3.5 w-3.5 text-amber-600" />
              </div>
              Limit requests awaiting decision
            </CardTitle>
            <Button asChild variant="ghost" size="sm">
              <Link href="/erp/dealer-portal/limit-requests">
                View all <ArrowRight className="ml-1 h-3.5 w-3.5" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-2">
            {pending.map((r) => (
              <div key={r.id} className="flex items-center justify-between rounded-md border px-3 py-2 text-sm">
                <div>
                  <div className="font-medium">{r.dealer}</div>
                  <div className="text-xs text-muted-foreground">
                    {formatCurrency(r.currentLimit)} → {formatCurrency(r.requestedLimit)}
                  </div>
                </div>
                <span className="text-xs tabular-nums text-muted-foreground">Used {Math.round((r.usedLimit / r.currentLimit) * 100)}%</span>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="py-4">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base font-semibold">
              <div className="rounded-lg bg-indigo-100 p-1.5">
                <Store className="h-3.5 w-3.5 text-indigo-600" />
              </div>
              Quick links
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-2">
            {[
              { href: "/erp/sales/order", label: "Dealer orders", icon: ShoppingCart, note: `${s.newOrders} new` },
              { href: "/erp/master/ledgers", label: "Dealer accounts", icon: Store, note: `${s.activeDealers} active` },
              { href: "/erp/sales", label: "Invoices & dues", icon: IndianRupee, note: formatCurrency(s.overdueAmount) + " overdue" },
              { href: "/erp/master/items", label: "Catalogue items", icon: PackageCheck, note: "Visibility & MOQ" },
              { href: "/erp/sales/order", label: "Pending dispatch", icon: Truck, note: `${s.pendingDispatch} orders` },
              { href: "/erp/master/ledgers", label: "Dealers on hold", icon: Lock, note: `${s.dealersOnHold} dealers` },
            ].map((l) => (
              <Link key={l.label} href={l.href} className="flex items-center gap-3 rounded-md border px-3 py-2.5 hover:bg-muted/50">
                <l.icon className="h-4 w-4 text-muted-foreground" />
                <div>
                  <div className="text-sm font-medium">{l.label}</div>
                  <div className="text-[11px] text-muted-foreground">{l.note}</div>
                </div>
              </Link>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
