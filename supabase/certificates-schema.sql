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
  test_results_common_field TEXT,
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

-- =====================================================
-- FUNCTIONS
-- =====================================================

-- Function to generate certificate number
CREATE OR REPLACE FUNCTION generate_certificate_number(
  p_organization_id VARCHAR,
  p_invoice_number VARCHAR DEFAULT NULL
)
RETURNS VARCHAR AS $$
DECLARE
  v_config RECORD;
  v_counter INTEGER;
  v_cert_number VARCHAR;
  v_date_part VARCHAR;
BEGIN
  -- Get configuration
  SELECT * INTO v_config
  FROM certificate_config
  WHERE organization_id = p_organization_id;

  -- Use defaults if no config exists
  IF v_config IS NULL THEN
    v_config.certificate_prefix := 'CERT';
    v_config.certificate_separator := '-';
    v_config.include_invoice_number := true;
    v_config.include_date := false;
    v_config.date_format := 'YYYYMMDD';
    v_config.counter_start := 1;
    v_config.counter_padding := 4;
  END IF;

  -- Get next counter value
  SELECT COALESCE(MAX(CAST(SUBSTRING(certificate_number FROM '[0-9]+$') AS INTEGER)), v_config.counter_start - 1) + 1
  INTO v_counter
  FROM certificates
  WHERE organization_id = p_organization_id;

  -- Build certificate number
  v_cert_number := v_config.certificate_prefix;

  IF v_config.include_invoice_number AND p_invoice_number IS NOT NULL THEN
    v_cert_number := v_cert_number || v_config.certificate_separator || p_invoice_number;
  END IF;

  IF v_config.include_date THEN
    v_date_part := TO_CHAR(CURRENT_DATE, v_config.date_format);
    v_cert_number := v_cert_number || v_config.certificate_separator || v_date_part;
  END IF;

  v_cert_number := v_cert_number || v_config.certificate_separator || LPAD(v_counter::TEXT, v_config.counter_padding, '0');

  RETURN v_cert_number;
END;
$$ LANGUAGE plpgsql;

-- Function to create certificate
CREATE OR REPLACE FUNCTION create_certificate(
  p_organization_id VARCHAR,
  p_invoice_number VARCHAR,
  p_customer_name VARCHAR,
  p_customer_address TEXT,
  p_instrument_name VARCHAR,
  p_certificate_data JSONB DEFAULT '{}'::jsonb
)
RETURNS VARCHAR AS $$
DECLARE
  v_cert_number VARCHAR;
  v_cert_id UUID;
BEGIN
  -- Generate certificate number
  v_cert_number := generate_certificate_number(p_organization_id, p_invoice_number);

  -- Insert certificate
  INSERT INTO certificates (
    organization_id,
    certificate_number,
    invoice_number,
    customer_name,
    customer_address,
    customer_gstin,
    customer_contact,
    customer_email,
    instrument_name,
    make_serial,
    mounting,
    range,
    accuracy,
    calibration_due_date,
    test_conditions,
    master_range,
    master_calibration_due,
    master_certificate_no,
    test_results,
    calibrated_by,
    approved_by,
    remarks,
    created_by
  ) VALUES (
    p_organization_id,
    v_cert_number,
    p_invoice_number,
    p_customer_name,
    p_customer_address,
    (p_certificate_data->>'customer_gstin')::VARCHAR,
    (p_certificate_data->>'customer_contact')::VARCHAR,
    (p_certificate_data->>'customer_email')::VARCHAR,
    p_instrument_name,
    (p_certificate_data->>'make_serial')::VARCHAR,
    (p_certificate_data->>'mounting')::VARCHAR,
    (p_certificate_data->>'range')::VARCHAR,
    (p_certificate_data->>'accuracy')::VARCHAR,
    (p_certificate_data->>'calibration_due_date')::DATE,
    (p_certificate_data->>'test_conditions')::TEXT,
    (p_certificate_data->>'master_range')::VARCHAR,
    (p_certificate_data->>'master_calibration_due')::DATE,
    (p_certificate_data->>'master_certificate_no')::VARCHAR,
    COALESCE((p_certificate_data->'test_results')::JSONB, '[]'::jsonb),
    (p_certificate_data->>'calibrated_by')::VARCHAR,
    (p_certificate_data->>'approved_by')::VARCHAR,
    (p_certificate_data->>'remarks')::TEXT,
    (p_certificate_data->>'created_by')::VARCHAR
  )
  RETURNING id INTO v_cert_id;

  -- Log creation
  INSERT INTO certificate_audit_log (certificate_id, action, performed_by)
  VALUES (v_cert_id, 'created', (p_certificate_data->>'created_by')::VARCHAR);

  RETURN v_cert_number;
END;
$$ LANGUAGE plpgsql;

-- Function to get certificates by invoice
CREATE OR REPLACE FUNCTION get_certificates_by_invoice(
  p_organization_id VARCHAR,
  p_invoice_number VARCHAR
)
RETURNS TABLE (
  id UUID,
  organization_id VARCHAR,
  certificate_number VARCHAR,
  invoice_number VARCHAR,
  certificate_date DATE,
  customer_name VARCHAR,
  customer_address TEXT,
  instrument_name VARCHAR,
  status VARCHAR,
  created_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.id,
    c.organization_id,
    c.certificate_number,
    c.invoice_number,
    c.certificate_date,
    c.customer_name,
    c.customer_address,
    c.instrument_name,
    c.status,
    c.created_at
  FROM certificates c
  WHERE c.organization_id = p_organization_id
    AND c.invoice_number = p_invoice_number
  ORDER BY c.created_at DESC;
END;
$$ LANGUAGE plpgsql;

-- Function to update certificate status
CREATE OR REPLACE FUNCTION update_certificate_status(
  p_certificate_id UUID,
  p_status VARCHAR,
  p_user_id VARCHAR DEFAULT NULL,
  p_pdf_url TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
  v_old_status VARCHAR;
BEGIN
  -- Get old status
  SELECT status INTO v_old_status
  FROM certificates
  WHERE id = p_certificate_id;

  -- Update certificate
  UPDATE certificates
  SET 
    status = p_status,
    pdf_url = COALESCE(p_pdf_url, pdf_url),
    updated_at = NOW()
  WHERE id = p_certificate_id;

  -- Log status change
  INSERT INTO certificate_audit_log (
    certificate_id,
    action,
    performed_by,
    changes
  ) VALUES (
    p_certificate_id,
    'status_changed',
    p_user_id,
    jsonb_build_object(
      'old_status', v_old_status,
      'new_status', p_status
    )
  );

  RETURN true;
END;
$$ LANGUAGE plpgsql;
