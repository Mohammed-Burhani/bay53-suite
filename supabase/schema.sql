-- =====================================================
-- StockBuddy - Invoicing Module Only
-- Supabase Database Schema with RLS
-- =====================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- ENUMS
-- =====================================================

CREATE TYPE invoice_type AS ENUM ('sale', 'purchase', 'quotation', 'proforma');
CREATE TYPE payment_mode AS ENUM ('cash', 'upi', 'card', 'bank_transfer', 'credit', 'cheque');
CREATE TYPE invoice_status AS ENUM ('draft', 'paid', 'partiank_transfer', 'credit');
CREATE TYPE invoice_status AS ENUM ('paid', 'partial', 'unpaid');
CREATE TYPE product_unit AS ENUM ('Pcs', 'Kg', 'Gm', 'Ltr', 'Ml', 'Mtr', 'Ft', 'Box', 'Pack', 'Dozen', 'Set', 'Pair');

-- =====================================================
-- TABLES
-- =====================================================

-- Organizations (Multi-tenant support)
CREATE TABLE organizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    gstin TEXT,
    address TEXT,
    city TEXT,
    state TEXT,
    pincode TEXT,
    phone TEXT,
    email TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Users (linked to auth.users)
CREATE TABLE user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    full_name TEXT,
    role TEXT DEFAULT 'user',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Products
CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    sku TEXT NOT NULL,
    barcode TEXT,
    category TEXT NOT NULL,
    brand TEXT,
    description TEXT,
    cost_price DECIMAL(12, 2) NOT NULL DEFAULT 0,
    selling_price DECIMAL(12, 2) NOT NULL DEFAULT 0,
    mrp DECIMAL(12, 2) NOT NULL DEFAULT 0,
    gst_rate DECIMAL(5, 2) NOT NULL DEFAULT 0,
    hsn_code TEXT,
    unit product_unit NOT NULL DEFAULT 'Pcs',
    stock INTEGER NOT NULL DEFAULT 0,
    low_stock_threshold INTEGER NOT NULL DEFAULT 5,
    image_url TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_sku_per_org UNIQUE (organization_id, sku)
);

-- Create index for faster product lookups
CREATE INDEX idx_products_org_active ON products(organization_id, is_active);
CREATE INDEX idx_products_sku ON products(organization_id, sku);
CREATE INDEX idx_products_barcode ON products(barcode) WHERE barcode IS NOT NULL;
CREATE INDEX idx_products_category ON products(organization_id, category);
CREATE INDEX idx_products_low_stock ON products(organization_id) WHERE stock <= low_stock_threshold;

-- Parties (Customers & Suppliers)
CREATE TABLE parties (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    type party_type NOT NULL,
    phone TEXT NOT NULL,
    email TEXT,
    gstin TEXT,
    address TEXT,
    city TEXT,
    state TEXT,
    pincode TEXT,
    balance DECIMAL(12, 2) NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for parties
CREATE INDEX idx_parties_org_type ON parties(organization_id, type);
CREATE INDEX idx_parties_phone ON parties(organization_id, phone);
CREATE INDEX idx_parties_gstin ON parties(gstin) WHERE gstin IS NOT NULL;

-- Invoices
CREATE TABLE invoices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    invoice_number TEXT NOT NULL,
    tax_invoice_number TEXT,
    type invoice_type NOT NULL,
    party_id UUID NOT NULL REFERENCES parties(id) ON DELETE RESTRICT,
    party_name TEXT NOT NULL,
    party_gstin TEXT,
    
    -- Business details (seller)
    business_name TEXT,
    business_gstin TEXT,
    business_address TEXT,
    business_city TEXT,
    business_state TEXT,
    business_pincode TEXT,
    
    -- Financial details
    subtotal DECIMAL(12, 2) NOT NULL DEFAULT 0,
    total_discount DECIMAL(12, 2) NOT NULL DEFAULT 0,
    taxable_amount DECIMAL(12, 2) NOT NULL DEFAULT 0,
    cgst DECIMAL(12, 2) NOT NULL DEFAULT 0,
    sgst DECIMAL(12, 2) NOT NULL DEFAULT 0,
    igst DECIMAL(12, 2) NOT NULL DEFAULT 0,
    total_gst DECIMAL(12, 2) NOT NULL DEFAULT 0,
    grand_total DECIMAL(12, 2) NOT NULL DEFAULT 0,
    
    -- Payment details
    amount_paid DECIMAL(12, 2) NOT NULL DEFAULT 0,
    payment_mode payment_mode NOT NULL DEFAULT 'cash',
    status invoice_status NOT NULL DEFAULT 'unpaid',
    
    -- Additional info
    notes TEXT,
    invoice_date DATE NOT NULL DEFAULT CURRENT_DATE,
    due_date DATE,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    CONSTRAINT unique_invoice_number_per_org UNIQUE (organization_id, invoice_number)
);

-- Create indexes for invoices
CREATE INDEX idx_invoices_org_type ON invoices(organization_id, type);
CREATE INDEX idx_invoices_party ON invoices(party_id);
CREATE INDEX idx_invoices_date ON invoices(organization_id, invoice_date DESC);
CREATE INDEX idx_invoices_status ON invoices(organization_id, status);
CREATE INDEX idx_invoices_number ON invoices(organization_id, invoice_number);

-- Invoice Items (max 8 items per invoice)
CREATE TABLE invoice_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id) ON DELETE RESTRICT,
    
    -- Product details (denormalized for historical accuracy)
    product_name TEXT NOT NULL,
    hsn_code TEXT,
    quantity DECIMAL(10, 3) NOT NULL,
    unit product_unit NOT NULL,
    price DECIMAL(12, 2) NOT NULL,
    discount DECIMAL(12, 2) NOT NULL DEFAULT 0,
    gst_rate DECIMAL(5, 2) NOT NULL,
    
    -- Calculated fields
    taxable_value DECIMAL(12, 2) NOT NULL,
    gst_amount DECIMAL(12, 2) NOT NULL,
    total DECIMAL(12, 2) NOT NULL,
    
    -- Custom columns (JSONB for flexibility)
    custom_fields JSONB DEFAULT '{}'::jsonb,
    
    item_order INTEGER NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    CONSTRAINT check_max_8_items CHECK (item_order BETWEEN 1 AND 8)
);

-- Create indexes for invoice items
CREATE INDEX idx_invoice_items_invoice ON invoice_items(invoice_id, item_order);
CREATE INDEX idx_invoice_items_product ON invoice_items(product_id);
CREATE INDEX idx_invoice_items_custom_fields ON invoice_items USING GIN (custom_fields);

-- Stock Movements (Audit trail)
CREATE TABLE stock_movements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    invoice_id UUID REFERENCES invoices(id) ON DELETE SET NULL,
    movement_type TEXT NOT NULL, -- 'sale', 'purchase', 'adjustment', 'return'
    quantity INTEGER NOT NULL,
    previous_stock INTEGER NOT NULL,
    new_stock INTEGER NOT NULL,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for stock movements
CREATE INDEX idx_stock_movements_product ON stock_movements(product_id, created_at DESC);
CREATE INDEX idx_stock_movements_invoice ON stock_movements(invoice_id);
CREATE INDEX idx_stock_movements_org_date ON stock_movements(organization_id, created_at DESC);

-- =====================================================
-- FUNCTIONS & TRIGGERS
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at trigger to tables
CREATE TRIGGER update_organizations_updated_at BEFORE UPDATE ON organizations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON user_profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_parties_updated_at BEFORE UPDATE ON parties
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_invoices_updated_at BEFORE UPDATE ON invoices
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to update product stock on invoice creation
CREATE OR REPLACE FUNCTION update_product_stock_on_invoice()
RETURNS TRIGGER AS $$
DECLARE
    item RECORD;
    old_stock INTEGER;
BEGIN
    -- Loop through invoice items
    FOR item IN 
        SELECT product_id, quantity 
        FROM invoice_items 
        WHERE invoice_id = NEW.id
    LOOP
        -- Get current stock
        SELECT stock INTO old_stock FROM products WHERE id = item.product_id;
        
        -- Update stock based on invoice type
        IF NEW.type = 'sale' THEN
            UPDATE products 
            SET stock = stock - item.quantity 
            WHERE id = item.product_id;
            
            -- Record stock movement
            INSERT INTO stock_movements (
                organization_id, product_id, invoice_id, movement_type,
                quantity, previous_stock, new_stock
            ) VALUES (
                NEW.organization_id, item.product_id, NEW.id, 'sale',
                -item.quantity, old_stock, old_stock - item.quantity
            );
        ELSIF NEW.type = 'purchase' THEN
            UPDATE products 
            SET stock = stock + item.quantity 
            WHERE id = item.product_id;
            
            -- Record stock movement
            INSERT INTO stock_movements (
                organization_id, product_id, invoice_id, movement_type,
                quantity, previous_stock, new_stock
            ) VALUES (
                NEW.organization_id, item.product_id, NEW.id, 'purchase',
                item.quantity, old_stock, old_stock + item.quantity
            );
        END IF;
    END LOOP;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update stock after invoice items are inserted
CREATE TRIGGER trigger_update_stock_on_invoice
    AFTER INSERT ON invoices
    FOR EACH ROW
    EXECUTE FUNCTION update_product_stock_on_invoice();

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE parties ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_movements ENABLE ROW LEVEL SECURITY;

-- Helper function to get user's organization
CREATE OR REPLACE FUNCTION get_user_organization_id()
RETURNS UUID AS $$
    SELECT organization_id FROM user_profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER;

-- Organizations policies
CREATE POLICY "Users can view their organization"
    ON organizations FOR SELECT
    USING (id = get_user_organization_id());

CREATE POLICY "Users can update their organization"
    ON organizations FOR UPDATE
    USING (id = get_user_organization_id());

-- User profiles policies
CREATE POLICY "Users can view profiles in their organization"
    ON user_profiles FOR SELECT
    USING (organization_id = get_user_organization_id());

CREATE POLICY "Users can update their own profile"
    ON user_profiles FOR UPDATE
    USING (id = auth.uid());

-- Products policies
CREATE POLICY "Users can view products in their organization"
    ON products FOR SELECT
    USING (organization_id = get_user_organization_id());

CREATE POLICY "Users can insert products in their organization"
    ON products FOR INSERT
    WITH CHECK (organization_id = get_user_organization_id());

CREATE POLICY "Users can update products in their organization"
    ON products FOR UPDATE
    USING (organization_id = get_user_organization_id());

CREATE POLICY "Users can delete products in their organization"
    ON products FOR DELETE
    USING (organization_id = get_user_organization_id());

-- Parties policies
CREATE POLICY "Users can view parties in their organization"
    ON parties FOR SELECT
    USING (organization_id = get_user_organization_id());

CREATE POLICY "Users can insert parties in their organization"
    ON parties FOR INSERT
    WITH CHECK (organization_id = get_user_organization_id());

CREATE POLICY "Users can update parties in their organization"
    ON parties FOR UPDATE
    USING (organization_id = get_user_organization_id());

CREATE POLICY "Users can delete parties in their organization"
    ON parties FOR DELETE
    USING (organization_id = get_user_organization_id());

-- Invoices policies
CREATE POLICY "Users can view invoices in their organization"
    ON invoices FOR SELECT
    USING (organization_id = get_user_organization_id());

CREATE POLICY "Users can insert invoices in their organization"
    ON invoices FOR INSERT
    WITH CHECK (organization_id = get_user_organization_id());

CREATE POLICY "Users can update invoices in their organization"
    ON invoices FOR UPDATE
    USING (organization_id = get_user_organization_id());

CREATE POLICY "Users can delete invoices in their organization"
    ON invoices FOR DELETE
    USING (organization_id = get_user_organization_id());

-- Invoice items policies
CREATE POLICY "Users can view invoice items in their organization"
    ON invoice_items FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM invoices 
            WHERE invoices.id = invoice_items.invoice_id 
            AND invoices.organization_id = get_user_organization_id()
        )
    );

CREATE POLICY "Users can insert invoice items in their organization"
    ON invoice_items FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM invoices 
            WHERE invoices.id = invoice_items.invoice_id 
            AND invoices.organization_id = get_user_organization_id()
        )
    );

CREATE POLICY "Users can update invoice items in their organization"
    ON invoice_items FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM invoices 
            WHERE invoices.id = invoice_items.invoice_id 
            AND invoices.organization_id = get_user_organization_id()
        )
    );

CREATE POLICY "Users can delete invoice items in their organization"
    ON invoice_items FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM invoices 
            WHERE invoices.id = invoice_items.invoice_id 
            AND invoices.organization_id = get_user_organization_id()
        )
    );

-- Stock movements policies
CREATE POLICY "Users can view stock movements in their organization"
    ON stock_movements FOR SELECT
    USING (organization_id = get_user_organization_id());

CREATE POLICY "Users can insert stock movements in their organization"
    ON stock_movements FOR INSERT
    WITH CHECK (organization_id = get_user_organization_id());

-- =====================================================
-- VIEWS FOR REPORTING
-- =====================================================

-- Dashboard metrics view
CREATE OR REPLACE VIEW dashboard_metrics AS
SELECT 
    i.organization_id,
    COUNT(DISTINCT CASE WHEN i.type = 'sale' AND i.invoice_date = CURRENT_DATE THEN i.id END) as sales_today_count,
    COALESCE(SUM(CASE WHEN i.type = 'sale' AND i.invoice_date = CURRENT_DATE THEN i.grand_total END), 0) as sales_today_amount,
    COALESCE(SUM(CASE WHEN i.type = 'sale' AND DATE_TRUNC('month', i.invoice_date) = DATE_TRUNC('month', CURRENT_DATE) THEN i.grand_total END), 0) as sales_month_amount,
    COALESCE(SUM(CASE WHEN i.type = 'purchase' AND DATE_TRUNC('month', i.invoice_date) = DATE_TRUNC('month', CURRENT_DATE) THEN i.grand_total END), 0) as purchases_month_amount,
    (SELECT COUNT(*) FROM products p WHERE p.organization_id = i.organization_id AND p.is_active = true) as total_products,
    (SELECT COUNT(*) FROM products p WHERE p.organization_id = i.organization_id AND p.stock <= p.low_stock_threshold) as low_stock_count,
    (SELECT COUNT(*) FROM parties pa WHERE pa.organization_id = i.organization_id AND pa.type = 'customer') as total_customers,
    (SELECT COUNT(*) FROM parties pa WHERE pa.organization_id = i.organization_id AND pa.type = 'supplier') as total_suppliers
FROM invoices i
GROUP BY i.organization_id;

-- Grant access to views
GRANT SELECT ON dashboard_metrics TO authenticated;

-- =====================================================
-- SAMPLE DATA (Optional - for testing)
-- =====================================================

-- Insert sample organization
-- INSERT INTO organizations (name, gstin, city, state) 
-- VALUES ('Sample Business', '27AAAAA0000A1Z5', 'Mumbai', 'Maharashtra');

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

-- Composite indexes for common queries
CREATE INDEX idx_invoices_org_type_date ON invoices(organization_id, type, invoice_date DESC);
CREATE INDEX idx_products_org_stock ON products(organization_id, stock) WHERE is_active = true;
CREATE INDEX idx_parties_org_type_name ON parties(organization_id, type, name);

-- =====================================================
-- COMMENTS
-- =====================================================

COMMENT ON TABLE organizations IS 'Multi-tenant organizations/businesses';
COMMENT ON TABLE products IS 'Product catalog with stock management';
COMMENT ON TABLE parties IS 'Customers and suppliers';
COMMENT ON TABLE invoices IS 'Sales and purchase invoices with GST compliance';
COMMENT ON TABLE invoice_items IS 'Line items for invoices (max 8 per invoice)';
COMMENT ON TABLE stock_movements IS 'Audit trail for all stock changes';
COMMENT ON COLUMN invoice_items.custom_fields IS 'JSONB field for flexible custom columns';
COMMENT ON CONSTRAINT check_max_8_items ON invoice_items IS 'Enforces maximum 8 items per invoice';
