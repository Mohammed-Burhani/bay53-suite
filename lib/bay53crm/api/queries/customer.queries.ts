"use client";

import { queryOptions, useQuery } from "@tanstack/react-query";
import { customerApi } from "../services/customer.service";
import type { CrmSchemas as S } from "../types";
import { crmKeys, staleTime } from "./keys";

export const customerKeys = {
  all: crmKeys.customer,
  list: (params: S["CustomerSearchParams"]) => [...crmKeys.customer, "list", params] as const,
};

export const customerQueries = {
  list: (params: S["CustomerSearchParams"]) =>
    queryOptions({
      queryKey: customerKeys.list(params),
      queryFn: () => customerApi.list(params),
      // Every customer comes back on every call: keep it cached.
      staleTime: staleTime.lookup,
    }),
};

// Customer has no write endpoint; the list is read-only.
export const useCustomers = (params: S["CustomerSearchParams"]) => useQuery(customerQueries.list(params));
