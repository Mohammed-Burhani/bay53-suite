// ==================== CRM Campaign API ====================
// Mirrors the "Campaign" tag of the CRM swagger. Responses are untyped upstream: pass the unwrapped `data` DTO as <T> when integrating.

import { crmHttp } from "../client";
import type { CrmSchemas as S } from "../types";

export const campaignApi = {
  list: <T = unknown>(payload: S["CampaignSearchParams"]) =>
    crmHttp.post<T>("/Campaign/List", payload),
  get: <T = unknown>(id: number) =>
    crmHttp.post<T>("/Campaign/Get", id),
  add: <T = unknown>(payload: S["CampaignCreateViewModel"]) =>
    crmHttp.post<T>("/Campaign/Add", payload),
  update: <T = unknown>(payload: S["CampaignCreateViewModel"]) =>
    crmHttp.post<T>("/Campaign/Update", payload),
  updateNote: <T = unknown>(payload: S["CampaignNoteViewModel"]) =>
    crmHttp.post<T>("/Campaign/UpdateNote", payload),
  delete: <T = unknown>(id: number) =>
    crmHttp.post<T>("/Campaign/Delete", id),
  deleteAttachment: <T = unknown>(id: number) =>
    crmHttp.post<T>("/Campaign/DeleteAttachment", id),
  uploadAttachment: <T = unknown>(form: FormData) =>
    crmHttp.upload<T>("/Campaign/UploadAttachment", form),
  attachmentList: <T = unknown>(payload: S["CampaignAttachmentSearchParams"]) =>
    crmHttp.post<T>("/Campaign/AttachmentList", payload),
  downloadAttachmentFile: (query: { filename?: string }) =>
    crmHttp.download("/Campaign/DownloadAttachmentFile", query),
  consultantNameList: <T = unknown>() =>
    crmHttp.post<T>("/Campaign/ConsultantNameList"),
  listCampaignActivity: <T = unknown>(payload: S["CampaignActivitySearchParams"]) =>
    crmHttp.post<T>("/Campaign/ListCampaignActivity", payload),
  getCampaignActivity: <T = unknown>(id: number) =>
    crmHttp.post<T>("/Campaign/GetCampaignActivity", id),
  addCampaignActivity: <T = unknown>(payload: S["CampaignActivityCreateViewModel"]) =>
    crmHttp.post<T>("/Campaign/AddCampaignActivity", payload),
  updateCampaignActivity: <T = unknown>(payload: S["CampaignActivityCreateViewModel"]) =>
    crmHttp.post<T>("/Campaign/UpdateCampaignActivity", payload),
  deleteCampaignActivity: <T = unknown>(id: number) =>
    crmHttp.post<T>("/Campaign/DeleteCampaignActivity", id),
};
