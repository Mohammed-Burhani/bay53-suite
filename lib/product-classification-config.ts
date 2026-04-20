/**
 * Product Classification Configuration
 * Based on legacy config: ClassificationCategories and ClassificationDepth
 */

export interface ClassificationField {
  id: string;
  name: string;
  enabled: boolean;
}

export interface ClassificationConfig {
  classificationDepth: number;
  classificationCategories: string;
  fields: ClassificationField[];
}

export const DEFAULT_CLASSIFICATION_FIELDS: ClassificationField[] = [
  { id: "item_code", name: "Item Code", enabled: true },
  { id: "item", name: "Item", enabled: true },
  { id: "aliases", name: "Aliases", enabled: true },
  { id: "category", name: "Category", enabled: true },
  { id: "sub_cat", name: "Sub Cat", enabled: false },
  { id: "size", name: "Size", enabled: false },
  { id: "ref_no", name: "Ref No.", enabled: false },
  { id: "color", name: "Color", enabled: false },
];

export const DEFAULT_CLASSIFICATION_DEPTH = 4;

const STORAGE_KEY = "productClassificationConfig";

/**
 * Get classification config from localStorage
 */
export function getClassificationConfig(): ClassificationConfig {
  if (typeof window === "undefined") {
    return {
      classificationDepth: DEFAULT_CLASSIFICATION_DEPTH,
      classificationCategories: DEFAULT_CLASSIFICATION_FIELDS
        .filter(f => f.enabled)
        .map(f => f.name)
        .join(","),
      fields: DEFAULT_CLASSIFICATION_FIELDS,
    };
  }

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      return {
        classificationDepth: DEFAULT_CLASSIFICATION_DEPTH,
        classificationCategories: DEFAULT_CLASSIFICATION_FIELDS
          .filter(f => f.enabled)
          .map(f => f.name)
          .join(","),
        fields: DEFAULT_CLASSIFICATION_FIELDS,
      };
    }

    const parsed = JSON.parse(stored);
    return {
      classificationDepth: parsed.classificationDepth || DEFAULT_CLASSIFICATION_DEPTH,
      classificationCategories: parsed.classificationCategories || "",
      fields: parsed.fields || DEFAULT_CLASSIFICATION_FIELDS,
    };
  } catch (error) {
    console.error("Failed to parse classification config:", error);
    return {
      classificationDepth: DEFAULT_CLASSIFICATION_DEPTH,
      classificationCategories: "",
      fields: DEFAULT_CLASSIFICATION_FIELDS,
    };
  }
}

/**
 * Save classification config to localStorage
 */
export function saveClassificationConfig(config: Partial<ClassificationConfig>): void {
  if (typeof window === "undefined") return;

  try {
    const current = getClassificationConfig();
    const updated = { ...current, ...config };
    
    // Update classificationCategories string from fields
    if (config.fields) {
      updated.classificationCategories = config.fields
        .filter(f => f.enabled)
        .map(f => f.name)
        .join(",");
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (error) {
    console.error("Failed to save classification config:", error);
  }
}

/**
 * Get enabled classification field names as array
 */
export function getEnabledClassifications(): string[] {
  const config = getClassificationConfig();
  return config.fields.filter(f => f.enabled).map(f => f.name);
}

/**
 * Get classification field name by ID
 */
export function getClassificationName(id: string): string {
  const config = getClassificationConfig();
  const field = config.fields.find(f => f.id === id);
  return field?.name || id;
}

/**
 * Check if classification field is enabled
 */
export function isClassificationEnabled(id: string): boolean {
  const config = getClassificationConfig();
  const field = config.fields.find(f => f.id === id);
  return field?.enabled ?? false;
}

/**
 * Reset to default configuration
 */
export function resetClassificationConfig(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORAGE_KEY);
}
