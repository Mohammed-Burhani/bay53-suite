import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  posService,
  Product,
  CreateTransactionInput,
  StockAdjustmentInput,
  OpeningStockInput,
} from "@/lib/services/pos.service";
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

// =====================================================
// STOCK MOVEMENTS / ADJUSTMENTS / OPENING STOCK
// =====================================================

export function useStockMovements(
  tenantId: string = DEMO_TENANT_ID,
  options?: { productId?: string; movementType?: string; limit?: number }
) {
  return useQuery({
    queryKey: ["stock-movements", tenantId, options],
    queryFn: () => posService.getStockMovementsWithProducts(tenantId, options),
    staleTime: 15000,
  });
}

/**
 * Adjustments mode — apply a signed delta to a product's stock.
 * Positive adds stock (e.g. receiving goods), negative removes it
 * (e.g. damage / shrinkage). Creates an 'adjustment' stock movement.
 */
export function useAdjustStock(tenantId: string = DEMO_TENANT_ID) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: StockAdjustmentInput) => posService.adjustStock(input),
    onSuccess: (movement) => {
      queryClient.invalidateQueries({ queryKey: ["pos-products", tenantId] });
      queryClient.invalidateQueries({ queryKey: ["stock-movements", tenantId] });
      const verb = movement.quantity >= 0 ? "added to" : "removed from";
      toast.success(
        `Stock ${verb} inventory (${movement.stock_before} → ${movement.stock_after})`
      );
    },
    onError: (error: Error) => {
      toast.error(`Failed to adjust stock: ${error.message}`);
    },
  });
}

/**
 * Open Stock mode — set a product's opening balance to an absolute value.
 * Creates an 'opening' stock movement and syncs products.stock.
 */
export function useSetOpeningStock(tenantId: string = DEMO_TENANT_ID) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: OpeningStockInput) => posService.setOpeningStock(input),
    onSuccess: (movement) => {
      queryClient.invalidateQueries({ queryKey: ["pos-products", tenantId] });
      queryClient.invalidateQueries({ queryKey: ["stock-movements", tenantId] });
      toast.success(`Opening stock set to ${movement.stock_after}`);
    },
    onError: (error: Error) => {
      toast.error(`Failed to set opening stock: ${error.message}`);
    },
  });
}
