"use client";

import { queryOptions, useQuery } from "@tanstack/react-query";
import { emailSettingApi } from "../services/email-setting.service";
import type { CrmEmailSetting } from "../dto";
import type { CrmSchemas as S } from "../types";
import { crmKeys, staleTime } from "./keys";
import { useCrmMutation } from "./mutation";

export const emailSettingKeys = {
  all: crmKeys.emailSetting,
  list: [...crmKeys.emailSetting, "list"] as const,
};

export const emailSettingQueries = {
  list: () =>
    queryOptions({
      queryKey: emailSettingKeys.list,
      queryFn: () => emailSettingApi.list<CrmEmailSetting[]>({}),
      staleTime: staleTime.list,
    }),
};

export const useEmailSettings = () => useQuery(emailSettingQueries.list());

// A mailbox change decides which mail the inbox shows.
const AFFECTED = [crmKeys.emailSetting, crmKeys.email];

export const useAddEmailSetting = () =>
  useCrmMutation((setting: S["EmailSettingViewModel"]) => emailSettingApi.add(setting), AFFECTED);
export const useUpdateEmailSetting = () =>
  useCrmMutation((setting: S["EmailSettingViewModel"]) => emailSettingApi.update(setting), AFFECTED);
export const useDeleteEmailSetting = () => useCrmMutation((id: number) => emailSettingApi.delete(id), AFFECTED);
