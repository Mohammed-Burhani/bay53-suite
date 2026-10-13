"use client";

import { useMemo } from "react";
import { Formik, Form } from "formik";
import * as Yup from "yup";
import { toast } from "sonner";
import { Loader2, Save } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Combobox } from "@/components/ui/combobox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Flag, NumberInput, Row, Section, fieldError } from "@/components/master/shared/form-parts";
import { useAllGroups, useLedgerById, useLedgerCreate, useLedgerUpdate } from "@/lib/hooks/useLedgerMaster";
import { getApiErrorMessage } from "@/lib/utils/api-error";
import {
  EMPTY_LEDGER_FORM,
  buildLedgerPayload,
  getLedgerId,
  rawToFormValues,
  toCopyBase,
} from "@/lib/ledgers/ledger-form";
import { GST_TYPE_OPTIONS, PARTY_TYPE_OPTIONS, type LedgerFormValues } from "@/lib/types/ledger.types";

const nonNegative = (label: string) =>
  Yup.string().test("non-negative", `${label} must be a number ≥ 0`, (v) => !v || (!Number.isNaN(Number(v)) && Number(v) >= 0));

const buildSchema = (requireAreaCity: boolean) =>
  Yup.object({
  name: Yup.string().trim().required("Required"),
  area: requireAreaCity ? Yup.string().trim().required("Required") : Yup.string(),
  city: requireAreaCity ? Yup.string().trim().required("Required") : Yup.string(),
  group_ID: Yup.number().nullable().required("Select a group"),
  email: Yup.string().trim().email("Enter a valid email"),
  gstNo: Yup.string().test(
    "gst",
    "Enter a valid 15-character GSTIN",
    (v) => !v?.trim() || /^\d{2}[A-Z]{5}\d{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/.test(v.trim().toUpperCase())
  ),
  panNo: Yup.string().test("pan", "Enter a valid PAN (e.g. ABCDE1234F)", (v) => !v?.trim() || /^[A-Z]{5}\d{4}[A-Z]$/.test(v.trim().toUpperCase())),
  opening_Bal: nonNegative("Opening balance"),
  credit_Limit: nonNegative("Credit limit"),
  creditDays: nonNegative("Credit days"),
  });

interface LedgerFormProps {
  /** Edit this ledger; null to create. */
  ledgerId: number | null;
  /** Create a new ledger pre-filled from this one ("Save as"). */
  copyFromId?: number | null;
  onSuccess: () => void;
  onCancel: () => void;
}

export function LedgerForm({ ledgerId, copyFromId = null, onSuccess, onCancel }: LedgerFormProps) {
  const sourceId = ledgerId ?? copyFromId;
  const { data: raw, isLoading, isError, refetch } = useLedgerById(sourceId);

  if (sourceId && isLoading) {
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

  if (sourceId && (isError || !raw)) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-3 p-12 text-center">
          <p className="text-sm text-muted-foreground">Could not load this ledger.</p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              Retry
            </Button>
            <Button variant="ghost" size="sm" onClick={onCancel}>
              Back to ledgers
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <LedgerFormBody
      raw={sourceId ? (raw ?? null) : null}
      isCopy={!ledgerId && !!copyFromId}
      onSuccess={onSuccess}
      onCancel={onCancel}
    />
  );
}

interface BodyProps {
  raw: Record<string, unknown> | null;
  isCopy: boolean;
  onSuccess: () => void;
  onCancel: () => void;
}

function LedgerFormBody({ raw, isCopy, onSuccess, onCancel }: BodyProps) {
  const createLedger = useLedgerCreate();
  const updateLedger = useLedgerUpdate();
  const { data: groups = [], isLoading: groupsLoading } = useAllGroups();

  const isEdit = !!raw && !isCopy;
  const schema = useMemo(() => buildSchema(!isEdit), [isEdit]);
  // The record written back on save; a copy drops the source's id and child rows.
  const base = useMemo(() => (raw && isCopy ? toCopyBase(raw) : raw), [raw, isCopy]);

  const initialValues = useMemo<LedgerFormValues>(() => {
    if (!raw) return EMPTY_LEDGER_FORM;
    const values = rawToFormValues(raw);
    return isCopy ? { ...values, name: `${values.name} (Copy)`, partyCode: "", lock_Freeze: false } : values;
  }, [raw, isCopy]);

  const groupOptions = useMemo(
    () => groups.map((g) => ({ value: String(g.id), label: g.name })),
    [groups]
  );

  const handleSubmit = (values: LedgerFormValues) => {
    const payload = buildLedgerPayload(values, base);
    const mutation = isEdit ? updateLedger : createLedger;
    mutation.mutate(payload, {
      onSuccess: () => {
        toast.success(`Ledger "${values.name}" ${isEdit ? "updated" : "created"}`);
        onSuccess();
      },
      onError: (error) => toast.error(getApiErrorMessage(error, `Failed to ${isEdit ? "update" : "create"} ledger`)),
    });
  };

  const isSaving = createLedger.isPending || updateLedger.isPending;
  const ledgerId = raw ? getLedgerId(raw) : null;

  return (
    <Formik initialValues={initialValues} validationSchema={schema} onSubmit={handleSubmit}>
      {({ values, errors, touched, handleChange, handleBlur, setFieldValue }) => {
        const text = (name: keyof LedgerFormValues) => ({
          name,
          value: values[name] as string,
          onChange: handleChange,
          onBlur: handleBlur,
        });
        const err = (name: keyof LedgerFormValues) => fieldError(errors, touched, name);

        return (
          <Form noValidate>
            <Card className="overflow-hidden">
              <div className="sticky top-0 z-10 flex flex-wrap items-center justify-end gap-2 border-b bg-card/95 px-4 py-3 backdrop-blur">
                {isCopy && <span className="mr-auto text-sm text-muted-foreground">Copy of ledger #{ledgerId} — contacts, balances and addresses are kept; opening details are not.</span>}
                <Button type="button" variant="outline" size="sm" disabled={isSaving} onClick={onCancel}>
                  Cancel
                </Button>
                <Button type="submit" size="sm" disabled={isSaving}>
                  {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                  {isEdit ? "Save Changes" : "Create Ledger"}
                </Button>
              </div>

              <CardContent className="space-y-6 p-4 sm:p-6">
                <Section title="Ledger Name">
                  <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                    <Row label="Name" required error={err("name")} className="xl:col-span-2">
                      <Input {...text("name")} aria-invalid={!!err("name")} />
                    </Row>
                    <Row label="Party Code">
                      <Input name="partyCode" value={values.partyCode} readOnly disabled placeholder="Auto-generated" />
                    </Row>
                    <Row label="Group" required error={err("group_ID")} className="xl:col-span-2">
                      <Combobox
                        options={groupOptions}
                        value={values.group_ID ? String(values.group_ID) : ""}
                        onValueChange={(v) => {
                          setFieldValue("group_ID", v ? Number(v) : null);
                        }}
                        placeholder={groupsLoading ? "Loading groups…" : "Select a group"}
                        searchPlaceholder="Search groups…"
                        disabled={groupsLoading}
                      />
                    </Row>
                  </div>
                </Section>

                <Section title="Contact Info">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Row label="Address">
                      <Textarea {...text("address")} rows={3} />
                    </Row>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <Row label="Area" required={!isEdit} error={err("area")}>
                        <Input {...text("area")} aria-invalid={!!err("area")} />
                      </Row>
                      <Row label="City" required={!isEdit} error={err("city")}>
                        <Input {...text("city")} aria-invalid={!!err("city")} />
                      </Row>
                      <Row label="Pin Code">
                        <Input {...text("pinCode")} inputMode="numeric" />
                      </Row>
                    </div>
                    <Row label="Phone 1">
                      <Input {...text("phone_1")} inputMode="tel" />
                    </Row>
                    <Row label="Phone 2">
                      <Input {...text("phone_2")} inputMode="tel" />
                    </Row>
                    <Row label="Fax">
                      <Input {...text("fax")} />
                    </Row>
                    <Row label="Mobile">
                      <Input {...text("mobile")} inputMode="tel" />
                    </Row>
                    <Row label="Email" error={err("email")}>
                      <Input {...text("email")} type="email" aria-invalid={!!err("email")} />
                    </Row>
                    <Row label="Website">
                      <Input {...text("website")} />
                    </Row>
                    <Row label="Shipping Address" className="sm:col-span-2">
                      <Textarea {...text("shipAddress")} rows={3} />
                    </Row>
                  </div>
                </Section>

                <Section title="Party Extra Info">
                  <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                    <Row label="GST No" error={err("gstNo")}>
                      <Input {...text("gstNo")} className="font-mono uppercase" maxLength={15} aria-invalid={!!err("gstNo")} />
                    </Row>
                    <Row label="Type">
                      <Select value={String(values.gstType)} onValueChange={(v) => setFieldValue("gstType", Number(v))}>
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {GST_TYPE_OPTIONS.map((o) => (
                            <SelectItem key={o.value} value={String(o.value)}>
                              {o.label}
                            </SelectItem>
                          ))}
                          {!GST_TYPE_OPTIONS.some((o) => o.value === values.gstType) && (
                            <SelectItem value={String(values.gstType)}>Type {values.gstType}</SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                    </Row>
                    <Row label="Party Type">
                      <Select value={String(values.partyType)} onValueChange={(v) => setFieldValue("partyType", Number(v))}>
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {PARTY_TYPE_OPTIONS.map((o) => (
                            <SelectItem key={o.value} value={String(o.value)}>
                              {o.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </Row>
                    <Row label="PAN No" error={err("panNo")}>
                      <Input {...text("panNo")} className="font-mono uppercase" maxLength={10} aria-invalid={!!err("panNo")} />
                    </Row>
                    <Row label="TIN No">
                      <Input {...text("tinV")} className="font-mono" />
                    </Row>
                    <Row label="Contact Person">
                      <Input {...text("contact_Person")} />
                    </Row>
                    <Row label="WhatsApp No">
                      <Input {...text("whatsappNo")} inputMode="tel" />
                    </Row>
                    <Row label="Vendor Code">
                      <Input {...text("vendorCode")} />
                    </Row>
                    <Row label="Transport By">
                      <Input {...text("transportBy")} />
                    </Row>
                  </div>
                </Section>

                <Section title="Opening Info">
                  <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
                    <Row label="Opening Bal" error={err("opening_Bal")}>
                      <NumberInput {...text("opening_Bal")} />
                    </Row>
                    <Row label="Dr / Cr">
                      <Select value={values.isCr ? "cr" : "dr"} onValueChange={(v) => setFieldValue("isCr", v === "cr")}>
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="dr">Debit (Dr)</SelectItem>
                          <SelectItem value="cr">Credit (Cr)</SelectItem>
                        </SelectContent>
                      </Select>
                    </Row>
                    <Row label="Opening Date">
                      <Input {...text("opening_Date")} type="date" />
                    </Row>
                    <Row label="Credit Limit" error={err("credit_Limit")}>
                      <NumberInput {...text("credit_Limit")} />
                    </Row>
                    <Row label="Credit Days" error={err("creditDays")}>
                      <NumberInput {...text("creditDays")} step="1" />
                    </Row>
                  </div>
                </Section>

                <Section title="Bank Details">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Row label="Bank Name">
                      <Input {...text("ledgerBankName")} />
                    </Row>
                    <Row label="Branch">
                      <Input {...text("ledgerBankBranch")} />
                    </Row>
                    <Row label="Account No">
                      <Input {...text("ledgerBankAccount")} className="font-mono" />
                    </Row>
                    <Row label="IFSC">
                      <Input {...text("ledgerBankIFSC")} className="font-mono uppercase" />
                    </Row>
                  </div>
                </Section>

                <Section title="Status">
                  <Flag
                    id="lock_Freeze"
                    label="Lock / freeze this ledger (blocks new transactions)"
                    checked={values.lock_Freeze}
                    onChange={(c) => setFieldValue("lock_Freeze", c)}
                  />
                </Section>
              </CardContent>
            </Card>
          </Form>
        );
      }}
    </Formik>
  );
}
