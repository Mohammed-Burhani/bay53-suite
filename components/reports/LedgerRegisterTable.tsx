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
          <tr className="bg-muted/30 border-l-4 border-amber-400">
            <td colSpan={6} className="p-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-w-5xl">
                {/* Bill Details Section */}
                {item.billDetails && item.billDetails.length > 0 && (
                  <div className="bg-background rounded-lg p-3 border">
                    <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Bill Details</h4>
                    <div className="space-y-2">
                      {item.billDetails.map((detail, idx) => {
                        const subTypeMap: Record<string, string> = {
                          "1": "Against Reference",
                          "2": "On Account",
                        };
                        const subTypeLabel = subTypeMap[detail.subType] || detail.subType;
                        const isCr = detail.iscr === "1";
                        
                        return (
                          <div key={idx} className="flex items-center justify-between py-1.5 border-b last:border-0">
                            <div className="flex flex-col gap-0.5">
                              <span className="text-sm font-medium">{detail.name}</span>
                              <span className="text-xs text-muted-foreground">{subTypeLabel}</span>
                            </div>
                            <span className={`text-sm font-mono font-semibold ${isCr ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                              {formatCurrency(parseFloat(detail.amount))}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Bank Details Section */}
                {hasBankDetails && (
                  <div className="bg-background rounded-lg p-3 border">
                    <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Bank Details</h4>
                    <div className="space-y-2">
                      {item.bankDetails!.map((bank, idx) => {
                        const instrumentTypeMap: Record<string, string> = {
                          "1": "Cash",
                          "2": "Cheque",
                          "3": "DD",
                          "4": "NEFT/RTGS",
                          "5": "Card",
                          "6": "UPI",
                        };
                        const instrumentType = instrumentTypeMap[bank.instrumentType] || bank.instrumentType;
                        
                        return (
                          <div key={idx} className="space-y-1.5">
                            <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-sm">
                              <div className="text-muted-foreground text-xs">Instrument Type:</div>
                              <div className="font-medium text-right">{instrumentType}</div>
                              
                              {bank.instrumentNo && (
                                <>
                                  <div className="text-muted-foreground text-xs">Instrument No:</div>
                                  <div className="font-mono text-right">{bank.instrumentNo}</div>
                                </>
                              )}
                              
                              {bank.instrumentDate && (
                                <>
                                  <div className="text-muted-foreground text-xs">Date:</div>
                                  <div className="text-right">{format(new Date(bank.instrumentDate), "dd MMM yyyy")}</div>
                                </>
                              )}
                              
                              {bank.bankname && (
                                <>
                                  <div className="text-muted-foreground text-xs">Bank:</div>
                                  <div className="text-right">{bank.bankname}</div>
                                </>
                              )}
                              
                              {bank.branchname && (
                                <>
                                  <div className="text-muted-foreground text-xs">Branch:</div>
                                  <div className="text-right">{bank.branchname}</div>
                                </>
                              )}
                              
                              <div className="text-muted-foreground text-xs">Amount:</div>
                              <div className="font-mono font-semibold text-right text-green-600 dark:text-green-400">
                                {formatCurrency(parseFloat(bank.amount))}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Note Section - Full Width */}
                {item.note && (
                  <div className="bg-background rounded-lg p-3 border md:col-span-2">
                    <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">Note</h4>
                    <p className="text-sm text-foreground">{item.note}</p>
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
