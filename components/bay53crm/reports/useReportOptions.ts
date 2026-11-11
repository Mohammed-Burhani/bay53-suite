"use client";

import { useMemo } from "react";
import { useAllCrmUsers, useLeads } from "@/lib/bay53crm/api/queries";
import type { CrmLeadListItem, CrmUserRef } from "@/lib/bay53crm/api";
import { distinct } from "@/lib/bay53crm/leads";

export interface SelectOption {
  label: string;
  value: string;
}

const NO_LEADS: CrmLeadListItem[] = [];
const NO_USERS: CrmUserRef[] = [];

const asOption = (value: string): SelectOption => ({ label: value, value });

/**
 * Choices for the report criteria. The API has no region or state lookup, so they come from the leads themselves
 * (the same lead list the leads screen already caches); users come from the user directory.
 */
export function useReportOptions() {
  const { data: leads = NO_LEADS } = useLeads({ isArchive: false });
  const { data: users = NO_USERS } = useAllCrmUsers();

  return useMemo(
    () => ({
      regions: distinct(leads.map((l) => l.companyRegion)).map(asOption),
      states: distinct(leads.map((l) => l.customerState)).map(asOption),
      users: users.map((u): SelectOption => ({ label: u.fullName, value: u.userName })),
    }),
    [leads, users]
  );
}
