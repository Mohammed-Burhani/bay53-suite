/**
 * LocalStorage utility for product classification labels
 * Provides instant access to labels without waiting for API
 */

export interface ClassificationLabels {
  item_code: string;
  item: string;
  aliases: string;
  category: string;
  sub_cat: string;
  size: string;
  ref_no: string;
  color: string;
}

const STORAGE_KEY = "Bay53_classification_labels";

const DEFAULT_LABELS: ClassificationLabels = {
  item_code: "Item Code",
  item: "Item",
  aliases: "Aliases",
  category: "Category",
  sub_cat: "Sub Cat",
  size: "Size",
  ref_no: "Ref No.",
  color: "Color",
};

/**
 * Get labels from localStorage
 */
export function getSavedLabels(): ClassificationLabels | null {
  if (typeof window === "undefined") return null;
  
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return null;
    
    const parsed = JSON.parse(saved);
    return parsed;
  } catch (error) {
    console.error("Error reading saved labels:", error);
    return null;
  }
}

/**
 * Save labels to localStorage and notify same-tab listeners
 */
export function saveLabels(labels: ClassificationLabels): boolean {
  if (typeof window === "undefined") return false;
  
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(labels));
    // Notify same-tab listeners (storage event only fires in other tabs)
    window.dispatchEvent(new CustomEvent("classification-labels-updated"));
    return true;
  } catch (error) {
    console.error("Error saving labels:", error);
    return false;
  }
}

/**
 * Clear saved labels
 */
export function clearSavedLabels(): boolean {
  if (typeof window === "undefined") return false;
  
  try {
    localStorage.removeItem(STORAGE_KEY);
    return true;
  } catch (error) {
    console.error("Error clearing labels:", error);
    return false;
  }
}

/**
 * Get labels with fallback chain: localStorage → defaults
 */
export function getLabelsWithFallback(): ClassificationLabels {
  const saved = getSavedLabels();
  return saved || DEFAULT_LABELS;
}

/**
 * Get default labels
 */
export function getDefaultLabels(): ClassificationLabels {
  return { ...DEFAULT_LABELS };
}
