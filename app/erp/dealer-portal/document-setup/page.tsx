"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Save } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DOC_KIND_LABEL, INVOICE_TYPE_ROWS, type DocKind } from "@/lib/admin-proto/mock";

export default function DocumentSetupPage() {
  const [rows, setRows] = useState(INVOICE_TYPE_ROWS);

  const update = (id: number, patch: Partial<(typeof rows)[number]>) =>
    setRows((list) => list.map((r) => (r.invTypeId === id ? { ...r, ...patch } : r)));

  return (
    <div className="flex flex-col gap-4 p-6">
      <div className="flex flex-wrap items-center gap-3">
        <div className="mr-auto">
          <h1 className="text-2xl font-bold tracking-tight">Document Setup</h1>
          <p className="text-sm text-muted-foreground">Tell the dealer portal which invoice types are orders, invoices, credit notes or debit notes.</p>
        </div>
        <Button size="sm" onClick={() => toast.success("Document setup saved")}>
          <Save className="mr-2 h-4 w-4" />
          Save changes
        </Button>
      </div>

      <Card className="gap-0 overflow-hidden py-0">
        <Table>
          <TableHeader className="bg-muted/40">
            <TableRow>
              <TableHead>Invoice type</TableHead>
              <TableHead className="w-64">Dealer document kind</TableHead>
              <TableHead className="w-44 text-center">Show in dealer portal</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((r) => (
              <TableRow key={r.invTypeId}>
                <TableCell>
                  <div className="font-medium">{r.typeName}</div>
                  <div className="font-mono text-[11px] text-muted-foreground">Type #{r.invTypeId}</div>
                </TableCell>
                <TableCell>
                  <Select
                    value={r.dealerDocKind}
                    onValueChange={(v) => update(r.invTypeId, { dealerDocKind: v as DocKind, showInDealerPortal: v === "other" ? false : r.showInDealerPortal })}
                  >
                    <SelectTrigger className="h-8 w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {(Object.keys(DOC_KIND_LABEL) as DocKind[]).map((k) => (
                        <SelectItem key={k} value={k}>
                          {DOC_KIND_LABEL[k]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell className="text-center">
                  <Switch
                    checked={r.showInDealerPortal}
                    disabled={r.dealerDocKind === "other"}
                    onCheckedChange={(c) => update(r.invTypeId, { showInDealerPortal: c })}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
