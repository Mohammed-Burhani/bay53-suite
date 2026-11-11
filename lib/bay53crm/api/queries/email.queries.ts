"use client";

import { queryOptions, useQuery } from "@tanstack/react-query";
import { emailApi } from "../services/email.service";
import type { CrmMessage } from "../dto";
import type { CrmSchemas as S } from "../types";
import { crmKeys } from "./keys";
import { useCrmMutation } from "./mutation";

/** The folders the CRM mailbox exposes. */
export type EmailFolder = "inbox" | "important" | "bookmarked" | "trash";

/** How many messages the inbox asks for; GetEmail takes a count and has no paging. */
export const INBOX_COUNT = 50;

export const emailKeys = {
  all: crmKeys.email,
  folder: (folder: EmailFolder) => [...crmKeys.email, "folder", folder] as const,
};

const fetchers: Record<EmailFolder, () => Promise<CrmMessage[]>> = {
  inbox: () => emailApi.getEmail<CrmMessage[]>(INBOX_COUNT),
  important: () => emailApi.getImportantEmail<CrmMessage[]>(),
  bookmarked: () => emailApi.getBookmarkEmail<CrmMessage[]>(),
  trash: () => emailApi.getTrashEmail<CrmMessage[]>(),
};

export const emailQueries = {
  folder: (folder: EmailFolder) =>
    queryOptions({
      queryKey: emailKeys.folder(folder),
      queryFn: fetchers[folder],
      // Mail is read from the mail server on every call: do not refetch on every focus.
      staleTime: 60_000,
    }),
};

export const useEmailFolder = (folder: EmailFolder) => useQuery(emailQueries.folder(folder));

const SELF = [crmKeys.email];

export const useMarkEmailRead = () => useCrmMutation((id: S["MailKitMessage"]) => emailApi.markAsRead(id), SELF);
export const useMarkEmailUnread = () => useCrmMutation((id: S["MailKitMessage"]) => emailApi.markAsUnRead(id), SELF);
export const useMarkAllEmailRead = () => useCrmMutation((ids: S["MailKitMessage"][]) => emailApi.markAsReadAll(ids), SELF);
export const useFlagEmail = () => useCrmMutation((id: S["MailKitMessage"]) => emailApi.markAsFlagged(id), SELF);
export const useUnflagEmail = () => useCrmMutation((id: S["MailKitMessage"]) => emailApi.markAsUnFlagged(id), SELF);
export const useBookmarkEmail = () => useCrmMutation((id: S["MailKitMessage"]) => emailApi.markAsBookmark(id), SELF);
export const useDeleteEmail = () => useCrmMutation((id: S["MailKitMessage"]) => emailApi.delete(id), SELF);
export const useDeleteEmails = () => useCrmMutation((ids: S["MailKitMessage"][]) => emailApi.deleteAll(ids), SELF);
export const useSendEmail = () => useCrmMutation((form: FormData) => emailApi.sendEmail(form), SELF);
export const useAddEmailsAsLeads = () =>
  useCrmMutation((ids: S["MailKitMessage"][]) => emailApi.addEmailAsLead(ids), [crmKeys.email, crmKeys.lead]);
