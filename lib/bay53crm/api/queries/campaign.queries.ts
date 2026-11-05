"use client";

import { queryOptions, useQuery } from "@tanstack/react-query";
import { campaignApi } from "../services/campaign.service";
import type { CrmSchemas as S } from "../types";
import { crmKeys, staleTime } from "./keys";
import { useCrmMutation } from "./mutation";

export const campaignKeys = {
  all: crmKeys.campaign,
  list: (params: S["CampaignSearchParams"]) => [...crmKeys.campaign, "list", params] as const,
  detail: (id: number) => [...crmKeys.campaign, "detail", id] as const,
  activities: (campaignId: number) => [...crmKeys.campaign, "activities", campaignId] as const,
  attachments: (campaignId: number) => [...crmKeys.campaign, "attachments", campaignId] as const,
  consultants: [...crmKeys.campaign, "consultants"] as const,
};

export const campaignQueries = {
  list: (params: S["CampaignSearchParams"]) =>
    queryOptions({
      queryKey: campaignKeys.list(params),
      queryFn: () => campaignApi.list(params),
      staleTime: staleTime.list,
    }),
  detail: (id: number) =>
    queryOptions({ queryKey: campaignKeys.detail(id), queryFn: () => campaignApi.get(id), staleTime: staleTime.list }),
  activities: (campaignId: number) =>
    queryOptions({
      queryKey: campaignKeys.activities(campaignId),
      queryFn: () => campaignApi.listCampaignActivity({ campaignId }),
      staleTime: staleTime.list,
    }),
  attachments: (campaignId: number) =>
    queryOptions({
      queryKey: campaignKeys.attachments(campaignId),
      queryFn: () => campaignApi.attachmentList({ campaignId }),
      staleTime: staleTime.list,
    }),
  consultants: () =>
    queryOptions({
      queryKey: campaignKeys.consultants,
      queryFn: () => campaignApi.consultantNameList(),
      staleTime: staleTime.lookup,
    }),
};

export const useCampaigns = (params: S["CampaignSearchParams"]) => useQuery(campaignQueries.list(params));
export const useCampaign = (id: number | undefined) =>
  useQuery({ ...campaignQueries.detail(id as number), enabled: id !== undefined });
export const useCampaignActivities = (campaignId: number | undefined) =>
  useQuery({ ...campaignQueries.activities(campaignId as number), enabled: campaignId !== undefined });
export const useCampaignAttachments = (campaignId: number | undefined) =>
  useQuery({ ...campaignQueries.attachments(campaignId as number), enabled: campaignId !== undefined });
export const useConsultantNames = () => useQuery(campaignQueries.consultants());

// Campaigns feed the campaign report.
const AFFECTED = [crmKeys.campaign, crmKeys.report];

export const useAddCampaign = () =>
  useCrmMutation((campaign: S["CampaignCreateViewModel"]) => campaignApi.add(campaign), AFFECTED);
export const useUpdateCampaign = () =>
  useCrmMutation((campaign: S["CampaignCreateViewModel"]) => campaignApi.update(campaign), AFFECTED);
export const useUpdateCampaignNote = () =>
  useCrmMutation((note: S["CampaignNoteViewModel"]) => campaignApi.updateNote(note), [crmKeys.campaign]);
export const useDeleteCampaign = () => useCrmMutation((id: number) => campaignApi.delete(id), AFFECTED);

export const useAddCampaignActivity = () =>
  useCrmMutation(
    (activity: S["CampaignActivityCreateViewModel"]) => campaignApi.addCampaignActivity(activity),
    [crmKeys.campaign]
  );
export const useUpdateCampaignActivity = () =>
  useCrmMutation(
    (activity: S["CampaignActivityCreateViewModel"]) => campaignApi.updateCampaignActivity(activity),
    [crmKeys.campaign]
  );
export const useDeleteCampaignActivity = () =>
  useCrmMutation((id: number) => campaignApi.deleteCampaignActivity(id), [crmKeys.campaign]);

export const useUploadCampaignAttachment = () =>
  useCrmMutation((form: FormData) => campaignApi.uploadAttachment(form), [crmKeys.campaign]);
export const useDeleteCampaignAttachment = () =>
  useCrmMutation((id: number) => campaignApi.deleteAttachment(id), [crmKeys.campaign]);
