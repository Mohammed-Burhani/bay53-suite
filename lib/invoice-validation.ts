// ==================== Invoice Form Validation ====================
// One rule set shared by every invoice create/edit form (InvoiceCreateForm).
// GLOBAL_RULES apply to all invoice types by default. A type can override
// that default in INVOICE_TYPE_VALIDATION_OVERRIDES by disabling specific
// global rule ids (e.g. a Quotation has no payment yet, so "recBy"/"recAmt"
// don't apply) and/or appending its own extra rules local to that type.

export interface InvoiceValidationContext {
  invType: number;
  selectedLedgerIds: number[];
  spCode: number | null;
  billNo: string;
  recBy: string;
  recAmt: number;
  lineItems: { item_ID: number; std_Qty: number }[];
}

export interface InvoiceValidationRule {
  id: string;
  message: string;
  check: (ctx: InvoiceValidationContext) => boolean; // true = passes
}

export const GLOBAL_RULES: InvoiceValidationRule[] = [
  { id: "party", message: "Select a party", check: (c) => c.selectedLedgerIds.length > 0 },
  { id: "stockPlace", message: "Select a stock place", check: (c) => c.spCode !== null },
  { id: "billNo", message: "Bill No. is required", check: (c) => c.billNo.trim().length > 0 },
  { id: "recBy", message: "Rec By is required", check: (c) => c.recBy.trim().length > 0 },
  { id: "recAmt", message: "Rec Amount is required", check: (c) => c.recAmt > 0 },
  { id: "items", message: "Add at least one item", check: (c) => c.lineItems.length > 0 },
  {
    id: "itemPicked",
    message: "Pick an item for every line",
    check: (c) => c.lineItems.length === 0 || c.lineItems.every((li) => li.item_ID > 0),
  },
  {
    id: "itemQty",
    message: "Every line needs a quantity above zero",
    check: (c) => c.lineItems.length === 0 || c.lineItems.every((li) => li.std_Qty > 0),
  },
];

interface TypeOverride {
  disable?: string[]; // global rule ids to skip for this invType
  extra?: InvoiceValidationRule[]; // rules that only apply to this invType
}

// invType id -> local override. Types not listed here use GLOBAL_RULES unchanged.
export const INVOICE_TYPE_VALIDATION_OVERRIDES: Record<number, TypeOverride> = {
  4: { disable: ["recBy", "recAmt"] }, // Sales Quotation — no payment recorded yet
  5: { disable: ["recBy", "recAmt"] }, // Sales Order — no payment recorded yet
  6: { disable: ["recBy", "recAmt"] }, // Performa Invoice — no payment recorded yet
  8: { disable: ["recBy", "recAmt"] }, // Purchase Order — no payment recorded yet
  23: { disable: ["recBy", "recAmt", "stockPlace"] }, // Sales Enquiry — pre-stock, pre-payment
};

export function getActiveRules(invType: number): InvoiceValidationRule[] {
  const override = INVOICE_TYPE_VALIDATION_OVERRIDES[invType];
  const disabled = new Set(override?.disable ?? []);
  const base = GLOBAL_RULES.filter((r) => !disabled.has(r.id));
  return [...base, ...(override?.extra ?? [])];
}

export function getValidationIssues(ctx: InvoiceValidationContext): string[] {
  return getActiveRules(ctx.invType)
    .filter((r) => !r.check(ctx))
    .map((r) => r.message);
}
