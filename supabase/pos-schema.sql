-- =====================================================
-- POS Multi-Tenant Schema
-- Separate Supabase Instance for E-commerce Customers
-- =====================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- TENANTS (E-commerce Customers)
-- =====================================================

CREATE TABLE tenants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  subdomain TEXT UNIQUE NOT NULL,
  contact_email TEXT,
  contact_phone TEXT,
  address TEXT,
  gstin TEXT,
  is_active BOOLEAN DEFAULT true,
  subscription_status TEXT DEFAULT 'trial' CHECK (subscription_status IN ('trial', 'active', 'suspended', 'cancelled')),
  subscription_plan TEXT DEFAULT 'basic' CHECK (subscription_plan IN ('basic', 'pro', 'enterprise')),
  subscription_start DATE,
  subscription_end DATE,
  settings JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_tenants_subdomain ON tenants(subdomain);
CREATE INDEX idx_tenants_active ON tenants(is_active);

-- =====================================================
-- PRODUCTS (Per Tenant Inventory)
-- =====================================================

CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  sku TEXT NOT NULL,
  barcode TEXT,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  brand TEXT,
  unit TEXT DEFAULT 'Pcs',
  cost_price DECIMAL(12, 2) DEFAULT 0,
  selling_price DECIMAL(12, 2) NOT NULL,
  mrp DECIMAL(12, 2),
  stock INTEGER DEFAULT 0,
  min_stock INTEGER DEFAULT 0,
  max_stock INTEGER,
  hsn_code TEXT,
  gst_rate DECIMAL(5, 2) DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  image_url TEXT,
  attributes JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tenant_id, sku)
);

CREATE INDEX idx_products_tenant ON products(tenant_id);
CREATE INDEX idx_products_active ON products(tenant_id, is_active);
CREATE INDEX idx_products_sku ON products(tenant_id, sku);
CREATE INDEX idx_products_barcode ON products(barcode) WHERE barcode IS NOT NULL;
CREATE INDEX idx_products_category ON products(tenant_id, category);
CREATE INDEX idx_products_stock ON products(tenant_id, stock);

-- =====================================================
-- CUSTOMERS (Per Tenant)
-- =====================================================

CREATE TABLE customers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  pincode TEXT,
  gstin TEXT,
  customer_type TEXT DEFAULT 'retail' CHECK (customer_type IN ('retail', 'wholesale', 'distributor')),
  credit_limit DECIMAL(12, 2) DEFAULT 0,
  outstanding_balance DECIMAL(12, 2) DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_customers_tenant ON customers(tenant_id);
CREATE INDEX idx_customers_phone ON customers(tenant_id, phone);
CREATE INDEX idx_customers_active ON customers(tenant_id, is_active);

-- =====================================================
-- POS TRANSACTIONS
-- =====================================================

CREATE TABLE pos_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  transaction_number TEXT NOT NULL,
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  customer_name TEXT NOT NULL,
  payment_mode TEXT NOT NULL CHECK (payment_mode IN ('cash', 'upi', 'card', 'bank_transfer')),
  subtotal DECIMAL(12, 2) NOT NULL,
  total_discount DECIMAL(12, 2) DEFAULT 0,
  taxable_amount DECIMAL(12, 2) NOT NULL,
  cgst DECIMAL(12, 2) DEFAULT 0,
  sgst DECIMAL(12, 2) DEFAULT 0,
  igst DECIMAL(12, 2) DEFAULT 0,
  total_gst DECIMAL(12, 2) DEFAULT 0,
  grand_total DECIMAL(12, 2) NOT NULL,
  amount_paid DECIMAL(12, 2) NOT NULL,
  status TEXT DEFAULT 'completed' CHECK (status IN ('completed', 'cancelled', 'refunded')),
  cashier_id UUID,
  register_id TEXT,
  notes TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  transaction_date TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tenant_id, transaction_number)
);

CREATE INDEX idx_pos_transactions_tenant ON pos_transactions(tenant_id);
CREATE INDEX idx_pos_transactions_date ON pos_transactions(tenant_id, transaction_date);
CREATE INDEX idx_pos_transactions_customer ON pos_transactions(tenant_id, customer_id);
CREATE INDEX idx_pos_transactions_payment ON pos_transactions(tenant_id, payment_mode);
CREATE INDEX idx_pos_transactions_status ON pos_transactions(tenant_id, status);

-- =====================================================
-- POS TRANSACTION ITEMS
-- =====================================================

CREATE TABLE pos_transaction_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  transaction_id UUID NOT NULL REFERENCES pos_transactions(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  product_name TEXT NOT NULL,
  product_sku TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  unit TEXT NOT NULL,
  unit_price DECIMAL(12, 2) NOT NULL,
  discount DECIMAL(12, 2) DEFAULT 0,
  gst_rate DECIMAL(5, 2) DEFAULT 0,
  total DECIMAL(12, 2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_pos_items_transaction ON pos_transaction_items(transaction_id);
CREATE INDEX idx_pos_items_product ON pos_transaction_items(product_id);

-- =====================================================
-- STOCK MOVEMENTS
-- =====================================================

CREATE TABLE stock_movements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  transaction_id UUID REFERENCES pos_transactions(id) ON DELETE SET NULL,
  movement_type TEXT NOT NULL CHECK (movement_type IN ('sale', 'purchase', 'adjustment', 'return', 'opening')),
  quantity INTEGER NOT NULL,
  stock_before INTEGER NOT NULL,
  stock_after INTEGER NOT NULL,
  reference_number TEXT,
  notes TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_stock_movements_tenant ON stock_movements(tenant_id);
CREATE INDEX idx_stock_movements_product ON stock_movements(product_id);
CREATE INDEX idx_stock_movements_date ON stock_movements(tenant_id, created_at);
CREATE INDEX idx_stock_movements_type ON stock_movements(tenant_id, movement_type);

-- =====================================================
-- USER MANAGEMENT (Per Tenant)
-- =====================================================

CREATE TABLE tenant_users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'manager', 'cashier', 'viewer')),
  is_active BOOLEAN DEFAULT true,
  permissions JSONB DEFAULT '{}'::jsonb,
  last_login TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tenant_id, email)
);

CREATE INDEX idx_tenant_users_tenant ON tenant_users(tenant_id);
CREATE INDEX idx_tenant_users_email ON tenant_users(email);

-- =====================================================
-- CATEGORIES (Per Tenant)
-- =====================================================

CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  parent_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tenant_id, name)
);

CREATE INDEX idx_categories_tenant ON categories(tenant_id);
CREATE INDEX idx_categories_parent ON categories(parent_id);

-- =====================================================
-- FUNCTIONS
-- =====================================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers to all tables with updated_at
CREATE TRIGGER update_tenants_updated_at BEFORE UPDATE ON tenants
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON customers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_pos_transactions_updated_at BEFORE UPDATE ON pos_transactions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tenant_users_updated_at BEFORE UPDATE ON tenant_users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON categories
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Update product stock after stock movement
CREATE OR REPLACE FUNCTION update_product_stock_after_movement()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE products
  SET stock = NEW.stock_after
  WHERE id = NEW.product_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_product_stock
  AFTER INSERT ON stock_movements
  FOR EACH ROW EXECUTE FUNCTION update_product_stock_after_movement();

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE pos_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE pos_transaction_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

-- Policies (Basic - will be refined based on auth setup)
-- These policies assume tenant_id will be passed via JWT claims

-- Tenants: Users can only see their own tenant
CREATE POLICY tenant_isolation_policy ON tenants
  FOR ALL USING (id = current_setting('app.current_tenant_id', true)::uuid);

-- Products: Tenant isolation
CREATE POLICY products_tenant_isolation ON products
  FOR ALL USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid);

-- Customers: Tenant isolation
CREATE POLICY customers_tenant_isolation ON customers
  FOR ALL USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid);

-- POS Transactions: Tenant isolation
CREATE POLICY pos_transactions_tenant_isolation ON pos_transactions
  FOR ALL USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid);

-- POS Transaction Items: Via transaction tenant_id
CREATE POLICY pos_items_tenant_isolation ON pos_transaction_items
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM pos_transactions
      WHERE pos_transactions.id = pos_transaction_items.transaction_id
      AND pos_transactions.tenant_id = current_setting('app.current_tenant_id', true)::uuid
    )
  );

-- Stock Movements: Tenant isolation
CREATE POLICY stock_movements_tenant_isolation ON stock_movements
  FOR ALL USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid);

-- Tenant Users: Tenant isolation
CREATE POLICY tenant_users_isolation ON tenant_users
  FOR ALL USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid);

-- Categories: Tenant isolation
CREATE POLICY categories_tenant_isolation ON categories
  FOR ALL USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid);

-- =====================================================
-- INITIAL DATA
-- =====================================================

-- Create demo tenant (remove in production)
INSERT INTO tenants (name, subdomain, contact_email, is_active, subscription_status)
VALUES ('Demo Store', 'demo', 'demo@example.com', true, 'trial');

-- =====================================================
-- VIEWS
-- =====================================================

-- Low stock products view
CREATE VIEW vw_low_stock_products AS
SELECT 
  p.*,
  t.name as tenant_name
FROM products p
JOIN tenants t ON p.tenant_id = t.id
WHERE p.stock <= p.min_stock
AND p.is_active = true;

-- Sales summary by product
CREATE VIEW vw_product_sales_summary AS
SELECT 
  pt.tenant_id,
  pti.product_id,
  p.name as product_name,
  p.sku,
  COUNT(DISTINCT pt.id) as transaction_count,
  SUM(pti.quantity) as total_quantity_sold,
  SUM(pti.total) as total_revenue,
  MAX(pt.transaction_date) as last_sold_date
FROM pos_transaction_items pti
JOIN pos_transactions pt ON pti.transaction_id = pt.id
JOIN products p ON pti.product_id = p.id
WHERE pt.status = 'completed'
GROUP BY pt.tenant_id, pti.product_id, p.name, p.sku;

-- Daily sales summary
CREATE VIEW vw_daily_sales_summary AS
SELECT 
  tenant_id,
  DATE(transaction_date) as sale_date,
  COUNT(*) as transaction_count,
  SUM(grand_total) as total_sales,
  SUM(total_gst) as total_gst,
  SUM(total_discount) as total_discount,
  AVG(grand_total) as avg_transaction_value
FROM pos_transactions
WHERE status = 'completed'
GROUP BY tenant_id, DATE(transaction_date);

-- =====================================================
-- COMMENTS
-- =====================================================

COMMENT ON TABLE tenants IS 'E-commerce customers (each gets isolated POS data)';
COMMENT ON TABLE products IS 'Product inventory per tenant';
COMMENT ON TABLE customers IS 'End customers per tenant';
COMMENT ON TABLE pos_transactions IS 'POS sales transactions';
COMMENT ON TABLE pos_transaction_items IS 'Line items for each POS transaction';
COMMENT ON TABLE stock_movements IS 'Audit trail for all stock changes';
COMMENT ON TABLE tenant_users IS 'Users per tenant with role-based access';
COMMENT ON TABLE categories IS 'Product categories per tenant';
