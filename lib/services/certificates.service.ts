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
  custom_fields?: Record<string, unknown>[];
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
    // Generate certificate number
    const certificateNumber = await this.generateCertificateNumber(
      input.organization_id,
      input.invoice_number
    );

    // Prepare certificate data with proper null handling for dates
    const certificateData = {
      organization_id: input.organization_id,
      certificate_number: certificateNumber,
      invoice_number: input.invoice_number,
      customer_name: input.customer_name,
      customer_address: input.customer_address,
      instrument_name: input.instrument_name,
      customer_gstin: input.certificate_data?.customer_gstin || null,
      customer_contact: input.certificate_data?.customer_contact || null,
      customer_email: input.certificate_data?.customer_email || null,
      make_serial: input.certificate_data?.make_serial || null,
      mounting: input.certificate_data?.mounting || null,
      range: input.certificate_data?.range || null,
      accuracy: input.certificate_data?.accuracy || null,
      calibration_due_date: input.certificate_data?.calibration_due_date || null,
      test_conditions: input.certificate_data?.test_conditions || null,
      master_range: input.certificate_data?.master_range || null,
      master_calibration_due: input.certificate_data?.master_calibration_due || null,
      master_certificate_no: input.certificate_data?.master_certificate_no || null,
      test_results: input.certificate_data?.test_results || [],
      calibrated_by: input.certificate_data?.calibrated_by || null,
      approved_by: input.certificate_data?.approved_by || null,
      remarks: input.certificate_data?.remarks || null,
      created_by: input.certificate_data?.created_by || null,
      status: 'draft' as const,
    };

    // Insert certificate
    const { data: certificate, error: insertError } = await supabase
      .from('certificates')
      .insert(certificateData)
      .select('id')
      .single();

    if (insertError) throw insertError;

    // Create audit log entry
    const { error: auditError } = await supabase
      .from('certificate_audit_log')
      .insert({
        certificate_id: certificate.id,
        action: 'created',
        performed_by: input.certificate_data?.created_by || null,
      });

    if (auditError) throw auditError;

    return certificateNumber;
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
    const { data, error } = await supabase
      .from('certificates')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('invoice_number', invoiceNumber)
      .order('created_at', { ascending: false });

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
    // Get old status for audit log
    const { data: oldCert, error: fetchError } = await supabase
      .from('certificates')
      .select('status')
      .eq('id', certificateId)
      .single();

    if (fetchError) throw fetchError;

    // Update certificate
    const updateData: Record<string, unknown> = { status };
    if (pdfUrl) updateData.pdf_url = pdfUrl;

    const { error: updateError } = await supabase
      .from('certificates')
      .update(updateData)
      .eq('id', certificateId);

    if (updateError) throw updateError;

    // Create audit log entry
    const { error: auditError } = await supabase
      .from('certificate_audit_log')
      .insert({
        certificate_id: certificateId,
        action: 'status_changed',
        performed_by: userId,
        changes: {
          old_status: oldCert.status,
          new_status: status,
        },
      });

    if (auditError) throw auditError;

    return true;
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
    // Get configuration (maybeSingle returns null if no rows found)
    const { data: config } = await supabase
      .from('certificate_config')
      .select('*')
      .eq('organization_id', organizationId)
      .maybeSingle();

    // Use defaults if no config exists
    const certificatePrefix = config?.certificate_prefix || 'CERT';
    const certificateSeparator = config?.certificate_separator || '-';
    const includeInvoiceNumber = config?.include_invoice_number ?? true;
    const includeDate = config?.include_date ?? false;
    const dateFormat = config?.date_format || 'YYYYMMDD';
    const counterStart = config?.counter_start || 1;
    const counterPadding = config?.counter_padding || 4;

    // Get next counter value by finding max certificate number
    const { data: certificates } = await supabase
      .from('certificates')
      .select('certificate_number')
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false })
      .limit(100);

    let counter = counterStart;
    if (certificates && certificates.length > 0) {
      // Extract numbers from certificate numbers and find max
      const numbers = certificates
        .map(cert => {
          const match = cert.certificate_number.match(/(\d+)$/);
          return match ? parseInt(match[1], 10) : 0;
        })
        .filter(num => !isNaN(num));
      
      if (numbers.length > 0) {
        counter = Math.max(...numbers) + 1;
      }
    }

    // Build certificate number
    let certNumber = certificatePrefix;

    if (includeInvoiceNumber && invoiceNumber) {
      certNumber += certificateSeparator + invoiceNumber;
    }

    if (includeDate) {
      const now = new Date();
      let datePart = '';
      
      switch (dateFormat) {
        case 'YYYYMMDD':
          datePart = now.toISOString().slice(0, 10).replace(/-/g, '');
          break;
        case 'YYMMDD':
          datePart = now.toISOString().slice(2, 10).replace(/-/g, '');
          break;
        case 'YYYY':
          datePart = now.getFullYear().toString();
          break;
        case 'YY':
          datePart = now.getFullYear().toString().slice(-2);
          break;
        default:
          datePart = now.toISOString().slice(0, 10).replace(/-/g, '');
      }
      
      certNumber += certificateSeparator + datePart;
    }

    certNumber += certificateSeparator + counter.toString().padStart(counterPadding, '0');

    return certNumber;
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
