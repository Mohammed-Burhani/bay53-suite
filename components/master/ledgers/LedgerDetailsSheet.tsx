"use client";

import { useMemo } from "react";
import { Pencil } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useAllGroups, useLedgerById } from "@/lib/hooks/useLedgerMaster";
import { rawToFormValues } from "@/lib/ledgers/ledger-form";
import { GST_TYPE_OPTIONS, PARTY_TYPE_OPTIONS } from "@/lib/types/ledger.types";
import type { Ledger } from "@/lib/types/reports.types";

interface LedgerDetailsSheetProps {
  /** The list row being viewed; null closes the sheet. */
  ledger: Ledger | null;
  onClose: () => void;
  onEdit: (id: number) => void;
}

const show = (v: string | number | null | undefined) => (v === null || v === undefined || v === "" ? "—" : String(v));

export function LedgerDetailsSheet({ ledger, onClose, onEdit }: LedgerDetailsSheetProps) {
  const ledgerId = ledger?.ledger_id ?? null;
  const { data: raw, isLoading, isError, refetch } = useLedgerById(ledgerId);
  const { data: groups } = useAllGroups();

  const values = useMemo(() => (raw ? rawToFormValues(raw) : null), [raw]);
  const groupName = values?.group_ID ? (groups?.find((g) => g.id === values.group_ID)?.name ?? ledger?.group) : ledger?.group;

  return (
    <Sheet open={ledger !== null} onOpenChange={(open) => !open && onClose()}>
      <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-xl">
        <SheetHeader className="border-b">
          <SheetTitle className="pr-8">{ledger?.name ?? "Ledger details"}</SheetTitle>
          <SheetDescription className="flex items-center gap-2">
            <span className="font-mono">#{ledgerId}</span>
            {ledger && (ledger.lock_Freeze ? <Badge variant="destructive">Locked</Badge> : <Badge variant="secondary">Active</Badge>)}
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-6 p-4">
          {isLoading && (
            <div className="space-y-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-8 w-full" />
              ))}
            </div>
          )}

          {isError && (
            <div className="space-y-3 py-8 text-center text-sm text-muted-foreground">
              <p>Could not load this ledger.</p>
              <Button variant="outline" size="sm" onClick={() => refetch()}>
                Retry
              </Button>
            </div>
          )}

          {values && (
            <>
              <Group title="Basic Details">
                <Field label="Name" value={show(values.name)} />
                <Field label="Party Code" value={show(values.partyCode)} />
                <Field label="Group" value={show(groupName)} />
                <Field label="Party Type" value={PARTY_TYPE_OPTIONS.find((o) => o.value === values.partyType)?.label ?? show(values.partyType)} />
                <Field label="Contact Person" value={show(values.contact_Person)} />
                <Field label="Vendor Code" value={show(values.vendorCode)} />
                <Field label="Transport By" value={show(values.transportBy)} />
              </Group>

              <Group title="Contact">
                <Field label="Mobile" value={show(values.mobile)} />
                <Field label="WhatsApp No" value={show(values.whatsappNo)} />
                <Field label="Email" value={show(values.email)} />
                <Field label="Phone 1" value={show(values.phone_1)} />
                <Field label="Phone 2" value={show(values.phone_2)} />
                <Field label="Fax" value={show(values.fax)} />
                <Field label="Website" value={show(values.website)} span />
              </Group>

              <Group title="Address">
                <Field label="Billing Address" value={show(values.address)} span />
                <Field label="Shipping Address" value={show(values.shipAddress)} span />
                <Field label="Area" value={show(values.area)} />
                <Field label="City" value={show(values.city)} />
                <Field label="State" value={show(ledger?.state)} />
                <Field label="Pin Code" value={show(values.pinCode)} />
              </Group>

              <Group title="Tax Details">
                <Field label="GST No" value={show(values.gstNo)} mono />
                <Field label="PAN No" value={show(values.panNo)} mono />
                <Field label="TIN No" value={show(values.tinV)} mono />
                <Field label="Type" value={GST_TYPE_OPTIONS.find((o) => o.value === values.gstType)?.label ?? `Type ${values.gstType}`} />
              </Group>

              <Group title="Accounts">
                <Field label="Opening Balance" value={values.opening_Bal ? `${values.opening_Bal} ${values.isCr ? "Cr" : "Dr"}` : "—"} />
                <Field label="Opening Date" value={show(values.opening_Date)} />
                <Field label="Credit Limit" value={show(values.credit_Limit)} />
                <Field label="Credit Days" value={show(values.creditDays)} />
              </Group>

              <Group title="Bank Details">
                <Field label="Bank Name" value={show(values.ledgerBankName)} />
                <Field label="Branch" value={show(values.ledgerBankBranch)} />
                <Field label="Account No" value={show(values.ledgerBankAccount)} mono />
                <Field label="IFSC" value={show(values.ledgerBankIFSC)} mono />
              </Group>
            </>
          )}
        </div>

        {ledgerId !== null && (
          <div className="sticky bottom-0 flex justify-end gap-2 border-t bg-background p-4">
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
            <Button onClick={() => onEdit(ledgerId)}>
              <Pencil className="mr-2 h-4 w-4" />
              Edit
            </Button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <h3 className="border-b pb-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">{title}</h3>
      <div className="grid grid-cols-2 gap-x-6 gap-y-3">{children}</div>
    </section>
  );
}

function Field({ label, value, span, mono }: { label: string; value: string; span?: boolean; mono?: boolean }) {
  return (
    <div className={span ? "col-span-2" : undefined}>
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className={mono ? "break-words font-mono text-sm font-medium" : "break-words text-sm font-medium"}>{value}</div>
    </div>
  );
}
