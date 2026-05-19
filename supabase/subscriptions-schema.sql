-- ==========================================
-- Subscriptions & Trial Management Schema
-- ==========================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==========================================
-- Subscription Plans
-- ==========================================
CREATE TABLE IF NOT EXISTS subscription_plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  name TEXT NOT NULL,
  description TEXT,
  price_monthly DECIMAL(10, 2) NOT NULL DEFAULT 0,
  price_yearly DECIMAL(10, 2) NOT NULL DEFAULT 0,
  trial_days INTEGER NOT NULL DEFAULT 14,
  
  -- Features
  max_users INTEGER,
  max_invoices_per_month INTEGER,
  max_storage_gb INTEGER,
  features JSONB DEFAULT '[]'::jsonb,
  
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==========================================
-- Organization Subscriptions
-- ==========================================
CREATE TABLE IF NOT EXISTS organization_subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  plan_id UUID REFERENCES subscription_plans(id),
  
  -- Status
  status TEXT NOT NULL DEFAULT 'trial' CHECK (
    status IN ('trial', 'active', 'past_due', 'cancelled', 'expired')
  ),
  
  -- Trial
  trial_start_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  trial_end_date TIMESTAMPTZ NOT NULL,
  
  -- Subscription
  subscription_start_date TIMESTAMPTZ,
  subscription_end_date TIMESTAMPTZ,
  billing_cycle TEXT CHECK (billing_cycle IN ('monthly', 'yearly')),
  
  -- Payment
  last_payment_date TIMESTAMPTZ,
  next_payment_date TIMESTAMPTZ,
  
  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  CONSTRAINT org_subscription_unique UNIQUE (organization_id)
);

-- ==========================================
-- Payment History
-- ==========================================
CREATE TABLE IF NOT EXISTS payment_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  subscription_id UUID NOT NULL REFERENCES organization_subscriptions(id) ON DELETE CASCADE,
  
  amount DECIMAL(10, 2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'INR',
  status TEXT NOT NULL CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
  
  payment_method TEXT,
  transaction_id TEXT,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==========================================
-- Indexes
-- ==========================================
CREATE INDEX IF NOT EXISTS idx_org_subscriptions_org ON organization_subscriptions(organization_id);
CREATE INDEX IF NOT EXISTS idx_org_subscriptions_status ON organization_subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_org_subscriptions_trial_end ON organization_subscriptions(trial_end_date);
CREATE INDEX IF NOT EXISTS idx_payment_history_org ON payment_history(organization_id);
CREATE INDEX IF NOT EXISTS idx_payment_history_subscription ON payment_history(subscription_id);

-- ==========================================
-- Triggers
-- ==========================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_subscription_plans_updated_at ON subscription_plans;
CREATE TRIGGER update_subscription_plans_updated_at
  BEFORE UPDATE ON subscription_plans
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_org_subscriptions_updated_at ON organization_subscriptions;
CREATE TRIGGER update_org_subscriptions_updated_at
  BEFORE UPDATE ON organization_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ==========================================
-- Helper Functions
-- ==========================================

-- Check if organization trial expired
CREATE OR REPLACE FUNCTION is_trial_expired(p_org_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_trial_end TIMESTAMPTZ;
BEGIN
  SELECT trial_end_date INTO v_trial_end
  FROM organization_subscriptions
  WHERE organization_id = p_org_id;
  
  RETURN v_trial_end < NOW();
END;
$$ LANGUAGE plpgsql;

-- Check if organization has active subscription
CREATE OR REPLACE FUNCTION has_active_subscription(p_org_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_status TEXT;
BEGIN
  SELECT status INTO v_status
  FROM organization_subscriptions
  WHERE organization_id = p_org_id;
  
  RETURN v_status IN ('trial', 'active');
END;
$$ LANGUAGE plpgsql;

-- Get days remaining in trial
CREATE OR REPLACE FUNCTION trial_days_remaining(p_org_id UUID)
RETURNS INTEGER AS $$
DECLARE
  v_trial_end TIMESTAMPTZ;
  v_days INTEGER;
BEGIN
  SELECT trial_end_date INTO v_trial_end
  FROM organization_subscriptions
  WHERE organization_id = p_org_id;
  
  v_days := EXTRACT(DAY FROM (v_trial_end - NOW()));
  
  RETURN GREATEST(v_days, 0);
END;
$$ LANGUAGE plpgsql;

-- ==========================================
-- Default Plans
-- ==========================================
INSERT INTO subscription_plans (name, description, price_monthly, price_yearly, trial_days, max_users, max_invoices_per_month, max_storage_gb, features)
VALUES 
  ('Free Trial', '14-day free trial with full features', 0, 0, 14, 5, 100, 1, '["All features", "Email support"]'::jsonb),
  ('Starter', 'Perfect for small businesses', 999, 9990, 14, 10, 500, 5, '["All features", "Email support", "Priority support"]'::jsonb),
  ('Professional', 'For growing businesses', 2999, 29990, 14, 50, 2000, 20, '["All features", "Priority support", "Phone support", "Custom reports"]'::jsonb),
  ('Enterprise', 'For large organizations', 9999, 99990, 14, NULL, NULL, 100, '["All features", "Dedicated support", "Custom integrations", "SLA"]'::jsonb)
ON CONFLICT DO NOTHING;

-- ==========================================
-- RLS (Disabled for now)
-- ==========================================
ALTER TABLE subscription_plans DISABLE ROW LEVEL SECURITY;
ALTER TABLE organization_subscriptions DISABLE ROW LEVEL SECURITY;
ALTER TABLE payment_history DISABLE ROW LEVEL SECURITY;
