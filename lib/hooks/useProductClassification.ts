import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  productClassificationService,
  CreateConfigInput,
  UpdateFieldInput,
} from '@/lib/services/product-classification.service';
import { toast } from 'sonner';

// =====================================================
// CONFIGURATION HOOKS
// =====================================================

export function useClassificationConfig(organizationId: string) {
  return useQuery({
    queryKey: ['classification-config', organizationId],
    queryFn: () => productClassificationService.getConfig(organizationId),
    enabled: !!organizationId,
  });
}

export function useInitializeConfig() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateConfigInput) =>
      productClassificationService.initializeConfig(input),
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: ['classification-config', data.organization_id],
      });
      toast.success('Classification configuration initialized');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to initialize configuration');
    },
  });
}

export function useUpdateClassificationDepth() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      organizationId,
      depth,
      userId,
    }: {
      organizationId: string;
      depth: number;
      userId?: string;
    }) => productClassificationService.updateDepth(organizationId, depth, userId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['classification-config', variables.organizationId],
      });
      toast.success('Classification depth updated');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update depth');
    },
  });
}

// =====================================================
// FIELD HOOKS
// =====================================================

export function useClassificationFields(configId: string) {
  return useQuery({
    queryKey: ['classification-fields', configId],
    queryFn: () => productClassificationService.getFields(configId),
    enabled: !!configId,
  });
}

export function useUpdateClassificationField() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      configId,
      fieldId,
      updates,
      userId,
    }: {
      configId: string;
      fieldId: string;
      updates: Partial<UpdateFieldInput>;
      userId?: string;
    }) => productClassificationService.updateField(configId, fieldId, updates, userId),
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: ['classification-fields', data.config_id],
      });
      queryClient.invalidateQueries({
        queryKey: ['classification-config'],
      });
      toast.success('Field updated successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update field');
    },
  });
}

export function useAddCustomField() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      organizationId,
      fieldName,
      userId,
    }: {
      organizationId: string;
      fieldName: string;
      userId?: string;
    }) => productClassificationService.addCustomField(organizationId, fieldName, userId),
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: ['classification-fields', data.config_id],
      });
      queryClient.invalidateQueries({
        queryKey: ['classification-config'],
      });
      toast.success('Custom field added');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to add field');
    },
  });
}

export function useDeleteClassificationField() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      configId,
      fieldId,
      userId,
    }: {
      configId: string;
      fieldId: string;
      userId?: string;
    }) => productClassificationService.deleteField(configId, fieldId, userId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['classification-fields', variables.configId],
      });
      queryClient.invalidateQueries({
        queryKey: ['classification-config'],
      });
      toast.success('Field deleted successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to delete field');
    },
  });
}

export function useReorderFields() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      configId,
      fieldOrders,
      userId,
    }: {
      configId: string;
      fieldOrders: Array<{ field_id: string; display_order: number }>;
      userId?: string;
    }) => productClassificationService.reorderFields(configId, fieldOrders, userId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['classification-fields', variables.configId],
      });
      queryClient.invalidateQueries({
        queryKey: ['classification-config'],
      });
      toast.success('Fields reordered');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to reorder fields');
    },
  });
}

export function useBulkUpdateFields() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      configId,
      fields,
      userId,
    }: {
      configId: string;
      fields: Array<{
        field_id: string;
        field_name: string;
        display_order: number;
        enabled: boolean;
      }>;
      userId?: string;
    }) => productClassificationService.bulkUpdateFields(configId, fields, userId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['classification-fields', variables.configId],
      });
      queryClient.invalidateQueries({
        queryKey: ['classification-config'],
      });
      toast.success('All changes saved');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to save changes');
    },
  });
}

// =====================================================
// HELPER HOOKS
// =====================================================

export function useEnabledClassifications(organizationId: string) {
  return useQuery({
    queryKey: ['enabled-classifications', organizationId],
    queryFn: () => productClassificationService.getEnabledClassifications(organizationId),
    enabled: !!organizationId,
  });
}

// =====================================================
// AUDIT LOG HOOK
// =====================================================

export function useClassificationAuditLog(configId: string) {
  return useQuery({
    queryKey: ['classification-audit', configId],
    queryFn: () => productClassificationService.getAuditLog(configId),
    enabled: !!configId,
  });
}
