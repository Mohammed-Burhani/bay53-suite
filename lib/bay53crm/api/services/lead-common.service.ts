// ==================== CRM LeadCommon API ====================
// Mirrors the "LeadCommon" tag of the CRM swagger. Responses are untyped upstream: endpoints seen live default <T> to the DTO in ../dto.ts, the rest to `unknown`.

import { crmHttp } from "../client";
import type { CrmActivity, CrmLeadAttachment, CrmLeadDetailsCount, CrmLeadFollowUp, CrmLeadHistoryEntry, CrmLeadNote, CrmLeadResultItem } from "../dto";
import type { CrmSchemas as S } from "../types";

export const leadCommonApi = {
  deleteLeadAttachment: <T = unknown>(id: number) =>
    crmHttp.post<T>("/LeadCommon/DeleteLeadAttachment", id),
  uploadLeadAttachment: <T = unknown>(form: FormData) =>
    crmHttp.upload<T>("/LeadCommon/UploadLeadAttachment", form),
  leadAttachmentList: <T = CrmLeadAttachment[]>(payload: S["LeadAttachmentSearchParams"]) =>
    crmHttp.post<T>("/LeadCommon/LeadAttachmentList", payload),
  downloadAttachmentFile: (query: { filename?: string }) =>
    crmHttp.download("/LeadCommon/DownloadAttachmentFile", query),
  listLeadFollowUp: <T = CrmLeadFollowUp[]>(payload: S["LeadFollowUpSearchParams"]) =>
    crmHttp.post<T>("/LeadCommon/ListLeadFollowUp", payload),
  getLeadFollowUp: <T = CrmLeadFollowUp>(id: number) =>
    crmHttp.post<T>("/LeadCommon/GetLeadFollowUp", id),
  addLeadFollowUp: <T = unknown>(payload: S["LeadFollowUpCreateViewModel"]) =>
    crmHttp.post<T>("/LeadCommon/AddLeadFollowUp", payload),
  updateLeadFollowUp: <T = unknown>(payload: S["LeadFollowUpCreateViewModel"]) =>
    crmHttp.post<T>("/LeadCommon/UpdateLeadFollowUp", payload),
  deleteLeadFollowUp: <T = unknown>(id: number) =>
    crmHttp.post<T>("/LeadCommon/DeleteLeadFollowUp", id),
  listLeadActivity: <T = CrmActivity[]>(payload: S["LeadActivitySearchParams"]) =>
    crmHttp.post<T>("/LeadCommon/ListLeadActivity", payload),
  getLeadActivity: <T = unknown>(id: number) =>
    crmHttp.post<T>("/LeadCommon/GetLeadActivity", id),
  addLeadActivity: <T = unknown>(payload: S["LeadActivityCreateViewModel"]) =>
    crmHttp.post<T>("/LeadCommon/AddLeadActivity", payload),
  updateLeadActivity: <T = unknown>(payload: S["LeadActivityCreateViewModel"]) =>
    crmHttp.post<T>("/LeadCommon/UpdateLeadActivity", payload),
  deleteLeadActivity: <T = unknown>(id: number) =>
    crmHttp.post<T>("/LeadCommon/DeleteLeadActivity", id),
  listLeadNote: <T = CrmLeadNote[]>(payload: S["LeadNoteSearchParams"]) =>
    crmHttp.post<T>("/LeadCommon/ListLeadNote", payload),
  getLeadNote: <T = unknown>(id: number) =>
    crmHttp.post<T>("/LeadCommon/GetLeadNote", id),
  addLeadNote: <T = unknown>(payload: S["LeadNoteCreateViewModel"]) =>
    crmHttp.post<T>("/LeadCommon/AddLeadNote", payload),
  updateLeadNote: <T = unknown>(payload: S["LeadNoteCreateViewModel"]) =>
    crmHttp.post<T>("/LeadCommon/UpdateLeadNote", payload),
  deleteLeadNote: <T = unknown>(id: number) =>
    crmHttp.post<T>("/LeadCommon/DeleteLeadNote", id),
  leadResult: <T = CrmLeadResultItem[]>(id: number) =>
    crmHttp.post<T>("/LeadCommon/LeadResult", id),
  getLeadEmail: <T = unknown>(id: number) =>
    crmHttp.post<T>("/LeadCommon/GetLeadEmail", id),
  listLeadEmail: <T = unknown>() =>
    crmHttp.post<T>("/LeadCommon/ListLeadEmail"),
  leadDetailsCount: <T = CrmLeadDetailsCount>(id: number) =>
    crmHttp.post<T>("/LeadCommon/LeadDetailsCount", id),
  listLeadHistory: <T = CrmLeadHistoryEntry[]>(payload: S["LeadChangeSearchParams"]) =>
    crmHttp.post<T>("/LeadCommon/ListLeadHistory", payload),
  updateLeadEnquiry: <T = unknown>(payload: S["UpdateEnquiryViewModel"]) =>
    crmHttp.post<T>("/LeadCommon/UpdateLeadEnquiry", payload),
  updateLeadValue: <T = unknown>(payload: S["UpdateEnquiryViewModel"]) =>
    crmHttp.post<T>("/LeadCommon/UpdateLeadValue", payload),
  updateLeadStage: <T = unknown>(payload: S["UpdateLeadSatgeVM"]) =>
    crmHttp.post<T>("/LeadCommon/UpdateLeadStage", payload),
};
