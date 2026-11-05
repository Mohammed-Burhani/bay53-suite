"use client";

import { queryOptions, useQuery } from "@tanstack/react-query";
import { reportApi } from "../services/report.service";
import type { CrmSchemas as S } from "../types";
import { crmKeys, staleTime } from "./keys";

export const reportKeys = {
  all: crmKeys.report,
  leadActivity: (params: S["LeadActivityReportViewModel"]) => [...crmKeys.report, "lead-activity", params] as const,
  leadDetails: (params: S["LeadDetailsReportViewModel"]) => [...crmKeys.report, "lead-details", params] as const,
  salesStageStatus: (params: S["SalesStageStatusReportViewModel"]) =>
    [...crmKeys.report, "sales-stage-status", params] as const,
  campaignDetails: (params: S["CampaignDetailsReportViewModel"]) =>
    [...crmKeys.report, "campaign-details", params] as const,
};

export const reportQueries = {
  leadActivity: (params: S["LeadActivityReportViewModel"]) =>
    queryOptions({
      queryKey: reportKeys.leadActivity(params),
      queryFn: () => reportApi.leadActivityReportList(params),
      staleTime: staleTime.report,
    }),
  leadDetails: (params: S["LeadDetailsReportViewModel"]) =>
    queryOptions({
      queryKey: reportKeys.leadDetails(params),
      queryFn: () => reportApi.leadDetailsReportList(params),
      staleTime: staleTime.report,
    }),
  salesStageStatus: (params: S["SalesStageStatusReportViewModel"]) =>
    queryOptions({
      queryKey: reportKeys.salesStageStatus(params),
      queryFn: () => reportApi.salesStageStatusReportList(params),
      staleTime: staleTime.report,
    }),
  campaignDetails: (params: S["CampaignDetailsReportViewModel"]) =>
    queryOptions({
      queryKey: reportKeys.campaignDetails(params),
      queryFn: () => reportApi.campaignDetailsReportList(params),
      staleTime: staleTime.report,
    }),
};

export const useLeadActivityReport = (params: S["LeadActivityReportViewModel"]) =>
  useQuery(reportQueries.leadActivity(params));
export const useLeadDetailsReport = (params: S["LeadDetailsReportViewModel"]) =>
  useQuery(reportQueries.leadDetails(params));
export const useSalesStageStatusReport = (params: S["SalesStageStatusReportViewModel"]) =>
  useQuery(reportQueries.salesStageStatus(params));
export const useCampaignDetailsReport = (params: S["CampaignDetailsReportViewModel"]) =>
  useQuery(reportQueries.campaignDetails(params));
