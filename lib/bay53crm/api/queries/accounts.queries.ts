"use client";

import { queryOptions, useQuery } from "@tanstack/react-query";
import { accountsApi } from "../services/accounts.service";
import type { CrmSchemas as S } from "../types";
import { crmKeys, staleTime } from "./keys";

// Login lives in ../auth.ts (crmAuth); this is the user directory used by "assigned to" filters.
export const accountsKeys = {
  all: crmKeys.accounts,
  users: (params: S["UserListRequestViewModel"]) => [...crmKeys.accounts, "users", params] as const,
  allUsers: [...crmKeys.accounts, "all-users"] as const,
};

export const accountsQueries = {
  users: (params: S["UserListRequestViewModel"]) =>
    queryOptions({
      queryKey: accountsKeys.users(params),
      queryFn: () => accountsApi.userList(params),
      staleTime: staleTime.lookup,
    }),
  allUsers: () =>
    queryOptions({
      queryKey: accountsKeys.allUsers,
      queryFn: () => accountsApi.listAllUser(),
      staleTime: staleTime.lookup,
    }),
};

export const useCrmUsers = (params: S["UserListRequestViewModel"]) => useQuery(accountsQueries.users(params));
export const useAllCrmUsers = () => useQuery(accountsQueries.allUsers());
