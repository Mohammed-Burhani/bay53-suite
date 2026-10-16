"use client";

import { useState } from "react";
import { Formik } from "formik";
import * as Yup from "yup";
import { toast } from "sonner";
import { ExternalLink, Loader2, TriangleAlert } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { FieldGrid, NumberInput, Row, fieldError } from "@/components/master/shared/form-parts";
import { auth } from "@/lib/auth";
import { reportsService } from "@/lib/api/reports.service";
import { useItemCreate } from "@/lib/hooks/useItemMaster";
import { buildItemPayload, EMPTY_ITEM_FORM } from "@/lib/items/item-form";
import { newestByName } from "@/lib/invoices/quick-add";
import type { ItemFormValues } from "@/lib/types/item.types";
import type { Item } from "@/lib/types/reports.types";
import { getApiErrorMessage } from "@/lib/utils/api-error";

const COMMON_UNITS = ["Nos", "Pcs", "Kg", "Gm", "Mtr", "Ltr", "Box", "Set", "Pair", "Dozen"];
const GST_RATES = [0, 5, 12, 18, 28];

const nonNegative = (label: string) =>
  Yup.string().test("non-negative", `${label} must be a number ≥ 0`, (v) => !v || (!Number.isNaN(Number(v)) && Number(v) >= 0));

const schema = Yup.object({
  name: Yup.string().trim().required("Required"),
  std_Unit: Yup.string().trim().required("Required"),
  std_Sell_Rate: nonNegative("Rate"),
  mrp: nonNegative("MRP"),
});

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Pre-fills the name, e.g. what the user had typed in the item search. */
  initialName?: string;
  /** Called with the item to put on the line: the new one, or an existing one the user chose instead. */
  onCreated: (item: Item) => void;
}

export function QuickAddItemDialog({ open, onOpenChange, ...rest }: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Quick add item</DialogTitle>
          <DialogDescription>
            Creates an item and puts it on this invoice line. Add the rest of the details later from Item Master.
          </DialogDescription>
        </DialogHeader>
        {/* Mounted only while open so every opening starts from a clean form. */}
        {open && <ItemQuickForm {...rest} onClose={() => onOpenChange(false)} />}
      </DialogContent>
    </Dialog>
  );
}

function ItemQuickForm({
  initialName = "",
  onCreated,
  onClose,
}: Omit<Props, "open" | "onOpenChange"> & { onClose: () => void }) {
  const create = useItemCreate();
  const queryClient = useQueryClient();
  const [duplicate, setDuplicate] = useState<Item | null>(null);
  const [saving, setSaving] = useState(false);

  const searchByName = (sessionId: string, name: string) =>
    reportsService.searchItems({
      sessionId,
      pageSize: 0,
      pageNumber: 0,
      isSync: true,
      lastModifiedDate: "",
      name: name.trim(),
    });

  const save = async (values: ItemFormValues, sessionId: string) => {
    setSaving(true);
    try {
      await create.mutateAsync(buildItemPayload({ ...values, name: values.name.trim() }, null));
      // The create call returns no documented id, so look the item up by name.
      const item = newestByName(await searchByName(sessionId, values.name), values.name, (i) => i.name, (i) => i.item_ID);
      // Make the new item show up in every row's search straight away.
      queryClient.invalidateQueries({ queryKey: ["item-search"] });
      if (item) {
        toast.success(`Item "${item.name}" created and added`);
        onCreated(item);
      } else {
        toast.success(`Item "${values.name.trim()}" created. Search for it to add it.`);
      }
      onClose();
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Failed to create item"));
    } finally {
      setSaving(false);
    }
  };

  const submit = async (values: ItemFormValues) => {
    const sessionId = auth.getSessionId();
    if (!sessionId) {
      toast.error("Session expired");
      return;
    }
    if (!duplicate) {
      setSaving(true);
      try {
        const existing = newestByName(await searchByName(sessionId, values.name), values.name, (i) => i.name, (i) => i.item_ID);
        if (existing) {
          setDuplicate(existing);
          return;
        }
      } catch {
        // If the duplicate check fails, let the create call decide.
      } finally {
        setSaving(false);
      }
    }
    await save(values, sessionId);
  };

  return (
    <Formik initialValues={{ ...EMPTY_ITEM_FORM, name: initialName }} validationSchema={schema} onSubmit={submit}>
      {({ values, errors, touched, handleChange, handleBlur, setFieldValue, handleSubmit }) => {
        const field = (name: keyof ItemFormValues) => ({
          name,
          value: values[name] as string,
          onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
            if (name === "name") setDuplicate(null);
            handleChange(e);
          },
          onBlur: handleBlur,
        });
        const err = (name: keyof ItemFormValues) => fieldError(errors, touched, name);

        return (
          <form
            noValidate
            onSubmit={(e) => {
              // The dialog is portaled, but React events still bubble to the invoice form's tree.
              e.stopPropagation();
              handleSubmit(e);
            }}
            className="space-y-4"
          >
            <FieldGrid>
              <Row label="Item name" required error={err("name")} className="col-span-2">
                <Input {...field("name")} autoFocus aria-invalid={!!err("name")} />
              </Row>
              <Row label="Unit" required error={err("std_Unit")}>
                <Input {...field("std_Unit")} list="quick-item-units" autoComplete="off" aria-invalid={!!err("std_Unit")} />
                <datalist id="quick-item-units">
                  {COMMON_UNITS.map((u) => (
                    <option key={u} value={u} />
                  ))}
                </datalist>
              </Row>
              <Row label="HSN / SAC">
                <Input {...field("hsnNo")} />
              </Row>
              <Row label="Tax %">
                <Select value={String(values.vatPer || 0)} onValueChange={(v) => setFieldValue("vatPer", v)}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {GST_RATES.map((r) => (
                      <SelectItem key={r} value={String(r)}>
                        {r}%
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Row>
              <Row label="Rate" error={err("std_Sell_Rate")}>
                <NumberInput {...field("std_Sell_Rate")} />
              </Row>
              <Row label="MRP" error={err("mrp")}>
                <NumberInput {...field("mrp")} />
              </Row>
            </FieldGrid>

            {duplicate && (
              <div role="alert" className="flex gap-2 rounded-md border border-amber-300 bg-amber-50 p-3 text-xs text-amber-900 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200">
                <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" />
                <div className="space-y-2">
                  <p>
                    An item named <strong>{duplicate.name}</strong> already exists.
                  </p>
                  <div className="flex gap-2">
                    <Button type="button" size="sm" variant="outline" onClick={() => { onCreated(duplicate); onClose(); }}>
                      Use existing
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        const sessionId = auth.getSessionId();
                        if (sessionId) void save(values, sessionId);
                      }}
                    >
                      Create anyway
                    </Button>
                  </div>
                </div>
              </div>
            )}

            <DialogFooter className="items-center sm:justify-between">
              <a
                href="/erp/master/items/create"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
              >
                Need more fields? Open full form <ExternalLink className="h-3 w-3" />
              </a>
              <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={onClose} disabled={saving}>
                  Cancel
                </Button>
                <Button type="submit" disabled={saving}>
                  {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Create &amp; add
                </Button>
              </div>
            </DialogFooter>
          </form>
        );
      }}
    </Formik>
  );
}
