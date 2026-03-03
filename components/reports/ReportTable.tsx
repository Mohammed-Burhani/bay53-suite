"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { LucideIcon } from "lucide-react";
import { ReactNode } from "react";

interface Column<T = Record<string, unknown>> {
  key: string;
  label: string;
  align?: "left" | "right" | "center";
  className?: string;
  render?: (value: unknown, row: T, index: number) => ReactNode;
}

interface ReportTableProps<T = Record<string, unknown>> {
  title: string;
  icon: LucideIcon;
  iconColor: string;
  headerGradient: string;
  hoverColor: string;
  columns: Column<T>[];
  data: T[];
  emptyMessage?: string;
  emptyIcon?: LucideIcon;
  summaryRow?: {
    label: string;
    colspan: number;
    values: ReactNode[];
  };
  summaryGradient?: string;
}

export function ReportTable<T extends Record<string, unknown> = Record<string, unknown>>({
  title,
  icon: Icon,
  iconColor,
  headerGradient,
  hoverColor,
  columns,
  data,
  emptyMessage = "No records found",
  emptyIcon: EmptyIcon,
  summaryRow,
  summaryGradient,
}: ReportTableProps<T>) {
  const EmptyIconComponent = EmptyIcon || Icon;

  return (
    <Card className="shadow-sm pt-0!">
      <CardHeader className={`border-b ${headerGradient} py-0!`}>
        <CardTitle className="text-lg font-semibold flex items-center gap-2 pt-4 pb-2">
          <div className={`h-8 w-8 rounded-lg ${iconColor} flex items-center justify-center`}>
            <Icon className="h-4 w-4 text-white" />
          </div>
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-linear-to-r from-muted/80 to-muted/40 hover:from-muted/80 hover:to-muted/40">
                {columns.map((column) => (
                  <TableHead
                    key={column.key}
                    className={`font-semibold ${column.align === "right" ? "text-right" : ""} ${column.className || ""}`}
                  >
                    {column.label}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={columns.length} className="text-center py-12">
                    <div className="flex flex-col items-center gap-2">
                      <EmptyIconComponent className="h-12 w-12 text-muted-foreground/30" />
                      <p className="text-muted-foreground font-medium">{emptyMessage}</p>
                      <p className="text-sm text-muted-foreground">Try adjusting your filters</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                <>
                  {data.map((row, idx) => (
                    <TableRow
                      key={(row as { id?: string }).id || idx}
                      className={`${hoverColor} transition-colors ${
                        idx % 2 === 0 ? "bg-background" : "bg-muted/20"
                      }`}
                    >
                      {columns.map((column) => (
                        <TableCell
                          key={column.key}
                          className={`${column.align === "right" ? "text-right" : ""} ${column.className || ""}`}
                        >
                          {column.render
                            ? column.render((row as Record<string, unknown>)[column.key], row, idx)
                            : String((row as Record<string, unknown>)[column.key] ?? "")}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                  {summaryRow && (
                    <TableRow className={`${summaryGradient} font-semibold border-t-2`}>
                      <TableCell colSpan={summaryRow.colspan} className="text-right">
                        {summaryRow.label}
                      </TableCell>
                      {summaryRow.values.map((value, idx) => (
                        <TableCell key={idx} className="text-right tabular-nums">
                          {value}
                        </TableCell>
                      ))}
                    </TableRow>
                  )}
                </>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
