"use client";

import { useState } from "react";
import { CalendarClock, Check, RotateCcw, User } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { CrmLeadFollowUp } from "@/lib/bay53crm/api";
import { formatDate } from "@/lib/bay53crm/constants";
import { dayOf, isOverdue, todayInput, type FollowUpInput } from "@/lib/bay53crm/records";
import { EmptyRecords, RecordForm, RecordHeader, RecordRow } from "./RecordParts";

interface FollowUpPanelProps {
  items: CrmLeadFollowUp[];
  users: { userName: string; fullName: string }[];
  isLoading?: boolean;
  isSaving?: boolean;
  /** The lead's assignee, offered for a new follow-up. */
  defaultAssignTo?: string;
  /** Resolve false to keep the form open (the save failed). */
  onSave: (input: FollowUpInput, existing?: CrmLeadFollowUp) => Promise<boolean | void>;
  onToggleDone: (followUp: CrmLeadFollowUp) => void;
  onDelete: (followUp: CrmLeadFollowUp) => void;
}

export function FollowUpPanel({ items, users, isLoading, isSaving, defaultAssignTo = "", onSave, onToggleDone, onDelete }: FollowUpPanelProps) {
  // null: form closed; "new": adding; a follow-up: editing it.
  const [editing, setEditing] = useState<CrmLeadFollowUp | "new" | null>(null);
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState(todayInput());
  const [assignTo, setAssignTo] = useState("");

  const userName = (id?: string) => users.find((u) => u.userName === id)?.fullName ?? id ?? "";
  // Pending ones first, the soonest due on top; finished ones after, the latest first.
  const sorted = [...items].sort((a, b) =>
    a.isCompleted === b.isCompleted
      ? a.isCompleted
        ? b.dueDate.localeCompare(a.dueDate)
        : a.dueDate.localeCompare(b.dueDate)
      : a.isCompleted
        ? 1
        : -1
  );

  const open = (target: CrmLeadFollowUp | "new") => {
    setEditing(target);
    if (target === "new") {
      setDescription("");
      setDueDate(todayInput());
      setAssignTo(defaultAssignTo);
    } else {
      setDescription(target.description ?? "");
      setDueDate(dayOf(target.dueDate) || todayInput());
      setAssignTo(target.assignTo ?? "");
    }
  };

  const submit = async () => {
    if (!editing || !description.trim()) return;
    const saved = await onSave({ description, dueDate, assignTo }, editing === "new" ? undefined : editing);
    if (saved !== false) setEditing(null);
  };

  return (
    <div className="space-y-3">
      <RecordHeader title="Follow-ups" count={items.length} addLabel="Add Follow-up" onAdd={() => open("new")} />

      {editing && (
        <RecordForm>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label htmlFor="follow-up-due" className="text-xs">Due date</Label>
              <Input id="follow-up-due" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className="h-9" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Assigned to</Label>
              <Select value={assignTo} onValueChange={setAssignTo}>
                <SelectTrigger className="h-9" aria-label="Assigned to"><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>
                  {users.map((u) => <SelectItem key={u.userName} value={u.userName}>{u.fullName}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What needs to be followed up..." className="min-h-[70px] text-sm" />
          <div className="flex gap-2 justify-end">
            <Button variant="ghost" size="sm" onClick={() => setEditing(null)} disabled={isSaving}>Cancel</Button>
            <Button size="sm" onClick={submit} disabled={!description.trim() || isSaving}>{isSaving ? "Saving..." : "Save"}</Button>
          </div>
        </RecordForm>
      )}

      <div className="space-y-2">
        {isLoading && <EmptyRecords>Loading follow-ups...</EmptyRecords>}
        {!isLoading && items.length === 0 && <EmptyRecords>No follow-ups yet</EmptyRecords>}
        {sorted.map((followUp) => {
          const overdue = isOverdue(followUp);
          return (
            <RecordRow
              key={followUp.id}
              what="this follow-up"
              busy={isSaving}
              onEdit={() => open(followUp)}
              onDelete={() => onDelete(followUp)}
              className={followUp.isCompleted ? "opacity-70" : undefined}
              meta={
                <span className="flex flex-wrap items-center gap-1.5">
                  <CalendarClock className="h-3 w-3" />
                  Due {formatDate(followUp.dueDate)}
                  {overdue && <Badge variant="outline" className="border-red-200 bg-red-50 text-[10px] text-red-700">Overdue</Badge>}
                  {followUp.isCompleted && <Badge variant="outline" className="border-green-200 bg-green-50 text-[10px] text-green-700">Done</Badge>}
                </span>
              }
            >
              <p className={`text-sm whitespace-pre-wrap break-words ${followUp.isCompleted ? "line-through" : ""}`}>
                {followUp.description || followUp.title || "-"}
              </p>
              <div className="flex items-center justify-between">
                {followUp.assignTo ? (
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <User className="h-3 w-3" />
                    {userName(followUp.assignTo)}
                  </div>
                ) : (
                  <span />
                )}
                <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={() => onToggleDone(followUp)} disabled={isSaving}>
                  {followUp.isCompleted ? <RotateCcw className="mr-1 h-3 w-3" /> : <Check className="mr-1 h-3 w-3" />}
                  {followUp.isCompleted ? "Reopen" : "Mark done"}
                </Button>
              </div>
            </RecordRow>
          );
        })}
      </div>
    </div>
  );
}
