"use client";

// Dealer-portal KPI cards + order pipeline. Used on the Dealer Portal overview page and
// embedded in the main ERP dashboard (/api/Dealer/DashboardSummary equivalent, mock data).

import { Gauge, IndianRupee, Lock, ShoppingCart, Store, Truck } from "lucide-react";
import { Bar, BarChart, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/store";
import { PORTAL_SUMMARY } from "@/lib/admin-proto/mock";
import { LimitUsageBar } from "./parts";

function Kpi({ title, value, subtitle, icon, iconBg, iconColor, borderColor }: { title: string; value: string; subtitle: string; icon: React.ReactNode; iconBg: string; iconColor: string; borderColor: string }) {
  return (
    <Card className={`card-hover border-l-4 ${borderColor} p-4!`}>
      <CardContent>
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{title}</span>
          <div className={`rounded-xl ${iconBg} p-2 ${iconColor}`}>{icon}</div>
        </div>
        <div className="mt-2 text-2xl font-bold tracking-tight">{value}</div>
        <p className="mt-1 text-xs text-muted-foreground">{subtitle}</p>
      </CardContent>
    </Card>
  );
}

export function DealerPortalSummary() {
  const s = PORTAL_SUMMARY;
  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <Kpi title="Active dealers" value={String(s.activeDealers)} subtitle="portal enabled" icon={<Store className="h-5 w-5" />} iconBg="bg-indigo-100" iconColor="text-indigo-600" borderColor="border-l-indigo-500" />
        <Kpi title="New orders" value={String(s.newOrders)} subtitle="awaiting confirmation" icon={<ShoppingCart className="h-5 w-5" />} iconBg="bg-sky-100" iconColor="text-sky-600" borderColor="border-l-sky-500" />
        <Kpi title="Pending dispatch" value={String(s.pendingDispatch)} subtitle="confirmed / processing" icon={<Truck className="h-5 w-5" />} iconBg="bg-violet-100" iconColor="text-violet-600" borderColor="border-l-violet-500" />
        <Kpi title="Dealer overdue" value={formatCurrency(s.overdueAmount)} subtitle="across all dealers" icon={<IndianRupee className="h-5 w-5" />} iconBg="bg-red-100" iconColor="text-red-600" borderColor="border-l-red-500" />
        <Kpi title="Limit requests" value={String(s.pendingLimitRequests)} subtitle="pending decision" icon={<Gauge className="h-5 w-5" />} iconBg="bg-amber-100" iconColor="text-amber-600" borderColor="border-l-amber-500" />
        <Kpi title="Dealers on hold" value={String(s.dealersOnHold)} subtitle="cannot place orders" icon={<Lock className="h-5 w-5" />} iconBg="bg-rose-100" iconColor="text-rose-600" borderColor="border-l-rose-500" />
      </div>

      <div className="grid gap-4 lg:grid-cols-5">
        <Card className="py-4 lg:col-span-3">
          <CardHeader>
            <CardTitle className="text-base font-semibold">Dealer order pipeline</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[240px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={s.ordersByStatus}>
                  <XAxis dataKey="status" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip cursor={{ fill: "rgba(0,0,0,0.04)" }} />
                  <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                    {s.ordersByStatus.map((e) => (
                      <Cell key={e.status} fill={e.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="py-4 lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base font-semibold">Dealers near credit limit</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {s.topDealers.map((d) => (
              <div key={d.name}>
                <div className="flex justify-between text-sm">
                  <span className="font-medium">{d.name}</span>
                  <span className="text-xs text-muted-foreground tabular-nums">{formatCurrency(d.outstanding)} outstanding</span>
                </div>
                <LimitUsageBar used={d.used} limit={100} className="[&>div:first-child]:hidden" />
                <div className="text-right text-[10px] text-muted-foreground">{d.used}% of limit used</div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
