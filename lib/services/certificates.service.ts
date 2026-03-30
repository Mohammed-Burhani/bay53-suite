import { supabase } from './supabase';

export interface Certificate {
  id: string;
  organization_id: string;
  certificate_number: string;
  invoice_number: string;
  certificate_date: string;
  customer_name: string;
  customer_address?: string;
  customer_gstin?: string;
  customer_contact?: string;
  customer_email?: string;
  instrument_name: string;
  make_serial?: string;
  mounting?: string;
  range?: string;
  accuracy?: string;
  calibration_due_date?: string;
  test_conditions?: string;
  master_range?: string;
  master_calibration_due?: string;
  master_certificate_no?: string;
  test_results?: TestResult[];
  calibrated_by?: string;
  approved_by?: string;
  status: 'draft' | 'issued' | 'cancelled';
  remarks?: string;
  pdf_url?: string;
  created_at: string;
  updated_at: string;
}

export interface TestResult {
  reading: string;
  standard: string;
  error: string;
  uncertainty?: string;
}

export interface CertificateConfig {
  id: string;
  organization_id: string;
  certificate_prefix: string;
  certificate_separator: string;
  include_invoice_number: boolean;
  include_date: boolean;
  date_format: string;
  counter_start: number;
  counter_padding: number;
  custom_format?: string;
}

export interface CertificateTemplate {
  id: string;
  organization_id: string;
  template_name: string;
  is_default: boolean;
  header_logo_url?: string;
  header_title: string;
  header_subtitle?: string;
  company_name?: string;
  company_address?: string;
  company_contact?: string;
  show_customer_gstin: boolean;
  show_customer_contact: boolean;
  show_mounting: boolean;
  show_accuracy: boolean;
  show_test_conditions: boolean;
  show_master_details: boolean;
  custom_fields?: any[];
  primary_color: string;
  secondary_color: string;
  font_family: string;
}

export interface CreateCertificateInput {
  organization_id: string;
  invoice_number: string;
  customer_name: string;
  customer_address?: string;
  instrument_name: string;
  certificate_data?: {
    customer_gstin?: string;
    customer_contact?: string;
    customer_email?: string;
    make_serial?: string;
    mounting?: string;
    range?: string;
    accuracy?: string;
    calibration_due_date?: string;
    test_conditions?: string;
    master_range?: string;
    master_calibration_due?: string;
    master_certificate_no?: string;
    test_results?: TestResult[];
    calibrated_by?: string;
    approved_by?: string;
    remarks?: string;
    created_by?: string;
  };
}

class CertificatesService {
  // =====================================================
  // CERTIFICATES
  // =====================================================

  async createCertificate(input: CreateCertificateInput): Promise<string> {
    const { data, error } = await supabase.rpc('create_certificate', {
      p_organization_id: input.organization_id,
      p_invoice_number: input.invoice_number,
      p_customer_name: input.customer_name,
      p_customer_address: input.customer_address,
      p_instrument_name: input.instrument_name,
      p_certificate_data: input.certificate_data || {},
    });

    if (error) throw error;
    return data;
  }

  async getCertificates(organizationId: string): Promise<Certificate[]> {
    const { data, error } = await supabase
      .from('certificates')
      .select('*')
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  async getCertificateById(id: string): Promise<Certificate | null> {
    const { data, error } = await supabase
      .from('certificates')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  }

  async getCertificatesByInvoice(
    organizationId: string,
    invoiceNumber: string
  ): Promise<Certificate[]> {
    const { data, error } = await supabase.rpc('get_certificates_by_invoice', {
      p_organization_id: organizationId,
      p_invoice_number: invoiceNumber,
    });

    if (error) throw error;
    return data || [];
  }

  async updateCertificate(
    id: string,
    updates: Partial<Certificate>
  ): Promise<Certificate> {
    const { data, error } = await supabase
      .from('certificates')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async updateCertificateStatus(
    certificateId: string,
    status: 'draft' | 'issued' | 'cancelled',
    userId?: string,
    pdfUrl?: string
  ): Promise<boolean> {
    const { data, error } = await supabase.rpc('update_certificate_status', {
      p_certificate_id: certificateId,
      p_status: status,
      p_user_id: userId,
      p_pdf_url: pdfUrl,
    });

    if (error) throw error;
    return data;
  }

  async deleteCertificate(id: string): Promise<void> {
    const { error } = await supabase
      .from('certificates')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  // =====================================================
  // CERTIFICATE CONFIGURATION
  // =====================================================

  async getCertificateConfig(
    organizationId: string
  ): Promise<CertificateConfig | null> {
    const { data, error } = await supabase
      .from('certificate_config')
      .select('*')
      .eq('organization_id', organizationId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }

  async upsertCertificateConfig(
    config: Partial<CertificateConfig> & { organization_id: string }
  ): Promise<CertificateConfig> {
    const { data, error } = await supabase
      .from('certificate_config')
      .upsert(config, { onConflict: 'organization_id' })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async generateCertificateNumber(
    organizationId: string,
    invoiceNumber?: string
  ): Promise<string> {
    const { data, error } = await supabase.rpc('generate_certificate_number', {
      p_organization_id: organizationId,
      p_invoice_number: invoiceNumber,
    });

    if (error) throw error;
    return data;
  }

  // =====================================================
  // CERTIFICATE TEMPLATES
  // =====================================================

  async getTemplates(organizationId: string): Promise<CertificateTemplate[]> {
    const { data, error } = await supabase
      .from('certificate_templates')
      .select('*')
      .eq('organization_id', organizationId)
      .order('is_default', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  async getDefaultTemplate(
    organizationId: string
  ): Promise<CertificateTemplate | null> {
    const { data, error } = await supabase
      .from('certificate_templates')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('is_default', true)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }

  async createTemplate(
    template: Omit<CertificateTemplate, 'id' | 'created_at' | 'updated_at'>
  ): Promise<CertificateTemplate> {
    const { data, error } = await supabase
      .from('certificate_templates')
      .insert(template)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async updateTemplate(
    id: string,
    updates: Partial<CertificateTemplate>
  ): Promise<CertificateTemplate> {
    const { data, error } = await supabase
      .from('certificate_templates')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async deleteTemplate(id: string): Promise<void> {
    const { error } = await supabase
      .from('certificate_templates')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  // =====================================================
  // AUDIT LOG
  // =====================================================

  async getAuditLog(certificateId: string) {
    const { data, error } = await supabase
      .from('certificate_audit_log')
      .select('*')
      .eq('certificate_id', certificateId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }
}

export const certificatesService = new CertificatesService();
