// Message templates and mailboxes: the two CMS-style records that have no relation to a lead.

import type { CrmCustomMessage, CrmEmailSetting } from "./api/dto";
import type { CrmSchemas } from "./api/types";

// ---- Message templates ----

export interface MessageInput {
  shortName: string;
  heading: string;
  text: string;
  isPublished: boolean;
}

export const EMPTY_MESSAGE: MessageInput = { shortName: "", heading: "", text: "", isPublished: true };

/** The type has no lookup endpoint; a new template gets 1 and an edited one keeps its own. */
export const DEFAULT_MESSAGE_TYPE = 1;

export const toMessageInput = (message: CrmCustomMessage): MessageInput => ({
  shortName: message.shortName ?? "",
  heading: message.heading ?? "",
  text: message.text ?? "",
  isPublished: message.isPublished,
});

export const toMessageModel = (input: MessageInput, existing?: CrmCustomMessage): CrmSchemas["CustomMessageViewModel"] => ({
  id: existing?.id ?? 0,
  type: existing?.type ?? DEFAULT_MESSAGE_TYPE,
  shortName: input.shortName.trim(),
  heading: input.heading.trim(),
  text: input.text.trim(),
  isPublished: input.isPublished,
});

export const messageProblems = (input: MessageInput): string[] => {
  const problems: string[] = [];
  if (!input.shortName.trim()) problems.push("Enter a short name");
  if (!input.text.trim()) problems.push("Enter the message text");
  return problems;
};

// ---- Mailboxes ----

export interface MailboxInput {
  senderName: string;
  emailAddress: string;
  userName: string;
  /** Typed again on every save: the API's copy is never shown, so it cannot be kept when the field is blank. */
  password: string;
  smtpServer: string;
  smtpPort: string;
  outgoingMailServer: string;
  imapServer: string;
  imapPort: string;
  popServer: string;
  popPort: string;
  enableSsl: boolean;
}

export const EMPTY_MAILBOX: MailboxInput = {
  senderName: "",
  emailAddress: "",
  userName: "",
  password: "",
  smtpServer: "",
  smtpPort: "587",
  outgoingMailServer: "",
  imapServer: "",
  imapPort: "993",
  popServer: "",
  popPort: "995",
  enableSsl: true,
};

export const toMailboxInput = (setting: CrmEmailSetting): MailboxInput => ({
  senderName: setting.senderName ?? "",
  emailAddress: setting.emailAddress ?? "",
  userName: setting.userName ?? "",
  password: "",
  smtpServer: setting.smtpServer ?? "",
  smtpPort: setting.smtpPort ? String(setting.smtpPort) : "",
  outgoingMailServer: setting.outgoingMailServer ?? "",
  imapServer: setting.imapServer ?? "",
  imapPort: setting.imapPort ?? "",
  popServer: setting.popServer ?? "",
  popPort: setting.popPort ?? "",
  enableSsl: setting.enableSsl,
});

const blankToNull = (value: string) => value.trim() || null;

export const toMailboxModel = (input: MailboxInput, existing?: CrmEmailSetting): CrmSchemas["EmailSettingViewModel"] => ({
  id: existing?.id ?? 0,
  accountId: existing?.accountId ?? null,
  senderName: blankToNull(input.senderName),
  emailAddress: input.emailAddress.trim(),
  userName: blankToNull(input.userName) ?? input.emailAddress.trim(),
  password: input.password,
  smtpServer: input.smtpServer.trim(),
  smtpPort: Number(input.smtpPort),
  outgoingMailServer: blankToNull(input.outgoingMailServer),
  imapServer: blankToNull(input.imapServer),
  imapPort: blankToNull(input.imapPort),
  popServer: blankToNull(input.popServer),
  popPort: blankToNull(input.popPort),
  enableSsl: input.enableSsl,
});

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const mailboxProblems = (input: MailboxInput): string[] => {
  const problems: string[] = [];
  if (!EMAIL.test(input.emailAddress.trim())) problems.push("Enter a valid email address");
  if (!input.password) problems.push("Enter the password");
  if (!input.smtpServer.trim()) problems.push("Enter the SMTP server");
  const port = Number(input.smtpPort);
  if (!Number.isInteger(port) || port < 1 || port > 65535) problems.push("The SMTP port must be a number from 1 to 65535");
  return problems;
};
