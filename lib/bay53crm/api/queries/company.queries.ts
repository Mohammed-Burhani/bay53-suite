"use client";

import { queryOptions, useQuery } from "@tanstack/react-query";
import { companyApi } from "../services/company.service";
import type { CrmSchemas as S } from "../types";
import { crmKeys, staleTime } from "./keys";
import { useCrmMutation } from "./mutation";

export const companyKeys = {
  all: crmKeys.company,
  detail: (id: number) => [...crmKeys.company, "detail", id] as const,
};

export const companyQueries = {
  detail: (id: number) =>
    queryOptions({ queryKey: companyKeys.detail(id), queryFn: () => companyApi.get(id), staleTime: staleTime.lookup }),
};

export const useCompany = (id: number | undefined) =>
  useQuery({ ...companyQueries.detail(id as number), enabled: id !== undefined });

// The company holds the yearly revenue target, which the dashboard shows.
const AFFECTED = [crmKeys.company, crmKeys.common];

export const useAddCompany = () =>
  useCrmMutation((company: S["CompanyCreateViewModel"]) => companyApi.add(company), AFFECTED);
export const useUpdateCompany = () =>
  useCrmMutation((company: S["CompanyCreateViewModel"]) => companyApi.update(company), AFFECTED);
