"use client";

import { ReportTable } from "./ReportTable";
import { FileText } from "lucide-react";
import { formatCurrency } from "@/lib/store";
import { format } from "date-fns";
import type { Invoice } from "@/lib/types";

interface QuotationsReportTableProps {
  invoices: Invoice[];
}

export function QuotationsReportTable({ invoices }: QuotationsReportTableProps) {
  const columns = [
    {
      key: "invoiceDate",
      label: "Quotation Date",
      render: (value: unknown) => (
        <span className="font-medium">{format(new Date(value as string), "dd/MMM/yyyy")}</span>
      ),
    },
    {
      key: "invoiceNumber",
      label: "Quotation No.",
      render: (value: unknown) => (
        <span className="font-mono text-sm bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-300 px-2 py-1 rounded">
          {value as string}
        </span>
      ),
    },
    {
      key: "partyName",
      label: "Customer Name",
      className: "max-w-[200px] truncate font-medium",
    },
    {
      key: "date",
      label: "Enquiry Date",
      render: (value: unknown) => (
        <span className="text-sm">{format(new Date(value as string), "dd/MMM/yyyy")}</span>
      ),
    },
    {
      key: "status",
      label: "Status",
      render: (value: unknown) => {
        const status = value as string;
        const isConverted = status === "paid" || status === "partial";
        return (
          <span
            className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${
              isConverted
                ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 ring-1 ring-green-600/20"
                : status === "cancelled"
                ? "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 ring-1 ring-red-600/20"
                : "bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-300 ring-1 ring-cyan-600/20"
            }`}
          >
            {isConverted ? "Converted" : status === "cancelled" ? "Cancelled" : "Pending"}
          </span>
        );
      },
    },
    {
      key: "taxableAmount",
      label: "Amount",
      align: "right" as const,
      className: "tabular-nums",
      render: (value: unknown) => formatCurrency(value as number),
    },
    {
      key: "totalGst",
      label: "GST",
      align: "right" as const,
      className: "tabular-nums text-muted-foreground",
      render: (value: unknown) => formatCurrency(value as number),
    },
    {
      key: "grandTotal",
      label: "Total Amount",
      align: "right" as const,
      className: "font-semibold tabular-nums",
      render: (value: unknown) => formatCurrency(value as number),
    },
  ];

  const totalAmount = invoices.reduce((s, i) => s + i.grandTotal, 0);
  const totalGST = invoices.reduce((s, i) => s + i.totalGst, 0);
  const totalTaxable = invoices.reduce((s, i) => s + i.taxableAmount, 0);

  const summaryRow = invoices.length > 0 ? {
    label: "Total",
    colspan: 5,
    values: [
      formatCurrency(totalTaxable),
      <span key="gst" className="text-muted-foreground">
        {formatCurrency(totalGST)}
      </span>,
      <span key="total" className="font-bold">
        {formatCurrency(totalAmount)}
      </span>,
    ],
  } : undefined;

  return (
    <ReportTable
      title="Quotations / Estimates Report"
      icon={FileText}
      iconColor="bg-cyan-500"
      headerGradient="bg-linear-to-r from-cyan-50 to-cyan-100/50 dark:from-cyan-950 dark:to-cyan-900/50"
      hoverColor="hover:bg-cyan-50/50 dark:hover:bg-cyan-950/20"
      columns={columns}
      data={invoices as unknown as Record<string, unknown>[]}
      emptyMessage="No quotations found"
      summaryRow={summaryRow}
      summaryGradient="bg-linear-to-r from-cyan-100 to-cyan-50 dark:from-cyan-900/30 dark:to-cyan-950/20 border-cyan-200 dark:border-cyan-800"
    />
  );
}
