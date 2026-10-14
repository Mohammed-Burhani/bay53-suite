"use client";

import { useMemo } from "react";
import { Formik } from "formik";
import * as Yup from "yup";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Combobox } from "@/components/ui/combobox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FieldGrid, Flag, FormToolbar, KeyboardForm, NumberInput, Row, Section, fieldError } from "@/components/master/shared/form-parts";
import { useDropdown } from "@/lib/hooks/useDropdown";
import { DROPDOWN_TABLES } from "@/lib/constants/dropdown-tables";
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

const buildSchema = (requireAreaCity: boolean, requireState: boolean) =>
  Yup.object({
  name: Yup.string().trim().required("Required"),
  area: requireAreaCity ? Yup.string().trim().required("Required") : Yup.string(),
  city: requireAreaCity ? Yup.string().trim().required("Required") : Yup.string(),
  state: requireState ? Yup.number().min(1, "Select a state") : Yup.number(),
  group_ID: Yup.number().nullable().required("Select a group"),
  email: Yup.string().trim().email("Enter a valid email"),
  gstNo: Yup.string().test(
    "gst",
    "Enter a valid 15-character GSTIN",
    (v) => !v?.trim() || /^\d{2}[A-Z]{5}\d{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/.test(v.trim().toUpperCase())
  ),
  // panNo: Yup.string().test("pan", "Enter a valid PAN (e.g. ABCDE1234F)", (v) => !v?.trim() || /^[A-Z]{5}\d{4}[A-Z]$/.test(v.trim().toUpperCase())),
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
  const { data: states = [] } = useDropdown(DROPDOWN_TABLES.state);
  const { data: countries = [] } = useDropdown(DROPDOWN_TABLES.country);
  const stateOptions = useMemo(() => states.map((s) => ({ value: String(s.id), label: s.name })), [states]);
  const countryOptions = useMemo(() => countries.map((c) => ({ value: String(c.id), label: c.name })), [countries]);
  const schema = useMemo(() => buildSchema(!isEdit, DROPDOWN_TABLES.state !== null && !isEdit), [isEdit]);
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
          <KeyboardForm onCancel={onCancel}>
            <Card className="gap-0 overflow-clip py-0">
              <FormToolbar
                saving={isSaving}
                submitLabel={isEdit ? "Save Changes" : "Create Ledger"}
                onCancel={onCancel}
                note={isCopy ? `Copy of ledger #${ledgerId} — contacts, balances and addresses are kept; opening details are not.` : undefined}
              />

              <CardContent className="p-3">
                <div className="grid items-start gap-3 lg:grid-cols-2 xl:grid-cols-3">
                  {/* ---------- column 1: name, opening, status ---------- */}
                  <div className="space-y-3">
                    <Section title="Ledger Name">
                      <FieldGrid>
                        <Row label="Name" required error={err("name")} className="col-span-2">
                          <Input {...text("name")} aria-invalid={!!err("name")} />
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
                        <Row label="Party Code" className="col-span-2">
                          <Input name="partyCode" value={values.partyCode} readOnly disabled placeholder="Auto-generated" />
                        </Row>
                      </FieldGrid>
                    </Section>

                    <Section title="Opening Info">
                      <FieldGrid>
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
                        <div className="flex items-end pb-1.5">
                          <Flag
                            id="lock_Freeze"
                            label="Lock / freeze"
                            checked={values.lock_Freeze}
                            onChange={(c) => setFieldValue("lock_Freeze", c)}
                          />
                        </div>
                      </FieldGrid>
                    </Section>
                  </div>

                  {/* ---------- column 2: contact info ---------- */}
                  <Section title="Contact Info">
                    <FieldGrid>
                      <Row label="Address" className="col-span-2">
                        <Textarea {...text("address")} rows={2} className="min-h-0 resize-none" />
                      </Row>
                      <Row label="Area" required={!isEdit} error={err("area")}>
                        <Input {...text("area")} aria-invalid={!!err("area")} />
                      </Row>
                      <Row label="City" required={!isEdit} error={err("city")}>
                        <Input {...text("city")} aria-invalid={!!err("city")} />
                      </Row>
                      {DROPDOWN_TABLES.state !== null && (
                        <Row label="State" required={!isEdit} error={err("state")}>
                          <Combobox
                            options={stateOptions}
                            value={values.state ? String(values.state) : ""}
                            onValueChange={(v) => setFieldValue("state", v ? Number(v) : 0)}
                            placeholder="Select a state"
                            searchPlaceholder="Search states…"
                          />
                        </Row>
                      )}
                      {DROPDOWN_TABLES.country !== null && (
                        <Row label="Country">
                          <Combobox
                            options={countryOptions}
                            value={values.country ? String(values.country) : ""}
                            onValueChange={(v) => setFieldValue("country", v ? Number(v) : 0)}
                            placeholder="Select a country"
                            searchPlaceholder="Search countries…"
                          />
                        </Row>
                      )}
                      <Row label="Pin Code">
                        <Input {...text("pinCode")} inputMode="numeric" />
                      </Row>
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
                      <Row label="Shipping Address" className="col-span-2">
                        <Textarea {...text("shipAddress")} rows={2} className="min-h-0 resize-none" />
                      </Row>
                    </FieldGrid>
                  </Section>

                  {/* ---------- column 3: party extra info + bank ---------- */}
                  <div className="space-y-3 lg:col-span-2 xl:col-span-1">
                    <Section title="Party Extra Info">
                      <FieldGrid>
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
                        {/* PAN No — not required
                        <Row label="PAN No" error={err("panNo")}>
                          <Input {...text("panNo")} className="font-mono uppercase" maxLength={10} aria-invalid={!!err("panNo")} />
                        </Row>
                        */}
                        <Row label="TIN No">
                          <Input {...text("tinV")} className="font-mono" />
                        </Row>
                        <Row label="TAN No">
                          <Input {...text("tanNo")} className="font-mono uppercase" />
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
                        <Row label="Individual / Business">
                          <Select value={values.isIndividual ? "individual" : "business"} onValueChange={(v) => setFieldValue("isIndividual", v === "individual")}>
                            <SelectTrigger className="w-full">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="business">Business</SelectItem>
                              <SelectItem value="individual">Individual</SelectItem>
                            </SelectContent>
                          </Select>
                        </Row>
                        <div className="col-span-2 flex items-center gap-6">
                          <Flag id="isHeadOffice" label="Head Office" checked={values.isHeadOffice} onChange={(c) => setFieldValue("isHeadOffice", c)} />
                          <Flag id="isBranchOffice" label="Branch Office" checked={values.isBranchOffice} onChange={(c) => setFieldValue("isBranchOffice", c)} />
                        </div>
                        <Row label="Contact Person">
                          <Input {...text("contact_Person")} />
                        </Row>
                        <Row label="WhatsApp No">
                          <Input {...text("whatsappNo")} inputMode="tel" />
                        </Row>
                        <Row label="Vendor Code">
                          <Input {...text("vendorCode")} />
                        </Row>
                        {/* Transport By — not required
                        <Row label="Transport By" className="col-span-2">
                          <Input {...text("transportBy")} />
                        </Row>
                        */}
                      </FieldGrid>
                    </Section>

                    <Section title="Bank Details">
                      <FieldGrid>
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
                      </FieldGrid>
                    </Section>
                  </div>
                </div>
              </CardContent>
            </Card>
          </KeyboardForm>
        );
      }}
    </Formik>
  );
}
