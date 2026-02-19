"use client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { FileText, Plus, Settings, Trash2, Search } from "lucide-react";
import { formatCurrency } from "@/lib/store";
import { Product } from "@/lib/types";
import { CustomColumn } from "./ColumnSettings";

export interface InvoiceLineItem {
  productId: string;
  productName: string;
  quantity: number;
  unit: string;
  price: number;
  discount: number;
  gstRate: number;
  total: number;
  maxStock: number;
  hsnCode?: string;
  [key: string]: any;
}

interface InvoiceItemsTableProps {
  items: InvoiceLineItem[];
  columns: CustomColumn[];
  products: Product[];
  searchTerm: string;
  onSearchChange: (value: string) => void;
  onAddItem: () => void;
  onRemoveItem: (index: number) => void;
  onUpdateItem: (index: number, field: string, value: any) => void;
  onToggleColumnSettings: () => void;
  showColumnSettings: boolean;
  columnSettingsComponent: React.ReactNode;
}

export function InvoiceItemsTable({
  items,
  columns,
  products,
  searchTerm,
  onSearchChange,
  onAddItem,
  onRemoveItem,
  onUpdateItem,
  onToggleColumnSettings,
  showColumnSettings,
  columnSettingsComponent,
}: InvoiceItemsTableProps) {
  const enabledColumns = columns.filter((c) => c.enabled);
  const maxColumns = 5;

  const filteredProducts = products.filter(
    (p) =>
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.barcode && p.barcode.includes(searchTerm))
  );

  return (
    <Card>
      <CardContent className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
            <FileText className="h-4 w-4" />
            Invoice Items
          </div>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={onToggleColumnSettings}
              className="gap-2"
            >
              <Settings className="h-3 w-3" />
              Columns ({enabledColumns.length}/{maxColumns})
            </Button>
            <Button size="sm" variant="outline" onClick={onAddItem} className="gap-2">
              <Plus className="h-3 w-3" />
              Add Item
            </Button>
          </div>
        </div>

        {showColumnSettings && columnSettingsComponent}

        {items.length === 0 ? (
          <div className="py-12 text-center text-muted-foreground">
            <FileText className="h-10 w-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm">No items added yet</p>
            <p className="text-xs mt-1">Click "Add Item" to start</p>
          </div>
        ) : (
          <div className="border rounded-lg overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  {enabledColumns.map((col) => (
                    <TableHead
                      key={col.id}
                      className={
                        col.id === "sno"
                          ? "w-[60px]"
                          : col.id === "description"
                          ? "min-w-[250px]"
                          : col.id === "amount"
                          ? "w-[140px] text-right"
                          : "w-[120px]"
                      }
                    >
                      {col.label}
                    </TableHead>
                  ))}
                  <TableHead className="w-[60px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item, index) => (
                  <InvoiceItemRow
                    key={index}
                    item={item}
                    index={index}
                    columns={enabledColumns}
                    products={filteredProducts}
                    searchTerm={searchTerm}
                    onSearchChange={onSearchChange}
                    onUpdate={onUpdateItem}
                    onRemove={onRemoveItem}
                  />
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface InvoiceItemRowProps {
  item: InvoiceLineItem;
  index: number;
  columns: CustomColumn[];
  products: Product[];
  searchTerm: string;
  onSearchChange: (value: string) => void;
  onUpdate: (index: number, field: string, value: any) => void;
  onRemove: (index: number) => void;
}

function InvoiceItemRow({
  item,
  index,
  columns,
  products,
  searchTerm,
  onSearchChange,
  onUpdate,
  onRemove,
}: InvoiceItemRowProps) {
  return (
    <TableRow>
      {columns.map((col) => {
        if (col.id === "sno") {
          return (
            <TableCell key={col.id} className="text-center">
              {index + 1}
            </TableCell>
          );
        }
        if (col.id === "description") {
          return (
            <TableCell key={col.id}>
              <Select
                value={item.productId}
                onValueChange={(value) => onUpdate(index, "productId", value)}
              >
                <SelectTrigger className="h-9 text-sm w-full">
                  <SelectValue placeholder="Select product" />
                </SelectTrigger>
                <SelectContent>
                  <div className="p-2">
                    <div className="relative">
                      <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
                      <Input
                        placeholder="Search..."
                        value={searchTerm}
                        onChange={(e) => onSearchChange(e.target.value)}
                        className="h-8 text-sm pl-7"
                      />
                    </div>
                  </div>
                  {products.map((p) => (
                    <SelectItem key={p.id} value={p.id} className="text-sm">
                      {p.name} (Stock: {p.stock})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {item.productId && (
                <p className="text-xs text-muted-foreground mt-1">
                  Stock: {item.maxStock} {item.unit}
                </p>
              )}
            </TableCell>
          );
        }
        if (col.id === "hsn") {
          return (
            <TableCell key={col.id}>
              <Input
                value={item.hsnCode || ""}
                onChange={(e) => onUpdate(index, "hsnCode", e.target.value)}
                className="h-9 text-sm"
                placeholder="HSN"
              />
            </TableCell>
          );
        }
        if (col.id === "quantity") {
          return (
            <TableCell key={col.id}>
              <Input
                type="number"
                min="1"
                max={item.maxStock}
                value={item.quantity}
                onChange={(e) => onUpdate(index, "quantity", Number(e.target.value) || 1)}
                className="h-9 text-sm"
              />
            </TableCell>
          );
        }
        if (col.id === "rate") {
          return (
            <TableCell key={col.id}>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={item.price}
                onChange={(e) => onUpdate(index, "price", Number(e.target.value) || 0)}
                className="h-9 text-sm"
              />
            </TableCell>
          );
        }
        if (col.id === "gst") {
          return (
            <TableCell key={col.id}>
              <Input
                type="number"
                value={item.gstRate}
                onChange={(e) => onUpdate(index, "gstRate", Number(e.target.value) || 0)}
                className="h-9 text-sm"
              />
            </TableCell>
          );
        }
        if (col.id === "amount") {
          return (
            <TableCell key={col.id} className="text-right font-medium">
              {formatCurrency(item.total)}
            </TableCell>
          );
        }
        // Custom columns
        if (col.isCustom) {
          return (
            <TableCell key={col.id}>
              <Input
                type={col.type}
                value={item[col.id] || ""}
                onChange={(e) =>
                  onUpdate(
                    index,
                    col.id,
                    col.type === "number" ? Number(e.target.value) || 0 : e.target.value
                  )
                }
                className="h-9 text-sm"
                placeholder={col.label}
              />
            </TableCell>
          );
        }
        return null;
      })}
      <TableCell>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-destructive"
          onClick={() => onRemove(index)}
        >
          <Trash2 className="h-3 w-3" />
        </Button>
      </TableCell>
    </TableRow>
  );
}
