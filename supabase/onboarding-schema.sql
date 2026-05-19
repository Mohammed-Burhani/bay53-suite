-- ==========================================
-- User Registration & Company Onboarding Schema
-- ==========================================
-- Stores user signup data and company setup details
-- Supports both Google OAuth and manual registration

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==========================================
-- Organizations/Companies Table
-- ==========================================
CREATE TABLE IF NOT EXISTS organizations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Company Info
  company_name TEXT NOT NULL,
  country TEXT NOT NULL,
  address TEXT NOT NULL,
  email TEXT NOT NULL,
  phone_number TEXT NOT NULL,
  
  -- Location & Tax
  contact_person TEXT NOT NULL,
  gst_number TEXT NOT NULL,
  state TEXT NOT NULL,
  pin_code TEXT NOT NULL,
  
  -- Business Details
  currency TEXT NOT NULL DEFAULT 'INR',
  nature_of_business TEXT NOT NULL CHECK (
    nature_of_business IN ('Retail', 'Wholesale', 'Distribution', 'Trading', 'Manufacturing', 'Fabrication')
  ),
  
  -- Logo
  logo_url TEXT,
  
  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  is_active BOOLEAN NOT NULL DEFAULT true,
  
  -- Indexes
  CONSTRAINT organizations_email_unique UNIQUE (email),
  CONSTRAINT organizations_gst_unique UNIQUE (gst_number)
);

-- ==========================================
-- Users Table
-- ==========================================
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Organization Link
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  
  -- Auth Info (Email only, no username/password)
  email TEXT NOT NULL,
  
  -- OAuth Info
  google_id TEXT,
  google_picture_url TEXT,
  auth_provider TEXT NOT NULL DEFAULT 'google' CHECK (
    auth_provider IN ('google')
  ),
  
  -- User Details
  first_name TEXT,
  last_name TEXT,
  
  -- Role & Status
  role TEXT NOT NULL DEFAULT 'admin' CHECK (
    role IN ('admin', 'manager', 'staff', 'viewer')
  ),
  is_admin BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_login_at TIMESTAMPTZ,
  
  -- Constraints
  CONSTRAINT users_email_unique UNIQUE (email),
  CONSTRAINT users_google_id_unique UNIQUE (google_id)
);

-- ==========================================
-- Onboarding Status Table
-- ==========================================
CREATE TABLE IF NOT EXISTS onboarding_status (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Links
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  
  -- Onboarding Steps
  company_info_completed BOOLEAN NOT NULL DEFAULT false,
  location_tax_completed BOOLEAN NOT NULL DEFAULT false,
  admin_account_completed BOOLEAN NOT NULL DEFAULT false,
  
  -- Overall Status
  is_completed BOOLEAN NOT NULL DEFAULT false,
  completed_at TIMESTAMPTZ,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT onboarding_user_unique UNIQUE (user_id)
);

-- ==========================================
-- User Sessions Table (Optional - for tracking)
-- ==========================================
CREATE TABLE IF NOT EXISTS user_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- User Link
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Session Info
  session_token TEXT NOT NULL,
  ip_address INET,
  user_agent TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  last_activity_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT user_sessions_token_unique UNIQUE (session_token)
);

-- ==========================================
-- Indexes for Performance
-- ==========================================

-- Organizations
CREATE INDEX IF NOT EXISTS idx_organizations_email ON organizations(email);
CREATE INDEX IF NOT EXISTS idx_organizations_gst ON organizations(gst_number);
CREATE INDEX IF NOT EXISTS idx_organizations_active ON organizations(is_active);

-- Users
CREATE INDEX IF NOT EXISTS idx_users_organization ON users(organization_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_google_id ON users(google_id);
CREATE INDEX IF NOT EXISTS idx_users_active ON users(is_active);

-- Onboarding Status
CREATE INDEX IF NOT EXISTS idx_onboarding_user ON onboarding_status(user_id);
CREATE INDEX IF NOT EXISTS idx_onboarding_org ON onboarding_status(organization_id);
CREATE INDEX IF NOT EXISTS idx_onboarding_completed ON onboarding_status(is_completed);

-- User Sessions
CREATE INDEX IF NOT EXISTS idx_sessions_user ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_token ON user_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_sessions_expires ON user_sessions(expires_at);

-- ==========================================
-- Updated At Triggers
-- ==========================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to organizations
DROP TRIGGER IF EXISTS update_organizations_updated_at ON organizations;
CREATE TRIGGER update_organizations_updated_at
  BEFORE UPDATE ON organizations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Apply to users
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Apply to onboarding_status
DROP TRIGGER IF EXISTS update_onboarding_status_updated_at ON onboarding_status;
CREATE TRIGGER update_onboarding_status_updated_at
  BEFORE UPDATE ON onboarding_status
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ==========================================
-- Row Level Security (RLS)
-- ==========================================

-- Enable RLS
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE onboarding_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;

-- Organizations: Allow all authenticated users to read/write during signup
CREATE POLICY organizations_all_policy ON organizations
  FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- Users: Allow all authenticated users to read/write during signup
CREATE POLICY users_all_policy ON users
  FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- Onboarding: Allow all authenticated users
CREATE POLICY onboarding_all_policy ON onboarding_status
  FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- Sessions: Allow all authenticated users
CREATE POLICY sessions_all_policy ON user_sessions
  FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- ==========================================
-- Helper Functions
-- ==========================================

-- Function to complete onboarding
CREATE OR REPLACE FUNCTION complete_onboarding(p_user_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE onboarding_status
  SET 
    is_completed = true,
    completed_at = NOW()
  WHERE user_id = p_user_id
    AND company_info_completed = true
    AND location_tax_completed = true
    AND admin_account_completed = true;
END;
$$ LANGUAGE plpgsql;

-- Function to check if user completed onboarding
CREATE OR REPLACE FUNCTION is_onboarding_complete(p_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_completed BOOLEAN;
BEGIN
  SELECT is_completed INTO v_completed
  FROM onboarding_status
  WHERE user_id = p_user_id;
  
  RETURN COALESCE(v_completed, false);
END;
$$ LANGUAGE plpgsql;

-- ==========================================
-- Sample Data (Optional - for testing)
-- ==========================================

-- Uncomment to insert sample data
/*
-- Sample Organization
INSERT INTO organizations (
  company_name, country, address, email, phone_number,
  contact_person, gst_number, state, pin_code,
  currency, nature_of_business
) VALUES (
  'Sample Corp', 'India', '123 Main St, Mumbai', 'contact@sample.com', '+91 9876543210',
  'John Doe', '27AABCU9603R1ZM', 'Maharashtra', '400001',
  'INR', 'Retail'
) RETURNING id;

-- Sample User (use returned org id)
INSERT INTO users (
  organization_id, username, email, password_hash,
  first_name, last_name, is_admin, auth_provider
) VALUES (
  'org-id-here', 'admin', 'admin@sample.com', 'hashed-password',
  'John', 'Doe', true, 'email'
);

-- Sample Onboarding Status
INSERT INTO onboarding_status (
  user_id, organization_id,
  company_info_completed, location_tax_completed, admin_account_completed,
  is_completed, completed_at
) VALUES (
  'user-id-here', 'org-id-here',
  true, true, true,
  true, NOW()
);
*/

-- ==========================================
-- Cleanup (Optional - for development)
-- ==========================================

-- Uncomment to drop all tables (WARNING: DELETES ALL DATA)
/*
DROP TABLE IF EXISTS user_sessions CASCADE;
DROP TABLE IF EXISTS onboarding_status CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS organizations CASCADE;
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;
DROP FUNCTION IF EXISTS complete_onboarding(UUID) CASCADE;
DROP FUNCTION IF EXISTS is_onboarding_complete(UUID) CASCADE;
*/
