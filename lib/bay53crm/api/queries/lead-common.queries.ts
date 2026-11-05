"use client";

import { queryOptions, useQuery } from "@tanstack/react-query";
import { leadCommonApi } from "../services/lead-common.service";
import type { CrmSchemas as S } from "../types";
import { crmKeys, staleTime } from "./keys";
import { useCrmMutation } from "./mutation";

// Everything under a lead: follow-ups, activities, notes, attachments, history, counts. Keyed by leadId.
type Part = "follow-ups" | "activities" | "notes" | "attachments" | "history" | "counts" | "result";

export const leadCommonKeys = {
  all: crmKeys.leadCommon,
  part: (part: Part, leadId: number) => [...crmKeys.leadCommon, part, leadId] as const,
};

export const leadCommonQueries = {
  followUps: (leadId: number) =>
    queryOptions({
      queryKey: leadCommonKeys.part("follow-ups", leadId),
      queryFn: () => leadCommonApi.listLeadFollowUp({ leadId }),
      staleTime: staleTime.list,
    }),
  activities: (leadId: number) =>
    queryOptions({
      queryKey: leadCommonKeys.part("activities", leadId),
      queryFn: () => leadCommonApi.listLeadActivity({ leadId }),
      staleTime: staleTime.list,
    }),
  notes: (leadId: number) =>
    queryOptions({
      queryKey: leadCommonKeys.part("notes", leadId),
      queryFn: () => leadCommonApi.listLeadNote({ leadId }),
      staleTime: staleTime.list,
    }),
  attachments: (leadId: number) =>
    queryOptions({
      queryKey: leadCommonKeys.part("attachments", leadId),
      queryFn: () => leadCommonApi.leadAttachmentList({ leadId }),
      staleTime: staleTime.list,
    }),
  history: (leadId: number) =>
    queryOptions({
      queryKey: leadCommonKeys.part("history", leadId),
      queryFn: () => leadCommonApi.listLeadHistory({ leadId }),
      staleTime: staleTime.list,
    }),
  counts: (leadId: number) =>
    queryOptions({
      queryKey: leadCommonKeys.part("counts", leadId),
      queryFn: () => leadCommonApi.leadDetailsCount(leadId),
      staleTime: staleTime.list,
    }),
  result: (leadId: number) =>
    queryOptions({
      queryKey: leadCommonKeys.part("result", leadId),
      queryFn: () => leadCommonApi.leadResult(leadId),
      staleTime: staleTime.list,
    }),
};

// leadId is optional so a hook can run before a lead is selected; the query stays disabled until then.
const forLead = <T extends object>(make: (leadId: number) => T, leadId: number | undefined) => ({
  ...make(leadId as number),
  enabled: leadId !== undefined,
});

export const useLeadFollowUps = (leadId?: number) => useQuery(forLead(leadCommonQueries.followUps, leadId));
export const useLeadActivities = (leadId?: number) => useQuery(forLead(leadCommonQueries.activities, leadId));
export const useLeadNotes = (leadId?: number) => useQuery(forLead(leadCommonQueries.notes, leadId));
export const useLeadAttachments = (leadId?: number) => useQuery(forLead(leadCommonQueries.attachments, leadId));
export const useLeadHistory = (leadId?: number) => useQuery(forLead(leadCommonQueries.history, leadId));
export const useLeadDetailsCount = (leadId?: number) => useQuery(forLead(leadCommonQueries.counts, leadId));
export const useLeadResult = (leadId?: number) => useQuery(forLead(leadCommonQueries.result, leadId));

const SELF = [crmKeys.leadCommon];
// Stage, value and enquiry changes alter the lead itself and the dashboard too.
const LEAD_CHANGED = [crmKeys.leadCommon, crmKeys.lead, crmKeys.common, crmKeys.report];

export const useAddLeadFollowUp = () =>
  useCrmMutation((v: S["LeadFollowUpCreateViewModel"]) => leadCommonApi.addLeadFollowUp(v), SELF);
export const useUpdateLeadFollowUp = () =>
  useCrmMutation((v: S["LeadFollowUpCreateViewModel"]) => leadCommonApi.updateLeadFollowUp(v), SELF);
export const useDeleteLeadFollowUp = () => useCrmMutation((id: number) => leadCommonApi.deleteLeadFollowUp(id), SELF);

export const useAddLeadActivity = () =>
  useCrmMutation((v: S["LeadActivityCreateViewModel"]) => leadCommonApi.addLeadActivity(v), SELF);
export const useUpdateLeadActivity = () =>
  useCrmMutation((v: S["LeadActivityCreateViewModel"]) => leadCommonApi.updateLeadActivity(v), SELF);
export const useDeleteLeadActivity = () => useCrmMutation((id: number) => leadCommonApi.deleteLeadActivity(id), SELF);

export const useAddLeadNote = () =>
  useCrmMutation((v: S["LeadNoteCreateViewModel"]) => leadCommonApi.addLeadNote(v), SELF);
export const useUpdateLeadNote = () =>
  useCrmMutation((v: S["LeadNoteCreateViewModel"]) => leadCommonApi.updateLeadNote(v), SELF);
export const useDeleteLeadNote = () => useCrmMutation((id: number) => leadCommonApi.deleteLeadNote(id), SELF);

export const useUploadLeadAttachment = () =>
  useCrmMutation((form: FormData) => leadCommonApi.uploadLeadAttachment(form), SELF);
export const useDeleteLeadAttachment = () =>
  useCrmMutation((id: number) => leadCommonApi.deleteLeadAttachment(id), SELF);

export const useUpdateLeadStage = () =>
  useCrmMutation((v: S["UpdateLeadSatgeVM"]) => leadCommonApi.updateLeadStage(v), LEAD_CHANGED);
export const useUpdateLeadValue = () =>
  useCrmMutation((v: S["UpdateEnquiryViewModel"]) => leadCommonApi.updateLeadValue(v), LEAD_CHANGED);
export const useUpdateLeadEnquiry = () =>
  useCrmMutation((v: S["UpdateEnquiryViewModel"]) => leadCommonApi.updateLeadEnquiry(v), LEAD_CHANGED);
