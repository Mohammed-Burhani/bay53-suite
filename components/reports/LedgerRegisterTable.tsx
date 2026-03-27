"use client";

import { useMemo, useState } from "react";
import { DataTable } from "@/components/ui/data-table";
import { FileText, ChevronDown, ChevronRight } from "lucide-react";
import { formatCurrency } from "@/lib/store";
import { format } from "date-fns";
import type { LedgerRegisterItem } from "@/lib/types/reports.types";
import { ModuleAIAssistant } from "@/components/ModuleAIAssistant";
import { Button } from "@/components/ui/button";

interface LedgerRegisterTableProps {
  data: LedgerRegisterItem[];
  ledgerName?: string;
}

export function LedgerRegisterTable({ data, ledgerName }: LedgerRegisterTableProps) {
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());

  const toggleRow = (index: number) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedRows(newExpanded);
  };

  const columns = [
    {
      key: "billDate",
      label: "Date",
      render: (value: unknown, row: Record<string, unknown>) => {
        if (row.type === "Opening Amount") {
          return <span className="font-medium text-muted-foreground">Opening</span>;
        }
        return value ? (
          <span className="font-medium">{format(new Date(value as string), "dd MMM yyyy")}</span>
        ) : (
          <span className="text-muted-foreground">-</span>
        );
      },
    },
    {
      key: "billNo",
      label: "Bill No.",
      render: (value: unknown, row: Record<string, unknown>) => {
        if (!value) return <span className="text-muted-foreground">-</span>;
        const hasDetails = (row.billDetails as unknown[])?.length > 0;
        const index = data.findIndex((item) => item.billNo === value);
        const isExpanded = expandedRows.has(index);

        return (
          <div className="flex items-center gap-2">
            {hasDetails && (
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0"
                onClick={() => toggleRow(index)}
              >
                {isExpanded ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </Button>
            )}
            <span className="font-mono text-sm bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 px-2 py-1 rounded">
              {value as string}
            </span>
          </div>
        );
      },
    },
    {
      key: "particular",
      label: "Particulars",
      render: (value: unknown, row: Record<string, unknown>) => (
        <div>
          <div className="font-medium">{(value as string) || "-"}</div>
          <div className="text-xs text-muted-foreground">{row.type as string}</div>
        </div>
      ),
    },
    {
      key: "debit",
      label: "Debit",
      align: "right" as const,
      className: "tabular-nums",
      render: (value: unknown) =>
        value ? (
          <span className="text-red-600 dark:text-red-400">{formatCurrency(value as number)}</span>
        ) : (
          <span className="text-muted-foreground">-</span>
        ),
    },
    {
      key: "credit",
      label: "Credit",
      align: "right" as const,
      className: "tabular-nums",
      render: (value: unknown) =>
        value ? (
          <span className="text-green-600 dark:text-green-400">{formatCurrency(value as number)}</span>
        ) : (
          <span className="text-muted-foreground">-</span>
        ),
    },
    {
      key: "running",
      label: "Balance",
      align: "right" as const,
      className: "font-semibold tabular-nums",
      render: (value: unknown, row: Record<string, unknown>) => {
        const drCr = row.drCr as string;
        return (
          <div className="flex items-center justify-end gap-1">
            <span className={drCr === "Dr" ? "text-amber-600 dark:text-amber-400" : "text-green-600 dark:text-green-400"}>
              {formatCurrency(value as number)}
            </span>
            <span className="text-xs font-normal text-muted-foreground">{drCr}</span>
          </div>
        );
      },
    },
  ];

  const totalDebit = useMemo(
    () => data.reduce((sum, item) => sum + (item.debit || 0), 0),
    [data]
  );

  const totalCredit = useMemo(
    () => data.reduce((sum, item) => sum + (item.credit || 0), 0),
    [data]
  );

  const closingBalance = useMemo(() => {
    const lastEntry = data[data.length - 1];
    return lastEntry?.running || 0;
  }, [data]);

  const closingDrCr = useMemo(() => {
    const lastEntry = data[data.length - 1];
    return lastEntry?.drCr || "Dr";
  }, [data]);

  const summaryRow = data.length > 0 ? {
    label: "Closing Balance",
    colspan: 3,
    values: [
      <span key="debit" className="text-red-600 dark:text-red-400">
        {formatCurrency(totalDebit)}
      </span>,
      <span key="credit" className="text-green-600 dark:text-green-400">
        {formatCurrency(totalCredit)}
      </span>,
      <div key="balance" className="flex items-center justify-end gap-1">
        <span className={closingDrCr === "Dr" ? "text-amber-600 dark:text-amber-400" : "text-green-600 dark:text-green-400"}>
          {formatCurrency(closingBalance)}
        </span>
        <span className="text-xs font-normal text-muted-foreground">{closingDrCr}</span>
      </div>,
    ],
  } : undefined;

  // Custom row renderer for expandable details
  const renderRow = (row: Record<string, unknown>, index: number) => {
    const item = data[index];
    const isExpanded = expandedRows.has(index);
    const hasDetails = item.billDetails && item.billDetails.length > 0;
    const hasBankDetails = item.bankDetails && item.bankDetails.length > 0;

    return (
      <>
        {hasDetails && isExpanded && (
          <tr className="bg-muted/30">
            <td colSpan={6} className="p-4">
              <div className="space-y-3">
                {item.billDetails && item.billDetails.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold mb-2">Bill Details</h4>
                    <div className="space-y-1">
                      {item.billDetails.map((detail, idx) => (
                        <div key={idx} className="flex justify-between text-sm bg-background p-2 rounded">
                          <span>{detail.name}</span>
                          <span className="font-mono">{formatCurrency(parseFloat(detail.amount))}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {hasBankDetails && (
                  <div>
                    <h4 className="text-sm font-semibold mb-2">Bank Details</h4>
                    <div className="space-y-1">
                      {item.bankDetails!.map((bank, idx) => (
                        <div key={idx} className="text-sm bg-background p-2 rounded space-y-1">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Payment Mode:</span>
                            <span>{bank.paymentMode || "-"}</span>
                          </div>
                          {bank.bankName && (
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Bank:</span>
                              <span>{bank.bankName}</span>
                            </div>
                          )}
                          {bank.chequeNumber && (
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Cheque No:</span>
                              <span>{bank.chequeNumber}</span>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {item.note && (
                  <div>
                    <h4 className="text-sm font-semibold mb-1">Note</h4>
                    <p className="text-sm text-muted-foreground bg-background p-2 rounded">{item.note}</p>
                  </div>
                )}
              </div>
            </td>
          </tr>
        )}
      </>
    );
  };

  return (
    <>
      <DataTable
        title={ledgerName ? `Ledger Register - ${ledgerName}` : "Ledger Register"}
        icon={FileText}
        iconColor="bg-amber-500"
        headerGradient="bg-linear-to-r from-amber-50 to-amber-100/50 dark:from-amber-950 dark:to-amber-900/50"
        hoverColor="hover:bg-amber-50/50 dark:hover:bg-amber-950/20"
        columns={columns}
        data={data as unknown as Record<string, unknown>[]}
        emptyMessage="No ledger entries found"
        summaryRow={summaryRow}
        summaryGradient="bg-linear-to-r from-amber-100 to-amber-50 dark:from-amber-900/30 dark:to-amber-950/20 border-amber-200 dark:border-amber-800"
        renderExpandedRow={renderRow}
        pageSize={50}
        pageSizeOptions={[25, 50, 100, 200]}
        showPagination={true}
      />

      {/* AI Assistant */}
      <ModuleAIAssistant
        moduleName="Ledger Register"
        moduleData={{ ledgerEntries: data, ledgerName }}
      />
    </>
  );
}
