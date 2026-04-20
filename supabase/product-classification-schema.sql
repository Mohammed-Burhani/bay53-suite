-- =====================================================
-- PRODUCT CLASSIFICATION CONFIGURATION SCHEMA
-- Stores customizable product classification settings
-- =====================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- TABLES
-- =====================================================

-- Product Classification Configuration Table
CREATE TABLE IF NOT EXISTS product_classification_config (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id VARCHAR(255) NOT NULL,
  classification_depth INTEGER NOT NULL DEFAULT 4 CHECK (classification_depth BETWEEN 1 AND 10),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by VARCHAR(255),
  UNIQUE(organization_id)
);

-- Classification Fields Table
CREATE TABLE IF NOT EXISTS classification_fields (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  config_id UUID NOT NULL,
  field_id VARCHAR(100) NOT NULL,
  field_name VARCHAR(100) NOT NULL,
  display_order INTEGER NOT NULL,
  enabled BOOLEAN DEFAULT true,
  is_custom BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT fk_classification_config FOREIGN KEY (config_id) REFERENCES product_classification_config(id) ON DELETE CASCADE,
  UNIQUE(config_id, field_id)
);

-- Classification Audit Log
CREATE TABLE IF NOT EXISTS classification_audit_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  config_id UUID NOT NULL,
  action VARCHAR(50) NOT NULL,
  performed_by VARCHAR(255),
  changes JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT fk_audit_config FOREIGN KEY (config_id) REFERENCES product_classification_config(id) ON DELETE CASCADE
);

-- =====================================================
-- INDEXES
-- =====================================================

CREATE INDEX idx_classification_config_org ON product_classification_config(organization_id);
CREATE INDEX idx_classification_fields_config ON classification_fields(config_id);
CREATE INDEX idx_classification_fields_order ON classification_fields(config_id, display_order);
CREATE INDEX idx_classification_fields_enabled ON classification_fields(config_id, enabled);
CREATE INDEX idx_classification_audit_config ON classification_audit_log(config_id);
CREATE INDEX idx_classification_audit_date ON classification_audit_log(created_at);

-- =====================================================
-- TRIGGERS
-- =====================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_classification_config_updated_at
  BEFORE UPDATE ON product_classification_config
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_classification_fields_updated_at
  BEFORE UPDATE ON classification_fields
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

ALTER TABLE product_classification_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE classification_fields ENABLE ROW LEVEL SECURITY;
ALTER TABLE classification_audit_log ENABLE ROW LEVEL SECURITY;

-- Policies for authenticated users
CREATE POLICY "Authenticated users can view classification config"
  ON product_classification_config FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can create classification config"
  ON product_classification_config FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update classification config"
  ON product_classification_config FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Authenticated users can delete classification config"
  ON product_classification_config FOR DELETE TO authenticated USING (true);

CREATE POLICY "Authenticated users can view classification fields"
  ON classification_fields FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can create classification fields"
  ON classification_fields FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update classification fields"
  ON classification_fields FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Authenticated users can delete classification fields"
  ON classification_fields FOR DELETE TO authenticated USING (true);

CREATE POLICY "Authenticated users can view audit logs"
  ON classification_audit_log FOR SELECT TO authenticated USING (true);

-- =====================================================
-- FUNCTIONS
-- =====================================================

-- Function to initialize default classification config
CREATE OR REPLACE FUNCTION initialize_classification_config(
  p_organization_id VARCHAR,
  p_created_by VARCHAR DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_config_id UUID;
  v_default_fields JSONB := '[
    {"field_id": "item_code", "field_name": "Item Code", "display_order": 1, "enabled": true},
    {"field_id": "item", "field_name": "Item", "display_order": 2, "enabled": true},
    {"field_id": "aliases", "field_name": "Aliases", "display_order": 3, "enabled": true},
    {"field_id": "category", "field_name": "Category", "display_order": 4, "enabled": true},
    {"field_id": "sub_cat", "field_name": "Sub Cat", "display_order": 5, "enabled": false},
    {"field_id": "size", "field_name": "Size", "display_order": 6, "enabled": false},
    {"field_id": "ref_no", "field_name": "Ref No.", "display_order": 7, "enabled": false},
    {"field_id": "color", "field_name": "Color", "display_order": 8, "enabled": false}
  ]'::jsonb;
  v_field JSONB;
BEGIN
  -- Check if config already exists
  SELECT id INTO v_config_id
  FROM product_classification_config
  WHERE organization_id = p_organization_id;

  IF v_config_id IS NOT NULL THEN
    RETURN v_config_id;
  END IF;

  -- Create config
  INSERT INTO product_classification_config (
    organization_id,
    classification_depth,
    created_by
  ) VALUES (
    p_organization_id,
    4,
    p_created_by
  )
  RETURNING id INTO v_config_id;

  -- Insert default fields
  FOR v_field IN SELECT * FROM jsonb_array_elements(v_default_fields)
  LOOP
    INSERT INTO classification_fields (
      config_id,
      field_id,
      field_name,
      display_order,
      enabled,
      is_custom
    ) VALUES (
      v_config_id,
      v_field->>'field_id',
      v_field->>'field_name',
      (v_field->>'display_order')::INTEGER,
      (v_field->>'enabled')::BOOLEAN,
      false
    );
  END LOOP;

  -- Log creation
  INSERT INTO classification_audit_log (
    config_id,
    action,
    performed_by
  ) VALUES (
    v_config_id,
    'initialized',
    p_created_by
  );

  RETURN v_config_id;
END;
$$ LANGUAGE plpgsql;

-- Function to get classification config with fields
CREATE OR REPLACE FUNCTION get_classification_config(
  p_organization_id VARCHAR
)
RETURNS TABLE (
  config_id UUID,
  organization_id VARCHAR,
  classification_depth INTEGER,
  field_id VARCHAR,
  field_name VARCHAR,
  display_order INTEGER,
  enabled BOOLEAN,
  is_custom BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.id AS config_id,
    c.organization_id,
    c.classification_depth,
    f.field_id,
    f.field_name,
    f.display_order,
    f.enabled,
    f.is_custom
  FROM product_classification_config c
  LEFT JOIN classification_fields f ON f.config_id = c.id
  WHERE c.organization_id = p_organization_id
  ORDER BY f.display_order;
END;
$$ LANGUAGE plpgsql;

-- Function to update classification depth
CREATE OR REPLACE FUNCTION update_classification_depth(
  p_organization_id VARCHAR,
  p_depth INTEGER,
  p_user_id VARCHAR DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
  v_config_id UUID;
  v_old_depth INTEGER;
BEGIN
  -- Get config
  SELECT id, classification_depth INTO v_config_id, v_old_depth
  FROM product_classification_config
  WHERE organization_id = p_organization_id;

  IF v_config_id IS NULL THEN
    RAISE EXCEPTION 'Configuration not found for organization %', p_organization_id;
  END IF;

  -- Update depth
  UPDATE product_classification_config
  SET 
    classification_depth = p_depth,
    updated_at = NOW()
  WHERE id = v_config_id;

  -- Auto-enable/disable fields based on depth
  UPDATE classification_fields
  SET 
    enabled = (display_order <= p_depth),
    updated_at = NOW()
  WHERE config_id = v_config_id;

  -- Log change
  INSERT INTO classification_audit_log (
    config_id,
    action,
    performed_by,
    changes
  ) VALUES (
    v_config_id,
    'depth_changed',
    p_user_id,
    jsonb_build_object(
      'old_depth', v_old_depth,
      'new_depth', p_depth
    )
  );

  RETURN true;
END;
$$ LANGUAGE plpgsql;

-- Function to update field settings
CREATE OR REPLACE FUNCTION update_classification_field(
  p_config_id UUID,
  p_field_id VARCHAR,
  p_field_name VARCHAR DEFAULT NULL,
  p_display_order INTEGER DEFAULT NULL,
  p_enabled BOOLEAN DEFAULT NULL,
  p_user_id VARCHAR DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
  v_old_values JSONB;
BEGIN
  -- Get old values
  SELECT jsonb_build_object(
    'field_name', field_name,
    'display_order', display_order,
    'enabled', enabled
  ) INTO v_old_values
  FROM classification_fields
  WHERE config_id = p_config_id AND field_id = p_field_id;

  -- Update field
  UPDATE classification_fields
  SET 
    field_name = COALESCE(p_field_name, field_name),
    display_order = COALESCE(p_display_order, display_order),
    enabled = COALESCE(p_enabled, enabled),
    updated_at = NOW()
  WHERE config_id = p_config_id AND field_id = p_field_id;

  -- Log change
  INSERT INTO classification_audit_log (
    config_id,
    action,
    performed_by,
    changes
  ) VALUES (
    p_config_id,
    'field_updated',
    p_user_id,
    jsonb_build_object(
      'field_id', p_field_id,
      'old_values', v_old_values,
      'new_values', jsonb_build_object(
        'field_name', p_field_name,
        'display_order', p_display_order,
        'enabled', p_enabled
      )
    )
  );

  RETURN true;
END;
$$ LANGUAGE plpgsql;

-- Function to add custom field
CREATE OR REPLACE FUNCTION add_custom_classification_field(
  p_organization_id VARCHAR,
  p_field_name VARCHAR,
  p_user_id VARCHAR DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_config_id UUID;
  v_field_id UUID;
  v_max_order INTEGER;
BEGIN
  -- Get config
  SELECT id INTO v_config_id
  FROM product_classification_config
  WHERE organization_id = p_organization_id;

  IF v_config_id IS NULL THEN
    RAISE EXCEPTION 'Configuration not found for organization %', p_organization_id;
  END IF;

  -- Get max display order
  SELECT COALESCE(MAX(display_order), 0) + 1 INTO v_max_order
  FROM classification_fields
  WHERE config_id = v_config_id;

  -- Insert custom field
  INSERT INTO classification_fields (
    config_id,
    field_id,
    field_name,
    display_order,
    enabled,
    is_custom
  ) VALUES (
    v_config_id,
    'custom_' || gen_random_uuid()::TEXT,
    p_field_name,
    v_max_order,
    true,
    true
  )
  RETURNING id INTO v_field_id;

  -- Log addition
  INSERT INTO classification_audit_log (
    config_id,
    action,
    performed_by,
    changes
  ) VALUES (
    v_config_id,
    'field_added',
    p_user_id,
    jsonb_build_object(
      'field_name', p_field_name,
      'display_order', v_max_order
    )
  );

  RETURN v_field_id;
END;
$$ LANGUAGE plpgsql;

-- Function to delete custom field
CREATE OR REPLACE FUNCTION delete_classification_field(
  p_config_id UUID,
  p_field_id VARCHAR,
  p_user_id VARCHAR DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
  v_is_custom BOOLEAN;
  v_field_name VARCHAR;
BEGIN
  -- Check if field is custom
  SELECT is_custom, field_name INTO v_is_custom, v_field_name
  FROM classification_fields
  WHERE config_id = p_config_id AND field_id = p_field_id;

  IF NOT v_is_custom THEN
    RAISE EXCEPTION 'Cannot delete built-in field %', p_field_id;
  END IF;

  -- Delete field
  DELETE FROM classification_fields
  WHERE config_id = p_config_id AND field_id = p_field_id;

  -- Log deletion
  INSERT INTO classification_audit_log (
    config_id,
    action,
    performed_by,
    changes
  ) VALUES (
    p_config_id,
    'field_deleted',
    p_user_id,
    jsonb_build_object(
      'field_id', p_field_id,
      'field_name', v_field_name
    )
  );

  RETURN true;
END;
$$ LANGUAGE plpgsql;

-- Function to reorder fields
CREATE OR REPLACE FUNCTION reorder_classification_fields(
  p_config_id UUID,
  p_field_orders JSONB,
  p_user_id VARCHAR DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
  v_field JSONB;
BEGIN
  -- Update display orders
  FOR v_field IN SELECT * FROM jsonb_array_elements(p_field_orders)
  LOOP
    UPDATE classification_fields
    SET 
      display_order = (v_field->>'display_order')::INTEGER,
      updated_at = NOW()
    WHERE config_id = p_config_id 
      AND field_id = v_field->>'field_id';
  END LOOP;

  -- Log reorder
  INSERT INTO classification_audit_log (
    config_id,
    action,
    performed_by,
    changes
  ) VALUES (
    p_config_id,
    'fields_reordered',
    p_user_id,
    jsonb_build_object('new_order', p_field_orders)
  );

  RETURN true;
END;
$$ LANGUAGE plpgsql;

-- Function to get enabled classification names as array
CREATE OR REPLACE FUNCTION get_enabled_classifications(
  p_organization_id VARCHAR
)
RETURNS TEXT[] AS $$
DECLARE
  v_names TEXT[];
BEGIN
  SELECT ARRAY_AGG(field_name ORDER BY display_order)
  INTO v_names
  FROM classification_fields f
  JOIN product_classification_config c ON c.id = f.config_id
  WHERE c.organization_id = p_organization_id
    AND f.enabled = true;

  RETURN COALESCE(v_names, ARRAY[]::TEXT[]);
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- SAMPLE DATA (OPTIONAL - COMMENT OUT IN PRODUCTION)
-- =====================================================

-- Initialize default config for demo organization
-- SELECT initialize_classification_config('demo-org-123', 'system');
