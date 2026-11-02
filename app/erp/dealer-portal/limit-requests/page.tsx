"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Check, X } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { formatCurrency } from "@/lib/store";
import { LIMIT_REQUESTS, type LimitRequest } from "@/lib/admin-proto/mock";
import { LimitUsageBar, RequestStatusBadge, fmtDate } from "@/components/admin-proto/parts";

export default function LimitRequestsPage() {
  const [status, setStatus] = useState<string>("Pending");
  const [target, setTarget] = useState<LimitRequest | null>(null);
  const [decision, setDecision] = useState<"approve" | "reject">("approve");
  const [approved, setApproved] = useState("");
  const [remarks, setRemarks] = useState("");

  const rows = useMemo(() => LIMIT_REQUESTS.filter((r) => status === "all" || r.status === status), [status]);

  const open = (r: LimitRequest, d: "approve" | "reject") => {
    setTarget(r);
    setDecision(d);
    setApproved(String(r.requestedLimit));
    setRemarks("");
  };

  return (
    <div className="flex flex-col gap-4 p-6">
      <div className="flex flex-wrap items-center gap-3">
        <div className="mr-auto">
          <h1 className="text-2xl font-bold tracking-tight">Limit Requests</h1>
          <p className="text-sm text-muted-foreground">Dealers asking for a higher purchase limit.</p>
        </div>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="h-9 w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All requests</SelectItem>
            <SelectItem value="Pending">Pending</SelectItem>
            <SelectItem value="Approved">Approved</SelectItem>
            <SelectItem value="Rejected">Rejected</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card className="gap-0 overflow-hidden py-0">
        <Table>
          <TableHeader className="bg-muted/40">
            <TableRow>
              <TableHead>Req #</TableHead>
              <TableHead className="min-w-44">Dealer</TableHead>
              <TableHead className="text-right">Current limit</TableHead>
              <TableHead>Usage</TableHead>
              <TableHead className="text-right">Requested</TableHead>
              <TableHead className="min-w-64">Reason</TableHead>
              <TableHead>Requested on</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="min-w-48">Decision</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 && (
              <TableRow>
                <TableCell colSpan={10} className="py-14 text-center text-muted-foreground">
                  No limit requests.
                </TableCell>
              </TableRow>
            )}
            {rows.map((r) => (
              <TableRow key={r.id}>
                <TableCell className="font-mono text-xs">#{r.id}</TableCell>
                <TableCell>
                  <div className="font-medium">{r.dealer}</div>
                  <div className="font-mono text-[11px] text-muted-foreground">{r.partyCode}</div>
                </TableCell>
                <TableCell className="text-right tabular-nums">{formatCurrency(r.currentLimit)}</TableCell>
                <TableCell>
                  <LimitUsageBar used={r.usedLimit} limit={r.currentLimit} />
                </TableCell>
                <TableCell className="text-right font-medium tabular-nums">{formatCurrency(r.requestedLimit)}</TableCell>
                <TableCell className="min-w-64 max-w-72 whitespace-normal text-xs text-muted-foreground">{r.reason}</TableCell>
                <TableCell className="whitespace-nowrap text-xs">{fmtDate(r.requestedAt)}</TableCell>
                <TableCell>
                  <RequestStatusBadge status={r.status} />
                </TableCell>
                <TableCell className="text-xs">
                  {r.decidedAt ? (
                    <>
                      <div>
                        {r.approvedLimit ? `Limit set to ${formatCurrency(r.approvedLimit)}` : "Rejected"} · {fmtDate(r.decidedAt)}
                      </div>
                      <div className="text-muted-foreground">{r.remarks}</div>
                    </>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  {r.status === "Pending" && (
                    <div className="flex justify-end gap-1">
                      <Button size="sm" className="h-8" onClick={() => open(r, "approve")}>
                        <Check className="mr-1 h-3.5 w-3.5" />
                        Approve
                      </Button>
                      <Button size="sm" variant="outline" className="h-8 text-destructive hover:text-destructive" onClick={() => open(r, "reject")}>
                        <X className="mr-1 h-3.5 w-3.5" />
                        Reject
                      </Button>
                    </div>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      <Dialog open={!!target} onOpenChange={(o) => !o && setTarget(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{decision === "approve" ? "Approve limit request" : "Reject limit request"}</DialogTitle>
            <DialogDescription>
              {target?.dealer} · current {target && formatCurrency(target.currentLimit)}, requested {target && formatCurrency(target.requestedLimit)}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            {decision === "approve" && (
              <div className="space-y-1.5">
                <Label className="text-xs">Approved limit (₹)</Label>
                <Input type="number" value={approved} onChange={(e) => setApproved(e.target.value)} />
                <p className="text-[11px] text-muted-foreground">Defaults to the requested amount. Lower it to part-approve.</p>
              </div>
            )}
            <div className="space-y-1.5">
              <Label className="text-xs">Remarks (shown to the dealer)</Label>
              <Textarea rows={3} value={remarks} onChange={(e) => setRemarks(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTarget(null)}>
              Cancel
            </Button>
            <Button
              variant={decision === "approve" ? "default" : "destructive"}
              onClick={() => {
                toast.success(`Request #${target?.id} ${decision === "approve" ? "approved" : "rejected"}`);
                setTarget(null);
              }}
            >
              {decision === "approve" ? "Approve" : "Reject"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
