"use client";

import { queryOptions, useQuery } from "@tanstack/react-query";
import { commonApi } from "../services/common.service";
import type { CrmSchemas as S } from "../types";
import { crmKeys, staleTime } from "./keys";

export const commonKeys = {
  all: crmKeys.common,
  financialYears: [...crmKeys.common, "financial-years"] as const,
  dashboard: (params: S["DashboardResultParams"]) => [...crmKeys.common, "dashboard", params] as const,
  pie: (params: S["PieChartSearchParams"]) => [...crmKeys.common, "pie", params] as const,
  enquiries: (params: S["EnquiryListRequestViewModel"]) => [...crmKeys.common, "enquiries", params] as const,
  quotations: (params: S["QuatationSearchParams"]) => [...crmKeys.common, "quotations", params] as const,
};

export const commonQueries = {
  financialYears: () =>
    queryOptions({
      queryKey: commonKeys.financialYears,
      queryFn: () => commonApi.fyList(),
      staleTime: staleTime.lookup,
    }),
  dashboard: (params: S["DashboardResultParams"]) =>
    queryOptions({
      queryKey: commonKeys.dashboard(params),
      queryFn: () => commonApi.dashboardResult(params),
      staleTime: staleTime.report,
    }),
  pie: (params: S["PieChartSearchParams"]) =>
    queryOptions({
      queryKey: commonKeys.pie(params),
      queryFn: () => commonApi.pieChartResult(params),
      staleTime: staleTime.report,
    }),
  enquiries: (params: S["EnquiryListRequestViewModel"]) =>
    queryOptions({
      queryKey: commonKeys.enquiries(params),
      queryFn: () => commonApi.enquiryList(params),
      staleTime: staleTime.list,
    }),
  quotations: (params: S["QuatationSearchParams"]) =>
    queryOptions({
      queryKey: commonKeys.quotations(params),
      queryFn: () => commonApi.quatationList(params),
      staleTime: staleTime.list,
    }),
};

export const useFinancialYears = () => useQuery(commonQueries.financialYears());
export const useDashboardResult = (params: S["DashboardResultParams"]) => useQuery(commonQueries.dashboard(params));
export const usePieChartResult = (params: S["PieChartSearchParams"]) => useQuery(commonQueries.pie(params));
export const useEnquiries = (params: S["EnquiryListRequestViewModel"]) => useQuery(commonQueries.enquiries(params));
export const useQuotations = (params: S["QuatationSearchParams"]) => useQuery(commonQueries.quotations(params));
