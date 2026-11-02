"use client";

// Shared building blocks for the admin-dashboard UI prototype. Everything here renders
// mock data from lib/admin-proto/mock.ts; nothing calls an API.

import { useState } from "react";
import { format } from "date-fns";
import { toast } from "sonner";
import { Check, Download, ImagePlus, MapPin, Package, Truck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Section, FieldGrid, Row, NumberInput, Flag } from "@/components/master/shared/form-parts";
import { formatCurrency } from "@/lib/store";
import { cn } from "@/lib/utils";
import {
  BUSINESS_TYPES,
  DOC_KIND_LABEL,
  ORDER_STATUSES,
  mockDealer,
  mockItem,
  mockOrder,
  type DealerMock,
  type ItemMock,
  type OrderMock,
  type OrderStatus,
  type PaymentStatus,
  type StockStatus,
} from "@/lib/admin-proto/mock";

export const fmtDate = (iso: string | null | undefined, pattern = "dd MMM yyyy") => {
  if (!iso) return "—";
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "—" : format(d, pattern);
};

// ---------------------------------------------------------------- badges

const ORDER_TONE: Record<OrderStatus, string> = {
  Placed: "bg-indigo-100 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300",
  Confirmed: "bg-sky-100 text-sky-700 dark:bg-sky-950/40 dark:text-sky-300",
  Processing: "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300",
  Dispatched: "bg-violet-100 text-violet-700 dark:bg-violet-950/40 dark:text-violet-300",
  Delivered: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300",
  Cancelled: "bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-300",
};

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  return (
    <Badge variant="secondary" className={cn("text-[10px]", ORDER_TONE[status])}>
      {status}
    </Badge>
  );
}

const PAYMENT_TONE: Record<PaymentStatus, string> = {
  Paid: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300",
  "Partially Paid": "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300",
  Unpaid: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
  Overdue: "bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-300",
};

export function PaymentStatusBadge({ status }: { status: PaymentStatus }) {
  return (
    <Badge variant="secondary" className={cn("text-[10px]", PAYMENT_TONE[status])}>
      {status}
    </Badge>
  );
}

const STOCK_TONE: Record<StockStatus, string> = {
  "In Stock": "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300",
  "Low Stock": "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300",
  "Out of Stock": "bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-300",
};

export function StockStatusBadge({ status }: { status: StockStatus }) {
  return (
    <Badge variant="secondary" className={cn("text-[10px]", STOCK_TONE[status])}>
      {status}
    </Badge>
  );
}

export function RequestStatusBadge({ status }: { status: "Pending" | "Approved" | "Rejected" }) {
  const tone =
    status === "Approved"
      ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"
      : status === "Rejected"
        ? "bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-300"
        : "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300";
  return (
    <Badge variant="secondary" className={cn("text-[10px]", tone)}>
      {status}
    </Badge>
  );
}

// ---------------------------------------------------------------- limit usage bar

export function LimitUsageBar({ used, limit, className }: { used: number; limit: number; className?: string }) {
  const pct = limit > 0 ? Math.min(100, Math.round((used / limit) * 100)) : 0;
  const tone = pct >= 90 ? "bg-red-500" : pct >= 70 ? "bg-amber-500" : "bg-emerald-500";
  return (
    <div className={cn("min-w-32", className)}>
      <div className="flex justify-between text-[10px] tabular-nums text-muted-foreground">
        <span>{formatCurrency(used)}</span>
        <span>{pct}%</span>
      </div>
      <div className="mt-0.5 h-1.5 overflow-hidden rounded-full bg-muted">
        <div className={cn("h-full rounded-full", tone)} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------- status timeline

export function StatusTimeline({ events }: { events: { status: OrderStatus; at: string }[] }) {
  return (
    <ol className="space-y-0">
      {events.map((e, i) => {
        const last = i === events.length - 1;
        return (
          <li key={`${e.status}-${i}`} className="relative flex gap-3 pb-3 last:pb-0">
            {!last && <span className="absolute left-[9px] top-5 h-[calc(100%-12px)] w-px bg-border" />}
            <span
              className={cn(
                "z-10 mt-0.5 flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full",
                e.status === "Cancelled" ? "bg-red-500 text-white" : last ? "bg-primary text-primary-foreground" : "bg-emerald-500 text-white"
              )}
            >
              <Check className="h-3 w-3" />
            </span>
            <div className="min-w-0 leading-tight">
              <div className="text-sm font-medium">{e.status}</div>
              <div className="text-[11px] text-muted-foreground">{fmtDate(e.at, "dd MMM yyyy, HH:mm")}</div>
            </div>
          </li>
        );
      })}
    </ol>
  );
}

// ---------------------------------------------------------------- order status update dialog

export function UpdateOrderStatusDialog({
  open,
  onOpenChange,
  billNo,
  current,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  billNo: string;
  current: OrderMock | null;
}) {
  const [status, setStatus] = useState<OrderStatus | "">("");
  const [statusAt, setStatusAt] = useState(() => format(new Date(), "yyyy-MM-dd'T'HH:mm"));
  const [courier, setCourier] = useState("");
  const [tracking, setTracking] = useState("");
  const [expected, setExpected] = useState("");
  const [remarks, setRemarks] = useState("");

  const needsShipping = status === "Dispatched";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Update order status</DialogTitle>
          <DialogDescription>
            {billNo}
            {current && <> · currently {current.orderStatus}</>}. The dealer is notified on every change.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label className="text-xs">New status</Label>
            <Select value={status} onValueChange={(v) => setStatus(v as OrderStatus)}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                {ORDER_STATUSES.filter((s) => s !== "Cancelled").map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Status date &amp; time</Label>
            <Input type="datetime-local" value={statusAt} onChange={(e) => setStatusAt(e.target.value)} />
          </div>

          {needsShipping && (
            <>
              <div className="space-y-1.5">
                <Label className="text-xs">Courier</Label>
                <Input placeholder="e.g. Blue Dart" value={courier} onChange={(e) => setCourier(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Tracking no.</Label>
                <Input placeholder="AWB / LR number" value={tracking} onChange={(e) => setTracking(e.target.value)} className="font-mono" />
              </div>
              <div className="col-span-2 space-y-1.5">
                <Label className="text-xs">Expected delivery</Label>
                <Input type="date" value={expected} onChange={(e) => setExpected(e.target.value)} />
              </div>
            </>
          )}

          <div className="col-span-2 space-y-1.5">
            <Label className="text-xs">Remarks</Label>
            <Textarea rows={2} placeholder="Visible to the dealer in the order timeline" value={remarks} onChange={(e) => setRemarks(e.target.value)} />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            disabled={!status}
            onClick={() => {
              toast.success(`${billNo} marked as ${status}`);
              onOpenChange(false);
            }}
          >
            Update status
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ---------------------------------------------------------------- order panel (invoice preview)

export function OrderAdminPanel({
  row,
}: {
  row: { invCode: number; inv_Type: number; grandTotal: number; date: string; bill_No?: string; partyName?: string | null; shipToName?: string | null } | null;
}) {
  const [statusOpen, setStatusOpen] = useState(false);
  if (!row) return null;
  const m = mockOrder(row);
  const isOrder = m.docKind === "order";

  return (
    <div className="grid gap-3 border-b bg-muted/30 px-4 py-3 sm:px-5 lg:grid-cols-[1.1fr_1fr_1fr] print:hidden">
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <h4 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Dealer portal status</h4>
          <Badge variant="outline" className="text-[10px]">
            {DOC_KIND_LABEL[m.docKind]}
          </Badge>
          <Badge variant="outline" className="text-[10px]">
            via {m.source}
          </Badge>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <OrderStatusBadge status={m.orderStatus} />
          <PaymentStatusBadge status={m.paymentStatus} />
        </div>
        <dl className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
          <dt className="text-muted-foreground">Due date</dt>
          <dd className="text-right font-medium">{fmtDate(m.dueDate)}</dd>
          <dt className="text-muted-foreground">Paid</dt>
          <dd className="text-right font-medium tabular-nums">{formatCurrency(m.paidAmount)}</dd>
          <dt className="text-muted-foreground">Balance</dt>
          <dd className="text-right font-semibold tabular-nums">{formatCurrency(m.balanceAmount)}</dd>
          {m.creditNoteTotal > 0 && (
            <>
              <dt className="text-muted-foreground">Credit notes</dt>
              <dd className="text-right font-medium tabular-nums text-emerald-600">− {formatCurrency(m.creditNoteTotal)}</dd>
              <dt className="text-muted-foreground">Net payable</dt>
              <dd className="text-right font-semibold tabular-nums">{formatCurrency(Math.max(0, row.grandTotal - m.creditNoteTotal))}</dd>
            </>
          )}
        </dl>
        <div className="flex gap-2 pt-1">
          {isOrder && (
            <Button size="sm" className="h-7 text-xs" onClick={() => setStatusOpen(true)}>
              <Truck className="mr-1.5 h-3.5 w-3.5" />
              Update status
            </Button>
          )}
          <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => toast.info(`PDF downloaded: ${row.bill_No ?? row.invCode}.pdf`)}>
            <Download className="mr-1.5 h-3.5 w-3.5" />
            Download PDF
          </Button>
        </div>
      </div>

      <div>
        <h4 className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Order timeline</h4>
        <StatusTimeline events={m.statusEvents} />
        {m.cancelReason && <p className="mt-2 rounded border border-red-200 bg-red-50 px-2 py-1 text-[11px] text-red-700">{m.cancelReason}</p>}
      </div>

      <div className="space-y-3">
        <div>
          <h4 className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Shipment</h4>
          {m.trackingNo ? (
            <dl className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs">
              <dt className="text-muted-foreground">Courier</dt>
              <dd className="text-right font-medium">{m.courierName}</dd>
              <dt className="text-muted-foreground">Tracking no.</dt>
              <dd className="text-right font-mono">{m.trackingNo}</dd>
              <dt className="text-muted-foreground">Dispatched</dt>
              <dd className="text-right">{fmtDate(m.dispatchedAt)}</dd>
              <dt className="text-muted-foreground">Expected</dt>
              <dd className="text-right">{fmtDate(m.expectedDeliveryDate)}</dd>
              <dt className="text-muted-foreground">Delivered</dt>
              <dd className="text-right">{fmtDate(m.deliveredAt)}</dd>
            </dl>
          ) : (
            <p className="text-xs text-muted-foreground">Not dispatched yet.</p>
          )}
        </div>
        <div>
          <h4 className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Linked documents</h4>
          {m.linkedDocuments.length === 0 ? (
            <p className="text-xs text-muted-foreground">No credit / debit notes.</p>
          ) : (
            m.linkedDocuments.map((d) => (
              <div key={d.bill_No} className="rounded border bg-card px-2 py-1.5 text-xs">
                <div className="flex justify-between font-medium">
                  <span className="font-mono">{d.bill_No}</span>
                  <span className="tabular-nums">{formatCurrency(d.grandTotal)}</span>
                </div>
                <div className="text-[11px] text-muted-foreground">
                  {DOC_KIND_LABEL[d.docKind]} · {fmtDate(d.date)} · {d.reason}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <UpdateOrderStatusDialog open={statusOpen} onOpenChange={setStatusOpen} billNo={row.bill_No ?? String(row.invCode)} current={m} />
    </div>
  );
}

// ---------------------------------------------------------------- lock / hold dialog

export function LockReasonDialog({
  open,
  onOpenChange,
  name,
  locking,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  name: string;
  locking: boolean;
  /** Runs the real lock/unlock call; the reason itself is prototype-only until LockLedger accepts it. */
  onConfirm?: () => void;
}) {
  const [reason, setReason] = useState("");
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{locking ? "Put dealer on hold" : "Release dealer hold"}</DialogTitle>
          <DialogDescription>
            {locking
              ? `${name} will not be able to place new orders in the dealer portal until released.`
              : `${name} will be able to place orders again.`}
          </DialogDescription>
        </DialogHeader>
        {locking && (
          <div className="space-y-1.5">
            <Label className="text-xs">Reason (shown to the dealer)</Label>
            <Textarea rows={3} placeholder="e.g. Overdue beyond credit days" value={reason} onChange={(e) => setReason(e.target.value)} />
          </div>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            variant={locking ? "destructive" : "default"}
            disabled={locking && !reason.trim()}
            onClick={() => {
              if (onConfirm) onConfirm();
              else toast.success(`${name} ${locking ? "put on hold" : "released"}`);
              onOpenChange(false);
              setReason("");
            }}
          >
            {locking ? "Put on hold" : "Release"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ---------------------------------------------------------------- ledger: form section + details

/** Dealer-portal fields for the ledger form. Local state only: the live save payload is untouched. */
export function DealerLedgerFormSection({ ledgerId }: { ledgerId: number | null }) {
  const seed = ledgerId ?? 0;
  const m = mockDealer(seed || 1);
  const [businessType, setBusinessType] = useState<string>(ledgerId ? m.businessType : "Retailer");
  const [portal, setPortal] = useState(ledgerId ? m.portalEnabled : true);
  const [addresses, setAddresses] = useState(ledgerId ? m.addresses : []);

  return (
    <Section title="Dealer Portal" className="lg:col-span-2 xl:col-span-3">
      <div className="grid gap-3 lg:grid-cols-[18rem_1fr]">
        <FieldGrid className="content-start">
          <Row label="Business Type" className="col-span-2">
            <Select value={businessType} onValueChange={setBusinessType}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {BUSINESS_TYPES.map((t) => (
                  <SelectItem key={t} value={t}>
                    {t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Row>
          <div className="col-span-2 flex items-center justify-between rounded-md border px-3 py-2">
            <div>
              <div className="text-sm font-medium">Portal access</div>
              <div className="text-[11px] text-muted-foreground">Dealer can sign in and place orders</div>
            </div>
            <Switch checked={portal} onCheckedChange={setPortal} />
          </div>
          {ledgerId && (
            <p className="col-span-2 text-[11px] text-muted-foreground">
              Limit used {m.limitUsagePercent}% · outstanding {formatCurrency(m.outstandingAmount)}
            </p>
          )}
        </FieldGrid>

        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <span className="text-[11px] font-medium text-muted-foreground">Delivery &amp; billing addresses</span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-7 text-xs"
              onClick={() =>
                setAddresses((a) => [
                  ...a,
                  { id: a.length + 1, addressName: `Address ${a.length + 1}`, addressType: "Shipping", line: "", cityName: "", stateName: "", isDefault: a.length === 0, isActive: true },
                ])
              }
            >
              <MapPin className="mr-1.5 h-3.5 w-3.5" />
              Add address
            </Button>
          </div>
          <div className="overflow-hidden rounded-md border">
            <table className="w-full text-xs">
              <thead className="bg-muted/40 text-left text-[11px] text-muted-foreground">
                <tr>
                  <th className="px-2 py-1.5 font-medium">Name</th>
                  <th className="px-2 py-1.5 font-medium">Type</th>
                  <th className="px-2 py-1.5 font-medium">City / State</th>
                  <th className="px-2 py-1.5 text-center font-medium">Default</th>
                  <th className="px-2 py-1.5 text-center font-medium">Active</th>
                </tr>
              </thead>
              <tbody>
                {addresses.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-2 py-4 text-center text-muted-foreground">
                      No addresses yet.
                    </td>
                  </tr>
                )}
                {addresses.map((a, i) => (
                  <tr key={a.id} className="border-t">
                    <td className="px-2 py-1">
                      <Input
                        className="h-7 text-xs"
                        value={a.addressName}
                        onChange={(e) => setAddresses((list) => list.map((x, j) => (j === i ? { ...x, addressName: e.target.value } : x)))}
                      />
                    </td>
                    <td className="px-2 py-1">
                      <Select
                        value={a.addressType}
                        onValueChange={(v) => setAddresses((list) => list.map((x, j) => (j === i ? { ...x, addressType: v as typeof a.addressType } : x)))}
                      >
                        <SelectTrigger className="h-7 w-28 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Billing">Billing</SelectItem>
                          <SelectItem value="Shipping">Shipping</SelectItem>
                          <SelectItem value="Warehouse">Warehouse</SelectItem>
                        </SelectContent>
                      </Select>
                    </td>
                    <td className="px-2 py-1 text-muted-foreground">{a.cityName ? `${a.cityName}, ${a.stateName}` : "—"}</td>
                    <td className="px-2 py-1 text-center">
                      <input
                        type="radio"
                        name="default-address"
                        checked={a.isDefault}
                        onChange={() => setAddresses((list) => list.map((x, j) => ({ ...x, isDefault: j === i })))}
                      />
                    </td>
                    <td className="px-2 py-1 text-center">
                      <Switch
                        checked={a.isActive}
                        onCheckedChange={(c) => setAddresses((list) => list.map((x, j) => (j === i ? { ...x, isActive: c } : x)))}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Section>
  );
}

function DetailGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <h3 className="border-b pb-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">{title}</h3>
      {children}
    </section>
  );
}

function Stat({ label, value, tone }: { label: string; value: string; tone?: string }) {
  return (
    <div>
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className={cn("text-sm font-semibold tabular-nums", tone)}>{value}</div>
    </div>
  );
}

export function DealerLedgerDetails({ ledgerId, creditLimit, locked }: { ledgerId: number; creditLimit?: number | string | null; locked: boolean }) {
  const m: DealerMock = mockDealer(ledgerId, creditLimit, locked);
  return (
    <>
      <DetailGroup title="Dealer Portal">
        <div className="grid grid-cols-2 gap-x-6 gap-y-3">
          <Stat label="Business type" value={m.businessType} />
          <div>
            <div className="text-xs text-muted-foreground">Portal access</div>
            <Badge variant={m.portalEnabled ? "secondary" : "outline"}>{m.portalEnabled ? "Enabled" : "Disabled"}</Badge>
          </div>
          {locked && m.lockReason && (
            <div className="col-span-2 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              <span className="font-medium">On hold:</span> {m.lockReason}
            </div>
          )}
        </div>
      </DetailGroup>

      <DetailGroup title="Credit &amp; Outstanding">
        <LimitUsageBar used={m.usedLimit} limit={m.creditLimit} className="max-w-full" />
        <div className="grid grid-cols-2 gap-x-6 gap-y-3">
          <Stat label="Credit limit" value={formatCurrency(m.creditLimit)} />
          <Stat label="Available limit" value={formatCurrency(m.availableLimit)} tone="text-emerald-600" />
          <Stat label="Outstanding" value={formatCurrency(m.outstandingAmount)} />
          <Stat label="Overdue" value={formatCurrency(m.overdueAmount)} tone={m.overdueAmount > 0 ? "text-red-600" : undefined} />
          <Stat label="Unpaid documents" value={String(m.unpaidDocCount)} />
          <Stat label="Open orders" value={formatCurrency(m.openOrderAmount)} />
        </div>
      </DetailGroup>

      <DetailGroup title="Delivery Addresses">
        <div className="space-y-2">
          {m.addresses.map((a) => (
            <div key={a.id} className={cn("rounded-md border px-3 py-2 text-sm", !a.isActive && "opacity-50")}>
              <div className="flex items-center gap-2">
                <span className="font-medium">{a.addressName}</span>
                <Badge variant="outline" className="text-[10px]">
                  {a.addressType}
                </Badge>
                {a.isDefault && (
                  <Badge variant="secondary" className="text-[10px]">
                    Default
                  </Badge>
                )}
                {!a.isActive && <span className="text-[11px] text-muted-foreground">Inactive</span>}
              </div>
              <div className="text-xs text-muted-foreground">
                {a.line}, {a.cityName}, {a.stateName}
              </div>
            </div>
          ))}
        </div>
      </DetailGroup>
    </>
  );
}

// ---------------------------------------------------------------- items: form section + details

export function DealerItemFormSection({ itemId, sellRate }: { itemId: number | null; sellRate?: number | null }) {
  const m = mockItem(itemId ?? 0, sellRate);
  const [visible, setVisible] = useState(itemId ? m.dealerVisible : true);
  const [moq, setMoq] = useState(itemId ? String(m.moq) : "1");
  const [images, setImages] = useState(itemId ? m.imageCount : 0);

  return (
    <Section title="Dealer Portal" className="lg:col-span-2 xl:col-span-3">
      <div className="grid gap-3 lg:grid-cols-[18rem_1fr]">
        <FieldGrid className="content-start">
          <Row label="Min order qty (MOQ)">
            <NumberInput name="moq" value={moq} onChange={(e) => setMoq(e.target.value)} step="1" />
          </Row>
          <Row label="Dealer rate">
            <NumberInput name="dealerRate" value={itemId ? String(m.dealerRate) : ""} readOnly disabled placeholder="From price list" />
          </Row>
          <div className="col-span-2">
            <Flag id="isDealerVisible" label="Visible in dealer catalogue" checked={visible} onChange={setVisible} />
          </div>
        </FieldGrid>

        <div>
          <div className="mb-1.5 text-[11px] font-medium text-muted-foreground">Product images</div>
          <div className="flex flex-wrap gap-2">
            {Array.from({ length: images }).map((_, i) => (
              <div key={i} className="relative flex h-20 w-20 items-center justify-center rounded-md border bg-muted/40 text-muted-foreground">
                <Package className="h-6 w-6" />
                <button
                  type="button"
                  className="absolute -right-1.5 -top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] text-white"
                  onClick={() => setImages((n) => n - 1)}
                  aria-label="Remove image"
                >
                  ×
                </button>
              </div>
            ))}
            <button
              type="button"
              disabled={images >= 5}
              onClick={() => setImages((n) => n + 1)}
              className="flex h-20 w-20 flex-col items-center justify-center gap-1 rounded-md border border-dashed text-[11px] text-muted-foreground hover:bg-muted/40 disabled:opacity-50"
            >
              <ImagePlus className="h-5 w-5" />
              Upload
            </button>
          </div>
          <p className="mt-1 text-[11px] text-muted-foreground">Up to 5 images. The first image is the catalogue thumbnail.</p>
        </div>
      </div>
    </Section>
  );
}

export function DealerItemDetails({ itemId, sellRate }: { itemId: number; sellRate?: number | null }) {
  const m: ItemMock = mockItem(itemId, sellRate);
  return (
    <DetailGroup title="Dealer Portal">
      <div className="grid grid-cols-2 gap-x-6 gap-y-3">
        <div>
          <div className="text-xs text-muted-foreground">Stock status</div>
          <StockStatusBadge status={m.stockStatus} />
        </div>
        <Stat label="Available qty" value={String(m.availableQty)} />
        <Stat label="MOQ" value={String(m.moq)} />
        <Stat label="Dealer rate" value={formatCurrency(m.dealerRate)} />
        <Stat label="Times purchased" value={String(m.purchaseCount)} />
        <div>
          <div className="text-xs text-muted-foreground">Dealer catalogue</div>
          <Badge variant={m.dealerVisible ? "secondary" : "outline"}>{m.dealerVisible ? "Visible" : "Hidden"}</Badge>
        </div>
      </div>
      <div className="flex gap-2">
        {Array.from({ length: Math.max(m.imageCount, 1) }).map((_, i) => (
          <div key={i} className="flex h-16 w-16 items-center justify-center rounded-md border bg-muted/40 text-muted-foreground">
            <Package className="h-5 w-5" />
          </div>
        ))}
      </div>
    </DetailGroup>
  );
}
