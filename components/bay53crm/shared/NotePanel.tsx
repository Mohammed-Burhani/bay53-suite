"use client";

import { useState } from "react";
import { Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import type { CrmLeadNote } from "@/lib/bay53crm/api";
import { formatDateTime } from "@/lib/bay53crm/constants";
import { EmptyRecords, RecordForm, RecordHeader, RecordRow } from "./RecordParts";

interface NotePanelProps {
  items: CrmLeadNote[];
  isLoading?: boolean;
  isSaving?: boolean;
  /** Resolve false to keep the form open (the save failed). */
  onSave: (description: string, existing?: CrmLeadNote) => Promise<boolean | void>;
  onDelete: (note: CrmLeadNote) => void;
}

export function NotePanel({ items, isLoading, isSaving, onSave, onDelete }: NotePanelProps) {
  // null: form closed; "new": adding; a note: editing it.
  const [editing, setEditing] = useState<CrmLeadNote | "new" | null>(null);
  const [text, setText] = useState("");

  const sorted = [...items].sort((a, b) => b.createdDate.localeCompare(a.createdDate));

  const open = (target: CrmLeadNote | "new") => {
    setEditing(target);
    setText(target === "new" ? "" : target.description);
  };

  const submit = async () => {
    if (!editing || !text.trim()) return;
    const saved = await onSave(text.trim(), editing === "new" ? undefined : editing);
    if (saved !== false) setEditing(null);
  };

  return (
    <div className="space-y-3">
      <RecordHeader title="Notes" count={items.length} addLabel="Add Note" onAdd={() => open("new")} />

      {editing && (
        <RecordForm>
          <Textarea value={text} onChange={(e) => setText(e.target.value)} placeholder="Write a note..." className="min-h-[80px] text-sm" autoFocus />
          <div className="flex gap-2 justify-end">
            <Button variant="ghost" size="sm" onClick={() => setEditing(null)} disabled={isSaving}>Cancel</Button>
            <Button size="sm" onClick={submit} disabled={!text.trim() || isSaving}>{isSaving ? "Saving..." : "Save"}</Button>
          </div>
        </RecordForm>
      )}

      <div className="space-y-2">
        {isLoading && <EmptyRecords>Loading notes...</EmptyRecords>}
        {!isLoading && items.length === 0 && <EmptyRecords>No notes yet</EmptyRecords>}
        {sorted.map((note) => (
          <RecordRow
            key={note.id}
            what="this note"
            busy={isSaving}
            onEdit={() => open(note)}
            onDelete={() => onDelete(note)}
            meta={
              <span className="flex items-center gap-1.5">
                <Clock className="h-3 w-3" />
                {formatDateTime(note.createdDate)}
              </span>
            }
          >
            <p className="text-sm whitespace-pre-wrap break-words">{note.description}</p>
          </RecordRow>
        ))}
      </div>
    </div>
  );
}
