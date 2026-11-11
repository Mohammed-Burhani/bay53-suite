"use client";

import { queryOptions, useQuery } from "@tanstack/react-query";
import { customMessageApi } from "../services/custom-message.service";
import type { CrmCustomMessage } from "../dto";
import type { CrmSchemas as S } from "../types";
import { crmKeys, staleTime } from "./keys";
import { useCrmMutation } from "./mutation";

export const customMessageKeys = {
  all: crmKeys.customMessage,
  list: (params: S["CustomMessageSearchParams"]) => [...crmKeys.customMessage, "list", params] as const,
};

export const customMessageQueries = {
  list: (params: S["CustomMessageSearchParams"]) =>
    queryOptions({
      queryKey: customMessageKeys.list(params),
      queryFn: () => customMessageApi.list<CrmCustomMessage[]>(params),
      staleTime: staleTime.list,
    }),
};

export const useCustomMessages = (params: S["CustomMessageSearchParams"]) => useQuery(customMessageQueries.list(params));

const SELF = [crmKeys.customMessage];

export const useAddCustomMessage = () =>
  useCrmMutation((message: S["CustomMessageViewModel"]) => customMessageApi.add(message), SELF);
export const useUpdateCustomMessage = () =>
  useCrmMutation((message: S["CustomMessageViewModel"]) => customMessageApi.update(message), SELF);
export const useDeleteCustomMessage = () => useCrmMutation((id: number) => customMessageApi.delete(id), SELF);
