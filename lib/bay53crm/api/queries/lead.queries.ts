"use client";

import { queryOptions, useQuery } from "@tanstack/react-query";
import { leadApi } from "../services/lead.service";
import type { CrmSchemas as S } from "../types";
import { crmKeys, staleTime } from "./keys";
import { useCrmMutation } from "./mutation";

export const leadKeys = {
  all: crmKeys.lead,
  list: (params: S["LeadSearchParams"]) => [...crmKeys.lead, "list", params] as const,
  detail: (id: number) => [...crmKeys.lead, "detail", id] as const,
};

export const leadQueries = {
  list: (params: S["LeadSearchParams"]) =>
    queryOptions({ queryKey: leadKeys.list(params), queryFn: () => leadApi.list(params), staleTime: staleTime.list }),
  detail: (id: number) =>
    queryOptions({ queryKey: leadKeys.detail(id), queryFn: () => leadApi.get(id), staleTime: staleTime.list }),
};

export const useLeads = (params: S["LeadSearchParams"]) => useQuery(leadQueries.list(params));

export const useLead = (id: number | undefined) =>
  useQuery({ ...leadQueries.detail(id as number), enabled: id !== undefined });

// A lead change also moves the dashboard numbers, the reports and the sub-resources of that lead.
const AFFECTED = [crmKeys.lead, crmKeys.leadCommon, crmKeys.common, crmKeys.report];

export const useAddLead = () => useCrmMutation((lead: S["LeadCreateViewModel"]) => leadApi.add(lead), AFFECTED);
export const useUpdateLead = () => useCrmMutation((lead: S["LeadCreateViewModel"]) => leadApi.update(lead), AFFECTED);
export const useDeleteLead = () => useCrmMutation((id: number) => leadApi.delete(id), AFFECTED);
export const useUpdateLeadFields = () =>
  useCrmMutation((lead: S["LeadUpdateViewModel"]) => leadApi.updateLead(lead), AFFECTED);
export const useUpdateLeadTitle = () =>
  useCrmMutation((lead: S["LeadUpdateViewModel"]) => leadApi.updateLeadTitle(lead), [crmKeys.lead]);
