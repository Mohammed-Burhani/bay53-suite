// ==================== Item Master Types ====================
// Shapes for POST /Item/Create, /Item/Update, /Item/GetById, /Item/Delete.
// Request shapes come from the backend swagger (ItemCreateViewModel); the
// swagger documents no response bodies, so GetById is read defensively.

import type { Item } from "@/lib/types/reports.types";
import type { ClassificationLabels } from "@/lib/product-classification-storage";

// A row in the item master listing. /Item/Search returns the base `Item`
// shape; the extra columns used by the legacy grid are optional because the
// search endpoint does not always include them.
export type ItemListRow = Item & {
  mrp?: number | null;
  description?: string | null;
  aliases?: string | null;
  barcode?: string | null;
  is_BOM?: boolean;
  reOrderQty?: number | null;
  reOrderDays?: number | null;
};

export interface ItemGetByIdPayload {
  id: number;
  sessionId: string;
}

export interface ItemDeletePayload {
  id: number;
  sessionId: string;
}

export interface UnitConv {
  unit_Conv_ID: number;
  item_Id: number;
  convUnit: number;
  convQty: number;
  convRate: number;
  [key: string]: unknown;
}

export interface BomMapRow {
  bomMasterId: number | null;
  itemId: number;
  includeItemId: number;
  unitId: number | null;
  rate: number;
  qty: number;
  hasStockEffect: boolean;
  includeBomMasterId: number | null;
}

// Full create/update body. Fields the form does not edit are carried through
// untouched from GetById (see `buildItemPayload`) so updates never wipe them.
export interface ItemSaveBody {
  id: number;
  name: string;
  description: string;
  vatPer: number;
  std_Sell_Rate: number;
  std_Unit: string;
  discount: number;
  minimum_Qty: number;
  maximum_Qty: number;
  regular: boolean;
  mfrCodeReq: boolean;
  item_CodeTxt: string;
  created_Date: string;
  modified_Date: string;
  barcode: string;
  last_Purchaserate: number;
  avg_Purchaserate: number;
  costing_On: number;
  is_BOM: boolean;
  reOrderQty: number;
  reOrderDays: number;
  mrp: number | null;
  onCalculation: boolean;
  unit_Conv: UnitConv[];
  bom_Map: BomMapRow[];
  aliases: string;
  hsnNo: string;
  productType: number;
  category: string;
  sizes: string;
  type: string;
  brand: string;
  itemGroup: string;
  isActive: boolean;
}

export type ItemSavePayload = ItemSaveBody & { sessionId: string };

// Form state. Numbers are kept as strings so inputs can be empty while typing.
export interface ItemFormValues {
  item_CodeTxt: string;
  name: string;
  aliases: string;
  sizes: string;
  type: string;
  category: string;
  brand: string;
  itemGroup: string;
  barcode: string;
  hsnNo: string;
  vatPer: string;
  mrp: string;
  std_Sell_Rate: string;
  discount: string;
  std_Unit: string;
  productType: number;
  costing_On: number;
  last_Purchaserate: string;
  avg_Purchaserate: string;
  minimum_Qty: string;
  maximum_Qty: string;
  reOrderQty: string;
  reOrderDays: string;
  regular: boolean;
  mfrCodeReq: boolean;
  onCalculation: boolean;
  is_BOM: boolean;
  isActive: boolean;
  description: string;
  bom_Map: BomFormRow[];
}

export interface BomFormRow {
  includeItemId: number | null;
  qty: string;
  hasStockEffect: boolean;
  // The row as returned by GetById, so ids the form doesn't edit survive a save.
  source?: Record<string, unknown>;
}

// Enum values are not documented by the API — confirm against the backend.
export const COSTING_ON_OPTIONS = [
  { value: 0, label: "Standard" },
  { value: 1, label: "Last Purchase" },
  { value: 2, label: "Average" },
] as const;

export const PRODUCT_TYPE_OPTIONS = [
  { value: 0, label: "Goods" },
  { value: 1, label: "Service" },
] as const;

// The item attribute columns, in display order. `field` is the Item API field;
// `label` is the per-tenant classification label key (Settings → Product
// Classification). Mapping follows `parseItemCode` in lib/utils/item-parser.ts.
export const ITEM_ATTRIBUTES: {
  field: "sizes" | "type" | "category" | "brand" | "itemGroup";
  label: keyof ClassificationLabels;
}[] = [
  { field: "sizes", label: "size" },
  { field: "type", label: "category" },
  { field: "category", label: "sub_cat" },
  { field: "brand", label: "ref_no" },
  { field: "itemGroup", label: "color" },
];
