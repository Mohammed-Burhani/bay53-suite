/**
 * Local Storage utility for managing invoice column preferences
 * Columns are saved locally and can be reused across invoices
 */

export interface ColumnConfig {
  id: string;
  label: string;
  enabled: boolean;
  isCustom: boolean;
  type: "text" | "number" | "fixed";
}

const STORAGE_KEY = "stockbuddy_invoice_columns";

/**
 * Get saved column configuration from localStorage
 */
export function getSavedColumns(): ColumnConfig[] | null {
  if (typeof window === "undefined") return null;
  
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return null;
    
    const parsed = JSON.parse(saved);
    return Array.isArray(parsed) ? parsed : null;
  } catch (error) {
    console.error("Error reading saved columns:", error);
    return null;
  }
}

/**
 * Save column configuration to localStorage
 */
export function saveColumns(columns: ColumnConfig[]): boolean {
  if (typeof window === "undefined") return false;
  
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(columns));
    return true;
  } catch (error) {
    console.error("Error saving columns:", error);
    return false;
  }
}

/**
 * Clear saved column configuration
 */
export function clearSavedColumns(): boolean {
  if (typeof window === "undefined") return false;
  
  try {
    localStorage.removeItem(STORAGE_KEY);
    return true;
  } catch (error) {
    console.error("Error clearing saved columns:", error);
    return false;
  }
}

/**
 * Get default column configuration
 */
export function getDefaultColumns(): ColumnConfig[] {
  return [
    { id: "sno", label: "S.No", enabled: true, isCustom: false, type: "fixed" },
    { id: "description", label: "Description", enabled: true, isCustom: false, type: "fixed" },
    { id: "hsn", label: "HSN/SAC", enabled: true, isCustom: false, type: "text" },
    { id: "quantity", label: "Quantity", enabled: true, isCustom: false, type: "number" },
    { id: "rate", label: "Rate", enabled: true, isCustom: false, type: "number" },
    { id: "gst", label: "GST %", enabled: false, isCustom: false, type: "number" },
    { id: "amount", label: "Amount", enabled: true, isCustom: false, type: "fixed" },
  ];
}

/**
 * Initialize columns - use saved if available, otherwise use defaults
 */
export function initializeColumns(): ColumnConfig[] {
  const saved = getSavedColumns();
  return saved || getDefaultColumns();
}

/**
 * Export column configuration for use in invoice
 * Returns only enabled columns
 */
export function getEnabledColumns(columns: ColumnConfig[]): ColumnConfig[] {
  return columns.filter((col) => col.enabled);
}

/**
 * Validate column configuration
 */
export function validateColumns(columns: ColumnConfig[], maxColumns: number = 5): {
  valid: boolean;
  error?: string;
} {
  if (!Array.isArray(columns)) {
    return { valid: false, error: "Columns must be an array" };
  }

  const enabledCount = columns.filter((col) => col.enabled).length;
  if (enabledCount > maxColumns) {
    return { valid: false, error: `Maximum ${maxColumns} columns allowed` };
  }

  // Check for required fixed columns
  const hasDescription = columns.some((col) => col.id === "description" && col.enabled);
  const hasAmount = columns.some((col) => col.id === "amount" && col.enabled);
  
  if (!hasDescription || !hasAmount) {
    return { valid: false, error: "Description and Amount columns are required" };
  }

  return { valid: true };
}

/**
 * Merge custom column data with standard fields
 */
export function mergeItemData(
  standardFields: Record<string, any>,
  customData: Record<string, any>
): Record<string, any> {
  return { ...standardFields, ...customData };
}

/**
 * Extract custom column data from item
 */
export function extractCustomData(
  item: Record<string, any>,
  columns: ColumnConfig[]
): Record<string, any> {
  const customData: Record<string, any> = {};
  
  columns.forEach((col) => {
    if (col.isCustom && item[col.id] !== undefined) {
      customData[col.id] = item[col.id];
    }
  });
  
  return customData;
}

/**
 * Get column label by ID
 */
export function getColumnLabel(columns: ColumnConfig[], columnId: string): string {
  const column = columns.find((col) => col.id === columnId);
  return column?.label || columnId;
}

/**
 * Check if column is editable
 */
export function isColumnEditable(column: ColumnConfig): boolean {
  return column.type !== "fixed";
}

/**
 * Auto-save columns when they change
 */
export function autoSaveColumns(columns: ColumnConfig[]): void {
  const validation = validateColumns(columns);
  if (validation.valid) {
    saveColumns(columns);
  }
}
