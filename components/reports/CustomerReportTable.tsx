"use client";

import { useMemo } from "react";
import { ReportTable } from "./ReportTable";
import { TrendingUp } from "lucide-react";
import { formatCurrency } from "@/lib/store";
import type { Invoice } from "@/lib/types";

interface CustomerReportTableProps {
  invoices: Invoice[];
}

export function CustomerReportTable({ invoices }: CustomerReportTableProps) {
  const customerSummary = useMemo(() => {
    const summary = new Map();

    invoices.forEach((inv) => {
      const existing = summary.get(inv.partyId) || {
        id: inv.partyId,
        name: inv.partyName,
        totalSales: 0,
        totalPaid: 0,
        invoiceCount: 0,
      };

      summary.set(inv.partyId, {
        ...existing,
        totalSales: existing.totalSales + inv.grandTotal,
        totalPaid: existing.totalPaid + inv.amountPaid,
        invoiceCount: existing.invoiceCount + 1,
      });
    });

    return Array.from(summary.values()).sort((a, b) => b.totalSales - a.totalSales);
  }, [invoices]);

  const columns = [
    {
      key: "name",
      label: "Customer Name",
      className: "font-medium",
    },
    {
      key: "invoiceCount",
      label: "Total Invoices",
      align: "right" as const,
      render: (value: number) => (
        <span className="inline-flex items-center justify-center min-w-8 h-7 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-semibold text-sm px-2">
          {value}
        </span>
      ),
    },
    {
      key: "totalSales",
      label: "Total Sales",
      align: "right" as const,
      className: "font-semibold tabular-nums",
      render: (value: number) => formatCurrency(value),
    },
    {
      key: "totalPaid",
      label: "Amount Paid",
      align: "right" as const,
      className: "tabular-nums text-green-600 dark:text-green-400",
      render: (value: number) => formatCurrency(value),
    },
    {
      key: "outstanding",
      label: "Outstanding",
      align: "right" as const,
      className: "tabular-nums",
      render: (_: any, row: any) => {
        const outstanding = row.totalSales - row.totalPaid;
        return (
          <span className={outstanding > 0 ? "font-semibold text-amber-600 dark:text-amber-400" : "text-muted-foreground"}>
            {formatCurrency(outstanding)}
          </span>
        );
      },
    },
  ];

  return (
    <ReportTable
      title="Customer-wise Sales Summary"
      icon={TrendingUp}
      iconColor="bg-blue-500"
      headerGradient="bg-linear-to-r from-blue-50 to-blue-100/50 dark:from-blue-950 dark:to-blue-900/50"
      hoverColor="hover:bg-blue-50/50 dark:hover:bg-blue-950/20"
      columns={columns}
      data={customerSummary}
      emptyMessage="No customer data found"
    />
  );
}
