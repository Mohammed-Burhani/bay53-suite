"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Bookmark, Flag, MailOpen, Mail as MailIcon, Paperclip, Pencil, Reply, Trash2, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  useAddEmailsAsLeads,
  useBookmarkEmail,
  useDeleteEmail,
  useEmailFolder,
  useFlagEmail,
  useMarkEmailRead,
  useMarkEmailUnread,
  useUnflagEmail,
  type EmailFolder,
} from "@/lib/bay53crm/api/queries";
import { emailApi, type CrmMessage } from "@/lib/bay53crm/api";
import {
  addressLabel,
  EMPTY_COMPOSE,
  mailIdOf,
  messageKey,
  newestFirst,
  previewOf,
  recipientsLabel,
  replyTo,
  unreadCount,
  type ComposeInput,
} from "@/lib/bay53crm/email";
import { formatDateTime } from "@/lib/bay53crm/constants";
import { requireFile, saveBlob } from "@/lib/bay53crm/records";
import { cn } from "@/lib/utils";
import { ComposeDialog } from "./ComposeDialog";

const FOLDERS: { value: EmailFolder; label: string }[] = [
  { value: "inbox", label: "Inbox" },
  { value: "important", label: "Important" },
  { value: "bookmarked", label: "Bookmarked" },
  { value: "trash", label: "Trash" },
];

const NO_MESSAGES: CrmMessage[] = [];

/** The body of a message. HTML mail is shown in a sandboxed frame, so nothing in it can run or reach the app. */
function MessageBody({ message }: { message: CrmMessage }) {
  if (message.htmlBody) {
    return (
      <iframe
        title="Message"
        sandbox=""
        srcDoc={message.htmlBody}
        className="h-[420px] w-full rounded-md border bg-white"
      />
    );
  }
  return <pre className="whitespace-pre-wrap break-words font-sans text-sm">{message.textBody}</pre>;
}

export function EmailView() {
  const [folder, setFolder] = useState<EmailFolder>("inbox");
  const { data, isLoading, isError, error, refetch, isFetching } = useEmailFolder(folder);
  const messages = useMemo(() => newestFirst(data ?? NO_MESSAGES), [data]);
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [draft, setDraft] = useState<ComposeInput | null>(null);

  const markRead = useMarkEmailRead();
  const markUnread = useMarkEmailUnread();
  const flag = useFlagEmail();
  const unflag = useUnflagEmail();
  const bookmark = useBookmarkEmail();
  const remove = useDeleteEmail();
  const addAsLead = useAddEmailsAsLeads();

  const selected = messages.find((m) => messageKey(m) === selectedKey) ?? null;

  const run = async (action: Promise<unknown>, done: string) => {
    try {
      await action;
      if (done) toast.success(done);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Something went wrong");
    }
  };

  const open = (message: CrmMessage) => {
    setSelectedKey(messageKey(message));
    if (!message.isRead) markRead.mutate(mailIdOf(message));
  };

  const downloadAttachment = async (message: CrmMessage, attachment: NonNullable<CrmMessage["attachments"]>[number]) => {
    try {
      const id = attachment.mailKitMessage ?? mailIdOf(message);
      const blob = await requireFile(
        await emailApi.download({
          id: id.id,
          validity: id.validity,
          contentId: attachment.attachmentId,
          fileName: attachment.fileName,
          type: attachment.contentType,
        })
      );
      saveBlob(blob, attachment.fileName ?? "attachment");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not download the file");
    }
  };

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Email</h1>
          <p className="text-sm text-muted-foreground">
            {isLoading ? "Loading..." : `${messages.length} messages, ${unreadCount(messages)} unread`}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => refetch()} disabled={isFetching}>{isFetching ? "Refreshing..." : "Refresh"}</Button>
          <Button onClick={() => setDraft(EMPTY_COMPOSE)}>
            <Pencil className="h-4 w-4 mr-1" />
            Compose
          </Button>
        </div>
      </div>

      <Tabs value={folder} onValueChange={(v) => { setFolder(v as EmailFolder); setSelectedKey(null); }}>
        <TabsList>
          {FOLDERS.map((f) => <TabsTrigger key={f.value} value={f.value}>{f.label}</TabsTrigger>)}
        </TabsList>
      </Tabs>

      {isError && (
        <Card className="p-4 text-sm">
          <p className="text-destructive">Could not read the mailbox: {error instanceof Error ? error.message : "unknown error"}</p>
          <p className="mt-1 text-muted-foreground">
            Check the mailbox login in <Link href="/crm/cms/email-settings" className="underline">Email Settings</Link>.
          </p>
        </Card>
      )}

      {!isError && (
        <div className="grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
          <Card className="overflow-hidden py-0">
            <div className="max-h-[65vh] divide-y overflow-y-auto">
              {isLoading && <p className="p-6 text-center text-sm text-muted-foreground">Loading messages...</p>}
              {!isLoading && messages.length === 0 && <p className="p-6 text-center text-sm text-muted-foreground">No messages in this folder</p>}
              {messages.map((message) => (
                <button
                  key={messageKey(message)}
                  type="button"
                  onClick={() => open(message)}
                  className={cn(
                    "block w-full px-4 py-3 text-left hover:bg-muted/50",
                    messageKey(message) === selectedKey && "bg-muted"
                  )}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className={cn("truncate text-sm", !message.isRead && "font-semibold")}>{addressLabel(message.fromAddress)}</span>
                    <span className="shrink-0 text-[11px] text-muted-foreground">{formatDateTime(message.date)}</span>
                  </div>
                  <p className={cn("truncate text-xs", !message.isRead ? "font-medium" : "text-muted-foreground")}>{message.subject || "(no subject)"}</p>
                  <p className="truncate text-xs text-muted-foreground">{previewOf(message)}</p>
                </button>
              ))}
            </div>
          </Card>

          <Card className="p-4">
            {!selected && <p className="py-16 text-center text-sm text-muted-foreground">Select a message to read it</p>}
            {selected && (
              <div className="space-y-4">
                <div className="space-y-1">
                  <h2 className="text-lg font-semibold break-words">{selected.subject || "(no subject)"}</h2>
                  <p className="text-xs text-muted-foreground">From {addressLabel(selected.fromAddress)}{selected.fromAddress?.address ? ` <${selected.fromAddress.address}>` : ""}</p>
                  <p className="text-xs text-muted-foreground">To {recipientsLabel(selected.toAddresses) || "-"}</p>
                  {selected.ccAddresses && selected.ccAddresses.length > 0 && (
                    <p className="text-xs text-muted-foreground">Cc {recipientsLabel(selected.ccAddresses)}</p>
                  )}
                  <p className="text-xs text-muted-foreground">{formatDateTime(selected.date)}</p>
                </div>

                <div className="flex flex-wrap gap-1.5">
                  <Button size="sm" variant="outline" onClick={() => setDraft(replyTo(selected))}>
                    <Reply className="mr-1 h-3.5 w-3.5" />Reply
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => run(selected.isRead ? markUnread.mutateAsync(mailIdOf(selected)) : markRead.mutateAsync(mailIdOf(selected)), "")}>
                    {selected.isRead ? <MailIcon className="mr-1 h-3.5 w-3.5" /> : <MailOpen className="mr-1 h-3.5 w-3.5" />}
                    {selected.isRead ? "Mark unread" : "Mark read"}
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => run(selected.isFlagged ? unflag.mutateAsync(mailIdOf(selected)) : flag.mutateAsync(mailIdOf(selected)), selected.isFlagged ? "Flag removed" : "Flagged")}>
                    <Flag className={cn("mr-1 h-3.5 w-3.5", selected.isFlagged && "fill-current")} />
                    {selected.isFlagged ? "Unflag" : "Flag"}
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => run(bookmark.mutateAsync(mailIdOf(selected)), "Bookmarked")} disabled={selected.isBookMark}>
                    <Bookmark className={cn("mr-1 h-3.5 w-3.5", selected.isBookMark && "fill-current")} />
                    {selected.isBookMark ? "Bookmarked" : "Bookmark"}
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => run(addAsLead.mutateAsync([mailIdOf(selected)]), "Added as a lead")}>
                    <UserPlus className="mr-1 h-3.5 w-3.5" />Add as lead
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-destructive"
                    onClick={async () => {
                      await run(remove.mutateAsync(mailIdOf(selected)), "Moved to trash");
                      setSelectedKey(null);
                    }}
                  >
                    <Trash2 className="mr-1 h-3.5 w-3.5" />Delete
                  </Button>
                </div>

                <MessageBody message={selected} />

                {selected.attachments && selected.attachments.length > 0 && (
                  <div className="space-y-1.5">
                    <p className="text-xs font-medium text-muted-foreground">Attachments</p>
                    {selected.attachments.map((attachment, index) => (
                      <button
                        key={attachment.attachmentId ?? index}
                        type="button"
                        onClick={() => downloadAttachment(selected, attachment)}
                        className="flex w-full items-center gap-2 rounded-md border px-2.5 py-1.5 text-left text-xs hover:bg-muted/50"
                      >
                        <Paperclip className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                        <span className="truncate">{attachment.fileName ?? "Attachment"}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </Card>
        </div>
      )}

      <ComposeDialog draft={draft} onClose={() => setDraft(null)} />
    </div>
  );
}
