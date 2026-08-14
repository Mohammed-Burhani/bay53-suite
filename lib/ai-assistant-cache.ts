/**
 * AI Assistant Data Cache - IndexedDB storage with smart merge algorithm
 * Stores module data locally to avoid re-fetching and sending full data to Gemini every time
 */

// Types for cached data
export interface CachedModuleData {
  moduleName: string;
  data: unknown[];
  lastUpdated: number;
  dataHash: string; // Simple hash to detect changes
  version: number;
}

export interface CacheConfig {
  dbName: string;
  storeName: string;
  version: number;
  maxAge: number; // Max age in milliseconds before considering stale
}

const DEFAULT_CONFIG: CacheConfig = {
  dbName: "Bay53_AIAssistant_Cache",
  storeName: "moduleData",
  version: 1,
  maxAge: 24 * 60 * 60 * 1000, // 24 hours
};

// Simple hash function for data comparison
function generateDataHash(data: unknown[]): string {
  try {
    // Create a simple hash based on data length and first/last few items
    const str = JSON.stringify(data.slice(0, 3).concat(data.slice(-3)));
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return hash.toString(36);
  } catch {
    return "0";
  }
}

// Summarize invoice data for AI context - reduces tokens while preserving analytical capability
export function summarizeForAI(data: unknown[], moduleName: string): {
  summary: Record<string, unknown>;
  sample: unknown[];
} {
  if (!data || data.length === 0) {
    return { summary: { count: 0 }, sample: [] };
  }

  const items = data as Array<Record<string, unknown>>;
  const count = items.length;

  // Detect data type and compute relevant summaries
  const first = items[0];
  const keys = Object.keys(first);

  // Check if it's invoice-like data (has grandTotal, invCode, etc.)
  const isInvoice = 'grandTotal' in first || 'invCode' in first || 'bill_No' in first;
  const isParty = 'partyCode' in first || 'ledger_ID' in first;
  const isProduct = 'itemCode' in first || 'item_ID' in first;

  let summary: Record<string, unknown> = { count };

  if (isInvoice) {
    // Invoice analytics
    let totalAmount = 0;
    let paidAmount = 0;
    let unpaidAmount = 0;
    const partyTotals = new Map<string, { amount: number; count: number }>();
    const dateTotals = new Map<string, { amount: number; count: number }>();
    const statusCounts = { authorized: 0, pending: 0 };

    items.forEach(inv => {
      const grandTotal = Number(inv.grandTotal) || 0;
      totalAmount += grandTotal;

      // Payment status
      const recBy = String(inv.recBy || '').toLowerCase();
      const isAuthorized = Boolean(inv.isAuthorized);
      if (isAuthorized || recBy.includes('cash') || recBy.includes('paid')) {
        paidAmount += grandTotal;
        statusCounts.authorized++;
      } else {
        unpaidAmount += grandTotal;
        statusCounts.pending++;
      }

      // Party aggregation
      const partyName = String(inv.partyName || 'Unknown');
      const existing = partyTotals.get(partyName) || { amount: 0, count: 0 };
      existing.amount += grandTotal;
      existing.count += 1;
      partyTotals.set(partyName, existing);

      // Date aggregation (monthly)
      const dateStr = String(inv.date || '');
      const monthKey = dateStr.substring(0, 7); // YYYY-MM
      const dateExisting = dateTotals.get(monthKey) || { amount: 0, count: 0 };
      dateExisting.amount += grandTotal;
      dateExisting.count += 1;
      dateTotals.set(monthKey, dateExisting);
    });

    // Top parties by amount
    const topParties = Array.from(partyTotals.entries())
      .sort((a, b) => b[1].amount - a[1].amount)
      .slice(0, 10)
      .map(([name, data]) => ({ name, total: data.amount, count: data.count }));

    // Monthly trend
    const monthlyTrend = Array.from(dateTotals.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .slice(-12)
      .map(([month, data]) => ({ month, total: data.amount, count: data.count }));

    summary = {
      count,
      totalAmount: Math.round(totalAmount),
      paidAmount: Math.round(paidAmount),
      unpaidAmount: Math.round(unpaidAmount),
      avgAmount: Math.round(totalAmount / count),
      statusCounts,
      topParties,
      monthlyTrend,
    };
  } else if (isParty) {
    // Party analytics
    const groupCounts = new Map<string, number>();
    items.forEach(p => {
      const group = String(p.groupName || p.group || 'Unknown');
      groupCounts.set(group, (groupCounts.get(group) || 0) + 1);
    });
    summary = {
      count,
      groups: Array.from(groupCounts.entries()).map(([group, count]) => ({ group, count })),
    };
  } else if (isProduct) {
    // Product/Stock analytics
    let totalStock = 0;
    let totalValue = 0;
    const lowStockItems: unknown[] = [];
    const categoryCounts = new Map<string, number>();

    items.forEach(prod => {
      const qty = Number(prod.currentStck || prod.qty || prod.stock || 0);
      const rate = Number(prod.rate || prod.std_Rate || prod.saleRate || 0);
      const reorder = Number(prod.reorderLevel || prod.minLevel || 0);
      const category = String(prod.categoryName || prod.groupName || 'Unknown');

      totalStock += qty;
      totalValue += qty * rate;
      categoryCounts.set(category, (categoryCounts.get(category) || 0) + 1);

      if (reorder > 0 && qty <= reorder) {
        lowStockItems.push({
          name: prod.itemName || prod.mfrItemName || prod.name,
          stock: qty,
          reorder,
        });
      }
    });

    summary = {
      count,
      totalStock: Math.round(totalStock),
      totalValue: Math.round(totalValue),
      avgStock: Math.round(totalStock / count),
      lowStockCount: lowStockItems.length,
      lowStockItems: lowStockItems.slice(0, 10),
      categories: Array.from(categoryCounts.entries()).map(([cat, cnt]) => ({ category: cat, count: cnt })),
    };
  } else {
    // Generic summary
    summary = { count };
  }

  // Return compact sample (first 3, last 3, and 3 from middle for variety)
  const sampleSize = Math.min(9, count);
  let sample: unknown[] = [];
  if (count <= 9) {
    sample = items;
  } else {
    sample = [
      ...items.slice(0, 3),
      ...items.slice(Math.floor(count / 2) - 1, Math.floor(count / 2) + 2),
      ...items.slice(-3),
    ];
  }

  return { summary, sample };
}

// Deep equality check for objects
function deepEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (a === null || b === null) return false;
  if (typeof a !== typeof b) return false;
  if (typeof a !== "object") return false;

  const keysA = Object.keys(a as object);
  const keysB = Object.keys(b as object);

  if (keysA.length !== keysB.length) return false;

  return keysA.every(key => deepEqual(
    (a as Record<string, unknown>)[key],
    (b as Record<string, unknown>)[key]
  ));
}

// Compare two arrays of objects by a unique identifier
function compareArraysById<T extends { id?: string | number; [key: string]: unknown }>(
  local: T[],
  remote: T[],
  idField: string = "id"
): { added: T[]; updated: T[]; unchanged: T[]; removed: T[] } {
  const localMap = new Map<string, T>();
  const remoteMap = new Map<string, T>();

  local.forEach(item => {
    const id = item[idField] !== undefined ? String(item[idField]) : JSON.stringify(item);
    localMap.set(id, item);
  });

  remote.forEach(item => {
    const id = item[idField] !== undefined ? String(item[idField]) : JSON.stringify(item);
    remoteMap.set(id, item);
  });

  const added: T[] = [];
  const updated: T[] = [];
  const unchanged: T[] = [];
  const removed: T[] = [];

  // Check remote items
  remote.forEach(remoteItem => {
    const id = remoteItem[idField] !== undefined ? String(remoteItem[idField]) : JSON.stringify(remoteItem);
    const localItem = localMap.get(id);

    if (!localItem) {
      added.push(remoteItem);
    } else if (!deepEqual(localItem, remoteItem)) {
      updated.push(remoteItem);
    } else {
      unchanged.push(remoteItem);
    }
  });

  // Check for removed items (in local but not in remote)
  local.forEach(localItem => {
    const id = localItem[idField] !== undefined ? String(localItem[idField]) : JSON.stringify(localItem);
    if (!remoteMap.has(id)) {
      removed.push(localItem);
    }
  });

  return { added, updated, unchanged, removed };
}

// IndexedDB wrapper
class AIAssistantCache {
  private db: IDBDatabase | null = null;
  private config: CacheConfig;
  private initPromise: Promise<void> | null = null;

  constructor(config: Partial<CacheConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  private async init(): Promise<void> {
    if (this.db) return;
    if (this.initPromise) return this.initPromise;

    this.initPromise = new Promise((resolve, reject) => {
      if (typeof window === "undefined") {
        reject(new Error("IndexedDB not available in server context"));
        return;
      }

      const request = indexedDB.open(this.config.dbName, this.config.version);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(this.config.storeName)) {
          db.createObjectStore(this.config.storeName, { keyPath: "moduleName" });
        }
      };
    });

    return this.initPromise;
  }

  /**
   * Get cached data for a module
   */
  async get(moduleName: string): Promise<CachedModuleData | null> {
    await this.init();
    if (!this.db) return null;

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(this.config.storeName, "readonly");
      const store = transaction.objectStore(this.config.storeName);
      const request = store.get(moduleName);

      request.onsuccess = () => {
        const result = request.result as CachedModuleData | undefined;
        if (!result) {
          resolve(null);
          return;
        }

        // Check if data is stale
        const age = Date.now() - result.lastUpdated;
        if (age > this.config.maxAge) {
          resolve(null); // Treat as cache miss
          return;
        }

        resolve(result);
      };

      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Save data for a module
   */
  async set(moduleName: string, data: unknown[]): Promise<void> {
    await this.init();
    if (!this.db) return;

    const cachedData: CachedModuleData = {
      moduleName,
      data,
      lastUpdated: Date.now(),
      dataHash: generateDataHash(data),
      version: 1,
    };

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(this.config.storeName, "readwrite");
      const store = transaction.objectStore(this.config.storeName);
      const request = store.put(cachedData);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Smart merge: Compare local cached data with newly fetched data
   * Returns merged data and info about what changed
   */
  async smartMerge(
    moduleName: string,
    fetchedData: unknown[],
    idField: string = "id"
  ): Promise<{
    mergedData: unknown[];
    hasChanges: boolean;
    stats: { added: number; updated: number; unchanged: number; removed: number };
  }> {
    const cached = await this.get(moduleName);

    // If fetched data is empty, don't overwrite cache - return cached data instead
    if (!fetchedData || fetchedData.length === 0) {
      if (cached) {
        // Return cached data, don't pollute cache with empty array
        return {
          mergedData: cached.data,
          hasChanges: false,
          stats: { added: 0, updated: 0, unchanged: cached.data.length, removed: 0 },
        };
      }
      // No cache and no fresh data - return empty but don't store
      return {
        mergedData: [],
        hasChanges: false,
        stats: { added: 0, updated: 0, unchanged: 0, removed: 0 },
      };
    }

    // No cache exists - first time with actual data
    if (!cached) {
      await this.set(moduleName, fetchedData);
      return {
        mergedData: fetchedData,
        hasChanges: true,
        stats: { added: fetchedData.length, updated: 0, unchanged: 0, removed: 0 },
      };
    }

    // Try to compare by ID field if data looks like array of objects with IDs
    // Use the idField parameter (e.g., "invCode", "partyCode", "itemCode", etc.)
    const cachedArray = cached.data as Array<{ [key: string]: unknown }>;
    const fetchedArray = fetchedData as Array<{ [key: string]: unknown }>;

    // Check if the configured idField exists in the data
    const hasIds = cachedArray.length > 0 && fetchedArray.length > 0 &&
      (cachedArray[0]?.[idField] !== undefined || fetchedArray[0]?.[idField] !== undefined);

    if (hasIds) {
      const comparison = compareArraysById(cachedArray, fetchedArray, idField);

      // SMART MERGE: Accumulate ALL data, never lose it.
      // - Keep all cached items (including ones not in the new fetch — they're still valid historical data)
      // - Overlay new/updated items from the fresh fetch
      // - This ensures the AI always sees the complete dataset, not just the latest page
      const cachedById = new Map<string, unknown>();
      cachedArray.forEach(item => {
        const id = (item as Record<string, unknown>)[idField] !== undefined
          ? String((item as Record<string, unknown>)[idField])
          : JSON.stringify(item);
        cachedById.set(id, item);
      });

      // Start with all cached data
      const mergedMap = new Map<string, unknown>(cachedById);

      // Overlay fresh data (added + updated replace cached versions)
      [...comparison.added, ...comparison.updated].forEach(item => {
        const id = (item as Record<string, unknown>)[idField] !== undefined
          ? String((item as Record<string, unknown>)[idField])
          : JSON.stringify(item);
        mergedMap.set(id, item);
      });

      const mergedData = Array.from(mergedMap.values());

      const hasChanges = comparison.added.length > 0 || comparison.updated.length > 0;

      if (hasChanges || mergedData.length !== cached.data.length) {
        await this.set(moduleName, mergedData);
      }

      return {
        mergedData,
        hasChanges,
        stats: {
          added: comparison.added.length,
          updated: comparison.updated.length,
          unchanged: comparison.unchanged.length,
          removed: comparison.removed.length,
        },
      };
    }

    // Fallback: Compare by hash if no IDs
    const newHash = generateDataHash(fetchedData);
    if (newHash !== cached.dataHash) {
      // Data changed - use new data but preserve some local context
      // For simplicity, replace with new data
      await this.set(moduleName, fetchedData);
      return {
        mergedData: fetchedData,
        hasChanges: true,
        stats: { added: fetchedData.length, updated: 0, unchanged: 0, removed: 0 },
      };
    }

    // No changes - use cached data
    return {
      mergedData: cached.data,
      hasChanges: false,
      stats: { added: 0, updated: 0, unchanged: cached.data.length, removed: 0 },
    };
  }

  /**
   * Clear cache for a specific module
   */
  async clear(moduleName: string): Promise<void> {
    await this.init();
    if (!this.db) return;

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(this.config.storeName, "readwrite");
      const store = transaction.objectStore(this.config.storeName);
      const request = store.delete(moduleName);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Clear all cache
   */
  async clearAll(): Promise<void> {
    await this.init();
    if (!this.db) return;

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(this.config.storeName, "readwrite");
      const store = transaction.objectStore(this.config.storeName);
      const request = store.clear();

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Get all cached modules info
   */
  async getAllModules(): Promise<Array<{ moduleName: string; lastUpdated: number; itemCount: number }>> {
    await this.init();
    if (!this.db) return [];

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(this.config.storeName, "readonly");
      const store = transaction.objectStore(this.config.storeName);
      const request = store.getAll();

      request.onsuccess = () => {
        const results = request.result as CachedModuleData[];
        resolve(results.map(r => ({
          moduleName: r.moduleName,
          lastUpdated: r.lastUpdated,
          itemCount: r.data.length,
        })));
      };

      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Check if cache exists and is fresh for a module
   */
  async hasFreshCache(moduleName: string): Promise<boolean> {
    const cached = await this.get(moduleName);
    return cached !== null;
  }
}

// Singleton instance
export const aiAssistantCache = new AIAssistantCache();

/**
 * Hook for React components to use the cache
 */
export function useAIAssistantCache() {
  return aiAssistantCache;
}

// Helper to determine ID field based on module type
export function getIdFieldForModule(moduleName: string): string {
  const moduleNameLower = moduleName.toLowerCase();

  if (moduleNameLower.includes("invoice") || moduleNameLower.includes("sales") || moduleNameLower.includes("purchase")) {
    return "invCode";
  }
  if (moduleNameLower.includes("party") || moduleNameLower.includes("customer") || moduleNameLower.includes("supplier")) {
    return "partyCode";
  }
  if (moduleNameLower.includes("product") || moduleNameLower.includes("item") || moduleNameLower.includes("stock")) {
    return "itemCode";
  }
  if (moduleNameLower.includes("group")) {
    return "groupCode";
  }
  if (moduleNameLower.includes("ledger")) {
    return "ledgerCode";
  }

  return "id"; // Default fallback
}