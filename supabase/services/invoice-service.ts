import { createClient } from "../client";

// =====================================================
// TYPES
// =====================================================

export type InvoiceType = 'sale' | 'purchase' | 'quotation' | 'proforma';
export type PaymentMode = 'cash' | 'upi' | 'card' | 'bank_transfer' | 'credit' | 'cheque';
export type InvoiceStatus = 'draft' | 'paid' | 'partial' | 'unpaid' | 'cancelled';

export interface ColumnConfig {
  id: string;
  label: string;
  enabled: boolean;
  isCustom?: boolean;
  type?: 'text' | 'number' | 'date';
}

export interface InvoiceItem {
  id?: string;
  invoice_id?: string;
  item_order: number;
  description: string;
  hsn_sac_code?: string;
  quantity: number;
  unit: string;
  rate: number;
  gst_rate: number;
  amount: number;
  custom_data?: Record<string, any>;
}

export interface Invoice {
  id?: string;
  user_id?: string;
  invoice_number: string;
  tax_invoice_number?: string;
  type: InvoiceType;
  status: InvoiceStatus;
  invoice_date: string;
  due_date?: string;
  
  // Seller details
  seller_name: string;
  seller_gstin?: string;
  seller_address?: string;
  seller_city?: string;
  seller_state?: string;
  seller_pincode?: string;
  seller_phone?: string;
  seller_email?: string;
  
  // Buyer details
  buyer_name: string;
  buyer_gstin?: string;
  buyer_address?: string;
  buyer_city?: string;
  buyer_state?: string;
  buyer_pincode?: string;
  buyer_phone?: string;
  buyer_email?: string;
  
  // Financial
  subtotal: number;
  discount: number;
  taxable_amount: number;
  cgst: number;
  sgst: number;
  igst: number;
  total_gst: number;
  grand_total: number;
  amount_paid: number;
  payment_mode?: PaymentMode;
  
  // Additional
  notes?: string;
  terms_conditions?: string;
  column_config?: ColumnConfig[];
  
  created_at?: string;
  updated_at?: string;
}

export interface InvoiceWithItems extends Invoice {
  items: InvoiceItem[];
}

export interface InvoiceSummary extends Invoice {
  item_count: number;
  balance_due: number;
}

// =====================================================
// SUPABASE SERVICE
// =====================================================

export const invoiceService = {
  // Get next invoice number
  async getNextInvoiceNumber(prefix: string = 'INV', year?: number): Promise<string> {
    const supabase = createClient();
    const currentYear = year || new Date().getFullYear();
    
    const { data, error } = await supabase.rpc('get_next_invoice_number', {
      p_user_id: (await supabase.auth.getUser()).data.user?.id,
      p_prefix: prefix,
      p_year: currentYear
    });
    
    if (error) throw error;
    return data;
  },

  // Create invoice with items
  async createInvoice(invoice: Invoice, items: InvoiceItem[]): Promise<InvoiceWithItems> {
    const supabase = createClient();
    
    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');
    
    // Insert invoice
    const { data: invoiceData, error: invoiceError } = await supabase
      .from('invoices')
      .insert({
        ...invoice,
        user_id: user.id
      })
      .select()
      .single();
    
    if (invoiceError) throw invoiceError;
    
    // Insert items
    const itemsToInsert = items.map(item => ({
      ...item,
      invoice_id: invoiceData.id
    }));
    
    const { data: itemsData, error: itemsError } = await supabase
      .from('invoice_items')
      .insert(itemsToInsert)
      .select();
    
    if (itemsError) throw itemsError;
    
    return {
      ...invoiceData,
      items: itemsData
    };
  },

  // Get invoice by ID with items
  async getInvoiceById(id: string): Promise<InvoiceWithItems | null> {
    const supabase = createClient();
    
    const { data: invoice, error: invoiceError } = await supabase
      .from('invoices')
      .select('*')
      .eq('id', id)
      .single();
    
    if (invoiceError) throw invoiceError;
    if (!invoice) return null;
    
    const { data: items, error: itemsError } = await supabase
      .from('invoice_items')
      .select('*')
      .eq('invoice_id', id)
      .order('item_order', { ascending: true });
    
    if (itemsError) throw itemsError;
    
    return {
      ...invoice,
      items: items || []
    };
  },

  // Get all invoices (with pagination)
  async getInvoices(params?: {
    type?: InvoiceType;
    status?: InvoiceStatus;
    limit?: number;
    offset?: number;
    search?: string;
  }): Promise<Invoice[]> {
    const supabase = createClient();
    
    let query = supabase
      .from('invoices')
      .select('*')
      .order('invoice_date', { ascending: false });
    
    if (params?.type) {
      query = query.eq('type', params.type);
    }
    
    if (params?.status) {
      query = query.eq('status', params.status);
    }
    
    if (params?.search) {
      query = query.or(`invoice_number.ilike.%${params.search}%,buyer_name.ilike.%${params.search}%`);
    }
    
    if (params?.limit) {
      query = query.limit(params.limit);
    }
    
    if (params?.offset) {
      query = query.range(params.offset, params.offset + (params.limit || 10) - 1);
    }
    
    const { data, error } = await query;
    
    if (error) throw error;
    return data || [];
  },

  // Get invoice summaries
  async getInvoiceSummaries(params?: {
    type?: InvoiceType;
    status?: InvoiceStatus;
    limit?: number;
    offset?: number;
  }): Promise<InvoiceSummary[]> {
    const supabase = createClient();
    
    let query = supabase
      .from('invoice_summary')
      .select('*')
      .order('invoice_date', { ascending: false });
    
    if (params?.type) {
      query = query.eq('type', params.type);
    }
    
    if (params?.status) {
      query = query.eq('status', params.status);
    }
    
    if (params?.limit) {
      query = query.limit(params.limit);
    }
    
    if (params?.offset) {
      query = query.range(params.offset, params.offset + (params.limit || 10) - 1);
    }
    
    const { data, error } = await query;
    
    if (error) throw error;
    return data || [];
  },

  // Update invoice
  async updateInvoice(id: string, updates: Partial<Invoice>): Promise<Invoice> {
    const supabase = createClient();
    
    const { data, error } = await supabase
      .from('invoices')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // Update invoice with items
  async updateInvoiceWithItems(
    id: string,
    invoice: Partial<Invoice>,
    items: InvoiceItem[]
  ): Promise<InvoiceWithItems> {
    const supabase = createClient();
    
    // Update invoice
    const { data: invoiceData, error: invoiceError } = await supabase
      .from('invoices')
      .update(invoice)
      .eq('id', id)
      .select()
      .single();
    
    if (invoiceError) throw invoiceError;
    
    // Delete existing items
    const { error: deleteError } = await supabase
      .from('invoice_items')
      .delete()
      .eq('invoice_id', id);
    
    if (deleteError) throw deleteError;
    
    // Insert new items
    const itemsToInsert = items.map(item => ({
      ...item,
      invoice_id: id
    }));
    
    const { data: itemsData, error: itemsError } = await supabase
      .from('invoice_items')
      .insert(itemsToInsert)
      .select();
    
    if (itemsError) throw itemsError;
    
    return {
      ...invoiceData,
      items: itemsData
    };
  },

  // Delete invoice
  async deleteInvoice(id: string): Promise<void> {
    const supabase = createClient();
    
    const { error } = await supabase
      .from('invoices')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  },

  // Get invoices by date range
  async getInvoicesByDateRange(startDate: string, endDate: string, type?: InvoiceType): Promise<Invoice[]> {
    const supabase = createClient();
    
    let query = supabase
      .from('invoices')
      .select('*')
      .gte('invoice_date', startDate)
      .lte('invoice_date', endDate)
      .order('invoice_date', { ascending: false });
    
    if (type) {
      query = query.eq('type', type);
    }
    
    const { data, error } = await query;
    
    if (error) throw error;
    return data || [];
  },

  // Get total sales/purchases
  async getTotalsByType(type: InvoiceType, startDate?: string, endDate?: string): Promise<number> {
    const supabase = createClient();
    
    let query = supabase
      .from('invoices')
      .select('grand_total')
      .eq('type', type)
      .neq('status', 'cancelled');
    
    if (startDate) {
      query = query.gte('invoice_date', startDate);
    }
    
    if (endDate) {
      query = query.lte('invoice_date', endDate);
    }
    
    const { data, error } = await query;
    
    if (error) throw error;
    
    return data?.reduce((sum, invoice) => sum + Number(invoice.grand_total), 0) || 0;
  },

  // Get outstanding balance
  async getOutstandingBalance(type: InvoiceType): Promise<number> {
    const supabase = createClient();
    
    const { data, error } = await supabase
      .from('invoices')
      .select('grand_total, amount_paid')
      .eq('type', type)
      .in('status', ['unpaid', 'partial']);
    
    if (error) throw error;
    
    return data?.reduce((sum, invoice) => 
      sum + (Number(invoice.grand_total) - Number(invoice.amount_paid)), 0
    ) || 0;
  }
};
