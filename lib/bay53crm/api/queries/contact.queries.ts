"use client";

import { queryOptions, useQuery } from "@tanstack/react-query";
import { contactApi } from "../services/contact.service";
import type { CrmSchemas as S } from "../types";
import { crmKeys, staleTime } from "./keys";
import { useCrmMutation } from "./mutation";

export const contactKeys = {
  all: crmKeys.contact,
  list: (params: S["ContactSearchParams"]) => [...crmKeys.contact, "list", params] as const,
  detail: (id: number) => [...crmKeys.contact, "detail", id] as const,
  companies: [...crmKeys.contact, "companies"] as const,
  emails: [...crmKeys.contact, "emails"] as const,
};

export const contactQueries = {
  list: (params: S["ContactSearchParams"]) =>
    queryOptions({
      queryKey: contactKeys.list(params),
      queryFn: () => contactApi.list(params),
      // The whole contact book comes back on every call (thousands of rows): keep it cached. Mutations invalidate it.
      staleTime: staleTime.lookup,
    }),
  detail: (id: number) =>
    queryOptions({ queryKey: contactKeys.detail(id), queryFn: () => contactApi.get(id), staleTime: staleTime.list }),
  companies: () =>
    queryOptions({ queryKey: contactKeys.companies, queryFn: () => contactApi.companyList(), staleTime: staleTime.lookup }),
  emails: () =>
    queryOptions({ queryKey: contactKeys.emails, queryFn: () => contactApi.contactEmailList(), staleTime: staleTime.lookup }),
};

export const useContacts = (params: S["ContactSearchParams"], { enabled = true }: { enabled?: boolean } = {}) =>
  useQuery({ ...contactQueries.list(params), enabled });
export const useContact = (id: number | undefined) =>
  useQuery({ ...contactQueries.detail(id as number), enabled: id !== undefined });
export const useContactCompanies = () => useQuery(contactQueries.companies());
export const useContactEmails = () => useQuery(contactQueries.emails());

// Contacts show up on leads (contact name), so lead lists refetch too.
const AFFECTED = [crmKeys.contact, crmKeys.lead];

export const useAddContact = () =>
  useCrmMutation((contact: S["ContactCreateViewModel"]) => contactApi.add(contact), AFFECTED);
export const useUpdateContact = () =>
  useCrmMutation((contact: S["ContactCreateViewModel"]) => contactApi.update(contact), AFFECTED);
export const useDeleteContact = () => useCrmMutation((id: number) => contactApi.delete(id), AFFECTED);
