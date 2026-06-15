-- TEMPORARY: Disable RLS for development
-- For production, implement proper auth w/ JWT claims

-- Drop existing policies
DROP POLICY IF EXISTS tenant_isolation_policy ON tenants;
DROP POLICY IF EXISTS products_tenant_isolation ON products;
DROP POLICY IF EXISTS customers_tenant_isolation ON customers;
DROP POLICY IF EXISTS pos_transactions_tenant_isolation ON pos_transactions;
DROP POLICY IF EXISTS pos_items_tenant_isolation ON pos_transaction_items;
DROP POLICY IF EXISTS stock_movements_tenant_isolation ON stock_movements;
DROP POLICY IF EXISTS tenant_users_isolation ON tenant_users;
DROP POLICY IF EXISTS categories_tenant_isolation ON categories;

-- Create permissive policies for anon key (DEV ONLY)
CREATE POLICY "Allow all for anon" ON tenants FOR ALL USING (true);
CREATE POLICY "Allow all for anon" ON products FOR ALL USING (true);
CREATE POLICY "Allow all for anon" ON customers FOR ALL USING (true);
CREATE POLICY "Allow all for anon" ON pos_transactions FOR ALL USING (true);
CREATE POLICY "Allow all for anon" ON pos_transaction_items FOR ALL USING (true);
CREATE POLICY "Allow all for anon" ON stock_movements FOR ALL USING (true);
CREATE POLICY "Allow all for anon" ON tenant_users FOR ALL USING (true);
CREATE POLICY "Allow all for anon" ON categories FOR ALL USING (true);
