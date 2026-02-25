import { createClient } from "../client";

// =====================================================
// TYPES
// =====================================================

export type InvoiceType = 'sale' | 'purchase' | 'quotation' | 'proforma';
export type PaymentMode = 'cash' | 'upi' | 'card' | 'bank_transfer' | 'credit' | 'cheque';
export type InvoiceStatus = 'draft' | 'paid' | 'partial' | 'unpaid' | 'cancelled';
export type InvoiceProcessingStatus = 'pending' | 'ready' | 'tax-invoice';

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
  weight?: number;
  custom_data?: Record<string, any>;
}

export interface Invoice {
  id?: string;
  user_id?: string;
  invoice_number: string;
  tax_invoice_number?: string;
  type: InvoiceType;
  status: InvoiceStatus;
  invoice_status?: InvoiceProcessingStatus;
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
  amount_paid?: number;
  payment_mode?: PaymentMode;
  
  // Additional
  notes?: string;
  terms_conditions?: string;
  column_config?: ColumnConfig[];
  parent_invoice_ids?: string[];
  
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
  },

  // Get pending invoices (for tax invoice generation)
  async getPendingInvoices(): Promise<InvoiceWithItems[]> {
    const supabase = createClient();
    
    const { data: invoices, error: invoicesError } = await supabase
      .from('invoices')
      .select('*')
      .eq('invoice_status', 'pending')
      .eq('type', 'sale')
      .order('invoice_date', { ascending: true });
    
    if (invoicesError) throw invoicesError;
    if (!invoices || invoices.length === 0) return [];
    
    // Get items for all invoices
    const invoiceIds = invoices.map(inv => inv.id);
    const { data: items, error: itemsError } = await supabase
      .from('invoice_items')
      .select('*')
      .in('invoice_id', invoiceIds)
      .order('item_order', { ascending: true });
    
    if (itemsError) throw itemsError;
    
    // Group items by invoice
    const itemsByInvoice = (items || []).reduce((acc, item) => {
      if (!acc[item.invoice_id]) acc[item.invoice_id] = [];
      acc[item.invoice_id].push(item);
      return acc;
    }, {} as Record<string, InvoiceItem[]>);
    
    return invoices.map(invoice => ({
      ...invoice,
      items: itemsByInvoice[invoice.id] || []
    }));
  },

  // Generate tax invoices (consolidate pending invoices by buyer)
  async generateTaxInvoices(): Promise<InvoiceWithItems[]> {
    const supabase = createClient();
    
    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');
    
    // Get all pending invoices
    const pendingInvoices = await this.getPendingInvoices();
    
    if (pendingInvoices.length === 0) {
      throw new Error('No pending invoices found');
    }
    
    // Group by seller_name (the "From" field - the company sending packages)
    // This consolidates all invoices from the same sender
    const invoicesBySeller = pendingInvoices.reduce((acc, invoice) => {
      // Normalize the seller name: trim whitespace and convert to lowercase for grouping
      const sellerKey = invoice.seller_name.trim().toLowerCase();
      if (!acc[sellerKey]) {
        acc[sellerKey] = [];
      }
      acc[sellerKey].push(invoice);
      return acc;
    }, {} as Record<string, InvoiceWithItems[]>);
    
    console.log('Grouping invoices by seller (From):', Object.keys(invoicesBySeller));
    console.log('Number of groups:', Object.keys(invoicesBySeller).length);
    Object.entries(invoicesBySeller).forEach(([key, invoices]) => {
      console.log(`Seller "${key}": ${invoices.length} invoice(s)`);
    });
    
    const taxInvoices: InvoiceWithItems[] = [];
    
    // Create tax invoice for each seller (From)
    for (const [sellerKey, sellerInvoices] of Object.entries(invoicesBySeller)) {
      const firstInvoice = sellerInvoices[0];
      
      // Get next tax invoice number
      const taxInvoiceNumber = await this.getNextInvoiceNumber('TAX', new Date().getFullYear());
      
      // Calculate totals
      let subtotal = 0;
      let totalGst = 0;
      let grandTotal = 0;
      
      // Create consolidated items (one item per original invoice)
      const consolidatedItems: InvoiceItem[] = sellerInvoices.map((invoice, index) => {
        subtotal += Number(invoice.subtotal);
        totalGst += Number(invoice.total_gst);
        grandTotal += Number(invoice.grand_total);
        
        // Calculate total weight for this invoice
        const totalWeight = invoice.items.reduce((sum, item) => sum + (Number(item.weight) || 0), 0);
        
        return {
          item_order: index + 1,
          description: `Invoice ${invoice.invoice_number} - ${invoice.invoice_date}`,
          hsn_sac_code: '996511', // HSN for courier services
          quantity: invoice.items.length,
          unit: 'Nos',
          rate: Number(invoice.subtotal),
          gst_rate: invoice.items[0]?.gst_rate || 18,
          amount: Number(invoice.subtotal),
          weight: totalWeight,
          custom_data: {
            original_invoice_id: invoice.id,
            original_invoice_number: invoice.invoice_number,
            original_invoice_date: invoice.invoice_date,
            from: invoice.seller_name,
            to: invoice.buyer_name
          }
        };
      });
      
      // Determine if intra-state or inter-state
      const isIntraState = firstInvoice.seller_state === firstInvoice.buyer_state;
      const cgst = isIntraState ? totalGst / 2 : 0;
      const sgst = isIntraState ? totalGst / 2 : 0;
      const igst = isIntraState ? 0 : totalGst;
      
      // Create tax invoice
      const taxInvoice: Invoice = {
        user_id: user.id,
        invoice_number: taxInvoiceNumber,
        tax_invoice_number: taxInvoiceNumber,
        type: 'sale',
        status: 'unpaid',
        invoice_status: 'tax-invoice',
        invoice_date: new Date().toISOString().split('T')[0],
        
        // Seller (courier company - from first invoice)
        seller_name: firstInvoice.seller_name,
        seller_gstin: firstInvoice.seller_gstin,
        seller_address: firstInvoice.seller_address,
        seller_city: firstInvoice.seller_city,
        seller_state: firstInvoice.seller_state,
        seller_pincode: firstInvoice.seller_pincode,
        seller_phone: firstInvoice.seller_phone,
        seller_email: firstInvoice.seller_email,
        
        // Buyer (company that used courier services)
        buyer_name: firstInvoice.buyer_name,
        buyer_gstin: firstInvoice.buyer_gstin,
        buyer_address: firstInvoice.buyer_address,
        buyer_city: firstInvoice.buyer_city,
        buyer_state: firstInvoice.buyer_state,
        buyer_pincode: firstInvoice.buyer_pincode,
        buyer_phone: firstInvoice.buyer_phone,
        buyer_email: firstInvoice.buyer_email,
        
        // Financials
        subtotal,
        discount: 0,
        taxable_amount: subtotal,
        cgst,
        sgst,
        igst,
        total_gst: totalGst,
        grand_total: grandTotal,
        amount_paid: 0,
        payment_mode: undefined,
        
        // Track parent invoices
        parent_invoice_ids: sellerInvoices.map(inv => inv.id!),
        
        notes: `Consolidated tax invoice for ${sellerInvoices.length} courier deliveries`,
        terms_conditions: 'Payment due within 30 days'
      };
      
      // Create the tax invoice
      const createdTaxInvoice = await this.createInvoice(taxInvoice, consolidatedItems);
      taxInvoices.push(createdTaxInvoice);
      
      // Update original invoices to 'ready' status
      const invoiceIds = sellerInvoices.map(inv => inv.id!);
      const { error: updateError } = await supabase
        .from('invoices')
        .update({ invoice_status: 'ready' })
        .in('id', invoiceIds);
      
      if (updateError) throw updateError;
    }
    
    return taxInvoices;
  },

  // Generate tax invoice for a specific seller
  async generateTaxInvoiceForSeller(sellerName: string): Promise<InvoiceWithItems> {
    const supabase = createClient();
    
    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');
    
    // Get all pending invoices for this seller
    const allPendingInvoices = await this.getPendingInvoices();
    const sellerKey = sellerName.trim().toLowerCase();
    const sellerInvoices = allPendingInvoices.filter(
      inv => inv.seller_name.trim().toLowerCase() === sellerKey
    );
    
    if (sellerInvoices.length === 0) {
      throw new Error(`No pending invoices found for seller: ${sellerName}`);
    }
    
    const firstInvoice = sellerInvoices[0];
    
    // Get next tax invoice number
    const taxInvoiceNumber = await this.getNextInvoiceNumber('TAX', new Date().getFullYear());
    
    // Calculate totals
    let subtotal = 0;
    let totalGst = 0;
    let grandTotal = 0;
    
    // Create consolidated items (one item per original invoice)
    const consolidatedItems: InvoiceItem[] = sellerInvoices.map((invoice, index) => {
      subtotal += Number(invoice.subtotal);
      totalGst += Number(invoice.total_gst);
      grandTotal += Number(invoice.grand_total);
      
      // Calculate total weight for this invoice
      const totalWeight = invoice.items.reduce((sum, item) => sum + (Number(item.weight) || 0), 0);
      
      return {
        item_order: index + 1,
        description: `Invoice ${invoice.invoice_number} - ${invoice.invoice_date}`,
        hsn_sac_code: '996511', // HSN for courier services
        quantity: invoice.items.length,
        unit: 'Nos',
        rate: Number(invoice.subtotal),
        gst_rate: invoice.items[0]?.gst_rate || 18,
        amount: Number(invoice.subtotal),
        weight: totalWeight,
        custom_data: {
          original_invoice_id: invoice.id,
          original_invoice_number: invoice.invoice_number,
          original_invoice_date: invoice.invoice_date,
          from: invoice.seller_name,
          to: invoice.buyer_name
        }
      };
    });
    
    // Determine if intra-state or inter-state
    const isIntraState = firstInvoice.seller_state === firstInvoice.buyer_state;
    const cgst = isIntraState ? totalGst / 2 : 0;
    const sgst = isIntraState ? totalGst / 2 : 0;
    const igst = isIntraState ? 0 : totalGst;
    
    // Create tax invoice
    const taxInvoice: Invoice = {
      user_id: user.id,
      invoice_number: taxInvoiceNumber,
      tax_invoice_number: taxInvoiceNumber,
      type: 'sale',
      status: 'unpaid',
      invoice_status: 'tax-invoice',
      invoice_date: new Date().toISOString().split('T')[0],
      
      // Seller (courier company - from first invoice)
      seller_name: firstInvoice.seller_name,
      seller_gstin: firstInvoice.seller_gstin,
      seller_address: firstInvoice.seller_address,
      seller_city: firstInvoice.seller_city,
      seller_state: firstInvoice.seller_state,
      seller_pincode: firstInvoice.seller_pincode,
      seller_phone: firstInvoice.seller_phone,
      seller_email: firstInvoice.seller_email,
      
      // Buyer (company that used courier services)
      buyer_name: firstInvoice.buyer_name,
      buyer_gstin: firstInvoice.buyer_gstin,
      buyer_address: firstInvoice.buyer_address,
      buyer_city: firstInvoice.buyer_city,
      buyer_state: firstInvoice.buyer_state,
      buyer_pincode: firstInvoice.buyer_pincode,
      buyer_phone: firstInvoice.buyer_phone,
      buyer_email: firstInvoice.buyer_email,
      
      // Financials
      subtotal,
      discount: 0,
      taxable_amount: subtotal,
      cgst,
      sgst,
      igst,
      total_gst: totalGst,
      grand_total: grandTotal,
      amount_paid: 0,
      payment_mode: undefined,
      
      // Track parent invoices
      parent_invoice_ids: sellerInvoices.map(inv => inv.id!),
      
      notes: `Consolidated tax invoice for ${sellerInvoices.length} courier deliveries`,
      terms_conditions: 'Payment due within 30 days'
    };
    
    // Create the tax invoice
    const createdTaxInvoice = await this.createInvoice(taxInvoice, consolidatedItems);
    
    // Update original invoices to 'ready' status
    const invoiceIds = sellerInvoices.map(inv => inv.id!);
    const { error: updateError } = await supabase
      .from('invoices')
      .update({ invoice_status: 'ready' })
      .in('id', invoiceIds);
    
    if (updateError) throw updateError;
    
    return createdTaxInvoice;
  }
};
