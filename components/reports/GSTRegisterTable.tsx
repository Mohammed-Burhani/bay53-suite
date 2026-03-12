"use client";

import { ReportTable } from "./ReportTable";
import { IndianRupee } from "lucide-react";
import { formatCurrency } from "@/lib/store";
import { format } from "date-fns";
import type { Invoice } from "@/lib/types";
import { ModuleAIAssistant } from "@/components/ModuleAIAssistant";

interface GSTRegisterTableProps {
  invoices: Invoice[];
}

export function GSTRegisterTable({ invoices }: GSTRegisterTableProps) {
  const columns = [
    {
      key: "invoiceDate",
      label: "Date",
      render: (value: unknown) => (
        <span className="font-medium">{format(new Date(value as string), "dd MMM yyyy")}</span>
      ),
    },
    {
      key: "invoiceNumber",
      label: "Invoice No.",
      render: (value: unknown) => (
        <span className="font-mono text-sm bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 px-2 py-1 rounded">
          {value as string}
        </span>
      ),
    },
    {
      key: "partyName",
      label: "Customer",
      className: "max-w-[180px] truncate",
    },
    {
      key: "partyGstin",
      label: "GSTIN",
      render: (value: unknown) => (
        <span className="text-xs font-mono bg-muted px-2 py-1 rounded">
          {(value as string) || "N/A"}
        </span>
      ),
    },
    {
      key: "taxableAmount",
      label: "Taxable Value",
      align: "right" as const,
      className: "tabular-nums",
      render: (value: unknown) => formatCurrency(value as number),
    },
    {
      key: "cgst",
      label: "CGST",
      align: "right" as const,
      className: "tabular-nums text-blue-600 dark:text-blue-400",
      render: (value: unknown) => formatCurrency(value as number),
    },
    {
      key: "sgst",
      label: "SGST",
      align: "right" as const,
      className: "tabular-nums text-blue-600 dark:text-blue-400",
      render: (value: unknown) => formatCurrency(value as number),
    },
    {
      key: "igst",
      label: "IGST",
      align: "right" as const,
      className: "tabular-nums text-purple-600 dark:text-purple-400",
      render: (value: unknown) => formatCurrency(value as number),
    },
    {
      key: "totalGst",
      label: "Total GST",
      align: "right" as const,
      className: "font-semibold tabular-nums",
      render: (value: unknown) => formatCurrency(value as number),
    },
  ];

  const summaryRow = invoices.length > 0 ? {
    label: "Total",
    colspan: 4,
    values: [
      formatCurrency(invoices.reduce((s, i) => s + i.taxableAmount, 0)),
      <span key="cgst" className="text-blue-600 dark:text-blue-400">
        {formatCurrency(invoices.reduce((s, i) => s + i.cgst, 0))}
      </span>,
      <span key="sgst" className="text-blue-600 dark:text-blue-400">
        {formatCurrency(invoices.reduce((s, i) => s + i.sgst, 0))}
      </span>,
      <span key="igst" className="text-purple-600 dark:text-purple-400">
        {formatCurrency(invoices.reduce((s, i) => s + i.igst, 0))}
      </span>,
      formatCurrency(invoices.reduce((s, i) => s + i.totalGst, 0)),
    ],
  } : undefined;

  return (
    <>
    <ReportTable
      title="GST Register"
      icon={IndianRupee}
      iconColor="bg-purple-500"
      headerGradient="bg-linear-to-r from-purple-50 to-purple-100/50 dark:from-purple-950 dark:to-purple-900/50"
      hoverColor="hover:bg-purple-50/50 dark:hover:bg-purple-950/20"
      columns={columns}
      data={invoices as unknown as Record<string, unknown>[]}
      emptyMessage="No GST records found"
      summaryRow={summaryRow}
      summaryGradient="bg-linear-to-r from-purple-100 to-purple-50 dark:from-purple-900/30 dark:to-purple-950/20 border-purple-200 dark:border-purple-800"
    />

    {/* AI Assistant */}
    <ModuleAIAssistant
      moduleName="GST Register"
      moduleData={{ invoices }}
    />
    </>
  );
}
