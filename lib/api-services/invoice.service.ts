import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { 
  invoiceService, 
  Invoice, 
  InvoiceWithItems, 
  InvoiceItem,
  InvoiceType,
  InvoiceStatus,
  InvoiceSummary
} from '@/supabase/services/invoice-service';

// =====================================================
// QUERY KEYS - Dynamic & Readable Structure
// =====================================================

export const invoiceKeys = {
  // Base key for all invoice queries
  all: ['invoices'] as const,
  
  // Invoice lists with optional filters
  lists: {
    all: () => ['invoices', 'lists'] as const,
    byType: (type: InvoiceType) => ['invoices', 'lists', 'type', type] as const,
    byStatus: (status: InvoiceStatus) => ['invoices', 'lists', 'status', status] as const,
    filtered: (filters: {
      type?: InvoiceType;
      status?: InvoiceStatus;
      limit?: number;
      offset?: number;
      search?: string;
    }) => ['invoices', 'lists', 'filtered', filters] as const,
    byDateRange: (startDate: string, endDate: string, type?: InvoiceType) => 
      ['invoices', 'lists', 'dateRange', { startDate, endDate, type }] as const,
  },
  
  // Single invoice details
  details: {
    all: () => ['invoices', 'details'] as const,
    byId: (id: string) => ['invoices', 'details', 'id', id] as const,
    byNumber: (invoiceNumber: string) => ['invoices', 'details', 'number', invoiceNumber] as const,
  },
  
  // Invoice summaries with aggregated data
  summaries: {
    all: () => ['invoices', 'summaries'] as const,
    byType: (type: InvoiceType) => ['invoices', 'summaries', 'type', type] as const,
    byStatus: (status: InvoiceStatus) => ['invoices', 'summaries', 'status', status] as const,
    filtered: (filters: {
      type?: InvoiceType;
      status?: InvoiceStatus;
      limit?: number;
      offset?: number;
    }) => ['invoices', 'summaries', 'filtered', filters] as const,
  },
  
  // Next invoice number generation
  nextNumber: {
    generate: (prefix: string, year: number) => 
      ['invoices', 'nextNumber', { prefix, year }] as const,
  },
  
  // Financial calculations
  totals: {
    byType: (type: InvoiceType) => ['invoices', 'totals', 'type', type] as const,
    byTypeAndDateRange: (type: InvoiceType, startDate: string, endDate: string) => 
      ['invoices', 'totals', 'type', type, 'dateRange', { startDate, endDate }] as const,
  },
  
  // Outstanding balances
  outstanding: {
    byType: (type: InvoiceType) => ['invoices', 'outstanding', 'type', type] as const,
    sales: () => ['invoices', 'outstanding', 'type', 'sale'] as const,
    purchases: () => ['invoices', 'outstanding', 'type', 'purchase'] as const,
  },
};

// =====================================================
// QUERY HOOKS
// =====================================================

// Get next invoice number
export function useNextInvoiceNumber(prefix: string = 'INV', year?: number) {
  const currentYear = year || new Date().getFullYear();
  
  return useQuery({
    queryKey: invoiceKeys.nextNumber.generate(prefix, currentYear),
    queryFn: () => invoiceService.getNextInvoiceNumber(prefix, currentYear),
  });
}

// Get invoice by ID
export function useInvoice(id: string, enabled: boolean = true) {
  return useQuery({
    queryKey: invoiceKeys.details.byId(id),
    queryFn: () => invoiceService.getInvoiceById(id),
    enabled: enabled && !!id,
  });
}

// Get all invoices with optional filters
export function useInvoices(params?: {
  type?: InvoiceType;
  status?: InvoiceStatus;
  limit?: number;
  offset?: number;
  search?: string;
}) {
  return useQuery({
    queryKey: params ? invoiceKeys.lists.filtered(params) : invoiceKeys.lists.all(),
    queryFn: () => invoiceService.getInvoices(params),
  });
}

// Get invoices by type only
export function useInvoicesByType(type: InvoiceType) {
  return useQuery({
    queryKey: invoiceKeys.lists.byType(type),
    queryFn: () => invoiceService.getInvoices({ type }),
  });
}

// Get invoices by status only
export function useInvoicesByStatus(status: InvoiceStatus) {
  return useQuery({
    queryKey: invoiceKeys.lists.byStatus(status),
    queryFn: () => invoiceService.getInvoices({ status }),
  });
}

// Get invoice summaries
export function useInvoiceSummaries(params?: {
  type?: InvoiceType;
  status?: InvoiceStatus;
  limit?: number;
  offset?: number;
}) {
  return useQuery({
    queryKey: params ? invoiceKeys.summaries.filtered(params) : invoiceKeys.summaries.all(),
    queryFn: () => invoiceService.getInvoiceSummaries(params),
  });
}

// Get invoices by date range
export function useInvoicesByDateRange(
  startDate: string,
  endDate: string,
  type?: InvoiceType,
  enabled: boolean = true
) {
  return useQuery({
    queryKey: invoiceKeys.lists.byDateRange(startDate, endDate, type),
    queryFn: () => invoiceService.getInvoicesByDateRange(startDate, endDate, type),
    enabled: enabled && !!startDate && !!endDate,
  });
}

// Get totals by type
export function useInvoiceTotals(
  type: InvoiceType,
  startDate?: string,
  endDate?: string
) {
  const queryKey = startDate && endDate 
    ? invoiceKeys.totals.byTypeAndDateRange(type, startDate, endDate)
    : invoiceKeys.totals.byType(type);
    
  return useQuery({
    queryKey,
    queryFn: () => invoiceService.getTotalsByType(type, startDate, endDate),
  });
}

// Get sales totals
export function useSalesTotals(startDate?: string, endDate?: string) {
  return useInvoiceTotals('sale', startDate, endDate);
}

// Get purchase totals
export function usePurchaseTotals(startDate?: string, endDate?: string) {
  return useInvoiceTotals('purchase', startDate, endDate);
}

// Get outstanding balance
export function useOutstandingBalance(type: InvoiceType) {
  return useQuery({
    queryKey: invoiceKeys.outstanding.byType(type),
    queryFn: () => invoiceService.getOutstandingBalance(type),
  });
}

// Get sales receivables (outstanding from customers)
export function useSalesReceivables() {
  return useQuery({
    queryKey: invoiceKeys.outstanding.sales(),
    queryFn: () => invoiceService.getOutstandingBalance('sale'),
  });
}

// Get purchase payables (outstanding to suppliers)
export function usePurchasePayables() {
  return useQuery({
    queryKey: invoiceKeys.outstanding.purchases(),
    queryFn: () => invoiceService.getOutstandingBalance('purchase'),
  });
}

// =====================================================
// MUTATION HOOKS
// =====================================================

// Create invoice
export function useCreateInvoice() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ invoice, items }: { invoice: Invoice; items: InvoiceItem[] }) =>
      invoiceService.createInvoice(invoice, items),
    onSuccess: (data) => {
      // Invalidate all list queries
      queryClient.invalidateQueries({ queryKey: invoiceKeys.lists.all() });
      queryClient.invalidateQueries({ queryKey: invoiceKeys.lists.byType(data.type) });
      
      // Invalidate summaries
      queryClient.invalidateQueries({ queryKey: invoiceKeys.summaries.all() });
      queryClient.invalidateQueries({ queryKey: invoiceKeys.summaries.byType(data.type) });
      
      // Invalidate financial queries
      queryClient.invalidateQueries({ queryKey: invoiceKeys.totals.byType(data.type) });
      queryClient.invalidateQueries({ queryKey: invoiceKeys.outstanding.byType(data.type) });
      
      // Set the new invoice in cache
      queryClient.setQueryData(invoiceKeys.details.byId(data.id!), data);
    },
  });
}

// Update invoice
export function useUpdateInvoice() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<Invoice> }) =>
      invoiceService.updateInvoice(id, updates),
    onSuccess: (data, variables) => {
      // Update the invoice in cache
      queryClient.setQueryData(invoiceKeys.details.byId(variables.id), data);
      
      // Invalidate lists
      queryClient.invalidateQueries({ queryKey: invoiceKeys.lists.all() });
      queryClient.invalidateQueries({ queryKey: invoiceKeys.lists.byType(data.type) });
      if (data.status) {
        queryClient.invalidateQueries({ queryKey: invoiceKeys.lists.byStatus(data.status) });
      }
      
      // Invalidate summaries
      queryClient.invalidateQueries({ queryKey: invoiceKeys.summaries.all() });
      
      // Invalidate financial queries
      queryClient.invalidateQueries({ queryKey: invoiceKeys.totals.byType(data.type) });
      queryClient.invalidateQueries({ queryKey: invoiceKeys.outstanding.byType(data.type) });
    },
  });
}

// Update invoice with items
export function useUpdateInvoiceWithItems() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ 
      id, 
      invoice, 
      items 
    }: { 
      id: string; 
      invoice: Partial<Invoice>; 
      items: InvoiceItem[] 
    }) => invoiceService.updateInvoiceWithItems(id, invoice, items),
    onSuccess: (data, variables) => {
      // Update the invoice in cache
      queryClient.setQueryData(invoiceKeys.details.byId(variables.id), data);
      
      // Invalidate lists
      queryClient.invalidateQueries({ queryKey: invoiceKeys.lists.all() });
      queryClient.invalidateQueries({ queryKey: invoiceKeys.lists.byType(data.type) });
      
      // Invalidate summaries
      queryClient.invalidateQueries({ queryKey: invoiceKeys.summaries.all() });
      
      // Invalidate financial queries
      queryClient.invalidateQueries({ queryKey: invoiceKeys.totals.byType(data.type) });
      queryClient.invalidateQueries({ queryKey: invoiceKeys.outstanding.byType(data.type) });
    },
  });
}

// Delete invoice
export function useDeleteInvoice() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => invoiceService.deleteInvoice(id),
    onSuccess: (_, id) => {
      // Remove from cache
      queryClient.removeQueries({ queryKey: invoiceKeys.details.byId(id) });
      
      // Invalidate all lists and summaries
      queryClient.invalidateQueries({ queryKey: invoiceKeys.lists.all() });
      queryClient.invalidateQueries({ queryKey: invoiceKeys.summaries.all() });
      
      // Invalidate all financial queries
      queryClient.invalidateQueries({ queryKey: ['invoices', 'totals'] });
      queryClient.invalidateQueries({ queryKey: ['invoices', 'outstanding'] });
    },
  });
}

// =====================================================
// OPTIMISTIC UPDATE HELPERS
// =====================================================

// Update invoice status optimistically
export function useUpdateInvoiceStatus() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: InvoiceStatus }) =>
      invoiceService.updateInvoice(id, { status }),
    onMutate: async ({ id, status }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: invoiceKeys.details.byId(id) });
      
      // Snapshot previous value
      const previousInvoice = queryClient.getQueryData<InvoiceWithItems>(
        invoiceKeys.details.byId(id)
      );
      
      // Optimistically update
      if (previousInvoice) {
        queryClient.setQueryData(invoiceKeys.details.byId(id), {
          ...previousInvoice,
          status,
        });
      }
      
      return { previousInvoice };
    },
    onError: (err, variables, context) => {
      // Rollback on error
      if (context?.previousInvoice) {
        queryClient.setQueryData(
          invoiceKeys.details.byId(variables.id),
          context.previousInvoice
        );
      }
    },
    onSettled: (data, error, variables) => {
      // Refetch after mutation
      queryClient.invalidateQueries({ queryKey: invoiceKeys.details.byId(variables.id) });
      queryClient.invalidateQueries({ queryKey: invoiceKeys.lists.all() });
      queryClient.invalidateQueries({ queryKey: invoiceKeys.lists.byStatus(variables.status) });
      queryClient.invalidateQueries({ queryKey: invoiceKeys.summaries.all() });
    },
  });
}

// Update payment details
export function useUpdatePayment() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ 
      id, 
      amount_paid, 
      payment_mode,
      status 
    }: { 
      id: string; 
      amount_paid: number; 
      payment_mode?: string;
      status: InvoiceStatus;
    }) => invoiceService.updateInvoice(id, { amount_paid, payment_mode: payment_mode as any, status }),
    onSuccess: (data, variables) => {
      queryClient.setQueryData(invoiceKeys.details.byId(variables.id), data);
      queryClient.invalidateQueries({ queryKey: invoiceKeys.lists.all() });
      queryClient.invalidateQueries({ queryKey: invoiceKeys.lists.byStatus(variables.status) });
      queryClient.invalidateQueries({ queryKey: invoiceKeys.summaries.all() });
      queryClient.invalidateQueries({ queryKey: invoiceKeys.outstanding.byType(data.type) });
    },
  });
}

// =====================================================
// PREFETCH HELPERS
// =====================================================

export function usePrefetchInvoice() {
  const queryClient = useQueryClient();
  
  return (id: string) => {
    queryClient.prefetchQuery({
      queryKey: invoiceKeys.details.byId(id),
      queryFn: () => invoiceService.getInvoiceById(id),
    });
  };
}

export function usePrefetchInvoices() {
  const queryClient = useQueryClient();
  
  return (params?: Parameters<typeof invoiceService.getInvoices>[0]) => {
    const queryKey = params 
      ? invoiceKeys.lists.filtered(params)
      : invoiceKeys.lists.all();
      
    queryClient.prefetchQuery({
      queryKey,
      queryFn: () => invoiceService.getInvoices(params),
    });
  };
}

export function usePrefetchInvoicesByType() {
  const queryClient = useQueryClient();
  
  return (type: InvoiceType) => {
    queryClient.prefetchQuery({
      queryKey: invoiceKeys.lists.byType(type),
      queryFn: () => invoiceService.getInvoices({ type }),
    });
  };
}
