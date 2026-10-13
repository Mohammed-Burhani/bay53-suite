"use client";

import { useMemo } from "react";
import { Pencil } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useItems } from "@/lib/hooks/useReports";
import { useItemById } from "@/lib/hooks/useItemMaster";
import { useClassificationLabels } from "@/lib/contexts/ClassificationContext";
import { rawToFormValues } from "@/lib/items/item-form";
import { COSTING_ON_OPTIONS, ITEM_ATTRIBUTES, PRODUCT_TYPE_OPTIONS, type UnitConv } from "@/lib/types/item.types";

interface ItemDetailsSheetProps {
  itemId: number | null;
  onClose: () => void;
  onEdit: (id: number) => void;
}

const show = (v: string | number | null | undefined) => (v === null || v === undefined || v === "" ? "—" : String(v));

export function ItemDetailsSheet({ itemId, onClose, onEdit }: ItemDetailsSheetProps) {
  const { getLabel } = useClassificationLabels();
  const { data: raw, isLoading, isError, refetch } = useItemById(itemId);
  const { data: itemList } = useItems();

  const values = useMemo(() => (raw ? rawToFormValues(raw) : null), [raw]);
  const unitConv = useMemo<UnitConv[]>(() => {
    const rows = raw?.unit_Conv ?? raw?.unitConv;
    return Array.isArray(rows) ? (rows as UnitConv[]) : [];
  }, [raw]);
  const itemName = (id: number | null) => itemList?.find((i) => i.item_ID === id)?.name ?? `Item #${id}`;

  return (
    <Sheet open={itemId !== null} onOpenChange={(open) => !open && onClose()}>
      <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-xl">
        <SheetHeader className="border-b">
          <SheetTitle className="pr-8">{values ? values.name : "Item details"}</SheetTitle>
          <SheetDescription className="flex items-center gap-2">
            <span className="font-mono">#{itemId}</span>
            {values && (values.isActive ? <Badge variant="secondary">Active</Badge> : <Badge variant="outline">Inactive</Badge>)}
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-6 p-4">
          {isLoading && (
            <div className="space-y-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-8 w-full" />
              ))}
            </div>
          )}

          {isError && (
            <div className="space-y-3 py-8 text-center text-sm text-muted-foreground">
              <p>Could not load this item.</p>
              <Button variant="outline" size="sm" onClick={() => refetch()}>
                Retry
              </Button>
            </div>
          )}

          {values && (
            <>
              <Group title="Identity">
                <Field label={getLabel("item_code")} value={show(values.item_CodeTxt)} />
                <Field label={getLabel("item")} value={show(values.name)} />
                <Field label={getLabel("aliases")} value={show(values.aliases)} span />
                {ITEM_ATTRIBUTES.map(({ field, label }) => (
                  <Field key={field} label={getLabel(label)} value={show(values[field])} />
                ))}
                <Field label="Barcode" value={show(values.barcode)} />
              </Group>

              <Group title="Tax & Pricing">
                <Field label="HSN / SAC" value={show(values.hsnNo)} />
                <Field label="Tax %" value={show(values.vatPer)} />
                <Field label="Std Unit" value={show(values.std_Unit)} />
                <Field label="MRP" value={show(values.mrp)} />
                <Field label="Sell Rate" value={show(values.std_Sell_Rate)} />
                <Field label="Discount %" value={show(values.discount)} />
                <Field label="Product Type" value={PRODUCT_TYPE_OPTIONS.find((o) => o.value === values.productType)?.label ?? show(values.productType)} />
              </Group>

              <Group title="Costing & Stock Levels">
                <Field label="Costing On" value={COSTING_ON_OPTIONS.find((o) => o.value === values.costing_On)?.label ?? show(values.costing_On)} />
                <Field label="Last Pur. Rate" value={show(values.last_Purchaserate)} />
                <Field label="Avg. Pur. Rate" value={show(values.avg_Purchaserate)} />
                <Field label="Min Qty" value={show(values.minimum_Qty)} />
                <Field label="Max Qty" value={show(values.maximum_Qty)} />
                <Field label="Reorder Qty" value={show(values.reOrderQty)} />
                <Field label="Reorder Days" value={show(values.reOrderDays)} />
              </Group>

              <Group title="Options">
                <div className="col-span-2 flex flex-wrap gap-2">
                  <Flag on={values.regular} label="Regular" />
                  <Flag on={values.mfrCodeReq} label="Batch Code Required" />
                  <Flag on={values.onCalculation} label="On Calculation" />
                  <Flag on={values.is_BOM} label="BOM" />
                </div>
              </Group>

              {values.is_BOM && (
                <Group title="BOM Components" single>
                  {values.bom_Map.length === 0 && <p className="text-sm text-muted-foreground">No components defined.</p>}
                  {values.bom_Map.map((row, i) => (
                    <div key={i} className="flex items-center justify-between gap-3 rounded-md border px-3 py-2 text-sm">
                      <span className="truncate">{itemName(row.includeItemId)}</span>
                      <span className="shrink-0 text-muted-foreground">
                        Qty {show(row.qty)}
                        {row.hasStockEffect && " · effects inventory"}
                      </span>
                    </div>
                  ))}
                </Group>
              )}

              {unitConv.length > 0 && (
                <Group title="Unit Conversion" single>
                  {unitConv.map((c, i) => (
                    <div key={c.unit_Conv_ID ?? i} className="flex items-center justify-between rounded-md border px-3 py-2 text-sm">
                      <span>Unit {String(c.convUnit)}</span>
                      <span className="text-muted-foreground">
                        Qty {c.convQty} · Rate {c.convRate}
                      </span>
                    </div>
                  ))}
                </Group>
              )}

              <Group title="Description" single>
                <p className="text-sm">{show(values.description)}</p>
              </Group>
            </>
          )}
        </div>

        {itemId !== null && (
          <div className="sticky bottom-0 flex justify-end gap-2 border-t bg-background p-4">
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
            <Button onClick={() => onEdit(itemId)}>
              <Pencil className="mr-2 h-4 w-4" />
              Edit
            </Button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}

function Group({ title, single, children }: { title: string; single?: boolean; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <h3 className="border-b pb-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">{title}</h3>
      <div className={single ? "space-y-2" : "grid grid-cols-2 gap-x-6 gap-y-3"}>{children}</div>
    </section>
  );
}

function Field({ label, value, span }: { label: string; value: string; span?: boolean }) {
  return (
    <div className={span ? "col-span-2" : undefined}>
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="break-words text-sm font-medium">{value}</div>
    </div>
  );
}

function Flag({ on, label }: { on: boolean; label: string }) {
  return <Badge variant={on ? "secondary" : "outline"} className={on ? undefined : "text-muted-foreground line-through"}>{label}</Badge>;
}
