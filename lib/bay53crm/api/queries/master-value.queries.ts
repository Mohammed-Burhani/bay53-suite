"use client";

import { queryOptions, useQuery } from "@tanstack/react-query";
import { masterValueApi } from "../services/master-value.service";
import type { CrmSchemas as S } from "../types";
import { crmKeys, staleTime } from "./keys";
import { useCrmMutation } from "./mutation";

export const masterValueKeys = {
  all: crmKeys.masterValue,
  list: (params: S["MasterValueSearchParams"]) => [...crmKeys.masterValue, "list", params] as const,
  active: (params: S["MasterValueSearchParams"]) => [...crmKeys.masterValue, "active", params] as const,
  detail: (id: number) => [...crmKeys.masterValue, "detail", id] as const,
};

export const masterValueQueries = {
  /** All values of a type, including unpublished ones (the master-values admin screen). */
  list: (params: S["MasterValueSearchParams"]) =>
    queryOptions({
      queryKey: masterValueKeys.list(params),
      queryFn: () => masterValueApi.list(params),
      staleTime: staleTime.lookup,
    }),
  /** Published values of a type (dropdowns in forms). */
  active: (params: S["MasterValueSearchParams"]) =>
    queryOptions({
      queryKey: masterValueKeys.active(params),
      queryFn: () => masterValueApi.activeList(params),
      staleTime: staleTime.lookup,
    }),
  detail: (id: number) =>
    queryOptions({
      queryKey: masterValueKeys.detail(id),
      queryFn: () => masterValueApi.get(id),
      staleTime: staleTime.lookup,
    }),
};

export const useMasterValues = (params: S["MasterValueSearchParams"]) => useQuery(masterValueQueries.list(params));
export const useActiveMasterValues = (params: S["MasterValueSearchParams"]) =>
  useQuery(masterValueQueries.active(params));
export const useMasterValue = (id: number | undefined) =>
  useQuery({ ...masterValueQueries.detail(id as number), enabled: id !== undefined });

export const useAddMasterValue = () =>
  useCrmMutation((value: S["MasterValueViewModel"]) => masterValueApi.add(value), [crmKeys.masterValue]);
export const useUpdateMasterValue = () =>
  useCrmMutation((value: S["MasterValueViewModel"]) => masterValueApi.update(value), [crmKeys.masterValue]);
export const useDeleteMasterValue = () =>
  useCrmMutation((id: number) => masterValueApi.delete(id), [crmKeys.masterValue]);
