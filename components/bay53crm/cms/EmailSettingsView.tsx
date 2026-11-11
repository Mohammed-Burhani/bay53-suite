"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Mail, Pencil, Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { DeleteButton } from "@/components/bay53crm/shared/RecordParts";
import {
  useAddEmailSetting,
  useDeleteEmailSetting,
  useEmailSettings,
  useUpdateEmailSetting,
} from "@/lib/bay53crm/api/queries";
import type { CrmEmailSetting } from "@/lib/bay53crm/api";
import { EMPTY_MAILBOX, mailboxProblems, toMailboxInput, toMailboxModel, type MailboxInput } from "@/lib/bay53crm/settings";

const NO_SETTINGS: CrmEmailSetting[] = [];

function TextField({ id, label, value, onChange, type = "text", placeholder }: { id: string; label: string; value: string; onChange: (v: string) => void; type?: string; placeholder?: string }) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <Input id={id} type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} autoComplete="off" />
    </div>
  );
}

function MailboxForm({
  initial,
  isEditing,
  isSaving,
  onSubmit,
  onCancel,
}: {
  initial: MailboxInput;
  isEditing: boolean;
  isSaving: boolean;
  onSubmit: (input: MailboxInput) => void;
  onCancel: () => void;
}) {
  const [value, setValue] = useState(initial);
  const set = <K extends keyof MailboxInput>(key: K, next: MailboxInput[K]) => setValue((v) => ({ ...v, [key]: next }));
  const problems = mailboxProblems(value);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <TextField id="mb-sender" label="Sender name" value={value.senderName} onChange={(v) => set("senderName", v)} placeholder="Bay53 CRM" />
        <TextField id="mb-email" label="Email address *" value={value.emailAddress} onChange={(v) => set("emailAddress", v)} type="email" />
        <TextField id="mb-user" label="User name" value={value.userName} onChange={(v) => set("userName", v)} placeholder="Defaults to the email address" />
        <TextField
          id="mb-password"
          label={isEditing ? "Password * (enter it again to save)" : "Password *"}
          value={value.password}
          onChange={(v) => set("password", v)}
          type="password"
        />
      </div>
      <p className="-mt-2 text-xs text-muted-foreground">Sending</p>
      <div className="grid grid-cols-2 gap-4">
        <TextField id="mb-smtp" label="SMTP server *" value={value.smtpServer} onChange={(v) => set("smtpServer", v)} placeholder="smtp.example.com" />
        <TextField id="mb-smtp-port" label="SMTP port *" value={value.smtpPort} onChange={(v) => set("smtpPort", v)} />
        <TextField id="mb-outgoing" label="Outgoing mail server" value={value.outgoingMailServer} onChange={(v) => set("outgoingMailServer", v)} />
      </div>
      <p className="-mt-2 text-xs text-muted-foreground">Receiving</p>
      <div className="grid grid-cols-2 gap-4">
        <TextField id="mb-imap" label="IMAP server" value={value.imapServer} onChange={(v) => set("imapServer", v)} placeholder="imap.example.com" />
        <TextField id="mb-imap-port" label="IMAP port" value={value.imapPort} onChange={(v) => set("imapPort", v)} />
        <TextField id="mb-pop" label="POP server" value={value.popServer} onChange={(v) => set("popServer", v)} />
        <TextField id="mb-pop-port" label="POP port" value={value.popPort} onChange={(v) => set("popPort", v)} />
      </div>
      <div className="flex items-center gap-2">
        <Switch id="mb-ssl" checked={value.enableSsl} onCheckedChange={(v) => set("enableSsl", v)} />
        <Label htmlFor="mb-ssl">Use SSL</Label>
      </div>
      {problems.length > 0 && <p className="text-xs text-muted-foreground">{problems[0]}</p>}
      <div className="flex justify-end gap-2 pt-2">
        <Button variant="outline" onClick={onCancel} disabled={isSaving}>Cancel</Button>
        <Button onClick={() => onSubmit(value)} disabled={isSaving || problems.length > 0}>
          {isSaving ? "Saving..." : isEditing ? "Save" : "Add Mailbox"}
        </Button>
      </div>
    </div>
  );
}

export function EmailSettingsView() {
  const { data: settings = NO_SETTINGS, isLoading, isError, error } = useEmailSettings();
  const addSetting = useAddEmailSetting();
  const updateSetting = useUpdateEmailSetting();
  const deleteSetting = useDeleteEmailSetting();
  // null: dialog closed; "new": creating; a setting: editing it.
  const [editing, setEditing] = useState<CrmEmailSetting | "new" | null>(null);

  const save = async (input: MailboxInput) => {
    const existing = editing !== "new" ? editing : undefined;
    try {
      await (existing ? updateSetting : addSetting).mutateAsync(toMailboxModel(input, existing ?? undefined));
      toast.success(existing ? "Mailbox updated" : "Mailbox added");
      setEditing(null);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not save the mailbox");
    }
  };

  const remove = async (setting: CrmEmailSetting) => {
    try {
      await deleteSetting.mutateAsync(setting.id);
      toast.success("Mailbox deleted");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not delete the mailbox");
    }
  };

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Email Settings</h1>
          <p className="text-sm text-muted-foreground">The mailboxes the CRM sends and reads email through</p>
        </div>
        <Button onClick={() => setEditing("new")}>
          <Plus className="h-4 w-4 mr-1" />
          New Mailbox
        </Button>
      </div>

      {isLoading && <p className="text-sm text-muted-foreground">Loading...</p>}
      {isError && (
        <p className="text-sm text-destructive">Could not load the mailboxes: {error instanceof Error ? error.message : "unknown error"}</p>
      )}
      {!isLoading && !isError && settings.length === 0 && (
        <Card className="py-4">
          <CardContent className="py-6 text-center text-sm text-muted-foreground">No mailbox is set up yet.</CardContent>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        {settings.map((setting) => (
          <Card key={setting.id} className="py-4">
            <CardContent className="space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div className="flex min-w-0 items-center gap-2">
                  <Mail className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{setting.emailAddress}</p>
                    {setting.senderName && <p className="truncate text-xs text-muted-foreground">{setting.senderName}</p>}
                  </div>
                </div>
                <div className="flex shrink-0 gap-1">
                  <Button variant="ghost" size="icon" className="h-7 w-7" aria-label="Edit mailbox" onClick={() => setEditing(setting)}>
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <DeleteButton what="this mailbox" onConfirm={() => remove(setting)} disabled={deleteSetting.isPending} />
                </div>
              </div>
              <dl className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs">
                <dt className="text-muted-foreground">SMTP</dt>
                <dd className="truncate">{setting.smtpServer}:{setting.smtpPort}</dd>
                <dt className="text-muted-foreground">IMAP</dt>
                <dd className="truncate">{setting.imapServer ? `${setting.imapServer}:${setting.imapPort}` : "-"}</dd>
                <dt className="text-muted-foreground">Security</dt>
                <dd>
                  <Badge variant="outline" className="text-[10px]">{setting.enableSsl ? "SSL" : "No SSL"}</Badge>
                </dd>
              </dl>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={editing !== null} onOpenChange={(open) => !open && setEditing(null)}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>{editing === "new" ? "New Mailbox" : "Edit Mailbox"}</DialogTitle>
            <DialogDescription>The password is stored by the CRM and is never shown again.</DialogDescription>
          </DialogHeader>
          <div className="max-h-[65vh] overflow-y-auto pr-2">
            {editing !== null && (
              <MailboxForm
                initial={editing === "new" ? EMPTY_MAILBOX : toMailboxInput(editing)}
                isEditing={editing !== "new"}
                isSaving={addSetting.isPending || updateSetting.isPending}
                onCancel={() => setEditing(null)}
                onSubmit={save}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
