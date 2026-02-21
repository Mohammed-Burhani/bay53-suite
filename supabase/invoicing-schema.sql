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
CREATE TYPE invoice_status AS ENUM ('draft', 'paid', 'partial', 'unpaid', 'cancelled');

-- =====================================================
-- TABLES
-- =====================================================

-- Invoices
CREATE TABLE invoices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Invoice identification
    invoice_number TEXT NOT NULL,
    tax_invoice_number TEXT,
    type invoice_type NOT NULL DEFAULT 'sale',
    status invoice_status NOT NULL DEFAULT 'draft',
    
    -- Dates
    invoice_date DATE NOT NULL DEFAULT CURRENT_DATE,
    due_date DATE,
    
    -- Seller (From) details
    seller_name TEXT NOT NULL,
    seller_gstin TEXT,
    seller_address TEXT,
    seller_city TEXT,
    seller_state TEXT,
    seller_pincode TEXT,
    seller_phone TEXT,
    seller_email TEXT,
    
    -- Buyer (To) details
    buyer_name TEXT NOT NULL,
    buyer_gstin TEXT,
    buyer_address TEXT,
    buyer_city TEXT,
    buyer_state TEXT,
    buyer_pincode TEXT,
    buyer_phone TEXT,
    buyer_email TEXT,
    
    -- Financial summary
    subtotal DECIMAL(12, 2) NOT NULL DEFAULT 0,
    discount DECIMAL(12, 2) NOT NULL DEFAULT 0,
    taxable_amount DECIMAL(12, 2) NOT NULL DEFAULT 0,
    cgst DECIMAL(12, 2) NOT NULL DEFAULT 0,
    sgst DECIMAL(12, 2) NOT NULL DEFAULT 0,
    igst DECIMAL(12, 2) NOT NULL DEFAULT 0,
    total_gst DECIMAL(12, 2) NOT NULL DEFAULT 0,
    grand_total DECIMAL(12, 2) NOT NULL DEFAULT 0,
    
    -- Payment details
    amount_paid DECIMAL(12, 2) NOT NULL DEFAULT 0,
    payment_mode payment_mode,
    
    -- Additional info
    notes TEXT,
    terms_conditions TEXT,
    
    -- Column configuration for this invoice (stored with invoice)
    column_config JSONB DEFAULT '[]'::jsonb,
    
    -- Metadata
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    CONSTRAINT unique_invoice_number_per_user UNIQUE (user_id, invoice_number)
);

-- Invoice Items (max 8 items per invoice)
CREATE TABLE invoice_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
    
    -- Item order (1-8)
    item_order INTEGER NOT NULL CHECK (item_order BETWEEN 1 AND 8),
    
    -- Product/Service details
    description TEXT NOT NULL,
    hsn_sac_code TEXT,
    quantity DECIMAL(10, 3) NOT NULL DEFAULT 1,
    unit TEXT NOT NULL DEFAULT 'Pcs',
    rate DECIMAL(12, 2) NOT NULL DEFAULT 0,
    
    -- Tax details
    gst_rate DECIMAL(5, 2) NOT NULL DEFAULT 0,
    
    -- Calculated fields
    amount DECIMAL(12, 2) NOT NULL DEFAULT 0,
    
    -- Custom column data (stores values for custom columns defined in invoice.column_config)
    custom_data JSONB DEFAULT '{}'::jsonb,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    CONSTRAINT unique_item_order_per_invoice UNIQUE (invoice_id, item_order)
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

-- Invoices indexes
CREATE INDEX idx_invoices_user ON invoices(user_id);
CREATE INDEX idx_invoices_user_date ON invoices(user_id, invoice_date DESC);
CREATE INDEX idx_invoices_user_status ON invoices(user_id, status);
CREATE INDEX idx_invoices_user_type ON invoices(user_id, type);
CREATE INDEX idx_invoices_number ON invoices(user_id, invoice_number);
CREATE INDEX idx_invoices_created ON invoices(user_id, created_at DESC);
CREATE INDEX idx_invoices_column_config ON invoices USING GIN (column_config);

-- Invoice items indexes
CREATE INDEX idx_invoice_items_invoice ON invoice_items(invoice_id, item_order);
CREATE INDEX idx_invoice_items_custom_data ON invoice_items USING GIN (custom_data);

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

-- Apply updated_at trigger
CREATE TRIGGER update_invoices_updated_at 
    BEFORE UPDATE ON invoices
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_items ENABLE ROW LEVEL SECURITY;

-- Invoices policies
CREATE POLICY "Users can view their own invoices"
    ON invoices FOR SELECT
    USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own invoices"
    ON invoices FOR INSERT
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own invoices"
    ON invoices FOR UPDATE
    USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own invoices"
    ON invoices FOR DELETE
    USING (user_id = auth.uid());

-- Invoice items policies
CREATE POLICY "Users can view items of their invoices"
    ON invoice_items FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM invoices 
            WHERE invoices.id = invoice_items.invoice_id 
            AND invoices.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert items to their invoices"
    ON invoice_items FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM invoices 
            WHERE invoices.id = invoice_items.invoice_id 
            AND invoices.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update items of their invoices"
    ON invoice_items FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM invoices 
            WHERE invoices.id = invoice_items.invoice_id 
            AND invoices.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete items of their invoices"
    ON invoice_items FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM invoices 
            WHERE invoices.id = invoice_items.invoice_id 
            AND invoices.user_id = auth.uid()
        )
    );

-- =====================================================
-- VIEWS FOR REPORTING
-- =====================================================

-- Invoice summary view with item count
CREATE OR REPLACE VIEW invoice_summary AS
SELECT 
    i.*,
    COUNT(ii.id) as item_count,
    (i.grand_total - i.amount_paid) as balance_due
FROM invoices i
LEFT JOIN invoice_items ii ON ii.invoice_id = i.id
GROUP BY i.id;

-- Grant access to views
GRANT SELECT ON invoice_summary TO authenticated;

-- =====================================================
-- HELPER FUNCTIONS
-- =====================================================

-- Function to get next invoice number
CREATE OR REPLACE FUNCTION get_next_invoice_number(
    p_user_id UUID,
    p_prefix TEXT DEFAULT 'INV',
    p_year INTEGER DEFAULT EXTRACT(YEAR FROM CURRENT_DATE)::INTEGER
)
RETURNS TEXT AS $$
DECLARE
    v_last_number INTEGER;
    v_next_number TEXT;
BEGIN
    -- Get the last invoice number for this user and year
    SELECT COALESCE(
        MAX(
            CAST(
                SUBSTRING(invoice_number FROM '[0-9]+$') AS INTEGER
            )
        ), 0
    ) INTO v_last_number
    FROM invoices
    WHERE user_id = p_user_id
    AND invoice_number LIKE p_prefix || '-' || p_year || '-%';
    
    -- Generate next number
    v_next_number := p_prefix || '-' || p_year || '-' || LPAD((v_last_number + 1)::TEXT, 4, '0');
    
    RETURN v_next_number;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- COMMENTS
-- =====================================================

COMMENT ON TABLE invoices IS 'Sales, purchase, and other invoice types with GST compliance';
COMMENT ON TABLE invoice_items IS 'Line items for invoices (max 8 per invoice)';
COMMENT ON COLUMN invoices.column_config IS 'Column configuration stored with each invoice';
COMMENT ON COLUMN invoice_items.custom_data IS 'JSONB field for custom column values (weight, color, batch, etc.)';
COMMENT ON COLUMN invoice_items.item_order IS 'Item order enforces maximum 8 items per invoice (1-8)';

-- =====================================================
-- SAMPLE USAGE
-- =====================================================

/*
-- 1. Create an invoice with column configuration
INSERT INTO invoices (
    user_id, invoice_number, tax_invoice_number, type,
    seller_name, seller_gstin, seller_address, seller_city, seller_state,
    buyer_name, buyer_gstin, buyer_city, buyer_state,
    invoice_date,
    column_config
) VALUES (
    auth.uid(),
    'INV-2025-0001',
    'TAX-2025-0001',
    'sale',
    'My Business',
    '27AAAAA0000A1Z5',
    '123 Business St',
    'Mumbai',
    'Maharashtra',
    'Customer Name',
    '27BBBBB1111B1Z5',
    'Mumbai',
    'Maharashtra',
    CURRENT_DATE,
    '[
        {"id": "sno", "label": "S.No", "enabled": true},
        {"id": "description", "label": "Description", "enabled": true},
        {"id": "hsn", "label": "HSN/SAC", "enabled": true},
        {"id": "quantity", "label": "Quantity", "enabled": true},
        {"id": "rate", "label": "Rate", "enabled": true},
        {"id": "custom_weight", "label": "Weight", "enabled": true, "isCustom": true, "type": "text"},
        {"id": "amount", "label": "Amount", "enabled": true}
    ]'::jsonb
) RETURNING id;

-- 2. Add invoice items with custom data
INSERT INTO invoice_items (
    invoice_id, item_order, description, hsn_sac_code,
    quantity, unit, rate, gst_rate, amount,
    custom_data
) VALUES 
(
    'invoice-uuid-here',
    1,
    'Product Name',
    '8517',
    10,
    'Pcs',
    100.00,
    18,
    1000.00,
    '{"custom_weight": "5kg", "custom_color": "Blue"}'::jsonb
),
(
    'invoice-uuid-here',
    2,
    'Another Product',
    '8518',
    5,
    'Pcs',
    200.00,
    18,
    1000.00,
    '{"custom_weight": "3kg", "custom_batch": "B123"}'::jsonb
);

-- 3. Update invoice totals
UPDATE invoices SET
    subtotal = 2000.00,
    discount = 100.00,
    taxable_amount = 1900.00,
    cgst = 171.00,
    sgst = 171.00,
    total_gst = 342.00,
    grand_total = 2242.00,
    amount_paid = 2242.00,
    payment_mode = 'upi',
    status = 'paid'
WHERE id = 'invoice-uuid-here';

-- 4. Get invoice with items and column config
SELECT 
    i.*,
    json_agg(
        json_build_object(
            'id', ii.id,
            'item_order', ii.item_order,
            'description', ii.description,
            'hsn_sac_code', ii.hsn_sac_code,
            'quantity', ii.quantity,
            'unit', ii.unit,
            'rate', ii.rate,
            'gst_rate', ii.gst_rate,
            'amount', ii.amount,
            'custom_data', ii.custom_data
        ) ORDER BY ii.item_order
    ) as items
FROM invoices i
LEFT JOIN invoice_items ii ON ii.invoice_id = i.id
WHERE i.id = 'invoice-uuid-here'
GROUP BY i.id;

-- 5. Get next invoice number
SELECT get_next_invoice_number(auth.uid(), 'INV', 2025);
*/
