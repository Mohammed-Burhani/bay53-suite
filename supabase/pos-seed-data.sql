-- Seed data for POS multi-tenant DB
-- Run after pos-schema.sql

-- Insert demo tenant (if not exists)
INSERT INTO tenants (id, name, subdomain, contact_email, is_active, subscription_status)
VALUES ('00000000-0000-0000-0000-000000000001', 'Demo Store', 'demo', 'demo@store.com', true, 'active')
ON CONFLICT (subdomain) DO NOTHING;

-- Insert test products
INSERT INTO products (tenant_id, sku, name, category, brand, unit, cost_price, selling_price, mrp, stock, min_stock, gst_rate, hsn_code, is_active) VALUES
('00000000-0000-0000-0000-000000000001', 'ELEC001', 'Wireless Mouse', 'Electronics', 'Logitech', 'Pcs', 300, 599, 699, 50, 10, 18, '8471', true),
('00000000-0000-0000-0000-000000000001', 'ELEC002', 'USB-C Cable', 'Electronics', 'Anker', 'Pcs', 150, 299, 349, 100, 20, 18, '8544', true),
('00000000-0000-0000-0000-000000000001', 'ELEC003', 'Wireless Keyboard', 'Electronics', 'Logitech', 'Pcs', 800, 1499, 1799, 30, 5, 18, '8471', true),
('00000000-0000-0000-0000-000000000001', 'ELEC004', 'Bluetooth Speaker', 'Electronics', 'JBL', 'Pcs', 1500, 2999, 3499, 25, 5, 18, '8518', true),
('00000000-0000-0000-0000-000000000001', 'CLOTH001', 'Cotton T-Shirt', 'Clothing', 'Nike', 'Pcs', 300, 799, 999, 80, 15, 12, '6109', true),
('00000000-0000-0000-0000-000000000001', 'CLOTH002', 'Denim Jeans', 'Clothing', 'Levis', 'Pcs', 1000, 2499, 2999, 40, 10, 12, '6203', true),
('00000000-0000-0000-0000-000000000001', 'GROC001', 'Basmati Rice 5kg', 'Grocery', 'India Gate', 'Kg', 200, 399, 450, 200, 50, 5, '1006', true),
('00000000-0000-0000-0000-000000000001', 'GROC002', 'Cooking Oil 1L', 'Grocery', 'Fortune', 'L', 120, 199, 220, 150, 30, 5, '1507', true),
('00000000-0000-0000-0000-000000000001', 'GROC003', 'Sugar 1kg', 'Grocery', 'Madhur', 'Kg', 35, 55, 60, 300, 50, 5, '1701', true),
('00000000-0000-0000-0000-000000000001', 'STAT001', 'A4 Paper Ream', 'Stationery', 'JK', 'Ream', 180, 299, 350, 60, 15, 18, '4802', true);

-- Insert walk-in customer
INSERT INTO customers (tenant_id, name, phone, customer_type, is_active) VALUES
('00000000-0000-0000-0000-000000000001', 'Walk-in Customer', '0000000000', 'retail', true);
