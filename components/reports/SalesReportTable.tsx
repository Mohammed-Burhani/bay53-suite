"use client";

import { ReportTable } from "./ReportTable";
import { FileText } from "lucide-react";
import { formatCurrency } from "@/lib/store";
import { format } from "date-fns";
import type { Invoice } from "@/lib/types";

interface SalesReportTableProps {
  invoices: Invoice[];
}

export function SalesReportTable({ invoices }: SalesReportTableProps) {
  const columns = [
    {
      key: "invoiceDate",
      label: "Date",
      render: (value: string) => (
        <span className="font-medium">{format(new Date(value), "dd MMM yyyy")}</span>
      ),
    },
    {
      key: "invoiceNumber",
      label: "Invoice No.",
      render: (value: string) => (
        <span className="font-mono text-sm bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 px-2 py-1 rounded">
          {value}
        </span>
      ),
    },
    {
      key: "partyName",
      label: "Customer",
      className: "max-w-[200px] truncate",
    },
    {
      key: "taxableAmount",
      label: "Amount",
      align: "right" as const,
      className: "tabular-nums",
      render: (value: number) => formatCurrency(value),
    },
    {
      key: "totalGst",
      label: "GST",
      align: "right" as const,
      className: "tabular-nums text-muted-foreground",
      render: (value: number) => formatCurrency(value),
    },
    {
      key: "grandTotal",
      label: "Total",
      align: "right" as const,
      className: "font-semibold tabular-nums",
      render: (value: number) => formatCurrency(value),
    },
    {
      key: "amountPaid",
      label: "Paid",
      align: "right" as const,
      className: "tabular-nums text-green-600 dark:text-green-400",
      render: (value: number) => formatCurrency(value),
    },
    {
      key: "balance",
      label: "Balance",
      align: "right" as const,
      className: "tabular-nums",
      render: (_: any, row: Invoice) => {
        const balance = row.grandTotal - row.amountPaid;
        return (
          <span className={balance > 0 ? "text-amber-600 dark:text-amber-400 font-medium" : "text-muted-foreground"}>
            {formatCurrency(balance)}
          </span>
        );
      },
    },
    {
      key: "status",
      label: "Status",
      render: (value: string) => (
        <span
          className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${
            value === "paid"
              ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 ring-1 ring-green-600/20"
              : value === "partial"
              ? "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 ring-1 ring-yellow-600/20"
              : "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 ring-1 ring-red-600/20"
          }`}
        >
          {value.charAt(0).toUpperCase() + value.slice(1)}
        </span>
      ),
    },
  ];

  return (
    <ReportTable
      title="Sales Transactions"
      icon={FileText}
      iconColor="bg-emerald-500"
      headerGradient="bg-linear-to-r from-emerald-50 to-emerald-100/50 dark:from-emerald-950 dark:to-emerald-900/50"
      hoverColor="hover:bg-emerald-50/50 dark:hover:bg-emerald-950/20"
      columns={columns}
      data={invoices}
      emptyMessage="No sales records found"
    />
  );
}
