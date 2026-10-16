"use client";

import { useMemo, useState } from "react";
import { Formik } from "formik";
import * as Yup from "yup";
import { toast } from "sonner";
import { ExternalLink, Loader2, TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Combobox } from "@/components/ui/combobox";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { FieldGrid, Row, fieldError } from "@/components/master/shared/form-parts";
import { auth } from "@/lib/auth";
import { reportsService } from "@/lib/api/reports.service";
import { useAllGroups, useLedgerCreate } from "@/lib/hooks/useLedgerMaster";
import { useLedgersByGroup } from "@/lib/hooks/useReports";
import { buildLedgerPayload, EMPTY_LEDGER_FORM } from "@/lib/ledgers/ledger-form";
import { defaultPartyGroup, groupFamily, newestByName, normalizeName } from "@/lib/invoices/quick-add";
import type { LedgerFormValues } from "@/lib/types/ledger.types";
import type { Ledger } from "@/lib/types/reports.types";
import { getApiErrorMessage } from "@/lib/utils/api-error";

const schema = Yup.object({
  name: Yup.string().trim().required("Required"),
  group_ID: Yup.number().nullable().required("Select a group"),
  area: Yup.string().trim().required("Required"),
  city: Yup.string().trim().required("Required"),
  mobile: Yup.string().test("mobile", "Enter 10 digits", (v) => !v?.trim() || /^\d{10}$/.test(v.trim())),
  email: Yup.string().trim().email("Enter a valid email"),
  gstNo: Yup.string().test(
    "gst",
    "Enter a valid 15-character GSTIN",
    (v) => !v?.trim() || /^\d{2}[A-Z]{5}\d{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/.test(v.trim().toUpperCase())
  ),
});

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Supplier for purchase-side invoices, customer otherwise. */
  supplier: boolean;
  /** Pre-fills the name, e.g. what the user had typed in the search box. */
  initialName?: string;
  /** Called with the ledger to select: the new one, or an existing one the user chose instead. */
  onCreated: (ledger: Ledger) => void;
}

export function QuickAddLedgerDialog({ open, onOpenChange, ...rest }: Props) {
  const kind = rest.supplier ? "supplier" : "customer";
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Quick add {kind}</DialogTitle>
          <DialogDescription>
            Creates a ledger and selects it on this invoice. Add the rest of the details later from Ledger Master.
          </DialogDescription>
        </DialogHeader>
        {/* Mounted only while open so every opening starts from a clean form. */}
        {open && <LedgerQuickForm {...rest} onClose={() => onOpenChange(false)} />}
      </DialogContent>
    </Dialog>
  );
}

function LedgerQuickForm({
  supplier,
  initialName = "",
  onCreated,
  onClose,
}: Omit<Props, "open" | "onOpenChange"> & { onClose: () => void }) {
  const create = useLedgerCreate();
  const { data: groups = [], isLoading: groupsLoading } = useAllGroups();
  const { data: ledgers = [] } = useLedgersByGroup();
  const [duplicate, setDuplicate] = useState<Ledger | null>(null);
  const [saving, setSaving] = useState(false);

  // Customers go under Sundry Debtors, suppliers under Sundry Creditors (and their sub-groups).
  const defaultGroup = useMemo(() => defaultPartyGroup(groups, supplier), [groups, supplier]);
  const groupOptions = useMemo(() => {
    const list = defaultGroup ? groupFamily(groups, defaultGroup) : groups;
    return list.map((g) => ({ value: String(g.id), label: g.name }));
  }, [groups, defaultGroup]);

  const initialValues: LedgerFormValues = {
    ...EMPTY_LEDGER_FORM,
    name: initialName,
    group_ID: defaultGroup?.id ?? null,
    partyType: supplier ? 2 : 1,
  };

  const save = async (values: LedgerFormValues) => {
    const sessionId = auth.getSessionId();
    if (!sessionId) {
      toast.error("Session expired");
      return;
    }
    setSaving(true);
    try {
      await create.mutateAsync(buildLedgerPayload({ ...values, name: values.name.trim() }, null));
      // The create call returns no documented id, so look the ledger up by name.
      const found = await reportsService.searchLedgers({
        sessionId,
        pageSize: 0,
        pageNumber: 0,
        groups: values.group_ID ? [values.group_ID] : [],
        includeChildGroups: true,
      });
      const ledger = newestByName(found, values.name, (l) => l.name, (l) => l.ledger_id);
      if (ledger) {
        toast.success(`Ledger "${ledger.name}" created and selected`);
        onCreated(ledger);
      } else {
        toast.success(`Ledger "${values.name.trim()}" created. Search for it to select it.`);
      }
      onClose();
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Failed to create ledger"));
    } finally {
      setSaving(false);
    }
  };

  const submit = (values: LedgerFormValues) => {
    if (!duplicate) {
      const match = ledgers.find((l) => normalizeName(l.name) === normalizeName(values.name));
      if (match) {
        setDuplicate(match);
        return;
      }
    }
    void save(values);
  };

  return (
    <Formik
      // Re-seed once the groups load so the default group is picked.
      key={defaultGroup?.id ?? "none"}
      initialValues={initialValues}
      validationSchema={schema}
      onSubmit={submit}
    >
      {({ values, errors, touched, handleChange, handleBlur, setFieldValue, handleSubmit }) => {
        const text = (name: keyof LedgerFormValues) => ({
          name,
          value: values[name] as string,
          onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
            if (name === "name") setDuplicate(null);
            handleChange(e);
          },
          onBlur: handleBlur,
        });
        const err = (name: keyof LedgerFormValues) => fieldError(errors, touched, name);

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
              <Row label="Name" required error={err("name")} className="col-span-2">
                <Input {...text("name")} autoFocus aria-invalid={!!err("name")} />
              </Row>
              <Row label="Group" required error={err("group_ID")} className="col-span-2">
                <Combobox
                  options={groupOptions}
                  value={values.group_ID ? String(values.group_ID) : ""}
                  onValueChange={(v) => setFieldValue("group_ID", v ? Number(v) : null)}
                  placeholder={groupsLoading ? "Loading groups…" : "Select a group"}
                  searchPlaceholder="Search groups…"
                  disabled={groupsLoading}
                />
              </Row>
              <Row label="Mobile" error={err("mobile")}>
                <Input {...text("mobile")} inputMode="numeric" maxLength={10} aria-invalid={!!err("mobile")} />
              </Row>
              <Row label="GSTIN" error={err("gstNo")}>
                <Input
                  {...text("gstNo")}
                  onChange={(e) => setFieldValue("gstNo", e.target.value.toUpperCase())}
                  maxLength={15}
                  aria-invalid={!!err("gstNo")}
                />
              </Row>
              <Row label="Area" required error={err("area")}>
                <Input {...text("area")} aria-invalid={!!err("area")} />
              </Row>
              <Row label="City" required error={err("city")}>
                <Input {...text("city")} aria-invalid={!!err("city")} />
              </Row>
              <Row label="Email" error={err("email")} className="col-span-2">
                <Input {...text("email")} type="email" aria-invalid={!!err("email")} />
              </Row>
            </FieldGrid>

            {duplicate && (
              <div role="alert" className="flex gap-2 rounded-md border border-amber-300 bg-amber-50 p-3 text-xs text-amber-900 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200">
                <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" />
                <div className="space-y-2">
                  <p>
                    A ledger named <strong>{duplicate.name}</strong>
                    {duplicate.group ? ` (${duplicate.group})` : ""} already exists.
                  </p>
                  <div className="flex gap-2">
                    <Button type="button" size="sm" variant="outline" onClick={() => { onCreated(duplicate); onClose(); }}>
                      Use existing
                    </Button>
                    <Button type="button" size="sm" variant="ghost" onClick={() => void save(values)}>
                      Create anyway
                    </Button>
                  </div>
                </div>
              </div>
            )}

            <DialogFooter className="items-center sm:justify-between">
              <a
                href="/erp/master/ledgers/create"
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
                <Button type="submit" disabled={saving || groupsLoading}>
                  {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Create &amp; select
                </Button>
              </div>
            </DialogFooter>
          </form>
        );
      }}
    </Formik>
  );
}
