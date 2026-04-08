// ==================== Item Parser Utility ====================
// Parse item_CodeTxt into 6 separate fields

import type { Item, ItemAttributes } from "@/lib/types/reports.types";

/**
 * Parse item_CodeTxt into 6 components
 * Format: item_CodeTxt = "2PNNNM2" where each character represents a field
 * This is a placeholder - adjust based on actual format
 */
export function parseItemCode(item: Item): ItemAttributes {
  const itemCode = item.item_CodeTxt || "";
  
  // Extract components from item_CodeTxt
  // Adjust this logic based on your actual item code format
  // For now, using a simple approach - customize as needed
  
  return {
    itemCode: itemCode,
    name: item.name || "",
    size: item.sizes || "",
    material: item.type || "", // Using 'type' as material
    quality: item.category || "", // Using 'category' as quality
    brand: item.brand || "",
  };
}

/**
 * Extract unique values for each attribute from items array
 */
export function extractUniqueAttributes(items: Item[]) {
  const itemCodes = new Set<string>();
  const names = new Set<string>();
  const sizes = new Set<string>();
  const materials = new Set<string>();
  const qualities = new Set<string>();
  const brands = new Set<string>();

  items.forEach((item) => {
    const attrs = parseItemCode(item);
    if (attrs.itemCode) itemCodes.add(attrs.itemCode);
    if (attrs.name) names.add(attrs.name);
    if (attrs.size) sizes.add(attrs.size);
    if (attrs.material) materials.add(attrs.material);
    if (attrs.quality) qualities.add(attrs.quality);
    if (attrs.brand) brands.add(attrs.brand);
  });

  return {
    itemCodes: Array.from(itemCodes).sort(),
    names: Array.from(names).sort(),
    sizes: Array.from(sizes).sort(),
    materials: Array.from(materials).sort(),
    qualities: Array.from(qualities).sort(),
    brands: Array.from(brands).sort(),
  };
}

/**
 * Filter items based on selected attributes
 */
export function filterItemsByAttributes(
  items: Item[],
  filters: Partial<ItemAttributes>
): Item[] {
  return items.filter((item) => {
    const attrs = parseItemCode(item);
    
    if (filters.itemCode && attrs.itemCode !== filters.itemCode) return false;
    if (filters.name && attrs.name !== filters.name) return false;
    if (filters.size && attrs.size !== filters.size) return false;
    if (filters.material && attrs.material !== filters.material) return false;
    if (filters.quality && attrs.quality !== filters.quality) return false;
    if (filters.brand && attrs.brand !== filters.brand) return false;
    
    return true;
  });
}

/**
 * Get available options for a specific attribute based on current filters
 * Optimized for performance with large datasets
 */
export function getAvailableOptions(
  items: Item[],
  currentFilters: Partial<ItemAttributes>,
  attribute: keyof ItemAttributes
): string[] {
  // First filter items by all OTHER attributes
  const filtersWithoutCurrent = { ...currentFilters };
  delete filtersWithoutCurrent[attribute];
  
  // Use Set for O(1) lookups and automatic deduplication
  const values = new Set<string>();
  
  // Single pass through items - O(n)
  for (const item of items) {
    const attrs = parseItemCode(item);
    
    // Check if item matches all other filters
    let matches = true;
    if (filtersWithoutCurrent.itemCode && attrs.itemCode !== filtersWithoutCurrent.itemCode) {
      matches = false;
    } else if (filtersWithoutCurrent.name && attrs.name !== filtersWithoutCurrent.name) {
      matches = false;
    } else if (filtersWithoutCurrent.size && attrs.size !== filtersWithoutCurrent.size) {
      matches = false;
    } else if (filtersWithoutCurrent.material && attrs.material !== filtersWithoutCurrent.material) {
      matches = false;
    } else if (filtersWithoutCurrent.quality && attrs.quality !== filtersWithoutCurrent.quality) {
      matches = false;
    } else if (filtersWithoutCurrent.brand && attrs.brand !== filtersWithoutCurrent.brand) {
      matches = false;
    }
    
    if (matches) {
      const value = attrs[attribute];
      if (value) values.add(value);
    }
  }
  
  return Array.from(values).sort();
}
