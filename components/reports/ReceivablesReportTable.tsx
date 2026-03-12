"use client";

import { useMemo } from "react";
import { ReportTable } from "./ReportTable";
import { IndianRupee } from "lucide-react";
import { formatCurrency } from "@/lib/store";
import { format } from "date-fns";
import type { Invoice } from "@/lib/types";
import { ModuleAIAssistant } from "@/components/ModuleAIAssistant";

interface ReceivablesReportTableProps {
  invoices: Invoice[];
}

interface ReceivableEntry {
  id: string;
  customerName: string;
  invoiceNumber: string;
  invoiceDate: string;
  orderDate: string;
  receivableAmount: number;
  received: number;
  chequeNo: string;
  chequeDate: string;
  dueAmount: number;
}

export function ReceivablesReportTable({ invoices }: ReceivablesReportTableProps) {
  const receivableEntries = useMemo(() => {
    return invoices
      .filter(inv => inv.grandTotal > inv.amountPaid)
      .map((inv) => ({
        id: inv.id,
        customerName: inv.partyName,
        invoiceNumber: inv.invoiceNumber,
        invoiceDate: inv.invoiceDate,
        orderDate: inv.date,
        receivableAmount: inv.grandTotal,
        received: inv.amountPaid,
        chequeNo: "",
        chequeDate: "",
        dueAmount: inv.grandTotal - inv.amountPaid,
      }));
  }, [invoices]);

  const columns = [
    {
      key: "customerName",
      label: "Customer Name",
      className: "font-medium",
    },
    {
      key: "invoiceNumber",
      label: "Invoice No.",
      render: (value: unknown) => (
        <span className="font-mono text-sm bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 px-2 py-1 rounded">
          {value as string}
        </span>
      ),
    },
    {
      key: "orderDate",
      label: "Order Date",
      render: (value: unknown) => (
        <span className="text-sm">{format(new Date(value as string), "dd/MMM/yyyy")}</span>
      ),
    },
    {
      key: "invoiceDate",
      label: "Invoice Date",
      render: (value: unknown) => (
        <span className="text-sm">{format(new Date(value as string), "dd/MMM/yyyy")}</span>
      ),
    },
    {
      key: "receivableAmount",
      label: "Receivable Amt.",
      align: "right" as const,
      className: "tabular-nums font-semibold",
      render: (value: unknown) => formatCurrency(value as number),
    },
    {
      key: "received",
      label: "Received",
      align: "right" as const,
      className: "tabular-nums text-green-600 dark:text-green-400",
      render: (value: unknown) => formatCurrency(value as number),
    },
    {
      key: "dueAmount",
      label: "Due Amount",
      align: "right" as const,
      className: "tabular-nums font-semibold text-red-600 dark:text-red-400",
      render: (value: unknown) => formatCurrency(value as number),
    },
    {
      key: "chequeNo",
      label: "Cheque No.",
      className: "text-sm text-muted-foreground",
    },
    {
      key: "chequeDate",
      label: "Cheque Date",
      className: "text-sm text-muted-foreground",
    },
  ];

  const totalReceivable = receivableEntries.reduce((s, e) => s + e.receivableAmount, 0);
  const totalReceived = receivableEntries.reduce((s, e) => s + e.received, 0);
  const totalDue = receivableEntries.reduce((s, e) => s + e.dueAmount, 0);

  const summaryRow = receivableEntries.length > 0 ? {
    label: "Total Pending Receivables",
    colspan: 4,
    values: [
      formatCurrency(totalReceivable),
      <span key="received" className="text-green-600 dark:text-green-400">
        {formatCurrency(totalReceived)}
      </span>,
      <span key="due" className="text-red-600 dark:text-red-400 font-bold">
        {formatCurrency(totalDue)}
      </span>,
      "",
      "",
    ],
  } : undefined;

  return (
    <>
    <ReportTable
      title="Receivables Report"
      icon={IndianRupee}
      iconColor="bg-orange-500"
      headerGradient="bg-linear-to-r from-orange-50 to-orange-100/50 dark:from-orange-950 dark:to-orange-900/50"
      hoverColor="hover:bg-orange-50/50 dark:hover:bg-orange-950/20"
      columns={columns}
      data={receivableEntries as unknown as Record<string, unknown>[]}
      emptyMessage="No pending receivables"
      summaryRow={summaryRow}
      summaryGradient="bg-linear-to-r from-orange-100 to-orange-50 dark:from-orange-900/30 dark:to-orange-950/20 border-orange-200 dark:border-orange-800"
    />

    {/* AI Assistant */}
    <ModuleAIAssistant
      moduleName="Receivables Report"
      moduleData={{ invoices, receivableEntries }}
    />
    </>
  );
}
