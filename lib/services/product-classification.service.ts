import { supabase } from './supabase';

export interface ClassificationField {
  id: string;
  config_id: string;
  field_id: string;
  field_name: string;
  display_order: number;
  enabled: boolean;
  is_custom: boolean;
  created_at: string;
  updated_at: string;
}

export interface ProductClassificationConfig {
  id: string;
  organization_id: string;
  classification_depth: number;
  created_at: string;
  updated_at: string;
  created_by?: string;
}

export interface ClassificationConfigWithFields extends ProductClassificationConfig {
  fields: ClassificationField[];
}

export interface CreateConfigInput {
  organization_id: string;
  classification_depth?: number;
  created_by?: string;
}

export interface UpdateFieldInput {
  field_id: string;
  field_name?: string;
  display_order?: number;
  enabled?: boolean;
}

class ProductClassificationService {
  // =====================================================
  // CONFIGURATION
  // =====================================================

  async getConfig(organizationId: string): Promise<ClassificationConfigWithFields | null> {
    // Get config
    const { data: config, error: configError } = await supabase
      .from('product_classification_config')
      .select('*')
      .eq('organization_id', organizationId)
      .maybeSingle();

    if (configError) throw configError;
    if (!config) return null;

    // Get fields
    const { data: fields, error: fieldsError } = await supabase
      .from('classification_fields')
      .select('*')
      .eq('config_id', config.id)
      .order('display_order', { ascending: true });

    if (fieldsError) throw fieldsError;

    return {
      ...config,
      fields: fields || [],
    };
  }

  async initializeConfig(input: CreateConfigInput): Promise<ClassificationConfigWithFields> {
    // Check if config exists
    const existing = await this.getConfig(input.organization_id);
    if (existing) return existing;

    // Create config
    const { data: config, error: configError } = await supabase
      .from('product_classification_config')
      .insert({
        organization_id: input.organization_id,
        classification_depth: input.classification_depth || 4,
        created_by: input.created_by,
      })
      .select()
      .single();

    if (configError) throw configError;

    // Default fields
    const defaultFields = [
      { field_id: 'item_code', field_name: 'Item Code', display_order: 1, enabled: true },
      { field_id: 'item', field_name: 'Item', display_order: 2, enabled: true },
      { field_id: 'aliases', field_name: 'Aliases', display_order: 3, enabled: true },
      { field_id: 'size', field_name: 'Size', display_order: 4, enabled: true },
      { field_id: 'material', field_name: 'Material', display_order: 5, enabled: false },
      { field_id: 'quality', field_name: 'Quality', display_order: 6, enabled: false },
      { field_id: 'brand', field_name: 'Brand', display_order: 7, enabled: false },
      { field_id: 'color', field_name: 'Color', display_order: 8, enabled: false },
      { field_id: 'bar_code', field_name: 'Bar Code', display_order: 9, enabled: false },
    ];

    // Insert fields
    const { data: fields, error: fieldsError } = await supabase
      .from('classification_fields')
      .insert(
        defaultFields.map(f => ({
          config_id: config.id,
          field_id: f.field_id,
          field_name: f.field_name,
          display_order: f.display_order,
          enabled: f.enabled,
          is_custom: false,
        }))
      )
      .select();

    if (fieldsError) throw fieldsError;

    // Log creation
    await supabase.from('classification_audit_log').insert({
      config_id: config.id,
      action: 'initialized',
      performed_by: input.created_by,
    });

    return {
      ...config,
      fields: fields || [],
    };
  }

  async updateDepth(
    organizationId: string,
    depth: number,
    userId?: string
  ): Promise<boolean> {
    // Get config
    const { data: config, error: fetchError } = await supabase
      .from('product_classification_config')
      .select('id, classification_depth')
      .eq('organization_id', organizationId)
      .single();

    if (fetchError) throw fetchError;

    const oldDepth = config.classification_depth;

    // Update depth
    const { error: updateError } = await supabase
      .from('product_classification_config')
      .update({ classification_depth: depth })
      .eq('id', config.id);

    if (updateError) throw updateError;

    // Auto-enable/disable fields based on depth
    const { data: fields, error: fieldsError } = await supabase
      .from('classification_fields')
      .select('id, display_order')
      .eq('config_id', config.id);

    if (fieldsError) throw fieldsError;

    // Update each field
    for (const field of fields || []) {
      await supabase
        .from('classification_fields')
        .update({ enabled: field.display_order <= depth })
        .eq('id', field.id);
    }

    // Log change
    await supabase.from('classification_audit_log').insert({
      config_id: config.id,
      action: 'depth_changed',
      performed_by: userId,
      changes: {
        old_depth: oldDepth,
        new_depth: depth,
      },
    });

    return true;
  }

  // =====================================================
  // FIELDS
  // =====================================================

  async getFields(configId: string): Promise<ClassificationField[]> {
    const { data, error } = await supabase
      .from('classification_fields')
      .select('*')
      .eq('config_id', configId)
      .order('display_order', { ascending: true });

    if (error) throw error;
    return data || [];
  }

  async updateField(
    configId: string,
    fieldId: string,
    updates: Partial<UpdateFieldInput>,
    userId?: string
  ): Promise<ClassificationField> {
    // Get old values
    const { data: oldField, error: fetchError } = await supabase
      .from('classification_fields')
      .select('*')
      .eq('config_id', configId)
      .eq('field_id', fieldId)
      .single();

    if (fetchError) throw fetchError;

    // Update field
    const { data, error } = await supabase
      .from('classification_fields')
      .update({
        field_name: updates.field_name ?? oldField.field_name,
        display_order: updates.display_order ?? oldField.display_order,
        enabled: updates.enabled ?? oldField.enabled,
      })
      .eq('config_id', configId)
      .eq('field_id', fieldId)
      .select()
      .single();

    if (error) throw error;

    // Log change
    await supabase.from('classification_audit_log').insert({
      config_id: configId,
      action: 'field_updated',
      performed_by: userId,
      changes: {
        field_id: fieldId,
        old_values: {
          field_name: oldField.field_name,
          display_order: oldField.display_order,
          enabled: oldField.enabled,
        },
        new_values: updates,
      },
    });

    return data;
  }

  async addCustomField(
    organizationId: string,
    fieldName: string,
    userId?: string
  ): Promise<ClassificationField> {
    // Get config
    const { data: config, error: configError } = await supabase
      .from('product_classification_config')
      .select('id')
      .eq('organization_id', organizationId)
      .single();

    if (configError) throw configError;

    // Get max display order
    const { data: fields, error: fieldsError } = await supabase
      .from('classification_fields')
      .select('display_order')
      .eq('config_id', config.id)
      .order('display_order', { ascending: false })
      .limit(1);

    if (fieldsError) throw fieldsError;

    const maxOrder = fields && fields.length > 0 ? fields[0].display_order : 0;

    // Insert custom field
    const { data, error } = await supabase
      .from('classification_fields')
      .insert({
        config_id: config.id,
        field_id: `custom_${Date.now()}`,
        field_name: fieldName,
        display_order: maxOrder + 1,
        enabled: true,
        is_custom: true,
      })
      .select()
      .single();

    if (error) throw error;

    // Log addition
    await supabase.from('classification_audit_log').insert({
      config_id: config.id,
      action: 'field_added',
      performed_by: userId,
      changes: {
        field_name: fieldName,
        display_order: maxOrder + 1,
      },
    });

    return data;
  }

  async deleteField(
    configId: string,
    fieldId: string,
    userId?: string
  ): Promise<boolean> {
    // Check if field is custom
    const { data: field, error: fetchError } = await supabase
      .from('classification_fields')
      .select('is_custom, field_name')
      .eq('config_id', configId)
      .eq('field_id', fieldId)
      .single();

    if (fetchError) throw fetchError;

    if (!field.is_custom) {
      throw new Error('Cannot delete built-in field');
    }

    // Delete field
    const { error } = await supabase
      .from('classification_fields')
      .delete()
      .eq('config_id', configId)
      .eq('field_id', fieldId);

    if (error) throw error;

    // Log deletion
    await supabase.from('classification_audit_log').insert({
      config_id: configId,
      action: 'field_deleted',
      performed_by: userId,
      changes: {
        field_id: fieldId,
        field_name: field.field_name,
      },
    });

    return true;
  }

  async reorderFields(
    configId: string,
    fieldOrders: Array<{ field_id: string; display_order: number }>,
    userId?: string
  ): Promise<boolean> {
    // Update each field's display order
    for (const { field_id, display_order } of fieldOrders) {
      const { error } = await supabase
        .from('classification_fields')
        .update({ display_order })
        .eq('config_id', configId)
        .eq('field_id', field_id);

      if (error) throw error;
    }

    // Log reorder
    await supabase.from('classification_audit_log').insert({
      config_id: configId,
      action: 'fields_reordered',
      performed_by: userId,
      changes: { new_order: fieldOrders },
    });

    return true;
  }

  async bulkUpdateFields(
    configId: string,
    fields: Array<{
      field_id: string;
      field_name: string;
      display_order: number;
      enabled: boolean;
    }>,
    userId?: string
  ): Promise<boolean> {
    // Update each field
    for (const field of fields) {
      const { error } = await supabase
        .from('classification_fields')
        .update({
          field_name: field.field_name,
          display_order: field.display_order,
          enabled: field.enabled,
        })
        .eq('config_id', configId)
        .eq('field_id', field.field_id);

      if (error) throw error;
    }

    // Log bulk update
    await supabase.from('classification_audit_log').insert({
      config_id: configId,
      action: 'fields_bulk_updated',
      performed_by: userId,
      changes: { updated_fields: fields },
    });

    return true;
  }

  // =====================================================
  // HELPERS
  // =====================================================

  async getEnabledClassifications(organizationId: string): Promise<string[]> {
    const config = await this.getConfig(organizationId);
    if (!config) return [];

    return config.fields
      .filter(f => f.enabled)
      .sort((a, b) => a.display_order - b.display_order)
      .map(f => f.field_name);
  }

  // =====================================================
  // AUDIT LOG
  // =====================================================

  async getAuditLog(configId: string) {
    const { data, error } = await supabase
      .from('classification_audit_log')
      .select('*')
      .eq('config_id', configId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }
}

export const productClassificationService = new ProductClassificationService();
