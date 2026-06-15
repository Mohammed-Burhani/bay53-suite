import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { posService, Product, CreateTransactionInput } from "@/lib/services/pos.service";
import { toast } from "sonner";

// Tenant context - get from auth or props
// Using seeded demo tenant ID
const DEMO_TENANT_ID = "00000000-0000-0000-0000-000000000001";

export function usePOSProducts(tenantId: string = DEMO_TENANT_ID) {
  return useQuery({
    queryKey: ['pos-products', tenantId],
    queryFn: () => posService.getProducts(tenantId),
    staleTime: 30000, // 30s
  });
}

export function usePOSCustomers(tenantId: string = DEMO_TENANT_ID) {
  return useQuery({
    queryKey: ['pos-customers', tenantId],
    queryFn: () => posService.getCustomers(tenantId),
    staleTime: 60000, // 1min
  });
}

export function usePOSTransactions(
  tenantId: string = DEMO_TENANT_ID,
  options?: Parameters<typeof posService.getTransactions>[1]
) {
  return useQuery({
    queryKey: ['pos-transactions', tenantId, options],
    queryFn: () => posService.getTransactions(tenantId, options),
  });
}

export function useCreatePOSTransaction(tenantId: string = DEMO_TENANT_ID) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (input: CreateTransactionInput) => posService.createTransaction(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pos-products', tenantId] });
      queryClient.invalidateQueries({ queryKey: ['pos-transactions', tenantId] });
      toast.success('Transaction completed successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to create transaction: ${error.message}`);
    },
  });
}

export function useAddProduct(tenantId: string = DEMO_TENANT_ID) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (product: Omit<Product, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await posService['client']
        .from('products')
        .insert(product)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pos-products', tenantId] });
      toast.success('Product added successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to add product: ${error.message}`);
    },
  });
}

export function useUpdateProduct(tenantId: string = DEMO_TENANT_ID) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Product> & { id: string }) => {
      const { data, error } = await posService['client']
        .from('products')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pos-products', tenantId] });
      toast.success('Product updated successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to update product: ${error.message}`);
    },
  });
}

export function useDeleteProduct(tenantId: string = DEMO_TENANT_ID) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (productId: string) => {
      const { error } = await posService['client']
        .from('products')
        .delete()
        .eq('id', productId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pos-products', tenantId] });
      toast.success('Product deleted successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete product: ${error.message}`);
    },
  });
}
