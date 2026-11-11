"use client";

import { useRef, useState } from "react";
import { toast } from "sonner";
import { Paperclip, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useSendEmail } from "@/lib/bay53crm/api/queries";
import { composeProblems, toSendForm, type ComposeInput } from "@/lib/bay53crm/email";

function ComposeForm({ initial, onDone }: { initial: ComposeInput; onDone: () => void }) {
  const send = useSendEmail();
  const [value, setValue] = useState(initial);
  const [showCopies, setShowCopies] = useState(!!initial.cc || !!initial.bcc);
  const fileInput = useRef<HTMLInputElement>(null);
  const set = <K extends keyof ComposeInput>(key: K, next: ComposeInput[K]) => setValue((v) => ({ ...v, [key]: next }));
  const problems = composeProblems(value);

  const submit = async () => {
    try {
      await send.mutateAsync(toSendForm(value));
      toast.success("Email sent");
      onDone();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not send the email");
    }
  };

  return (
    <div className="space-y-3">
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <Label htmlFor="mail-to">To</Label>
          {!showCopies && (
            <button type="button" className="text-xs text-muted-foreground hover:text-foreground" onClick={() => setShowCopies(true)}>
              Cc / Bcc
            </button>
          )}
        </div>
        <Input id="mail-to" value={value.to} onChange={(e) => set("to", e.target.value)} placeholder="name@example.com, another@example.com" />
      </div>
      {showCopies && (
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="mail-cc">Cc</Label>
            <Input id="mail-cc" value={value.cc} onChange={(e) => set("cc", e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="mail-bcc">Bcc</Label>
            <Input id="mail-bcc" value={value.bcc} onChange={(e) => set("bcc", e.target.value)} />
          </div>
        </div>
      )}
      <div className="space-y-1.5">
        <Label htmlFor="mail-subject">Subject</Label>
        <Input id="mail-subject" value={value.subject} onChange={(e) => set("subject", e.target.value)} />
      </div>
      <Textarea aria-label="Message" value={value.body} onChange={(e) => set("body", e.target.value)} className="min-h-[160px] text-sm" placeholder="Write your message..." />

      <div className="space-y-2">
        <input
          ref={fileInput}
          type="file"
          multiple
          className="hidden"
          onChange={(e) => {
            const picked = Array.from(e.target.files ?? []);
            if (picked.length) set("files", [...value.files, ...picked]);
            e.target.value = "";
          }}
        />
        <Button type="button" variant="outline" size="sm" onClick={() => fileInput.current?.click()}>
          <Paperclip className="mr-1 h-3.5 w-3.5" />
          Attach files
        </Button>
        {value.files.map((file, index) => (
          <div key={`${file.name}-${index}`} className="flex items-center justify-between rounded-md border px-2.5 py-1.5 text-xs">
            <span className="truncate">{file.name}</span>
            <Button type="button" variant="ghost" size="icon" className="h-6 w-6" aria-label={`Remove ${file.name}`} onClick={() => set("files", value.files.filter((_, i) => i !== index))}>
              <X className="h-3 w-3" />
            </Button>
          </div>
        ))}
      </div>

      {problems.length > 0 && <p className="text-xs text-muted-foreground">{problems[0]}</p>}
      <div className="flex justify-end gap-2 pt-1">
        <Button variant="outline" onClick={onDone} disabled={send.isPending}>Cancel</Button>
        <Button onClick={submit} disabled={send.isPending || problems.length > 0}>{send.isPending ? "Sending..." : "Send"}</Button>
      </div>
    </div>
  );
}

interface ComposeDialogProps {
  /** null: closed. */
  draft: ComposeInput | null;
  onClose: () => void;
}

export function ComposeDialog({ draft, onClose }: ComposeDialogProps) {
  return (
    <Dialog open={draft !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>New Email</DialogTitle>
          <DialogDescription>Sent from the CRM mailbox.</DialogDescription>
        </DialogHeader>
        {/* Mounted only while open, so each draft starts from its own values. */}
        {draft !== null && <ComposeForm initial={draft} onDone={onClose} />}
      </DialogContent>
    </Dialog>
  );
}
