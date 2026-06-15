import { getPOSClient } from "@/supabase/pos-client";

export interface Tenant {
  id: string;
  name: string;
  subdomain: string;
  contact_email?: string;
  contact_phone?: string;
  address?: string;
  gstin?: string;
  is_active: boolean;
  subscription_status: 'trial' | 'active' | 'suspended' | 'cancelled';
  subscription_plan: 'basic' | 'pro' | 'enterprise';
  subscription_start?: string;
  subscription_end?: string;
  settings?: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface Product {
  id: string;
  tenant_id: string;
  sku: string;
  barcode?: string;
  name: string;
  description?: string;
  category: string;
  brand?: string;
  unit: string;
  cost_price: number;
  selling_price: number;
  mrp?: number;
  stock: number;
  min_stock: number;
  max_stock?: number;
  hsn_code?: string;
  gst_rate: number;
  is_active: boolean;
  image_url?: string;
  attributes?: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface Customer {
  id: string;
  tenant_id: string;
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  gstin?: string;
  customer_type: 'retail' | 'wholesale' | 'distributor';
  credit_limit: number;
  outstanding_balance: number;
  is_active: boolean;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface POSTransaction {
  id: string;
  tenant_id: string;
  transaction_number: string;
  customer_id?: string;
  customer_name: string;
  payment_mode: 'cash' | 'upi' | 'card' | 'bank_transfer';
  subtotal: number;
  total_discount: number;
  taxable_amount: number;
  cgst: number;
  sgst: number;
  igst: number;
  total_gst: number;
  grand_total: number;
  amount_paid: number;
  status: 'completed' | 'cancelled' | 'refunded';
  cashier_id?: string;
  register_id?: string;
  notes?: string;
  metadata?: Record<string, unknown>;
  transaction_date: string;
  created_at: string;
  updated_at: string;
}

export interface POSTransactionItem {
  id: string;
  transaction_id: string;
  product_id: string;
  product_name: string;
  product_sku: string;
  quantity: number;
  unit: string;
  unit_price: number;
  discount: number;
  gst_rate: number;
  total: number;
  created_at: string;
}

export interface StockMovement {
  id: string;
  tenant_id: string;
  product_id: string;
  transaction_id?: string;
  movement_type: 'sale' | 'purchase' | 'adjustment' | 'return' | 'opening';
  quantity: number;
  stock_before: number;
  stock_after: number;
  reference_number?: string;
  notes?: string;
  created_by?: string;
  created_at: string;
}

export interface CreateTransactionInput {
  tenant_id: string;
  customer_id?: string;
  customer_name: string;
  payment_mode: 'cash' | 'upi' | 'card' | 'bank_transfer';
  items: {
    product_id: string;
    product_name: string;
    product_sku: string;
    quantity: number;
    unit: string;
    unit_price: number;
    discount: number;
    gst_rate: number;
    total: number;
  }[];
  subtotal: number;
  total_discount: number;
  taxable_amount: number;
  cgst: number;
  sgst: number;
  igst: number;
  total_gst: number;
  grand_total: number;
  amount_paid: number;
  cashier_id?: string;
  register_id?: string;
  notes?: string;
}

class POSService {
  public client = getPOSClient(); // Made public for hooks access

  // =====================================================
  // PRODUCTS
  // =====================================================

  async getProducts(tenantId: string): Promise<Product[]> {
    const { data, error} = await this.client
      .from('products')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('is_active', true)
      .order('name');

    if (error) throw error;
    return data || [];
  }

  async createProduct(product: Omit<Product, 'id' | 'created_at' | 'updated_at'>): Promise<Product> {
    const { data, error } = await this.client
      .from('products')
      .insert(product)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async updateProduct(productId: string, updates: Partial<Product>): Promise<Product> {
    const { data, error } = await this.client
      .from('products')
      .update(updates)
      .eq('id', productId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async deleteProduct(productId: string): Promise<void> {
    const { error } = await this.client
      .from('products')
      .delete()
      .eq('id', productId);

    if (error) throw error;
  }

  async getProductById(productId: string): Promise<Product | null> {
    const { data, error } = await this.client
      .from('products')
      .select('*')
      .eq('id', productId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }

  async searchProducts(
    tenantId: string,
    searchTerm: string
  ): Promise<Product[]> {
    const { data, error } = await this.client
      .from('products')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('is_active', true)
      .or(`name.ilike.%${searchTerm}%,sku.ilike.%${searchTerm}%,barcode.eq.${searchTerm}`)
      .order('name')
      .limit(50);

    if (error) throw error;
    return data || [];
  }

  async getLowStockProducts(tenantId: string): Promise<Product[]> {
    const { data, error } = await this.client
      .from('products')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('is_active', true)
      .filter('stock', 'lte', 'min_stock')
      .order('stock');

    if (error) throw error;
    return data || [];
  }

  // =====================================================
  // CUSTOMERS
  // =====================================================

  async getCustomers(tenantId: string): Promise<Customer[]> {
    const { data, error } = await this.client
      .from('customers')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('is_active', true)
      .order('name');

    if (error) throw error;
    return data || [];
  }

  async getCustomerById(customerId: string): Promise<Customer | null> {
    const { data, error } = await this.client
      .from('customers')
      .select('*')
      .eq('id', customerId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }

  // =====================================================
  // POS TRANSACTIONS
  // =====================================================

  async createTransaction(
    input: CreateTransactionInput
  ): Promise<POSTransaction> {
    const posClient = this.client;

    // Generate transaction number
    const transactionNumber = await this.generateTransactionNumber(
      input.tenant_id
    );

    // Start transaction
    const { data: transaction, error: txError } = await posClient
      .from('pos_transactions')
      .insert({
        tenant_id: input.tenant_id,
        transaction_number: transactionNumber,
        customer_id: input.customer_id || null,
        customer_name: input.customer_name,
        payment_mode: input.payment_mode,
        subtotal: input.subtotal,
        total_discount: input.total_discount,
        taxable_amount: input.taxable_amount,
        cgst: input.cgst,
        sgst: input.sgst,
        igst: input.igst,
        total_gst: input.total_gst,
        grand_total: input.grand_total,
        amount_paid: input.amount_paid,
        status: 'completed',
        cashier_id: input.cashier_id || null,
        register_id: input.register_id || null,
        notes: input.notes || null,
        transaction_date: new Date().toISOString(),
      })
      .select()
      .single();

    if (txError) throw txError;

    // Insert transaction items
    const itemsToInsert = input.items.map((item) => ({
      transaction_id: transaction.id,
      product_id: item.product_id,
      product_name: item.product_name,
      product_sku: item.product_sku,
      quantity: item.quantity,
      unit: item.unit,
      unit_price: item.unit_price,
      discount: item.discount,
      gst_rate: item.gst_rate,
      total: item.total,
    }));

    const { error: itemsError } = await posClient
      .from('pos_transaction_items')
      .insert(itemsToInsert);

    if (itemsError) throw itemsError;

    // Create stock movements for each item
    for (const item of input.items) {
      // Get current stock
      const { data: product } = await posClient
        .from('products')
        .select('stock')
        .eq('id', item.product_id)
        .single();

      if (product) {
        const stockBefore = product.stock;
        const stockAfter = stockBefore - item.quantity;

        // Insert stock movement
        await posClient.from('stock_movements').insert({
          tenant_id: input.tenant_id,
          product_id: item.product_id,
          transaction_id: transaction.id,
          movement_type: 'sale',
          quantity: -item.quantity,
          stock_before: stockBefore,
          stock_after: stockAfter,
          reference_number: transactionNumber,
          created_by: input.cashier_id || null,
        });
      }
    }

    return transaction;
  }

  async getTransactions(
    tenantId: string,
    options?: {
      startDate?: string;
      endDate?: string;
      customerId?: string;
      paymentMode?: string;
      status?: string;
      limit?: number;
    }
  ): Promise<POSTransaction[]> {
    let query = this.client
      .from('pos_transactions')
      .select('*')
      .eq('tenant_id', tenantId);

    if (options?.startDate) {
      query = query.gte('transaction_date', options.startDate);
    }
    if (options?.endDate) {
      query = query.lte('transaction_date', options.endDate);
    }
    if (options?.customerId) {
      query = query.eq('customer_id', options.customerId);
    }
    if (options?.paymentMode) {
      query = query.eq('payment_mode', options.paymentMode);
    }
    if (options?.status) {
      query = query.eq('status', options.status);
    }

    query = query.order('transaction_date', { ascending: false });

    if (options?.limit) {
      query = query.limit(options.limit);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data || [];
  }

  async getTransactionById(transactionId: string): Promise<{
    transaction: POSTransaction;
    items: POSTransactionItem[];
  } | null> {
    const { data: transaction, error: txError } = await this.client
      .from('pos_transactions')
      .select('*')
      .eq('id', transactionId)
      .single();

    if (txError && txError.code !== 'PGRST116') throw txError;
    if (!transaction) return null;

    const { data: items, error: itemsError } = await this.client
      .from('pos_transaction_items')
      .select('*')
      .eq('transaction_id', transactionId);

    if (itemsError) throw itemsError;

    return {
      transaction,
      items: items || [],
    };
  }

  private async generateTransactionNumber(
    tenantId: string
  ): Promise<string> {
    const today = new Date();
    const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');

    // Get today's transaction count
    const { count } = await this.client
      .from('pos_transactions')
      .select('*', { count: 'exact', head: true })
      .eq('tenant_id', tenantId)
      .gte('transaction_date', today.toISOString().slice(0, 10));

    const counter = (count || 0) + 1;
    return `POS-${dateStr}-${counter.toString().padStart(4, '0')}`;
  }

  // =====================================================
  // STOCK MOVEMENTS
  // =====================================================

  async getStockMovements(
    tenantId: string,
    productId?: string,
    options?: {
      startDate?: string;
      endDate?: string;
      movementType?: string;
      limit?: number;
    }
  ): Promise<StockMovement[]> {
    let query = this.client
      .from('stock_movements')
      .select('*')
      .eq('tenant_id', tenantId);

    if (productId) {
      query = query.eq('product_id', productId);
    }
    if (options?.startDate) {
      query = query.gte('created_at', options.startDate);
    }
    if (options?.endDate) {
      query = query.lte('created_at', options.endDate);
    }
    if (options?.movementType) {
      query = query.eq('movement_type', options.movementType);
    }

    query = query.order('created_at', { ascending: false });

    if (options?.limit) {
      query = query.limit(options.limit);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data || [];
  }

  // =====================================================
  // TENANT MANAGEMENT
  // =====================================================

  async getTenantBySubdomain(subdomain: string): Promise<Tenant | null> {
    const { data, error } = await this.client
      .from('tenants')
      .select('*')
      .eq('subdomain', subdomain)
      .eq('is_active', true)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }

  async getTenantById(tenantId: string): Promise<Tenant | null> {
    const { data, error } = await this.client
      .from('tenants')
      .select('*')
      .eq('id', tenantId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }
}

export const posService = new POSService();
