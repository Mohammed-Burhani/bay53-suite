"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { X, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

export interface CustomColumn {
  id: string;
  label: string;
  enabled: boolean;
  isCustom: boolean;
  type: "text" | "number" | "fixed";
}

interface ColumnSettingsProps {
  columns: CustomColumn[];
  maxColumns: number;
  onToggleColumn: (id: string) => void;
  onUpdateColumnLabel: (id: string, label: string) => void;
  onAddColumn: (label: string, type: "text" | "number") => void;
  onDeleteColumn: (id: string) => void;
  onClose: () => void;
}

export function ColumnSettings({
  columns,
  maxColumns,
  onToggleColumn,
  onUpdateColumnLabel,
  onAddColumn,
  onDeleteColumn,
  onClose,
}: ColumnSettingsProps) {
  const [editingColumnId, setEditingColumnId] = useState<string | null>(null);
  const [editingColumnLabel, setEditingColumnLabel] = useState("");
  const [newColumnLabel, setNewColumnLabel] = useState("");
  const [newColumnType, setNewColumnType] = useState<"text" | "number">("text");

  const enabledCount = columns.filter((c) => c.enabled).length;

  const startEditing = (col: CustomColumn) => {
    if (col.type === "fixed") {
      toast.error("Cannot edit fixed columns");
      return;
    }
    setEditingColumnId(col.id);
    setEditingColumnLabel(col.label);
  };

  const saveLabel = () => {
    if (!editingColumnLabel.trim()) {
      toast.error("Column name cannot be empty");
      return;
    }
    onUpdateColumnLabel(editingColumnId!, editingColumnLabel.trim());
    setEditingColumnId(null);
    setEditingColumnLabel("");
  };

  const handleAddColumn = () => {
    if (!newColumnLabel.trim()) {
      toast.error("Column name cannot be empty");
      return;
    }
    if (enabledCount >= maxColumns) {
      toast.error(`Maximum ${maxColumns} columns allowed`);
      return;
    }
    onAddColumn(newColumnLabel.trim(), newColumnType);
    setNewColumnLabel("");
    setNewColumnType("text");
  };

  return (
    <div className="border rounded-lg p-4 bg-muted/30 space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium">
          Customize Columns ({enabledCount}/{maxColumns})
        </p>
        <Button size="sm" variant="ghost" onClick={onClose}>
          <X className="h-3 w-3" />
        </Button>
      </div>

      {/* Existing Columns */}
      <div className="space-y-2">
        <p className="text-xs font-medium text-muted-foreground">Available Columns</p>
        <div className="grid gap-2">
          {columns.map((col) => (
            <div
              key={col.id}
              className="flex items-center gap-2 p-2 rounded border bg-background"
            >
              <input
                type="checkbox"
                checked={col.enabled}
                onChange={() => onToggleColumn(col.id)}
                className="rounded"
              />
              {editingColumnId === col.id ? (
                <div className="flex-1 flex gap-2">
                  <Input
                    value={editingColumnLabel}
                    onChange={(e) => setEditingColumnLabel(e.target.value)}
                    className="h-7 text-sm"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === "Enter") saveLabel();
                      if (e.key === "Escape") setEditingColumnId(null);
                    }}
                  />
                  <Button size="sm" onClick={saveLabel} className="h-7">
                    Save
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setEditingColumnId(null)}
                    className="h-7"
                  >
                    Cancel
                  </Button>
                </div>
              ) : (
                <>
                  <span className="flex-1 text-sm">{col.label}</span>
                  {col.type !== "fixed" && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => startEditing(col)}
                      className="h-7 text-xs"
                    >
                      Edit
                    </Button>
                  )}
                  {col.isCustom && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => onDeleteColumn(col.id)}
                      className="h-7 text-xs text-destructive"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  )}
                  <Badge variant="outline" className="text-xs">
                    {col.type}
                  </Badge>
                </>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Add Custom Column */}
      <div className="space-y-2 pt-2 border-t">
        <p className="text-xs font-medium text-muted-foreground">Add Custom Column</p>
        <div className="flex gap-2">
          <Input
            value={newColumnLabel}
            onChange={(e) => setNewColumnLabel(e.target.value)}
            placeholder="Column name"
            className="h-9 text-sm"
            onKeyDown={(e) => {
              if (e.key === "Enter") handleAddColumn();
            }}
          />
          <Select value={newColumnType} onValueChange={(v: any) => setNewColumnType(v)}>
            <SelectTrigger className="h-9 w-[100px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="text">Text</SelectItem>
              <SelectItem value="number">Number</SelectItem>
            </SelectContent>
          </Select>
          <Button size="sm" onClick={handleAddColumn} className="h-9">
            <Plus className="h-3 w-3 mr-1" />
            Add
          </Button>
        </div>
      </div>
    </div>
  );
}
