"use client";

import { useMemo } from "react";
import { ReportTable } from "./ReportTable";
import { TrendingUp } from "lucide-react";
import { formatCurrency } from "@/lib/store";
import type { Invoice } from "@/lib/types";
import { ModuleAIAssistant } from "@/components/ModuleAIAssistant";

interface CustomerReportTableProps {
  invoices: Invoice[];
}

interface CustomerSummary {
  id: string;
  name: string;
  totalSales: number;
  totalPaid: number;
  invoiceCount: number;
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
      render: (value: unknown) => (
        <span className="inline-flex items-center justify-center min-w-8 h-7 rounded-full bg-[var(--report-accent-bg)] dark:bg-[var(--report-accent)]/10 text-[var(--report-accent)] font-semibold text-sm px-2">
          {value as number}
        </span>
      ),
    },
    {
      key: "totalSales",
      label: "Total Sales",
      align: "right" as const,
      className: "font-semibold tabular-nums",
      render: (value: unknown) => formatCurrency(value as number),
    },
    {
      key: "totalPaid",
      label: "Amount Paid",
      align: "right" as const,
      className: "tabular-nums text-green-600 dark:text-green-400",
      render: (value: unknown) => formatCurrency(value as number),
    },
    {
      key: "outstanding",
      label: "Outstanding",
      align: "right" as const,
      className: "tabular-nums",
      render: (_: unknown, row: unknown) => {
        const customer = row as CustomerSummary;
        const outstanding = customer.totalSales - customer.totalPaid;
        return (
          <span className={outstanding > 0 ? "font-semibold text-amber-600 dark:text-amber-400" : "text-muted-foreground"}>
            {formatCurrency(outstanding)}
          </span>
        );
      },
    },
  ];

  return (
    <>
    <ReportTable
      title="Customer-wise Sales Summary"
      icon={TrendingUp}
      iconColor="bg-[var(--report-accent)]"
      headerGradient="bg-linear-to-r from-[var(--report-accent-bg)] to-[var(--report-accent-bg)] dark:from-[var(--report-accent)]/10 dark:to-[var(--report-accent)]/5"
      hoverColor="hover:bg-[var(--report-accent-bg)] dark:hover:bg-[var(--report-accent)]/5"
      columns={columns}
      data={customerSummary as unknown as Record<string, unknown>[]}
      emptyMessage="No customer data found"
    />

    {/* AI Assistant */}
    <ModuleAIAssistant
      moduleName="Customer Report"
      moduleData={{ invoices, customerSummary }}
    />
    </>
  );
}
