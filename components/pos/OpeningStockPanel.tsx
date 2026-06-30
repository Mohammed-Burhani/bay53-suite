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
import { Layers, ArrowRight, PencilLine, Search } from "lucide-react";
import { toast } from "sonner";
import type { Product } from "@/lib/services/pos.service";
import { useSetOpeningStock } from "@/lib/hooks/usePOSInventory";
import { formatCurrency } from "@/lib/store";

interface Props {
  tenantId: string;
  products: Product[];
  isLoading: boolean;
}

export function OpeningStockPanel({ tenantId, products, isLoading }: Props) {
  const [productId, setProductId] = useState("");
  const [openingQty, setOpeningQty] = useState("");
  const [notes, setNotes] = useState("");
  const [search, setSearch] = useState("");

  const setOpening = useSetOpeningStock(tenantId);

  const options = useMemo(
    () =>
      products.map((p) => ({
        value: p.id,
        label: `${p.name} · ${p.sku} · stock ${p.stock}`,
      })),
    [products]
  );

  const selected = products.find((p) => p.id === productId);
  const numericQty =
    openingQty === "" ? null : Math.max(0, Math.floor(Number(openingQty)) || 0);
  const canSubmit = !!productId && numericQty !== null && !setOpening.isPending;

  const filteredProducts = useMemo(() => {
    const q = search.toLowerCase();
    return products.filter(
      (p) =>
        !q ||
        p.name.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q)
    );
  }, [products, search]);

  const totalUnits = products.reduce((sum, p) => sum + p.stock, 0);
  const totalValue = products.reduce(
    (sum, p) => sum + p.stock * Number(p.selling_price),
    0
  );

  const handleSubmit = async () => {
    if (!productId) {
      toast.error("Select a product");
      return;
    }
    if (numericQty === null) {
      toast.error("Enter an opening quantity");
      return;
    }
    try {
      await setOpening.mutateAsync({
        tenant_id: tenantId,
        product_id: productId,
        opening_quantity: numericQty,
        notes: notes.trim() || undefined,
      });
      setOpeningQty("");
      setNotes("");
    } catch {
      /* error toast handled by the hook */
    }
  };

  const prefill = (p: Product) => {
    setProductId(p.id);
    setOpeningQty(String(p.stock));
    setNotes("");
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[380px_1fr]">
      {/* Set opening stock form */}
      <Card className="h-fit">
        <CardContent className="space-y-4 p-5">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
              <Layers className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="text-sm font-semibold">Set Opening Stock</p>
              <p className="text-xs text-muted-foreground">Set the starting balance</p>
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
            <label className="text-sm font-medium">Opening Quantity</label>
            <Input
              type="number"
              min={0}
              step={1}
              value={openingQty}
              onChange={(e) => setOpeningQty(e.target.value)}
              placeholder="0"
            />
            <p className="text-xs text-muted-foreground">
              Sets the absolute stock balance (not a delta).
            </p>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium">
              Notes <span className="text-muted-foreground">(optional)</span>
            </label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Initial stock count for new period"
              rows={2}
            />
          </div>

          {selected && numericQty !== null && (
            <div className="flex items-center justify-center gap-3 rounded-lg border bg-muted/30 p-3 text-sm">
              <span className="font-semibold">{selected.stock}</span>
              <ArrowRight className="h-4 w-4 text-muted-foreground" />
              <span className="font-semibold text-primary">{numericQty}</span>
              <Badge variant="outline" className="ml-1">
                opening
              </Badge>
            </div>
          )}

          <Button className="w-full gap-2" onClick={handleSubmit} disabled={!canSubmit}>
            <Layers className="h-4 w-4" />
            {setOpening.isPending ? "Saving…" : "Set Opening Stock"}
          </Button>
        </CardContent>
      </Card>

      {/* Opening stock register */}
      <Card>
        <div className="flex flex-col gap-3 border-b px-5 py-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm font-semibold">Opening Stock Register</p>
          <div className="flex items-center gap-3">
            <Badge variant="secondary" className="font-normal">
              {totalUnits} units
            </Badge>
            <Badge variant="secondary" className="font-normal">
              {formatCurrency(totalValue)}
            </Badge>
          </div>
        </div>
        <div className="px-5 py-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search products…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Product</TableHead>
              <TableHead className="text-center">Current Stock</TableHead>
              <TableHead className="text-right">Sell Price</TableHead>
              <TableHead className="text-right">Stock Value</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">
                  Loading…
                </TableCell>
              </TableRow>
            ) : filteredProducts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="py-10 text-center text-muted-foreground">
                  <Layers className="mx-auto mb-2 h-8 w-8 opacity-30" />
                  <p className="text-sm">No products found</p>
                </TableCell>
              </TableRow>
            ) : (
              filteredProducts.map((p) => (
                <TableRow key={p.id}>
                  <TableCell>
                    <p className="text-sm font-medium">{p.name}</p>
                    <p className="font-mono text-[10px] text-muted-foreground">{p.sku}</p>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge
                      variant={
                        p.stock === 0
                          ? "destructive"
                          : p.stock <= p.min_stock
                          ? "secondary"
                          : "default"
                      }
                    >
                      {p.stock}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right text-sm">
                    {formatCurrency(Number(p.selling_price))}
                  </TableCell>
                  <TableCell className="text-right text-sm">
                    {formatCurrency(p.stock * Number(p.selling_price))}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 gap-1.5 text-xs"
                      onClick={() => prefill(p)}
                    >
                      <PencilLine className="h-3.5 w-3.5" />
                      Set
                    </Button>
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
