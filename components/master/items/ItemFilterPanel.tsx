"use client";

import { useMemo, useState } from "react";
import { Download, Search, SlidersHorizontal, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { useClassificationLabels } from "@/lib/contexts/ClassificationContext";
import { EMPTY_ITEM_FILTERS, distinctValues, type ItemFilters } from "@/lib/items/item-form";
import { ITEM_ATTRIBUTES, type ItemListRow } from "@/lib/types/item.types";

interface ItemFilterPanelProps {
  /** Every loaded item — used for filter suggestions. */
  allItems: ItemListRow[];
  filters: ItemFilters;
  onFiltersChange: (filters: ItemFilters) => void;
  onExport: () => void;
  canExport: boolean;
  /** Spread the fields across a wide row instead of the narrow side pane. */
  wide?: boolean;
}

export function ItemFilterPanel({ allItems, filters, onFiltersChange, onExport, canExport, wide }: ItemFilterPanelProps) {
  const { getLabel } = useClassificationLabels();
  const [showMore, setShowMore] = useState(false);

  const suggestions = useMemo(
    () => ({
      hsn: distinctValues(allItems, (i) => i.hsnNo),
      sizes: distinctValues(allItems, (i) => i.sizes),
      type: distinctValues(allItems, (i) => i.type),
      category: distinctValues(allItems, (i) => i.category),
      brand: distinctValues(allItems, (i) => i.brand),
      itemGroup: distinctValues(allItems, (i) => i.itemGroup),
    }),
    [allItems]
  );

  const set = (patch: Partial<ItemFilters>) => onFiltersChange({ ...filters, ...patch });
  const activeCount = Object.values(filters).filter((v) => v.trim() !== "").length;

  return (
    <div className="space-y-3">
      <div className={cn("grid gap-2", wide ? "sm:grid-cols-2 lg:grid-cols-4" : "grid-cols-2")}>
        <div>
          <Label className="mb-1 text-xs text-muted-foreground">{getLabel("item_code")}</Label>
          <Input className="h-8" value={filters.code} onChange={(e) => set({ code: e.target.value })} />
        </div>
        <div className={wide ? "lg:col-span-2" : undefined}>
          <Label className="mb-1 text-xs text-muted-foreground">{getLabel("item")}</Label>
          <div className="relative">
            <Search className="absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input className="h-8 pl-7" value={filters.name} onChange={(e) => set({ name: e.target.value })} placeholder="Search…" />
          </div>
        </div>
        {wide && (
          <div className="flex items-end gap-2">
            <FilterActions showMore={showMore} onToggleMore={() => setShowMore((v) => !v)} activeCount={activeCount} onClear={() => onFiltersChange(EMPTY_ITEM_FILTERS)} onExport={onExport} canExport={canExport} />
          </div>
        )}
      </div>

      {showMore && (
        <div className={cn("grid gap-2", wide ? "sm:grid-cols-3 lg:grid-cols-6" : "grid-cols-2")}>
          {ITEM_ATTRIBUTES.map(({ field, label }) => (
            <div key={field}>
              <Label className="mb-1 text-xs text-muted-foreground">{getLabel(label)}</Label>
              <Input
                className="h-8"
                value={filters[field]}
                onChange={(e) => set({ [field]: e.target.value })}
                list={`item-filter-dl-${field}`}
                autoComplete="off"
              />
              <datalist id={`item-filter-dl-${field}`}>
                {suggestions[field].slice(0, 200).map((v) => (
                  <option key={v} value={v} />
                ))}
              </datalist>
            </div>
          ))}
          <div>
            <Label className="mb-1 text-xs text-muted-foreground">HSN / SAC</Label>
            <Input className="h-8" value={filters.hsn} onChange={(e) => set({ hsn: e.target.value })} list="item-filter-dl-hsn" autoComplete="off" />
            <datalist id="item-filter-dl-hsn">
              {suggestions.hsn.slice(0, 200).map((v) => (
                <option key={v} value={v} />
              ))}
            </datalist>
          </div>
        </div>
      )}

      {!wide && (
        <div className="flex items-center gap-2">
          <FilterActions showMore={showMore} onToggleMore={() => setShowMore((v) => !v)} activeCount={activeCount} onClear={() => onFiltersChange(EMPTY_ITEM_FILTERS)} onExport={onExport} canExport={canExport} />
        </div>
      )}
    </div>
  );
}

function FilterActions({
  showMore,
  onToggleMore,
  activeCount,
  onClear,
  onExport,
  canExport,
}: {
  showMore: boolean;
  onToggleMore: () => void;
  activeCount: number;
  onClear: () => void;
  onExport: () => void;
  canExport: boolean;
}) {
  return (
    <>
      <Button type="button" variant="ghost" size="sm" className="h-8 px-2 text-xs" onClick={onToggleMore}>
        <SlidersHorizontal className="mr-1.5 h-3.5 w-3.5" />
        {showMore ? "Fewer filters" : "More filters"}
      </Button>
      <Button type="button" variant="ghost" size="sm" className="h-8 px-2 text-xs" disabled={activeCount === 0} onClick={onClear}>
        <X className="mr-1.5 h-3.5 w-3.5" />
        Clear{activeCount > 0 && ` (${activeCount})`}
      </Button>
      <Button type="button" variant="outline" size="sm" className="ml-auto h-8 text-xs" disabled={!canExport} onClick={onExport}>
        <Download className="mr-1.5 h-3.5 w-3.5" />
        Export
      </Button>
    </>
  );
}
