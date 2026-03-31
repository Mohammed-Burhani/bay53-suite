-- =====================================================
-- CALIBRATION CERTIFICATES SCHEMA (STANDALONE)
-- No dependencies on organizations table
-- =====================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- TABLES
-- =====================================================

-- Certificate Configuration Table
CREATE TABLE IF NOT EXISTS certificate_config (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id VARCHAR(255) NOT NULL,
  certificate_prefix VARCHAR(10) DEFAULT 'CERT',
  certificate_separator VARCHAR(5) DEFAULT '-',
  include_invoice_number BOOLEAN DEFAULT true,
  include_date BOOLEAN DEFAULT false,
  date_format VARCHAR(20) DEFAULT 'YYYYMMDD',
  counter_start INTEGER DEFAULT 1,
  counter_padding INTEGER DEFAULT 4,
  custom_format TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(organization_id)
);

-- Certificates Table
CREATE TABLE IF NOT EXISTS certificates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id VARCHAR(255) NOT NULL,
  certificate_number VARCHAR(100) UNIQUE NOT NULL,
  invoice_number VARCHAR(100) NOT NULL,
  certificate_date DATE NOT NULL DEFAULT CURRENT_DATE,
  customer_name VARCHAR(255) NOT NULL,
  customer_address TEXT,
  customer_gstin VARCHAR(15),
  customer_contact VARCHAR(50),
  customer_email VARCHAR(255),
  instrument_name VARCHAR(255) NOT NULL,
  make_serial VARCHAR(255),
  mounting VARCHAR(255),
  range VARCHAR(255),
  accuracy VARCHAR(255),
  calibration_due_date DATE,
  test_conditions TEXT,
  master_range VARCHAR(255),
  master_calibration_due DATE,
  master_certificate_no VARCHAR(100),
  test_results JSONB DEFAULT '[]'::jsonb,
  calibrated_by VARCHAR(255),
  approved_by VARCHAR(255),
  status VARCHAR(20) DEFAULT 'draft',
  remarks TEXT,
  pdf_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by VARCHAR(255)
);

-- Certificate Templates Table
CREATE TABLE IF NOT EXISTS certificate_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id VARCHAR(255) NOT NULL,
  template_name VARCHAR(100) NOT NULL,
  is_default BOOLEAN DEFAULT false,
  header_logo_url TEXT,
  header_title VARCHAR(255) DEFAULT 'CALIBRATION CERTIFICATE',
  header_subtitle VARCHAR(255),
  company_name VARCHAR(255),
  company_address TEXT,
  company_contact TEXT,
  show_customer_gstin BOOLEAN DEFAULT true,
  show_customer_contact BOOLEAN DEFAULT true,
  show_mounting BOOLEAN DEFAULT true,
  show_accuracy BOOLEAN DEFAULT true,
  show_test_conditions BOOLEAN DEFAULT true,
  show_master_details BOOLEAN DEFAULT true,
  custom_fields JSONB DEFAULT '[]'::jsonb,
  primary_color VARCHAR(7) DEFAULT '#000000',
  secondary_color VARCHAR(7) DEFAULT '#666666',
  font_family VARCHAR(50) DEFAULT 'Arial',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Certificate Audit Log
CREATE TABLE IF NOT EXISTS certificate_audit_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  certificate_id UUID NOT NULL,
  action VARCHAR(50) NOT NULL,
  performed_by VARCHAR(255),
  changes JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT fk_audit_certificate FOREIGN KEY (certificate_id) REFERENCES certificates(id) ON DELETE CASCADE
);

-- =====================================================
-- INDEXES
-- =====================================================

CREATE INDEX idx_certificates_org ON certificates(organization_id);
CREATE INDEX idx_certificates_invoice ON certificates(invoice_number);
CREATE INDEX idx_certificates_number ON certificates(certificate_number);
CREATE INDEX idx_certificates_customer ON certificates(customer_name);
CREATE INDEX idx_certificates_date ON certificates(certificate_date);
CREATE INDEX idx_certificates_status ON certificates(status);
CREATE INDEX idx_certificate_templates_org ON certificate_templates(organization_id);
CREATE INDEX idx_audit_certificate ON certificate_audit_log(certificate_id);
CREATE INDEX idx_audit_date ON certificate_audit_log(created_at);

-- =====================================================
-- TRIGGERS
-- =====================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$ LANGUAGE plpgsql;

CREATE TRIGGER update_certificates_updated_at
  BEFORE UPDATE ON certificates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_certificate_config_updated_at
  BEFORE UPDATE ON certificate_config
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_certificate_templates_updated_at
  BEFORE UPDATE ON certificate_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

ALTER TABLE certificates ENABLE ROW LEVEL SECURITY;
ALTER TABLE certificate_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE certificate_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE certificate_audit_log ENABLE ROW LEVEL SECURITY;

-- Permissive policies for authenticated users
CREATE POLICY "Authenticated users can view certificates"
  ON certificates FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can create certificates"
  ON certificates FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update certificates"
  ON certificates FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Authenticated users can delete certificates"
  ON certificates FOR DELETE TO authenticated USING (true);

CREATE POLICY "Authenticated users can view config"
  ON certificate_config FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert config"
  ON certificate_config FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update config"
  ON certificate_config FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Authenticated users can view templates"
  ON certificate_templates FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert templates"
  ON certificate_templates FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update templates"
  ON certificate_templates FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Authenticated users can delete templates"
  ON certificate_templates FOR DELETE TO authenticated USING (true);

CREATE POLICY "Authenticated users can view audit logs"
  ON certificate_audit_log FOR SELECT TO authenticated USING (true);
