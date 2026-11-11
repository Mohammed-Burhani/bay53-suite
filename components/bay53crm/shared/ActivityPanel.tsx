"use client";

import { useState } from "react";
import { Clock, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { CrmActivity } from "@/lib/bay53crm/api";
import { formatDate } from "@/lib/bay53crm/constants";
import { dayOf, todayInput, type ActivityInput } from "@/lib/bay53crm/records";
import { EmptyRecords, RecordForm, RecordHeader, RecordRow } from "./RecordParts";

interface ActivityPanelProps {
  items: CrmActivity[];
  users: { userName: string; fullName: string }[];
  isLoading?: boolean;
  isSaving?: boolean;
  /** The user who is done by default for a new activity (the lead's or project's assignee). */
  defaultDoneBy?: string;
  /** Resolve false to keep the form open (the save failed). */
  onSave: (input: ActivityInput, existing?: CrmActivity) => Promise<boolean | void>;
  onDelete: (activity: CrmActivity) => void;
}

export function ActivityPanel({ items, users, isLoading, isSaving, defaultDoneBy = "", onSave, onDelete }: ActivityPanelProps) {
  // null: form closed; "new": adding; an activity: editing it.
  const [editing, setEditing] = useState<CrmActivity | "new" | null>(null);
  const [description, setDescription] = useState("");
  const [date, setDate] = useState(todayInput());
  const [doneBy, setDoneBy] = useState("");

  const userName = (id?: string) => users.find((u) => u.userName === id)?.fullName ?? id ?? "";
  const sorted = [...items].sort((a, b) => b.completedOn.localeCompare(a.completedOn));

  const open = (target: CrmActivity | "new") => {
    setEditing(target);
    if (target === "new") {
      setDescription("");
      setDate(todayInput());
      setDoneBy(defaultDoneBy);
    } else {
      setDescription(target.description ?? "");
      setDate(dayOf(target.completedOn) || todayInput());
      setDoneBy(target.doneBy ?? "");
    }
  };

  const submit = async () => {
    if (!editing || !description.trim()) return;
    const saved = await onSave({ description, date, doneBy }, editing === "new" ? undefined : editing);
    if (saved !== false) setEditing(null);
  };

  return (
    <div className="space-y-3">
      <RecordHeader title="Activities" count={items.length} addLabel="Add Activity" onAdd={() => open("new")} />

      {editing && (
        <RecordForm>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label htmlFor="activity-date" className="text-xs">Date</Label>
              <Input id="activity-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} className="h-9" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Done by</Label>
              <Select value={doneBy} onValueChange={setDoneBy}>
                <SelectTrigger className="h-9" aria-label="Done by"><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>
                  {users.map((u) => <SelectItem key={u.userName} value={u.userName}>{u.fullName}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What was done..." className="min-h-[70px] text-sm" />
          <div className="flex gap-2 justify-end">
            <Button variant="ghost" size="sm" onClick={() => setEditing(null)} disabled={isSaving}>Cancel</Button>
            <Button size="sm" onClick={submit} disabled={!description.trim() || isSaving}>{isSaving ? "Saving..." : "Save"}</Button>
          </div>
        </RecordForm>
      )}

      <div className="space-y-2">
        {isLoading && <EmptyRecords>Loading activities...</EmptyRecords>}
        {!isLoading && items.length === 0 && <EmptyRecords>No activities yet</EmptyRecords>}
        {sorted.map((activity) => (
          <RecordRow
            key={activity.id}
            what="this activity"
            busy={isSaving}
            onEdit={() => open(activity)}
            onDelete={() => onDelete(activity)}
            meta={
              <span className="flex items-center gap-1.5">
                <Clock className="h-3 w-3" />
                {formatDate(activity.completedOn)}
              </span>
            }
          >
            <p className="text-sm whitespace-pre-wrap break-words">{activity.description || activity.title || "-"}</p>
            {activity.doneBy && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <User className="h-3 w-3" />
                {userName(activity.doneBy)}
              </div>
            )}
          </RecordRow>
        ))}
      </div>
    </div>
  );
}
