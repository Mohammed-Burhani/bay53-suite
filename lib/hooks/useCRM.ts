"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  crmLeadService,
  crmFollowUpService,
  crmProjectService,
  crmMasterService,
  crmNotificationService,
  crmCompanyService,
} from "../bay53crm/crm.service";
import type {
  CRMLead,
  CRMProject,
  MasterLookupItem,
  CRMNotification,
  CRMCompanyConfig,
  LeadStage,
} from "../bay53crm/types";

// ==================== Lead Hooks ====================

export function useCRMLeads() {
  return useQuery({
    queryKey: ["crm-leads"],
    queryFn: () => crmLeadService.getAll(),
    staleTime: 30_000,
  });
}

export function useCRMLead(id: string) {
  return useQuery({
    queryKey: ["crm-lead", id],
    queryFn: () => crmLeadService.getById(id),
    enabled: !!id,
  });
}

export function useCreateCRMLead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Omit<CRMLead, "id" | "createdAt" | "updatedAt">) => crmLeadService.create(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["crm-leads"] }),
  });
}

export function useUpdateCRMLead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CRMLead> }) => crmLeadService.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["crm-leads"] });
      qc.invalidateQueries({ queryKey: ["crm-lead"] });
    },
  });
}

export function useDeleteCRMLead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => crmLeadService.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["crm-leads"] }),
  });
}

// ==================== FollowUp Hooks ====================

export function useCRMFollowUps(leadId?: string, projectId?: string) {
  return useQuery({
    queryKey: ["crm-follow-ups", leadId, projectId],
    queryFn: () => {
      if (leadId) return crmFollowUpService.getByLeadId(leadId);
      if (projectId) return crmFollowUpService.getByProjectId(projectId);
      return [];
    },
    enabled: !!(leadId || projectId),
  });
}

export function useAddCRMFollowUp() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { leadId?: string; projectId?: string; date: string; notes: string; stage?: LeadStage; createdBy: string }) =>
      crmFollowUpService.add(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["crm-follow-ups"] });
      qc.invalidateQueries({ queryKey: ["crm-leads"] });
      qc.invalidateQueries({ queryKey: ["crm-projects"] });
    },
  });
}

// ==================== Project Hooks ====================

export function useCRMProjects() {
  return useQuery({
    queryKey: ["crm-projects"],
    queryFn: () => crmProjectService.getAll(),
    staleTime: 30_000,
  });
}

export function useCRMProject(id: string) {
  return useQuery({
    queryKey: ["crm-project", id],
    queryFn: () => crmProjectService.getById(id),
    enabled: !!id,
  });
}

export function useCreateCRMProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Omit<CRMProject, "id" | "createdAt" | "updatedAt">) => crmProjectService.create(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["crm-projects"] }),
  });
}

export function useUpdateCRMProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CRMProject> }) => crmProjectService.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["crm-projects"] });
      qc.invalidateQueries({ queryKey: ["crm-project"] });
    },
  });
}

export function useDeleteCRMProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => crmProjectService.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["crm-projects"] }),
  });
}

// ==================== Master Values Hooks ====================

export function useCRMMasterValues(type?: string) {
  return useQuery({
    queryKey: ["crm-master-values", type],
    queryFn: () => crmMasterService.getAll(type),
    staleTime: 60_000,
  });
}

export function useAddCRMMasterValue() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Omit<MasterLookupItem, "id">) => crmMasterService.add(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["crm-master-values"] }),
  });
}

export function useUpdateCRMMasterValue() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<MasterLookupItem> }) => crmMasterService.update(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["crm-master-values"] }),
  });
}

export function useDeleteCRMMasterValue() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => crmMasterService.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["crm-master-values"] }),
  });
}

// ==================== Notification Hooks ====================

export function useCRMNotifications() {
  return useQuery({
    queryKey: ["crm-notifications"],
    queryFn: () => crmNotificationService.getAll(),
    staleTime: 30_000,
  });
}

export function useAddCRMNotification() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Omit<CRMNotification, "id" | "createdAt">) => crmNotificationService.add(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["crm-notifications"] }),
  });
}

export function useUpdateCRMNotification() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CRMNotification> }) => crmNotificationService.update(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["crm-notifications"] }),
  });
}

export function useDeleteCRMNotification() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => crmNotificationService.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["crm-notifications"] }),
  });
}

// ==================== Company Config Hooks ====================

export function useCRMCompanyConfig() {
  return useQuery({
    queryKey: ["crm-company-config"],
    queryFn: () => crmCompanyService.get(),
    staleTime: 60_000,
  });
}

export function useUpdateCRMCompanyConfig() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<CRMCompanyConfig>) => crmCompanyService.update(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["crm-company-config"] }),
  });
}
