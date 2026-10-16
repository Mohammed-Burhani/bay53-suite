// Pure helpers for the Item master form: GetById → form values → save payload,
// plus list filtering. Kept free of React so it is easy to test.

import type {
  BomFormRow,
  BomMapRow,
  ItemFormValues,
  ItemListRow,
  ItemSaveBody,
  UnitConv,
} from "@/lib/types/item.types";

type Raw = Record<string, unknown>;

export const EMPTY_ITEM_FORM: ItemFormValues = {
  item_CodeTxt: "",
  name: "",
  aliases: "",
  sizes: "",
  type: "",
  category: "",
  brand: "",
  itemGroup: "",
  barcode: "",
  hsnNo: "",
  vatPer: "",
  mrp: "",
  std_Sell_Rate: "",
  discount: "",
  std_Unit: "",
  productType: 0,
  costing_On: 0,
  last_Purchaserate: "0",
  avg_Purchaserate: "0",
  minimum_Qty: "",
  maximum_Qty: "",
  reOrderQty: "",
  reOrderDays: "",
  regular: true,
  mfrCodeReq: false,
  onCalculation: false,
  is_BOM: false,
  isActive: true,
  stockMaintain: true,
  isAllowNagativeStock: false,
  expDate: false,
  multiRate: false,
  salesAccountLedgerID: null,
  purchaseAccountLedgerID: null,
  description: "",
  bom_Map: [],
};

// Every remaining ItemCreateViewModel field the form does not expose, so a new item is
// created with explicit defaults rather than whatever the server infers for a missing key.
// `0` for an id / UOM / enum means "not set".
const ITEM_CREATE_DEFAULTS: Raw = {
  slabCategory: 0,
  rateDealer: 0,
  rateRetailer: 0,
  sizeQty: 0,
  usedFor: 0,
  rebate: 0,
  sugComission: 0,
  landCostDiscount: 0,
  taxEffect: 0,
  cess: 0,
  wtKg: 0,
  cbSqft: 0,
  isMultiUOM: false,
  baseUOM: 0,
  salesUOM: 0,
  purchaseUOM: 0,
  length: 0,
  width: 0,
  thickness: 0,
  weight: 0,
  updatePL: false,
  // The server binds this to a non-string type, so "" fails JSON conversion; null is accepted.
  steelCutFarmulaOn: null,
  machineWorkRate: 0,
  dia: 0,
  af: 0,
  rateWO: 0,
  uniqueItemID: "",
  machineWorkReq: false,
  qcReq: false,
  qcTypeId: 0,
  classification: 0,
  rackLocationId: 0,
  rackLocationName: "",
  itemCodeSuffix: "",
  oldSwRefId: 0,
  areaCalculationOn: 0,
  calModeOn: 0,
  stockOn: 0,
  calModeEffectOn: 0,
  itemGroupMain: "",
};

// First defined value among differently-cased keys (the API is inconsistent,
// e.g. `last_Purchaserate` on create vs `last_PurchaseRate` on search).
function pick(raw: Raw, ...keys: string[]): unknown {
  for (const key of keys) {
    if (raw[key] !== undefined && raw[key] !== null) return raw[key];
  }
  return undefined;
}

const str = (v: unknown) => (v === undefined || v === null ? "" : String(v));
const numStr = (v: unknown) => (v === undefined || v === null || v === "" ? "" : String(v));
// Formik turns <input type="number"> edits into numbers, so form values may be string or number.
const isBlank = (v: string | number) => String(v).trim() === "";
const num = (v: string | number) => (isBlank(v) ? 0 : Number(v));
const bool = (v: unknown, fallback = false) => (typeof v === "boolean" ? v : fallback);

export function getItemId(raw: Raw): number {
  return Number(pick(raw, "id", "item_ID", "itemId") ?? 0);
}

export function rawToFormValues(raw: Raw): ItemFormValues {
  const bomRaw = pick(raw, "bom_Map", "bomMap");
  const bom: BomFormRow[] = Array.isArray(bomRaw)
    ? (bomRaw as Raw[]).map((row) => ({
        includeItemId: row.includeItemId === undefined ? null : Number(row.includeItemId),
        qty: numStr(row.qty),
        hasStockEffect: bool(row.hasStockEffect),
        source: row,
      }))
    : [];

  return {
    item_CodeTxt: str(raw.item_CodeTxt),
    name: str(raw.name),
    aliases: str(raw.aliases),
    sizes: str(raw.sizes),
    type: str(raw.type),
    category: str(raw.category),
    brand: str(raw.brand),
    itemGroup: str(raw.itemGroup),
    barcode: str(raw.barcode),
    hsnNo: str(pick(raw, "hsnNo", "tariff_No")),
    vatPer: numStr(raw.vatPer),
    mrp: numStr(raw.mrp),
    std_Sell_Rate: numStr(raw.std_Sell_Rate),
    discount: numStr(raw.discount),
    std_Unit: str(raw.std_Unit),
    productType: Number(raw.productType ?? 0),
    costing_On: Number(raw.costing_On ?? 0),
    last_Purchaserate: numStr(pick(raw, "last_Purchaserate", "last_PurchaseRate")) || "0",
    avg_Purchaserate: numStr(pick(raw, "avg_Purchaserate", "avg_PurchaseRate")) || "0",
    minimum_Qty: numStr(raw.minimum_Qty),
    maximum_Qty: numStr(raw.maximum_Qty),
    reOrderQty: numStr(raw.reOrderQty),
    reOrderDays: numStr(raw.reOrderDays),
    regular: bool(raw.regular, true),
    mfrCodeReq: bool(raw.mfrCodeReq),
    onCalculation: bool(raw.onCalculation),
    is_BOM: bool(pick(raw, "is_BOM", "isBOM")),
    isActive: bool(raw.isActive, true),
    stockMaintain: bool(raw.stockMaintain, true),
    isAllowNagativeStock: bool(raw.isAllowNagativeStock),
    expDate: bool(raw.expDate),
    multiRate: bool(raw.multiRate),
    salesAccountLedgerID: Number(raw.salesAccountLedgerID) || null,
    purchaseAccountLedgerID: Number(raw.purchaseAccountLedgerID) || null,
    description: str(raw.description),
    bom_Map: bom,
  };
}

// Builds the Create/Update body. `raw` is the record from GetById when editing;
// it is spread first so fields the form does not expose (rates, UOM, ledgers…)
// are written back unchanged instead of being reset to defaults.
export function buildItemPayload(
  values: ItemFormValues,
  raw: Raw | null
): ItemSaveBody {
  const now = new Date().toISOString();
  const base: Raw = raw ?? ITEM_CREATE_DEFAULTS;

  const bom_Map: BomMapRow[] = values.is_BOM
    ? values.bom_Map
        .filter((row) => row.includeItemId)
        .map((row) => ({
          bomMasterId: null,
          itemId: raw ? getItemId(raw) : 0,
          unitId: null,
          rate: 0,
          includeBomMasterId: null,
          ...(row.source as Partial<BomMapRow> | undefined),
          includeItemId: row.includeItemId as number,
          qty: num(row.qty),
          hasStockEffect: row.hasStockEffect,
        }))
    : [];

  const unitConvRaw = pick(base, "unit_Conv", "unitConv");

  return {
    ...base,
    id: raw ? getItemId(raw) : 0,
    name: values.name.trim(),
    item_CodeTxt: values.item_CodeTxt.trim(),
    aliases: values.aliases.trim(),
    sizes: values.sizes.trim(),
    type: values.type.trim(),
    category: values.category.trim(),
    brand: values.brand.trim(),
    itemGroup: values.itemGroup.trim(),
    barcode: values.barcode.trim(),
    hsnNo: values.hsnNo.trim(),
    vatPer: num(values.vatPer),
    mrp: isBlank(values.mrp) ? null : Number(values.mrp),
    std_Sell_Rate: num(values.std_Sell_Rate),
    discount: num(values.discount),
    std_Unit: values.std_Unit.trim(),
    productType: values.productType,
    costing_On: values.costing_On,
    last_Purchaserate: num(values.last_Purchaserate),
    avg_Purchaserate: num(values.avg_Purchaserate),
    minimum_Qty: num(values.minimum_Qty),
    maximum_Qty: num(values.maximum_Qty),
    reOrderQty: num(values.reOrderQty),
    reOrderDays: Math.trunc(num(values.reOrderDays)),
    regular: values.regular,
    mfrCodeReq: values.mfrCodeReq,
    onCalculation: values.onCalculation,
    is_BOM: values.is_BOM,
    isActive: values.isActive,
    tariff_No: values.hsnNo.trim(),
    stockMaintain: values.stockMaintain,
    isAllowNagativeStock: values.isAllowNagativeStock,
    expDate: values.expDate,
    multiRate: values.multiRate,
    salesAccountLedgerID: values.salesAccountLedgerID ?? 0,
    purchaseAccountLedgerID: values.purchaseAccountLedgerID ?? 0,
    description: values.description.trim(),
    created_Date: str(base.created_Date) || now,
    modified_Date: now,
    unit_Conv: Array.isArray(unitConvRaw) ? (unitConvRaw as UnitConv[]) : [],
    bom_Map,
  };
}

// Create returns an undocumented body; accept a bare id or an object carrying one.
export function extractCreatedId(res: unknown): number | null {
  if (typeof res === "number" && res > 0) return res;
  if (typeof res === "string" && /^\d+$/.test(res.trim())) return Number(res);
  if (res && typeof res === "object") {
    const id = getItemId(res as Raw);
    if (id > 0) return id;
  }
  return null;
}

// "Particular" as the legacy list shows it: name-size-type-brand.
export function itemParticular(item: ItemListRow): string {
  if (item.particular) return item.particular;
  return [item.name, item.sizes, item.type, item.brand].filter(Boolean).join("-");
}

export interface ItemFilters {
  code: string;
  name: string;
  hsn: string;
  sizes: string;
  type: string;
  category: string;
  brand: string;
  itemGroup: string;
}

export const EMPTY_ITEM_FILTERS: ItemFilters = {
  code: "",
  name: "",
  hsn: "",
  sizes: "",
  type: "",
  category: "",
  brand: "",
  itemGroup: "",
};

const ATTRIBUTE_KEYS = ["sizes", "type", "category", "brand", "itemGroup"] as const;

export function filterItems(items: ItemListRow[], f: ItemFilters): ItemListRow[] {
  const code = f.code.trim().toLowerCase();
  const name = f.name.trim().toLowerCase();
  const hsn = f.hsn.trim().toLowerCase();
  return items.filter((item) => {
    if (code && !(item.item_CodeTxt ?? "").toLowerCase().includes(code)) return false;
    if (hsn && !(item.hsnNo ?? "").toLowerCase().includes(hsn)) return false;
    if (name && !itemParticular(item).toLowerCase().includes(name)) return false;
    for (const key of ATTRIBUTE_KEYS) {
      const wanted = f[key].trim().toLowerCase();
      if (wanted && !(item[key] ?? "").toLowerCase().includes(wanted)) return false;
    }
    return true;
  });
}

export function distinctValues(items: ItemListRow[], pickValue: (i: ItemListRow) => string | null | undefined) {
  const set = new Set<string>();
  for (const item of items) {
    const v = pickValue(item)?.trim();
    if (v) set.add(v);
  }
  return Array.from(set).sort((a, b) => a.localeCompare(b));
}
