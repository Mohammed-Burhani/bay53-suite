// ==================== CRM Email API ====================
// Mirrors the "Email" tag of the CRM swagger. Responses are untyped upstream: pass the unwrapped `data` DTO as <T> when integrating.

import { crmHttp } from "../client";
import type { CrmSchemas as S } from "../types";

export const emailApi = {
  getEmail: <T = unknown>(count: number) =>
    crmHttp.get<T>(`/Email/GetEmail/${count}`),
  getEmailThread: <T = unknown>(inbox: string) =>
    crmHttp.get<T>(`/Email/GetEmailThread/${inbox}`),
  getImportantEmail: <T = unknown>() =>
    crmHttp.get<T>("/Email/GetImportantEmail"),
  getBookmarkEmail: <T = unknown>() =>
    crmHttp.get<T>("/Email/GetBookmarkEmail"),
  sendEmail: <T = unknown>(form: FormData) =>
    crmHttp.upload<T>("/Email/SendEmail", form),
  markAsReadAll: <T = unknown>(payload: S["MailKitMessage"][]) =>
    crmHttp.post<T>("/Email/MarkAsReadAll", payload),
  markAsRead: <T = unknown>(payload: S["MailKitMessage"]) =>
    crmHttp.post<T>("/Email/MarkAsRead", payload),
  markAsUnRead: <T = unknown>(payload: S["MailKitMessage"]) =>
    crmHttp.post<T>("/Email/MarkAsUnRead", payload),
  markAsFlagged: <T = unknown>(payload: S["MailKitMessage"]) =>
    crmHttp.post<T>("/Email/MarkAsFlagged", payload),
  getTrashEmail: <T = unknown>() =>
    crmHttp.get<T>("/Email/GetTrashEmail"),
  markAsUnFlagged: <T = unknown>(payload: S["MailKitMessage"]) =>
    crmHttp.post<T>("/Email/MarkAsUnFlagged", payload),
  markAsBookmark: <T = unknown>(payload: S["MailKitMessage"]) =>
    crmHttp.post<T>("/Email/MarkAsBookmark", payload),
  delete: <T = unknown>(payload: S["MailKitMessage"]) =>
    crmHttp.post<T>("/Email/Delete", payload),
  deleteAll: <T = unknown>(payload: S["MailKitMessage"][]) =>
    crmHttp.post<T>("/Email/DeleteAll", payload),
  download: (query: { validity?: number; id?: number; contentId?: string; fileName?: string; type?: string }) =>
    crmHttp.download("/Email/Download", query),
  getContacts: <T = unknown>() =>
    crmHttp.get<T>("/Email/GetContacts"),
  addEmailAsLead: <T = unknown>(payload: S["MailKitMessage"][]) =>
    crmHttp.post<T>("/Email/AddEmailAsLead", payload),
  getEmailLeads: <T = unknown>() =>
    crmHttp.get<T>("/Email/GetEmailLeads"),
};
