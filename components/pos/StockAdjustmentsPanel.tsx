"use client";

import { useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Combobox } from "@/components/ui/combobox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, Minus, PackagePlus, History, TrendingUp, TrendingDown, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import type { Product } from "@/lib/services/pos.service";
import { useAdjustStock, useStockMovements } from "@/lib/hooks/usePOSInventory";

interface Props {
  tenantId: string;
  products: Product[];
  isLoading: boolean;
}

export function StockAdjustmentsPanel({ tenantId, products, isLoading }: Props) {
  const [productId, setProductId] = useState("");
  const [direction, setDirection] = useState<"add" | "remove">("add");
  const [qty, setQty] = useState("");
  const [reason, setReason] = useState("");

  const adjust = useAdjustStock(tenantId);
  const { data: movements = [], isLoading: movementsLoading } = useStockMovements(tenantId, {
    movementType: "adjustment",
    limit: 50,
  });

  const options = useMemo(
    () =>
      products.map((p) => ({
        value: p.id,
        label: `${p.name} · ${p.sku} · stock ${p.stock}`,
      })),
    [products]
  );

  const selected = products.find((p) => p.id === productId);
  const numericQty = Math.floor(Number(qty)) || 0;
  const delta = direction === "add" ? numericQty : -numericQty;
  const projected = selected ? selected.stock + delta : 0;
  const wouldGoNegative = direction === "remove" && selected != null && projected < 0;

  const canSubmit =
    !!productId && numericQty > 0 && !wouldGoNegative && !adjust.isPending;

  const handleSubmit = async () => {
    if (!productId) {
      toast.error("Select a product to adjust");
      return;
    }
    if (numericQty <= 0) {
      toast.error("Enter a quantity greater than zero");
      return;
    }
    if (wouldGoNegative) {
      toast.error("Cannot remove more than the current stock");
      return;
    }
    try {
      await adjust.mutateAsync({
        tenant_id: tenantId,
        product_id: productId,
        delta,
        notes: reason.trim() || undefined,
      });
      setQty("");
      setReason("");
    } catch {
      /* error toast handled by the hook */
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[380px_1fr]">
      {/* Adjustment form */}
      <Card className="h-fit">
        <CardContent className="space-y-4 p-5">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
              <PackagePlus className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="text-sm font-semibold">Adjust Stock</p>
              <p className="text-xs text-muted-foreground">Add or remove inventory</p>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium">Product</label>
            <Combobox
              options={options}
              value={productId}
              onValueChange={setProductId}
              placeholder={isLoading ? "Loading products…" : "Select a product"}
              searchPlaceholder="Search by name or SKU…"
              emptyText="No products found"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium">Adjustment Type</label>
            <div className="grid grid-cols-2 gap-2">
              <Button
                type="button"
                variant={direction === "add" ? "default" : "outline"}
                className="gap-1.5"
                onClick={() => setDirection("add")}
              >
                <Plus className="h-4 w-4" />
                Add
              </Button>
              <Button
                type="button"
                variant={direction === "remove" ? "default" : "outline"}
                className="gap-1.5"
                onClick={() => setDirection("remove")}
              >
                <Minus className="h-4 w-4" />
                Remove
              </Button>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium">Quantity</label>
            <Input
              type="number"
              min={1}
              step={1}
              value={qty}
              onChange={(e) => setQty(e.target.value)}
              placeholder="0"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium">
              Reason <span className="text-muted-foreground">(optional)</span>
            </label>
            <Textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Stock received, damaged goods, recount…"
              rows={2}
            />
          </div>

          {/* Live preview */}
          {selected && numericQty > 0 && (
            <div className="flex items-center justify-center gap-3 rounded-lg border bg-muted/30 p-3 text-sm">
              <span className="font-semibold">{selected.stock}</span>
              <ArrowRight className="h-4 w-4 text-muted-foreground" />
              <span
                className={
                  wouldGoNegative
                    ? "font-semibold text-destructive"
                    : "font-semibold text-emerald-600"
                }
              >
                {projected}
              </span>
              <Badge variant="outline" className="ml-1 gap-1">
                {delta >= 0 ? (
                  <TrendingUp className="h-3 w-3 text-emerald-600" />
                ) : (
                  <TrendingDown className="h-3 w-3 text-destructive" />
                )}
                {delta >= 0 ? `+${delta}` : delta}
              </Badge>
            </div>
          )}

          {wouldGoNegative && (
            <p className="text-xs text-destructive">
              Removing {numericQty} would drop stock below zero (current {selected?.stock}).
            </p>
          )}

          <Button className="w-full gap-2" onClick={handleSubmit} disabled={!canSubmit}>
            <PackagePlus className="h-4 w-4" />
            {adjust.isPending ? "Applying…" : "Apply Adjustment"}
          </Button>
        </CardContent>
      </Card>

      {/* Recent adjustments log */}
      <Card>
        <div className="flex items-center gap-2 border-b px-5 py-3">
          <History className="h-4 w-4 text-muted-foreground" />
          <p className="text-sm font-semibold">Recent Adjustments</p>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Product</TableHead>
              <TableHead className="text-center">Change</TableHead>
              <TableHead className="text-center">Before → After</TableHead>
              <TableHead>Reason</TableHead>
              <TableHead className="text-right">When</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {movementsLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">
                  Loading…
                </TableCell>
              </TableRow>
            ) : movements.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="py-10 text-center text-muted-foreground">
                  <PackagePlus className="mx-auto mb-2 h-8 w-8 opacity-30" />
                  <p className="text-sm">No adjustments yet</p>
                  <p className="text-xs">Add or remove stock to see the audit trail here.</p>
                </TableCell>
              </TableRow>
            ) : (
              movements.map((m) => (
                <TableRow key={m.id}>
                  <TableCell>
                    <p className="text-sm font-medium">{m.product_name || "—"}</p>
                    {m.product_sku && (
                      <p className="font-mono text-[10px] text-muted-foreground">{m.product_sku}</p>
                    )}
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge
                      variant="outline"
                      className={m.quantity >= 0 ? "text-emerald-600" : "text-destructive"}
                    >
                      {m.quantity >= 0 ? `+${m.quantity}` : m.quantity}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center text-xs text-muted-foreground">
                    {m.stock_before} → <span className="font-medium text-foreground">{m.stock_after}</span>
                  </TableCell>
                  <TableCell className="max-w-[220px] truncate text-xs text-muted-foreground">
                    {m.notes || "—"}
                  </TableCell>
                  <TableCell className="text-right text-xs text-muted-foreground">
                    {format(new Date(m.created_at), "MMM dd, hh:mm a")}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
