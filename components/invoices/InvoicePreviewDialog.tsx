"use client";

import { useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Printer,
  Loader2,
  AlertCircle,
  RefreshCw,
  Store,
  ShieldCheck,
  ReceiptText,
  BadgeCheck,
} from "lucide-react";
import { format } from "date-fns";
import { formatCurrency } from "@/lib/store";
import { useInvoiceById } from "@/lib/hooks/useInvoices";
import type { InvoiceSearchItem, InvoiceDetail } from "@/lib/types/invoice.types";
import {
  buildBillViewModel,
  type BillViewModel,
  type BillItem,
  type BillParty,
} from "@/lib/invoices/bill-view-model";

interface InvoicePreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** invCode of the selected row */
  invCode: number | null;
  /** invoice type to send to /Invoice/GetById */
  invType: number;
  /** the clicked row — used for instant header data and as a fallback */
  fallback?: InvoiceSearchItem | null;
}

function safeDate(value: string | null | undefined, pattern = "dd MMM yyyy"): string {
  if (!value) return "—";
  try {
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return String(value);
    return format(d, pattern);
  } catch {
    return String(value);
  }
}

export function InvoicePreviewDialog({
  open,
  onOpenChange,
  invCode,
  invType,
  fallback,
}: InvoicePreviewDialogProps) {
  const { data, isLoading, isError, error, refetch, isFetching } = useInvoiceById(
    invCode,
    invType,
    open
  );

  const detail = data;
  const row = fallback ?? null;

  const handlePrint = () => {
    if (typeof window !== "undefined") window.print();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[92vh] w-full max-w-[95vw] flex-col gap-0 overflow-hidden p-0 sm:max-w-4xl lg:max-w-5xl">
        <DialogHeader className="flex shrink-0 flex-row items-center justify-between space-y-0 border-b px-4 py-3 pr-12 sm:px-5 print:hidden">
          <div className="flex items-center gap-2">
            <ReceiptText className="h-4 w-4 text-primary" />
            <DialogTitle className="text-base">Invoice Preview</DialogTitle>
          </div>
          <DialogDescription className="sr-only">
            A printable bill view of the selected invoice.
          </DialogDescription>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="h-8 gap-1.5"
              onClick={handlePrint}
              disabled={isLoading || isError}
            >
              <Printer className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Print</span>
            </Button>
          </div>
        </DialogHeader>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
          <div data-invoice-print className="bg-white text-zinc-900">
            {isLoading ? (
              <BillSkeleton />
            ) : isError ? (
              <BillError
                message={(error as Error)?.message || "Failed to load invoice."}
                onRetry={() => refetch()}
                retrying={isFetching}
              />
            ) : (
              <Bill detail={detail} row={row} />
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------
// The bill itself — rendered entirely from the normalized view model.
// ---------------------------------------------------------------------------
function Bill({
  detail,
  row,
}: {
  detail: InvoiceDetail | undefined;
  row: InvoiceSearchItem | null;
}) {
  const vm: BillViewModel = useMemo(
    () => buildBillViewModel(detail, row),
    [detail, row]
  );

  const { company, billTo, shipTo, meta, items, totals, eInvoice, isEInvoiced } = vm;
  const isAuthorized = Boolean(row?.isAuthorized);
  const poNumber = row?.poNumber ?? null;

  return (
    <div className="px-4 py-6 text-sm leading-relaxed sm:px-7 sm:py-7">
      {/* Top accent + header */}
      <div className="h-1.5 -mx-4 -mt-6 mb-6 bg-primary sm:-mx-7 sm:-mt-7" />

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
              <Store className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <h2 className="truncate text-lg font-semibold tracking-tight text-zinc-900">
                {company.name ?? meta.spName ?? "Tax Invoice"}
              </h2>
              {(company.address || meta.spName) && (
                <p className="truncate text-xs text-zinc-500">
                  {company.address ?? `Branch: ${meta.spName}`}
                </p>
              )}
            </div>
          </div>
          <div className="mt-2 space-y-0.5 text-xs text-zinc-500">
            {company.gstin && (
              <p>
                <span className="text-zinc-400">GSTIN:</span>{" "}
                <span className="font-medium text-zinc-700">{company.gstin}</span>
              </p>
            )}
            {company.stateName && (
              <p>
                <span className="text-zinc-400">State:</span>{" "}
                <span className="font-medium text-zinc-700">
                  {company.stateCode ? `${company.stateCode} – ` : ""}
                  {company.stateName}
                </span>
              </p>
            )}
          </div>
        </div>

        <div className="shrink-0 text-left sm:text-right">
          <p className="text-xs font-semibold uppercase tracking-wide text-zinc-400">
            Tax Invoice
          </p>
          <p className="mt-0.5 font-mono text-base font-semibold text-zinc-900">
            {meta.billNo ?? "—"}
          </p>
          <dl className="mt-2 space-y-0.5 text-xs text-zinc-500">
            {meta.invoiceNo && (
              <div className="flex justify-start gap-2 sm:justify-end">
                <dt className="text-zinc-400">Invoice No</dt>
                <dd className="font-medium tabular-nums text-zinc-700">{meta.invoiceNo}</dd>
              </div>
            )}
            <div className="flex justify-start gap-2 sm:justify-end">
              <dt className="text-zinc-400">Date</dt>
              <dd className="font-medium text-zinc-700">{safeDate(meta.date)}</dd>
            </div>
            {meta.dueDate && (
              <div className="flex justify-start gap-2 sm:justify-end">
                <dt className="text-zinc-400">Due</dt>
                <dd className="font-medium text-zinc-700">{safeDate(meta.dueDate)}</dd>
              </div>
            )}
            {meta.spName && (
              <div className="flex justify-start gap-2 sm:justify-end">
                <dt className="text-zinc-400">Stock Place</dt>
                <dd className="font-medium text-zinc-700">{meta.spName}</dd>
              </div>
            )}
          </dl>
          <div className="mt-2 flex flex-wrap justify-start gap-1.5 sm:justify-end">
            {isEInvoiced && (
              <Badge className="gap-1 border-transparent bg-sky-100 text-sky-700 hover:bg-sky-100">
                <BadgeCheck className="h-3 w-3" />
                e-Invoice
              </Badge>
            )}
            {isAuthorized ? (
              <Badge className="gap-1 border-transparent bg-emerald-100 text-emerald-700 hover:bg-emerald-100">
                <ShieldCheck className="h-3 w-3" />
                Authorized
              </Badge>
            ) : (
              <Badge variant="outline" className="border-amber-300 text-amber-700">
                Pending
              </Badge>
            )}
          </div>
        </div>
      </div>

      {/* Bill To / Ship To */}
      <div className="mt-6 grid grid-cols-1 gap-px overflow-hidden rounded-lg border border-zinc-200 bg-zinc-200 sm:grid-cols-2">
        <PartyBlock label="Bill To" party={billTo} />
        <PartyBlock label="Ship To" party={shipTo} />
      </div>

      {/* Meta chips */}
      {(meta.recBy || poNumber || meta.placeOfSupply || eInvoice?.irn) && (
        <div className="mt-4 flex flex-wrap gap-2 text-xs">
          {meta.recBy && <MetaChip label="Payment" value={meta.recBy} />}
          {poNumber && <MetaChip label="PO No" value={poNumber} />}
          {meta.placeOfSupply && <MetaChip label="Place of Supply" value={meta.placeOfSupply} />}
          {eInvoice?.irn && <MetaChip label="IRN" value={eInvoice.irn} mono />}
        </div>
      )}

      {/* Items table (scrolls horizontally on narrow screens) */}
      <div className="mt-5 overflow-x-auto rounded-lg border border-zinc-200">
        <table className="w-full min-w-[640px] border-collapse text-sm">
          <thead>
            <tr className="bg-zinc-50 text-left text-xs uppercase tracking-wide text-zinc-500">
              <th className="w-10 px-3 py-2 text-center font-semibold">#</th>
              <th className="px-3 py-2 font-semibold">Description</th>
              <th className="px-3 py-2 text-center font-semibold">HSN</th>
              <th className="px-3 py-2 text-right font-semibold">Qty</th>
              <th className="px-3 py-2 text-right font-semibold">Rate</th>
              <th className="px-3 py-2 text-right font-semibold">Disc</th>
              <th className="px-3 py-2 text-right font-semibold">GST</th>
              <th className="px-3 py-2 text-right font-semibold">Amount</th>
            </tr>
          </thead>
          <tbody>
            {items.length > 0 ? (
              items.map((item) => <ItemRow key={item.sno} item={item} />)
            ) : (
              <tr>
                <td colSpan={8} className="px-3 py-10 text-center text-sm text-zinc-500">
                  No line items available for this invoice.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Totals */}
      <div className="mt-5 flex flex-col gap-5 sm:flex-row sm:justify-between">
        <div className="space-y-3 text-xs sm:max-w-xs">
          <div>
            <p className="font-semibold uppercase tracking-wide text-zinc-400">
              Amount in words
            </p>
            <p className="mt-1 font-medium text-zinc-700">{totals.amountInWords}</p>
          </div>
          {eInvoice && (
            <div className="rounded-md border border-sky-100 bg-sky-50/60 p-2.5">
              <p className="flex items-center gap-1 font-semibold uppercase tracking-wide text-sky-600">
                <BadgeCheck className="h-3 w-3" />
                e-Invoice
              </p>
              <dl className="mt-1 space-y-0.5 text-zinc-600">
                {eInvoice.ackNo && (
                  <div className="flex gap-2">
                    <dt className="text-zinc-400">Ack No</dt>
                    <dd className="font-medium tabular-nums">{eInvoice.ackNo}</dd>
                  </div>
                )}
                {eInvoice.ackDt && (
                  <div className="flex gap-2">
                    <dt className="text-zinc-400">Ack Date</dt>
                    <dd className="font-medium">{safeDate(eInvoice.ackDt, "dd MMM yyyy, HH:mm")}</dd>
                  </div>
                )}
              </dl>
            </div>
          )}
        </div>

        <div className="w-full sm:w-72">
          <dl className="space-y-1.5 text-sm">
            <TotalRow label="Sub Total" value={totals.taxableSubtotal} />
            {totals.totalDiscount > 0 && (
              <TotalRow label="Discount" value={-totals.totalDiscount} className="text-emerald-600" />
            )}
            {totals.cgst > 0 && <TotalRow label="CGST" value={totals.cgst} muted />}
            {totals.sgst > 0 && <TotalRow label="SGST" value={totals.sgst} muted />}
            {totals.igst > 0 && <TotalRow label="IGST" value={totals.igst} muted />}
            {totals.otherCharges !== 0 && (
              <TotalRow label="Other Charges" value={totals.otherCharges} muted />
            )}
            {totals.roundOff !== 0 && (
              <TotalRow label="Round Off" value={totals.roundOff} muted />
            )}
            <div className="mt-2 flex items-center justify-between rounded-md bg-primary px-3 py-2.5 text-primary-foreground">
              <span className="text-sm font-semibold">Grand Total</span>
              <span className="text-base font-bold tabular-nums">
                {formatCurrency(totals.grandTotal)}
              </span>
            </div>
          </dl>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-7 flex flex-col items-start justify-between gap-6 border-t border-dashed border-zinc-200 pt-4 sm:flex-row sm:items-end">
        <p className="max-w-sm text-xs text-zinc-400">
          This is a computer-generated invoice and does not require a physical signature.
        </p>
        <div className="text-left sm:text-right">
          <div className="h-10" />
          <p className="border-t border-zinc-300 pt-1 text-xs font-medium text-zinc-600">
            Authorized Signatory
          </p>
        </div>
      </div>

      <p className="mt-4 text-center text-xs font-medium text-zinc-400">
        Thank you for your business
      </p>
    </div>
  );
}

function ItemRow({ item }: { item: BillItem }) {
  return (
    <tr className="border-t border-zinc-100 align-top">
      <td className="px-3 py-2.5 text-center text-zinc-500 tabular-nums">{item.sno}</td>
      <td className="px-3 py-2.5 font-medium text-zinc-800">{item.description}</td>
      <td className="px-3 py-2.5 text-center text-zinc-500 tabular-nums">{item.hsn ?? "—"}</td>
      <td className="px-3 py-2.5 text-right tabular-nums text-zinc-700">
        {item.qty}
        {item.unit ? <span className="text-zinc-400"> {item.unit}</span> : null}
      </td>
      <td className="px-3 py-2.5 text-right tabular-nums text-zinc-700">
        {formatCurrency(item.rate)}
      </td>
      <td className="px-3 py-2.5 text-right tabular-nums text-zinc-700">
        {item.discountAmount > 0 ? (
          <>
            {formatCurrency(item.discountAmount)}
            {item.discountPercent != null && (
              <span className="block text-[10px] text-zinc-400">{item.discountPercent}%</span>
            )}
          </>
        ) : (
          "—"
        )}
      </td>
      <td className="px-3 py-2.5 text-right tabular-nums text-zinc-700">
        {item.gstRate != null ? (
          <>
            {item.gstRate}%
            {item.cgstAmount + item.sgstAmount + item.igstAmount > 0 && (
              <span className="block text-[10px] text-zinc-400">
                {formatCurrency(item.cgstAmount + item.sgstAmount + item.igstAmount)}
              </span>
            )}
          </>
        ) : (
          "—"
        )}
      </td>
      <td className="px-3 py-2.5 text-right font-medium tabular-nums text-zinc-900">
        {formatCurrency(item.taxableAmount)}
      </td>
    </tr>
  );
}

function PartyBlock({ label, party }: { label: string; party: BillParty }) {
  return (
    <div className="bg-white p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-zinc-400">{label}</p>
      <p className="mt-1 font-semibold text-zinc-900">{party.name ?? "—"}</p>
      {party.address && (
        <p className="mt-0.5 text-xs leading-relaxed text-zinc-600">{party.address}</p>
      )}
      {party.gstin && (
        <p className="mt-1 text-xs text-zinc-500">
          <span className="text-zinc-400">GSTIN:</span>{" "}
          <span className="font-medium text-zinc-700">{party.gstin}</span>
        </p>
      )}
      {party.stateName && (
        <p className="text-xs text-zinc-500">
          <span className="text-zinc-400">State:</span>{" "}
          <span className="font-medium text-zinc-700">
            {party.stateCode ? `${party.stateCode} – ` : ""}
            {party.stateName}
          </span>
        </p>
      )}
    </div>
  );
}

function MetaChip({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-md border border-zinc-200 bg-zinc-50 px-2.5 py-1">
      <span className="text-zinc-400">{label}:</span>
      <span className={mono ? "font-mono break-all text-zinc-700" : "font-medium text-zinc-700"}>
        {value}
      </span>
    </span>
  );
}

function TotalRow({
  label,
  value,
  muted,
  className,
}: {
  label: string;
  value: number;
  muted?: boolean;
  className?: string;
}) {
  return (
    <div className={`flex items-center justify-between ${className ?? ""}`}>
      <span className={muted ? "text-xs text-zinc-500" : "text-zinc-600"}>{label}</span>
      <span className={`tabular-nums ${muted ? "text-xs text-zinc-600" : "text-zinc-800"}`}>
        {formatCurrency(value)}
      </span>
    </div>
  );
}

function BillSkeleton() {
  return (
    <div className="px-4 py-6 sm:px-7 sm:py-7">
      <div className="h-1.5 -mx-4 -mt-6 mb-6 bg-zinc-200 sm:-mx-7 sm:-mt-7" />
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-2">
          <div className="h-6 w-48 animate-pulse rounded bg-zinc-200" />
          <div className="h-3 w-32 animate-pulse rounded bg-zinc-100" />
        </div>
        <div className="space-y-2 sm:text-right">
          <div className="h-5 w-32 animate-pulse rounded bg-zinc-200 sm:ml-auto" />
          <div className="h-3 w-24 animate-pulse rounded bg-zinc-100 sm:ml-auto" />
        </div>
      </div>
      <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="h-20 animate-pulse rounded-lg bg-zinc-100" />
        <div className="h-20 animate-pulse rounded-lg bg-zinc-100" />
      </div>
      <div className="mt-5 space-y-2">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-9 animate-pulse rounded bg-zinc-100" />
        ))}
      </div>
      <div className="mt-5 flex justify-end">
        <div className="h-28 w-full animate-pulse rounded-lg bg-zinc-100 sm:w-72" />
      </div>
      <div className="mt-6 flex items-center justify-center gap-2 text-sm text-zinc-400">
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading invoice…
      </div>
    </div>
  );
}

function BillError({
  message,
  onRetry,
  retrying,
}: {
  message: string;
  onRetry: () => void;
  retrying: boolean;
}) {
  return (
    <div className="flex flex-col items-center justify-center px-7 py-16 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-red-500">
        <AlertCircle className="h-6 w-6" />
      </div>
      <p className="mt-4 font-medium text-zinc-800">Couldn&apos;t load this invoice</p>
      <p className="mt-1 max-w-sm text-sm text-zinc-500">{message}</p>
      <Button variant="outline" size="sm" className="mt-4 gap-1.5" onClick={onRetry} disabled={retrying}>
        {retrying ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <RefreshCw className="h-3.5 w-3.5" />
        )}
        Try again
      </Button>
    </div>
  );
}
