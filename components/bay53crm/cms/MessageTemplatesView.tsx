"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Pencil, Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { DeleteButton } from "@/components/bay53crm/shared/RecordParts";
import {
  useAddCustomMessage,
  useCustomMessages,
  useDeleteCustomMessage,
  useUpdateCustomMessage,
} from "@/lib/bay53crm/api/queries";
import type { CrmCustomMessage } from "@/lib/bay53crm/api";
import {
  EMPTY_MESSAGE,
  messageProblems,
  toMessageInput,
  toMessageModel,
  type MessageInput,
} from "@/lib/bay53crm/settings";

const ALL_MESSAGES = { pageNumber: 1, pageSize: 500 };
const NO_MESSAGES: CrmCustomMessage[] = [];

function MessageForm({
  initial,
  isSaving,
  submitLabel,
  onSubmit,
  onCancel,
}: {
  initial: MessageInput;
  isSaving: boolean;
  submitLabel: string;
  onSubmit: (input: MessageInput) => void;
  onCancel: () => void;
}) {
  const [value, setValue] = useState(initial);
  const set = <K extends keyof MessageInput>(key: K, next: MessageInput[K]) => setValue((v) => ({ ...v, [key]: next }));
  const problems = messageProblems(value);

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="message-short-name">Short name *</Label>
        <Input id="message-short-name" value={value.shortName} onChange={(e) => set("shortName", e.target.value)} placeholder="Name used to pick the template" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="message-heading">Heading</Label>
        <Input id="message-heading" value={value.heading} onChange={(e) => set("heading", e.target.value)} placeholder="Subject or title" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="message-text">Message *</Label>
        <Textarea id="message-text" value={value.text} onChange={(e) => set("text", e.target.value)} className="min-h-[140px]" />
      </div>
      <div className="flex items-center gap-2">
        <Switch id="message-published" checked={value.isPublished} onCheckedChange={(v) => set("isPublished", v)} />
        <Label htmlFor="message-published">Published</Label>
      </div>
      {problems.length > 0 && <p className="text-xs text-muted-foreground">{problems[0]}</p>}
      <div className="flex justify-end gap-2 pt-2">
        <Button variant="outline" onClick={onCancel} disabled={isSaving}>Cancel</Button>
        <Button onClick={() => onSubmit(value)} disabled={isSaving || problems.length > 0}>{isSaving ? "Saving..." : submitLabel}</Button>
      </div>
    </div>
  );
}

export function MessageTemplatesView() {
  const { data: messages = NO_MESSAGES, isLoading, isError, error } = useCustomMessages(ALL_MESSAGES);
  const addMessage = useAddCustomMessage();
  const updateMessage = useUpdateCustomMessage();
  const deleteMessage = useDeleteCustomMessage();
  // null: dialog closed; "new": creating; a message: editing it.
  const [editing, setEditing] = useState<CrmCustomMessage | "new" | null>(null);

  const save = async (input: MessageInput) => {
    const existing = editing !== "new" ? editing : undefined;
    try {
      await (existing ? updateMessage : addMessage).mutateAsync(toMessageModel(input, existing ?? undefined));
      toast.success(existing ? "Template updated" : "Template added");
      setEditing(null);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not save the template");
    }
  };

  const remove = async (message: CrmCustomMessage) => {
    try {
      await deleteMessage.mutateAsync(message.id);
      toast.success("Template deleted");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not delete the template");
    }
  };

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Message Templates</h1>
          <p className="text-sm text-muted-foreground">Ready-made messages for emails and notifications</p>
        </div>
        <Button onClick={() => setEditing("new")}>
          <Plus className="h-4 w-4 mr-1" />
          New Template
        </Button>
      </div>

      <Card>
        <div className="overflow-auto max-h-[65vh]">
          <Table>
            <TableHeader>
              <TableRow className="sticky top-0 bg-background z-10">
                <TableHead>Short name</TableHead>
                <TableHead>Heading</TableHead>
                <TableHead>Message</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {messages.map((message) => (
                <TableRow key={message.id}>
                  <TableCell className="font-medium text-xs">{message.shortName}</TableCell>
                  <TableCell className="text-xs max-w-[200px] truncate" title={message.heading}>{message.heading}</TableCell>
                  <TableCell className="text-xs max-w-[320px] truncate" title={message.text}>{message.text}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={message.isPublished ? "border-green-200 bg-green-50 text-green-700" : "text-muted-foreground"}>
                      {message.isPublished ? "Published" : "Draft"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" className="h-7 w-7" aria-label="Edit template" onClick={() => setEditing(message)}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <DeleteButton what="this template" onConfirm={() => remove(message)} disabled={deleteMessage.isPending} />
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {(isLoading || isError || messages.length === 0) && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    {isLoading
                      ? "Loading templates..."
                      : isError
                        ? `Could not load templates: ${error instanceof Error ? error.message : "unknown error"}`
                        : "No templates yet"}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      <Dialog open={editing !== null} onOpenChange={(open) => !open && setEditing(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing === "new" ? "New Template" : "Edit Template"}</DialogTitle>
            <DialogDescription>A message that can be reused instead of typing it each time.</DialogDescription>
          </DialogHeader>
          {editing !== null && (
            <MessageForm
              initial={editing === "new" ? EMPTY_MESSAGE : toMessageInput(editing)}
              isSaving={addMessage.isPending || updateMessage.isPending}
              submitLabel={editing === "new" ? "Add Template" : "Save"}
              onCancel={() => setEditing(null)}
              onSubmit={save}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
