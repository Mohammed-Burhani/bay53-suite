"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Bell, CheckCheck, Gauge, IndianRupee, PackageX, ShoppingCart, Truck } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { NOTIFICATIONS, type PortalNotification } from "@/lib/admin-proto/mock";
import { fmtDate } from "@/components/admin-proto/parts";

const KIND: Record<PortalNotification["kind"], { icon: React.ElementType; tone: string }> = {
  order: { icon: ShoppingCart, tone: "bg-indigo-100 text-indigo-600" },
  delivery: { icon: Truck, tone: "bg-emerald-100 text-emerald-600" },
  stock: { icon: PackageX, tone: "bg-amber-100 text-amber-600" },
  limit: { icon: Gauge, tone: "bg-rose-100 text-rose-600" },
  payment: { icon: IndianRupee, tone: "bg-red-100 text-red-600" },
};

const PREFS = [
  { key: "orders", label: "New & cancelled orders", note: "When a dealer places or cancels an order" },
  { key: "delivery", label: "Delivery updates", note: "Dispatched and delivered shipments" },
  { key: "stock", label: "Stock alerts", note: "Items falling below reorder level" },
  { key: "limit", label: "Credit limit", note: "Limit requests and dealers nearing their limit" },
] as const;

export default function PortalNotificationsPage() {
  const [items, setItems] = useState(NOTIFICATIONS);
  const [filter, setFilter] = useState<"all" | "unread">("all");
  const [prefs, setPrefs] = useState<Record<string, boolean>>({ orders: true, delivery: true, stock: true, limit: true });

  const unread = items.filter((n) => !n.isRead).length;
  const shown = items.filter((n) => filter === "all" || !n.isRead);

  return (
    <div className="flex flex-col gap-4 p-6">
      <div className="flex flex-wrap items-center gap-3">
        <div className="mr-auto">
          <h1 className="text-2xl font-bold tracking-tight">Portal Notifications</h1>
          <p className="text-sm text-muted-foreground">{unread} unread</p>
        </div>
        <Tabs value={filter} onValueChange={(v) => setFilter(v as "all" | "unread")}>
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="unread">Unread</TabsTrigger>
          </TabsList>
        </Tabs>
        <Button
          variant="outline"
          size="sm"
          disabled={unread === 0}
          onClick={() => {
            setItems((l) => l.map((n) => ({ ...n, isRead: true })));
            toast.success("All notifications marked as read");
          }}
        >
          <CheckCheck className="mr-2 h-4 w-4" />
          Mark all read
        </Button>
      </div>

      <div className="grid items-start gap-4 lg:grid-cols-[1fr_20rem]">
        <Card className="gap-0 overflow-hidden py-0">
          {shown.length === 0 && <div className="py-14 text-center text-sm text-muted-foreground">Nothing here.</div>}
          {shown.map((n) => {
            const k = KIND[n.kind];
            return (
              <button
                key={n.id}
                type="button"
                onClick={() => setItems((l) => l.map((x) => (x.id === n.id ? { ...x, isRead: true } : x)))}
                className={cn("flex w-full items-start gap-3 border-b px-4 py-3 text-left last:border-b-0 hover:bg-muted/40", !n.isRead && "bg-primary/5")}
              >
                <div className={cn("mt-0.5 rounded-lg p-2", k.tone)}>
                  <k.icon className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{n.title}</span>
                    {!n.isRead && <span className="h-2 w-2 rounded-full bg-primary" />}
                  </div>
                  <p className="text-sm text-muted-foreground">{n.body}</p>
                  <div className="mt-1 flex items-center gap-2 text-[11px] text-muted-foreground">
                    <Badge variant="outline" className="text-[10px]">
                      {n.refType} · {n.refId}
                    </Badge>
                    <span>{fmtDate(n.createdAt, "dd MMM, HH:mm")}</span>
                  </div>
                </div>
              </button>
            );
          })}
        </Card>

        <Card className="py-4">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Bell className="h-4 w-4" />
              Notification settings
            </CardTitle>
            <CardDescription>Choose what the admin team is alerted about.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {PREFS.map((p) => (
              <div key={p.key} className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-sm font-medium">{p.label}</div>
                  <div className="text-[11px] text-muted-foreground">{p.note}</div>
                </div>
                <Switch checked={prefs[p.key]} onCheckedChange={(c) => setPrefs((s) => ({ ...s, [p.key]: c }))} />
              </div>
            ))}
            <Button className="w-full" size="sm" onClick={() => toast.success("Notification settings saved")}>
              Save settings
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
