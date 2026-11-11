"use client";

// Small pieces shared by the lead and project panels (follow-ups, activities, notes, attachments), so every list
// looks and behaves the same: a header with an add button, rows with edit and delete, and a delete confirmation.

import { Pencil, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";

interface RecordHeaderProps {
  title: string;
  count?: number;
  addLabel?: string;
  onAdd?: () => void;
}

export function RecordHeader({ title, count, addLabel = "Add", onAdd }: RecordHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <h4 className="text-sm font-semibold text-muted-foreground">
        {title}
        {count !== undefined && count > 0 && <span className="ml-1.5 font-normal">({count})</span>}
      </h4>
      {onAdd && (
        <Button variant="outline" size="sm" onClick={onAdd}>
          <Plus className="h-3.5 w-3.5 mr-1" />
          {addLabel}
        </Button>
      )}
    </div>
  );
}

interface DeleteButtonProps {
  /** What is being deleted, for the confirmation ("this note"). */
  what: string;
  onConfirm: () => void;
  disabled?: boolean;
}

export function DeleteButton({ what, onConfirm, disabled }: DeleteButtonProps) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" disabled={disabled} aria-label={`Delete ${what}`}>
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete {what}?</AlertDialogTitle>
          <AlertDialogDescription>This cannot be undone.</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm}>Delete</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

interface RecordRowProps {
  children: React.ReactNode;
  /** Shown top left, beside the actions (a date, a badge). */
  meta?: React.ReactNode;
  what: string;
  onEdit?: () => void;
  onDelete?: () => void;
  busy?: boolean;
  className?: string;
}

export function RecordRow({ children, meta, what, onEdit, onDelete, busy, className }: RecordRowProps) {
  return (
    <div className={cn("border rounded-lg p-3 space-y-1.5", className)}>
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0 text-xs text-muted-foreground">{meta}</div>
        <div className="flex shrink-0 items-center">
          {onEdit && (
            <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground" onClick={onEdit} disabled={busy} aria-label={`Edit ${what}`}>
              <Pencil className="h-3.5 w-3.5" />
            </Button>
          )}
          {onDelete && <DeleteButton what={what} onConfirm={onDelete} disabled={busy} />}
        </div>
      </div>
      {children}
    </div>
  );
}

export function EmptyRecords({ children }: { children: React.ReactNode }) {
  return <p className="text-xs text-muted-foreground text-center py-4">{children}</p>;
}

/** A dashed card that holds the add/edit form of a panel. */
export function RecordForm({ children }: { children: React.ReactNode }) {
  return <div className="border border-dashed rounded-lg p-3 space-y-2">{children}</div>;
}
