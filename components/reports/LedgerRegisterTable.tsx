"use client";

import { useMemo } from "react";
import { ReportTable } from "./ReportTable";
import { FileText } from "lucide-react";
import { formatCurrency } from "@/lib/store";
import { format } from "date-fns";
import type { Invoice } from "@/lib/types";

interface LedgerRegisterTableProps {
  invoices: Invoice[];
}

export function LedgerRegisterTable({ invoices }: LedgerRegisterTableProps) {
  const ledgerEntries = useMemo(() => {
    return invoices.map((inv) => ({
      ...inv,
      debit: inv.grandTotal,
      credit: inv.amountPaid,
      balance: inv.grandTotal - inv.amountPaid,
    }));
  }, [invoices]);

  const columns = [
    {
      key: "invoiceDate",
      label: "Date",
      render: (value: string) => (
        <span className="font-medium">{format(new Date(value), "dd MMM yyyy")}</span>
      ),
    },
    {
      key: "partyName",
      label: "Particulars",
      className: "max-w-[200px] truncate",
    },
    {
      key: "invoiceNumber",
      label: "Invoice No.",
      render: (value: string) => (
        <span className="font-mono text-sm bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 px-2 py-1 rounded">
          {value}
        </span>
      ),
    },
    {
      key: "debit",
      label: "Debit",
      align: "right" as const,
      className: "tabular-nums text-red-600 dark:text-red-400",
      render: (value: number) => formatCurrency(value),
    },
    {
      key: "credit",
      label: "Credit",
      align: "right" as const,
      className: "tabular-nums text-green-600 dark:text-green-400",
      render: (value: number) => formatCurrency(value),
    },
    {
      key: "balance",
      label: "Balance",
      align: "right" as const,
      className: "font-semibold tabular-nums",
      render: (value: number) => (
        <span className={value > 0 ? "text-amber-600 dark:text-amber-400" : "text-muted-foreground"}>
          {formatCurrency(value)}
        </span>
      ),
    },
  ];

  const runningBalance = ledgerEntries.reduce((acc, entry) => acc + entry.balance, 0);

  const summaryRow = ledgerEntries.length > 0 ? {
    label: "Total Outstanding",
    colspan: 3,
    values: [
      <span key="debit" className="text-red-600 dark:text-red-400">
        {formatCurrency(ledgerEntries.reduce((s, e) => s + e.debit, 0))}
      </span>,
      <span key="credit" className="text-green-600 dark:text-green-400">
        {formatCurrency(ledgerEntries.reduce((s, e) => s + e.credit, 0))}
      </span>,
      <span key="balance" className={runningBalance > 0 ? "text-amber-600 dark:text-amber-400" : "text-muted-foreground"}>
        {formatCurrency(runningBalance)}
      </span>,
    ],
  } : undefined;

  return (
    <ReportTable
      title="Sales Ledger Register"
      icon={FileText}
      iconColor="bg-amber-500"
      headerGradient="bg-linear-to-r from-amber-50 to-amber-100/50 dark:from-amber-950 dark:to-amber-900/50"
      hoverColor="hover:bg-amber-50/50 dark:hover:bg-amber-950/20"
      columns={columns}
      data={ledgerEntries}
      emptyMessage="No ledger entries found"
      summaryRow={summaryRow}
      summaryGradient="bg-linear-to-r from-amber-100 to-amber-50 dark:from-amber-900/30 dark:to-amber-950/20 border-amber-200 dark:border-amber-800"
    />
  );
}
