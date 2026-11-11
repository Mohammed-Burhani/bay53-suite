// Email of the CRM mailbox. The stage mail server rejects logins, so these helpers follow the swagger models and
// are covered by tests but have not been run against real mail.

import type { CrmEmailAddress, CrmMailId, CrmMessage } from "./api/dto";

/** A name for an address in a list: the display name, else the address. */
export const addressLabel = (address?: CrmEmailAddress | null): string => address?.name?.trim() || address?.address?.trim() || "Unknown sender";

export const recipientsLabel = (addresses?: CrmEmailAddress[] | null): string =>
  (addresses ?? []).map(addressLabel).join(", ");

/** The id the mail endpoints take back (they want the id and validity of the message on the server). */
export const mailIdOf = (message: CrmMessage): CrmMailId => message.mailKitMessage ?? message.messageId;

/** A stable key for a message in a list. */
export const messageKey = (message: CrmMessage): string => `${message.messageId.validity}-${message.messageId.id}`;

/** The text of a message without markup, for a one-line preview. */
export function previewOf(message: CrmMessage, length = 110): string {
  const source = message.textBody?.trim() || (message.htmlBody ?? "").replace(/<(style|script)[\s\S]*?<\/\1>/gi, " ").replace(/<[^>]+>/g, " ");
  const text = source.replace(/&nbsp;/g, " ").replace(/\s+/g, " ").trim();
  return text.length > length ? `${text.slice(0, length - 1)}…` : text;
}

/** Newest first. */
export const newestFirst = (messages: CrmMessage[]): CrmMessage[] => [...messages].sort((a, b) => b.date.localeCompare(a.date));

export const unreadCount = (messages: CrmMessage[]): number => messages.filter((m) => !m.isRead).length;

// ---- Composing ----

const EMAIL = /^[^\s@,;]+@[^\s@,;]+\.[^\s@,;]+$/;

/** Addresses typed in one field, separated by commas, semicolons or line breaks. */
export const parseRecipients = (text: string): string[] =>
  [...new Set(text.split(/[,;\n]/).map((part) => part.trim()).filter(Boolean))];

export const invalidRecipients = (text: string): string[] => parseRecipients(text).filter((address) => !EMAIL.test(address));

export interface ComposeInput {
  to: string;
  cc: string;
  bcc: string;
  subject: string;
  body: string;
  files: File[];
}

export const EMPTY_COMPOSE: ComposeInput = { to: "", cc: "", bcc: "", subject: "", body: "", files: [] };

/** What is wrong with a message before it is sent; an empty list means it can be sent. */
export function composeProblems(input: ComposeInput): string[] {
  const problems: string[] = [];
  if (parseRecipients(input.to).length === 0) problems.push("Add at least one recipient");
  for (const [label, field] of [["To", input.to], ["Cc", input.cc], ["Bcc", input.bcc]] as const) {
    const bad = invalidRecipients(field);
    if (bad.length > 0) problems.push(`${label}: "${bad[0]}" is not a valid address`);
  }
  if (!input.subject.trim() && !input.body.trim()) problems.push("Write a subject or a message");
  return problems;
}

/** The multipart body of Email/SendEmail. Several addresses in one field are joined with commas. */
export function toSendForm(input: ComposeInput): FormData {
  const form = new FormData();
  form.append("to", parseRecipients(input.to).join(","));
  const cc = parseRecipients(input.cc);
  if (cc.length) form.append("cc", cc.join(","));
  const bcc = parseRecipients(input.bcc);
  if (bcc.length) form.append("bcc", bcc.join(","));
  form.append("subject", input.subject.trim());
  form.append("content", input.body);
  for (const file of input.files) form.append("files", file);
  return form;
}

/** A reply to a message: its sender as the recipient and "Re:" in front of the subject, once. */
export function replyTo(message: CrmMessage): ComposeInput {
  const subject = message.subject?.trim() ?? "";
  return {
    ...EMPTY_COMPOSE,
    to: message.fromAddress?.address ?? "",
    subject: /^re:/i.test(subject) ? subject : `Re: ${subject}`.trim(),
  };
}
