"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { toast } from "sonner";
import { Eye, Loader2, PackagePlus, Pencil, RefreshCw, Trash2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { TablePagination } from "@/components/ui/table-pagination";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";
import { useItems } from "@/lib/hooks/useReports";
import { useItemDelete } from "@/lib/hooks/useItemMaster";
import { useClassificationLabels } from "@/lib/contexts/ClassificationContext";
import { exportToExcel } from "@/lib/utils/report-export";
import { getApiErrorMessage } from "@/lib/utils/api-error";
import { EMPTY_ITEM_FILTERS, filterItems, itemParticular, type ItemFilters } from "@/lib/items/item-form";
import { ITEM_ATTRIBUTES, type ItemListRow } from "@/lib/types/item.types";
import { ItemFilterPanel } from "./ItemFilterPanel";
import { ItemDetailsSheet } from "./ItemDetailsSheet";

const money = (v: number | null | undefined) =>
  v === null || v === undefined ? "—" : v.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const dash = (v: unknown) => (v === null || v === undefined || v === "" ? "—" : String(v));

function formatDate(value: string | null | undefined) {
  if (!value) return "—";
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? "—" : format(d, "dd MMM yyyy, HH:mm");
}

export function ItemListTable() {
  const router = useRouter();
  const { getLabel } = useClassificationLabels();
  const { data, isLoading, isFetching, isError, refetch } = useItems();
  const allItems = useMemo(() => (data ?? []) as ItemListRow[], [data]);
  const deleteItem = useItemDelete();

  const [filters, setFilters] = useState<ItemFilters>(EMPTY_ITEM_FILTERS);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [viewId, setViewId] = useState<number | null>(null);
  const [toDelete, setToDelete] = useState<ItemListRow | null>(null);

  const filtered = useMemo(() => filterItems(allItems, filters), [allItems, filters]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const start = (safePage - 1) * pageSize;
  const rows = filtered.slice(start, start + pageSize);

  const updateFilters = (next: ItemFilters) => {
    setFilters(next);
    setPage(1);
  };

  const handleExport = () => {
    exportToExcel(
      filtered as unknown as Record<string, unknown>[],
      [
        { key: "item_CodeTxt", label: getLabel("item_code") },
        { key: "name", label: getLabel("item") },
        ...ITEM_ATTRIBUTES.map(({ field, label }) => ({ key: field, label: getLabel(label) })),
        { key: "hsnNo", label: "HSN / SAC" },
        { key: "vatPer", label: "Tax %" },
        { key: "mrp", label: "MRP" },
        { key: "std_Sell_Rate", label: "Sell Rate" },
        { key: "std_Unit", label: "Std Unit" },
        { key: "discount", label: "Discount" },
        { key: "description", label: "Description" },
        { key: "mfrCodeReq", label: "Batch Code Required" },
        { key: "is_BOM", label: "Is BOM" },
        { key: "reOrderQty", label: "Reorder Qty" },
        { key: "reOrderDays", label: "Reorder Days" },
        { key: "modified_Date", label: "Modified Date" },
        { key: "item_ID", label: "Item ID" },
      ],
      "items-export"
    );
    toast.success(`Exported ${filtered.length} items`);
  };

  const handleDelete = () => {
    if (!toDelete) return;
    const target = toDelete;
    deleteItem.mutate(target.item_ID, {
      onSuccess: () => {
        toast.success(`Item "${target.name}" deleted`);
        setToDelete(null);
      },
      onError: (error) => {
        setToDelete(null);
        toast.error(getApiErrorMessage(error, "Failed to delete item"));
      },
    });
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="mr-auto">
          <h1 className="text-2xl font-bold tracking-tight">Items</h1>
          <p className="text-sm text-muted-foreground">
            {isLoading
              ? "Loading items…"
              : `${filtered.length.toLocaleString()}${filtered.length !== allItems.length ? ` of ${allItems.length.toLocaleString()}` : ""} items`}
          </p>
        </div>
        <Button type="button" variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching}>
          <RefreshCw className={cn("mr-2 h-4 w-4", isFetching && "animate-spin")} />
          Refresh
        </Button>
        <Button asChild size="sm">
          <Link href="/erp/master/items/create">
            <PackagePlus className="mr-2 h-4 w-4" />
            Add Item
          </Link>
        </Button>
      </div>

      <Card className="gap-0 py-0">
        <CardContent className="p-3">
          <ItemFilterPanel
            wide
            allItems={allItems}
            filters={filters}
            onFiltersChange={updateFilters}
            onExport={handleExport}
            canExport={filtered.length > 0}
          />
        </CardContent>
      </Card>

      {isError && (
        <div className="flex items-center justify-between rounded-md border border-destructive/40 bg-destructive/5 px-4 py-3 text-sm">
          <span>Could not load items.</span>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            Retry
          </Button>
        </div>
      )}

      <Card className="gap-0 overflow-hidden py-0">
        <Table className="min-w-[1700px]">
          <TableHeader className="bg-muted/40">
            <TableRow>
              <TableHead>{getLabel("item_code")}</TableHead>
              <TableHead className="min-w-64">Particular</TableHead>
              <TableHead>HSN / SAC</TableHead>
              <TableHead className="text-right">Tax %</TableHead>
              <TableHead className="text-right">MRP</TableHead>
              <TableHead className="text-right">Sell Rate</TableHead>
              <TableHead>Std Unit</TableHead>
              <TableHead className="text-right">Discount</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Batch Code Req</TableHead>
              <TableHead>Is BOM</TableHead>
              <TableHead className="text-right">Reorder Qty</TableHead>
              <TableHead className="text-right">Reorder Days</TableHead>
              {ITEM_ATTRIBUTES.map(({ field, label }) => (
                <TableHead key={field}>{getLabel(label)}</TableHead>
              ))}
              <TableHead>Modified</TableHead>
              <TableHead className="text-right">Item ID</TableHead>
              <TableHead className="sticky right-0 bg-muted text-right shadow-[-1px_0_0_var(--border)]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading &&
              Array.from({ length: 8 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell colSpan={21}>
                    <Skeleton className="h-6 w-full" />
                  </TableCell>
                </TableRow>
              ))}
            {!isLoading && rows.length === 0 && (
              <TableRow>
                <TableCell colSpan={21} className="py-14 text-center text-muted-foreground">
                  {allItems.length === 0 ? "No items yet. Add your first item." : "No items match these filters."}
                </TableCell>
              </TableRow>
            )}
            {rows.map((item) => (
              <TableRow key={item.item_ID} className={cn("group", item.isActive === false && "opacity-60")}>
                <TableCell className="font-mono text-xs">{dash(item.item_CodeTxt)}</TableCell>
                <TableCell className="font-medium">{itemParticular(item)}</TableCell>
                <TableCell>{dash(item.hsnNo)}</TableCell>
                <TableCell className="text-right tabular-nums">{item.vatPer ?? "—"}</TableCell>
                <TableCell className="text-right tabular-nums">{money(item.mrp)}</TableCell>
                <TableCell className="text-right tabular-nums">{money(item.std_Sell_Rate)}</TableCell>
                <TableCell>{dash(item.std_Unit)}</TableCell>
                <TableCell className="text-right tabular-nums">{item.discount ?? "—"}</TableCell>
                <TableCell className="max-w-48 truncate">{dash(item.description)}</TableCell>
                <TableCell>{item.mfrCodeReq ? <Badge variant="secondary">Yes</Badge> : "No"}</TableCell>
                <TableCell>{item.is_BOM ? <Badge variant="secondary">Yes</Badge> : "No"}</TableCell>
                <TableCell className="text-right tabular-nums">{dash(item.reOrderQty)}</TableCell>
                <TableCell className="text-right tabular-nums">{dash(item.reOrderDays)}</TableCell>
                {ITEM_ATTRIBUTES.map(({ field }) => (
                  <TableCell key={field} className="max-w-40 truncate">
                    {dash(item[field])}
                  </TableCell>
                ))}
                <TableCell className="whitespace-nowrap text-xs text-muted-foreground">{formatDate(item.modified_Date)}</TableCell>
                <TableCell className="text-right font-mono text-xs text-muted-foreground">{item.item_ID}</TableCell>
                <TableCell className="sticky right-0 bg-card shadow-[-1px_0_0_var(--border)] group-hover:bg-muted">
                  <div className="flex justify-end gap-1">
                    <Button variant="outline" size="icon" className="h-8 w-8" aria-label="View details" title="View details" onClick={() => setViewId(item.item_ID)}>
                      <Eye className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      aria-label="Edit item"
                      title="Edit"
                      onClick={() => router.push(`/erp/master/items/${item.item_ID}/edit`)}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:bg-red-50 hover:text-destructive"
                      aria-label="Delete item"
                      title="Delete"
                      onClick={() => setToDelete(item)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <TablePagination
          totalItems={filtered.length}
          pageSize={pageSize}
          currentPage={safePage}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
        />
      </Card>

      <ItemDetailsSheet
        itemId={viewId}
        onClose={() => setViewId(null)}
        onEdit={(id) => router.push(`/erp/master/items/${id}/edit`)}
      />

      <AlertDialog open={!!toDelete} onOpenChange={(open) => !open && !deleteItem.isPending && setToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete item</AlertDialogTitle>
            <AlertDialogDescription>
              Delete &quot;{toDelete ? itemParticular(toDelete) : ""}&quot;? Items already used in invoices may not be deletable. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteItem.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleDelete();
              }}
              disabled={deleteItem.isPending}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              {deleteItem.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
