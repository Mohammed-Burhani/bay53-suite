import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { certificatesService, CreateCertificateInput, Certificate, CertificateConfig, CertificateTemplate } from '@/lib/services/certificates.service';
import { toast } from 'sonner';

export function useCertificates(organizationId: string) {
  return useQuery({
    queryKey: ['certificates', organizationId],
    queryFn: () => certificatesService.getCertificates(organizationId),
    enabled: !!organizationId,
  });
}

export function useCertificatesByInvoice(organizationId: string, invoiceNumber: string) {
  return useQuery({
    queryKey: ['certificates', organizationId, 'invoice', invoiceNumber],
    queryFn: () => certificatesService.getCertificatesByInvoice(organizationId, invoiceNumber),
    enabled: !!organizationId && !!invoiceNumber,
  });
}

export function useCertificate(id: string) {
  return useQuery({
    queryKey: ['certificate', id],
    queryFn: () => certificatesService.getCertificateById(id),
    enabled: !!id,
  });
}

export function useCreateCertificate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateCertificateInput) => certificatesService.createCertificate(input),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['certificates', variables.organization_id] });
      toast.success('Certificate created successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to create certificate');
    },
  });
}

export function useUpdateCertificate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<Certificate> }) =>
      certificatesService.updateCertificate(id, updates),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['certificate', data.id] });
      queryClient.invalidateQueries({ queryKey: ['certificates'] });
      toast.success('Certificate updated successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update certificate');
    },
  });
}

export function useUpdateCertificateStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      certificateId,
      status,
      userId,
      pdfUrl,
    }: {
      certificateId: string;
      status: 'draft' | 'issued' | 'cancelled';
      userId?: string;
      pdfUrl?: string;
    }) => certificatesService.updateCertificateStatus(certificateId, status, userId, pdfUrl),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['certificates'] });
      toast.success('Certificate status updated');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update status');
    },
  });
}

export function useDeleteCertificate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => certificatesService.deleteCertificate(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['certificates'] });
      toast.success('Certificate deleted successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to delete certificate');
    },
  });
}

// Configuration hooks
export function useCertificateConfig(organizationId: string) {
  return useQuery({
    queryKey: ['certificate-config', organizationId],
    queryFn: () => certificatesService.getCertificateConfig(organizationId),
    enabled: !!organizationId,
  });
}

export function useUpsertCertificateConfig() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (config: Partial<CertificateConfig> & { organization_id: string }) =>
      certificatesService.upsertCertificateConfig(config),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['certificate-config', data.organization_id] });
      toast.success('Configuration saved successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to save configuration');
    },
  });
}

export function useGenerateCertificateNumber(organizationId: string, invoiceNumber?: string) {
  return useQuery({
    queryKey: ['certificate-number', organizationId, invoiceNumber],
    queryFn: () => certificatesService.generateCertificateNumber(organizationId, invoiceNumber),
    enabled: false, // Manual trigger
  });
}

// Template hooks
export function useCertificateTemplates(organizationId: string) {
  return useQuery({
    queryKey: ['certificate-templates', organizationId],
    queryFn: () => certificatesService.getTemplates(organizationId),
    enabled: !!organizationId,
  });
}

export function useDefaultTemplate(organizationId: string) {
  return useQuery({
    queryKey: ['certificate-template', organizationId, 'default'],
    queryFn: () => certificatesService.getDefaultTemplate(organizationId),
    enabled: !!organizationId,
  });
}

export function useCreateTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (template: Omit<CertificateTemplate, 'id' | 'created_at' | 'updated_at'>) =>
      certificatesService.createTemplate(template),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['certificate-templates', data.organization_id] });
      toast.success('Template created successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to create template');
    },
  });
}

export function useUpdateTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<CertificateTemplate> }) =>
      certificatesService.updateTemplate(id, updates),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['certificate-templates', data.organization_id] });
      toast.success('Template updated successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update template');
    },
  });
}

export function useDeleteTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => certificatesService.deleteTemplate(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['certificate-templates'] });
      toast.success('Template deleted successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to delete template');
    },
  });
}

// Audit log hook
export function useCertificateAuditLog(certificateId: string) {
  return useQuery({
    queryKey: ['certificate-audit', certificateId],
    queryFn: () => certificatesService.getAuditLog(certificateId),
    enabled: !!certificateId,
  });
}
