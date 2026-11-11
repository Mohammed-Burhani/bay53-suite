"use client";

import { useRef, useState } from "react";
import { Download, FileText, Loader2, Paperclip } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DeleteButton, EmptyRecords, RecordForm, RecordHeader } from "./RecordParts";

/** What the panel needs of an attachment from either a lead or a project. */
export interface AttachmentItem {
  id: number;
  name: string;
  filePath: string;
}

interface AttachmentPanelProps {
  items: AttachmentItem[];
  isLoading?: boolean;
  /** An upload or delete is running. */
  isBusy?: boolean;
  /** Resolve false to keep the form open (the upload failed). */
  onUpload: (file: File, name: string) => Promise<boolean | void>;
  onDownload: (item: AttachmentItem) => Promise<void> | void;
  onDelete: (item: AttachmentItem) => void;
}

export function AttachmentPanel({ items, isLoading, isBusy, onUpload, onDownload, onDelete }: AttachmentPanelProps) {
  const [showForm, setShowForm] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [name, setName] = useState("");
  const [downloading, setDownloading] = useState<number | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  const reset = () => {
    setFile(null);
    setName("");
    setShowForm(false);
    if (fileInput.current) fileInput.current.value = "";
  };

  const submit = async () => {
    if (!file) return;
    const uploaded = await onUpload(file, name);
    if (uploaded !== false) reset();
  };

  const download = async (item: AttachmentItem) => {
    setDownloading(item.id);
    try {
      await onDownload(item);
    } finally {
      setDownloading(null);
    }
  };

  return (
    <div className="space-y-3">
      <RecordHeader title="Attachments" count={items.length} addLabel="Upload" onAdd={() => setShowForm(true)} />

      {showForm && (
        <RecordForm>
          <div className="space-y-1">
            <Label htmlFor="attachment-file" className="text-xs">File</Label>
            <Input
              id="attachment-file"
              ref={fileInput}
              type="file"
              className="h-9 text-xs"
              onChange={(e) => {
                const picked = e.target.files?.[0] ?? null;
                setFile(picked);
                // The label defaults to the file name without its extension; it can be changed.
                if (picked && !name) setName(picked.name.replace(/\.[^.]+$/, ""));
              }}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="attachment-name" className="text-xs">Name</Label>
            <Input id="attachment-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Shown in the list" className="h-9" />
          </div>
          <div className="flex gap-2 justify-end">
            <Button variant="ghost" size="sm" onClick={reset} disabled={isBusy}>Cancel</Button>
            <Button size="sm" onClick={submit} disabled={!file || isBusy}>
              {isBusy ? "Uploading..." : "Upload"}
            </Button>
          </div>
        </RecordForm>
      )}

      <div className="space-y-2">
        {isLoading && <EmptyRecords>Loading attachments...</EmptyRecords>}
        {!isLoading && items.length === 0 && <EmptyRecords>No attachments yet</EmptyRecords>}
        {items.map((item) => (
          <div key={item.id} className="flex items-center gap-2 border rounded-lg p-2.5">
            <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium" title={item.name}>{item.name}</p>
              <p className="flex items-center gap-1 text-[11px] text-muted-foreground">
                <Paperclip className="h-3 w-3" />
                {item.filePath.slice(item.filePath.lastIndexOf(".")).toUpperCase().slice(1) || "File"}
              </p>
            </div>
            <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground" onClick={() => download(item)} disabled={downloading === item.id} aria-label={`Download ${item.name}`}>
              {downloading === item.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
            </Button>
            <DeleteButton what={`"${item.name}"`} onConfirm={() => onDelete(item)} disabled={isBusy} />
          </div>
        ))}
      </div>
    </div>
  );
}
