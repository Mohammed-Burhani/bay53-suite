"use client";

import { useMemo } from "react";
import { Formik, Form } from "formik";
import * as Yup from "yup";
import { toast } from "sonner";
import { Loader2, Plus, Save, Trash2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Flag, NumberInput, Row, Section, fieldError } from "@/components/master/shared/form-parts";
import { ItemSearchCombobox } from "@/components/ui/item-search-combobox";
import { useClassificationLabels } from "@/lib/contexts/ClassificationContext";
import { useItems } from "@/lib/hooks/useReports";
import { useItemById, useItemCreate, useItemUpdate } from "@/lib/hooks/useItemMaster";
import { getApiErrorMessage } from "@/lib/utils/api-error";
import {
  EMPTY_ITEM_FORM,
  buildItemPayload,
  distinctValues,
  getItemId,
  rawToFormValues,
} from "@/lib/items/item-form";
import {
  COSTING_ON_OPTIONS,
  ITEM_ATTRIBUTES,
  PRODUCT_TYPE_OPTIONS,
  type ItemFormValues,
  type ItemListRow,
  type UnitConv,
} from "@/lib/types/item.types";

const nonNegative = (label: string) =>
  Yup.string().test("non-negative", `${label} must be a number ≥ 0`, (v) => !v || (!Number.isNaN(Number(v)) && Number(v) >= 0));

const percent = (label: string) =>
  Yup.string().test("percent", `${label} must be between 0 and 100`, (v) => !v || (!Number.isNaN(Number(v)) && Number(v) >= 0 && Number(v) <= 100));

const itemSchema = Yup.object({
  name: Yup.string().trim().required("Required"),
  std_Unit: Yup.string().trim().required("Required"),
  vatPer: percent("Tax %"),
  discount: percent("Discount"),
  mrp: nonNegative("MRP"),
  std_Sell_Rate: nonNegative("Sell rate"),
  minimum_Qty: nonNegative("Min qty"),
  maximum_Qty: nonNegative("Max qty"),
  reOrderQty: nonNegative("Reorder qty"),
  reOrderDays: nonNegative("Reorder days"),
});

interface ItemFormProps {
  /** null = creating a new item */
  itemId: number | null;
  /** Called after a successful create/update. */
  onSuccess: () => void;
  onCancel: () => void;
}

export function ItemForm({ itemId, onSuccess, onCancel }: ItemFormProps) {
  const { data: raw, isLoading, isError, refetch } = useItemById(itemId);
  // Feeds field suggestions and the BOM component picker.
  const { data: itemList } = useItems();
  const items = useMemo(() => (itemList ?? []) as ItemListRow[], [itemList]);

  if (itemId && isLoading) {
    return (
      <Card>
        <CardContent className="space-y-4 p-6">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-40 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (itemId && (isError || !raw)) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-3 p-12 text-center">
          <p className="text-sm text-muted-foreground">Could not load this item.</p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              Retry
            </Button>
            <Button variant="ghost" size="sm" onClick={onCancel}>
              Back to items
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return <ItemFormBody raw={itemId ? (raw ?? null) : null} items={items} onSuccess={onSuccess} onCancel={onCancel} />;
}

interface BodyProps {
  raw: Record<string, unknown> | null;
  items: ItemListRow[];
  onSuccess: () => void;
  onCancel: () => void;
}

function ItemFormBody({ raw, items, onSuccess, onCancel }: BodyProps) {
  const { getLabel } = useClassificationLabels();
  const createItem = useItemCreate();
  const updateItem = useItemUpdate();

  const initialValues = useMemo<ItemFormValues>(
    () => (raw ? rawToFormValues(raw) : EMPTY_ITEM_FORM),
    [raw]
  );
  const itemId = raw ? getItemId(raw) : null;
  const isEdit = itemId !== null;

  const suggestions = useMemo(
    () => ({
      std_Unit: distinctValues(items, (i) => i.std_Unit),
      hsnNo: distinctValues(items, (i) => i.hsnNo),
      sizes: distinctValues(items, (i) => i.sizes),
      type: distinctValues(items, (i) => i.type),
      category: distinctValues(items, (i) => i.category),
      brand: distinctValues(items, (i) => i.brand),
      itemGroup: distinctValues(items, (i) => i.itemGroup),
    }),
    [items]
  );

  const unitConv = useMemo<UnitConv[]>(() => {
    const rows = raw?.unit_Conv ?? raw?.unitConv;
    return Array.isArray(rows) ? (rows as UnitConv[]) : [];
  }, [raw]);

  const handleSubmit = (values: ItemFormValues) => {
    const payload = buildItemPayload(values, raw);
    if (isEdit) {
      updateItem.mutate(payload, {
        onSuccess: () => {
          toast.success(`Item "${values.name}" updated`);
          onSuccess();
        },
        onError: (error) => toast.error(getApiErrorMessage(error, "Failed to update item")),
      });
    } else {
      createItem.mutate(payload, {
        onSuccess: () => {
          toast.success(`Item "${values.name}" created`);
          onSuccess();
        },
        onError: (error) => toast.error(getApiErrorMessage(error, "Failed to create item")),
      });
    }
  };

  const isSaving = createItem.isPending || updateItem.isPending;

  return (
    <Formik initialValues={initialValues} validationSchema={itemSchema} onSubmit={handleSubmit}>
      {({ values, errors, touched, handleChange, handleBlur, setFieldValue }) => (
        <Form noValidate>
          <Card className="overflow-hidden">
            <div className="sticky top-0 z-10 flex flex-wrap items-center justify-end gap-2 border-b bg-card/95 px-4 py-3 backdrop-blur">
              <Button type="button" variant="outline" size="sm" disabled={isSaving} onClick={onCancel}>
                Cancel
              </Button>
              <Button type="submit" size="sm" disabled={isSaving}>
                {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                {isEdit ? "Save Changes" : "Create Item"}
              </Button>
            </div>

            <CardContent className="space-y-6 p-4 sm:p-6">
              {/* ---------- Identity ---------- */}
              <Section title="Identity">
                <div className="grid gap-4 sm:grid-cols-2">
                  <Row label={getLabel("item_code")}>
                    <Input name="item_CodeTxt" value={values.item_CodeTxt} onChange={handleChange} onBlur={handleBlur} />
                  </Row>
                  <Row label={getLabel("item")} required error={fieldError(errors, touched, "name")}>
                    <Input name="name" value={values.name} onChange={handleChange} onBlur={handleBlur} aria-invalid={!!fieldError(errors, touched, "name")} />
                  </Row>
                  <Row label={getLabel("aliases")} className="sm:col-span-2">
                    <Input name="aliases" value={values.aliases} onChange={handleChange} onBlur={handleBlur} />
                  </Row>
                  {ITEM_ATTRIBUTES.map(({ field, label }) => (
                    <Row key={field} label={getLabel(label)}>
                      <Input
                        name={field}
                        value={values[field]}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        list={`item-dl-${field}`}
                        autoComplete="off"
                      />
                      <datalist id={`item-dl-${field}`}>
                        {suggestions[field].slice(0, 200).map((v) => (
                          <option key={v} value={v} />
                        ))}
                      </datalist>
                    </Row>
                  ))}
                  <Row label="Barcode">
                    <Input name="barcode" value={values.barcode} onChange={handleChange} onBlur={handleBlur} />
                  </Row>
                </div>
              </Section>

              {/* ---------- Tax & pricing ---------- */}
              <Section title="Tax & Pricing">
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  <Row label="HSN / SAC">
                    <Input name="hsnNo" value={values.hsnNo} onChange={handleChange} onBlur={handleBlur} list="item-dl-hsn" autoComplete="off" />
                    <datalist id="item-dl-hsn">
                      {suggestions.hsnNo.slice(0, 200).map((v) => (
                        <option key={v} value={v} />
                      ))}
                    </datalist>
                  </Row>
                  <Row label="Tax %" error={fieldError(errors, touched, "vatPer")}>
                    <NumberInput name="vatPer" value={values.vatPer} onChange={handleChange} onBlur={handleBlur} />
                  </Row>
                  <Row label="Std Unit" required error={fieldError(errors, touched, "std_Unit")}>
                    <Input name="std_Unit" value={values.std_Unit} onChange={handleChange} onBlur={handleBlur} list="item-dl-unit" autoComplete="off" aria-invalid={!!fieldError(errors, touched, "std_Unit")} />
                    <datalist id="item-dl-unit">
                      {suggestions.std_Unit.map((v) => (
                        <option key={v} value={v} />
                      ))}
                    </datalist>
                  </Row>
                  <Row label="MRP" error={fieldError(errors, touched, "mrp")}>
                    <NumberInput name="mrp" value={values.mrp} onChange={handleChange} onBlur={handleBlur} />
                  </Row>
                  <Row label="Sell Rate" error={fieldError(errors, touched, "std_Sell_Rate")}>
                    <NumberInput name="std_Sell_Rate" value={values.std_Sell_Rate} onChange={handleChange} onBlur={handleBlur} />
                  </Row>
                  <Row label="Discount %" error={fieldError(errors, touched, "discount")}>
                    <NumberInput name="discount" value={values.discount} onChange={handleChange} onBlur={handleBlur} />
                  </Row>
                  <Row label="Product Type">
                    <Select value={String(values.productType)} onValueChange={(v) => setFieldValue("productType", Number(v))}>
                      <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {PRODUCT_TYPE_OPTIONS.map((o) => (
                          <SelectItem key={o.value} value={String(o.value)}>{o.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Row>
                </div>
              </Section>

              {/* ---------- Costing & stock levels ---------- */}
              <Section title="Costing & Stock Levels">
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  <Row label="Costing On">
                    <Select value={String(values.costing_On)} onValueChange={(v) => setFieldValue("costing_On", Number(v))}>
                      <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {COSTING_ON_OPTIONS.map((o) => (
                          <SelectItem key={o.value} value={String(o.value)}>{o.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Row>
                  <Row label="Last Pur. Rate">
                    <NumberInput name="last_Purchaserate" value={values.last_Purchaserate} readOnly disabled />
                  </Row>
                  <Row label="Avg. Pur. Rate">
                    <NumberInput name="avg_Purchaserate" value={values.avg_Purchaserate} readOnly disabled />
                  </Row>
                  <Row label="Min Qty" error={fieldError(errors, touched, "minimum_Qty")}>
                    <NumberInput name="minimum_Qty" value={values.minimum_Qty} onChange={handleChange} onBlur={handleBlur} />
                  </Row>
                  <Row label="Max Qty" error={fieldError(errors, touched, "maximum_Qty")}>
                    <NumberInput name="maximum_Qty" value={values.maximum_Qty} onChange={handleChange} onBlur={handleBlur} />
                  </Row>
                  <Row label="Reorder Qty" error={fieldError(errors, touched, "reOrderQty")}>
                    <NumberInput name="reOrderQty" value={values.reOrderQty} onChange={handleChange} onBlur={handleBlur} />
                  </Row>
                  <Row label="Reorder Days" error={fieldError(errors, touched, "reOrderDays")}>
                    <NumberInput name="reOrderDays" value={values.reOrderDays} onChange={handleChange} onBlur={handleBlur} step="1" />
                  </Row>
                </div>
              </Section>

              {/* ---------- Flags ---------- */}
              <Section title="Options">
                <div className="flex flex-wrap gap-x-6 gap-y-3">
                  <Flag id="regular" label="Regular" checked={values.regular} onChange={(c) => setFieldValue("regular", c)} />
                  <Flag id="mfrCodeReq" label="Batch Code Required" checked={values.mfrCodeReq} onChange={(c) => setFieldValue("mfrCodeReq", c)} />
                  <Flag id="onCalculation" label="On Calculation" checked={values.onCalculation} onChange={(c) => setFieldValue("onCalculation", c)} />
                  <Flag id="is_BOM" label="BOM" checked={values.is_BOM} onChange={(c) => setFieldValue("is_BOM", c)} />
                  <Flag id="isActive" label="Active" checked={values.isActive} onChange={(c) => setFieldValue("isActive", c)} />
                </div>
              </Section>

              {/* ---------- BOM ---------- */}
              {values.is_BOM && (
                <Section title="BOM Creation">
                  <div className="space-y-2">
                    {values.bom_Map.length === 0 && (
                      <p className="text-sm text-muted-foreground">No components yet. Add the items that make up this item.</p>
                    )}
                    {values.bom_Map.map((row, index) => (
                      <div key={index} className="grid grid-cols-[1fr_7rem_auto_auto] items-center gap-2">
                        <ItemSearchCombobox
                          items={items.filter((i) => i.item_ID !== itemId)}
                          value={row.includeItemId}
                          onValueChange={(v) => setFieldValue(`bom_Map.${index}.includeItemId`, v)}
                          placeholder="Select component…"
                        />
                        <NumberInput
                          aria-label="Quantity"
                          placeholder="Qty"
                          value={row.qty}
                          onChange={(e) => setFieldValue(`bom_Map.${index}.qty`, e.target.value)}
                        />
                        <label className="flex items-center gap-2 whitespace-nowrap text-xs text-muted-foreground">
                          <Checkbox
                            checked={row.hasStockEffect}
                            onCheckedChange={(c) => setFieldValue(`bom_Map.${index}.hasStockEffect`, c === true)}
                          />
                          Effects inventory
                        </label>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-destructive"
                          aria-label="Remove component"
                          onClick={() => setFieldValue("bom_Map", values.bom_Map.filter((_, i) => i !== index))}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setFieldValue("bom_Map", [...values.bom_Map, { includeItemId: null, qty: "1", hasStockEffect: true }])
                      }
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Add component
                    </Button>
                  </div>
                </Section>
              )}

              {/* ---------- Unit conversions (read-only) ---------- */}
              {unitConv.length > 0 && (
                <Section title="Unit Conversion">
                  <div className="overflow-hidden rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Conv Unit</TableHead>
                          <TableHead className="text-right">Conv Qty</TableHead>
                          <TableHead className="text-right">Conv Rate</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {unitConv.map((c, i) => (
                          <TableRow key={c.unit_Conv_ID ?? i}>
                            <TableCell>{String(c.convUnit)}</TableCell>
                            <TableCell className="text-right tabular-nums">{c.convQty}</TableCell>
                            <TableCell className="text-right tabular-nums">{c.convRate}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground">Existing conversions are kept as-is when you save.</p>
                </Section>
              )}

              {/* ---------- Description ---------- */}
              <Section title="Description">
                <Input name="description" value={values.description} onChange={handleChange} onBlur={handleBlur} placeholder="Optional notes about this item" />
              </Section>
            </CardContent>
          </Card>

        </Form>
      )}
    </Formik>
  );
}

// ---------- small building blocks ----------
