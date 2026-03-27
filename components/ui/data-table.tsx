"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, LucideIcon } from "lucide-react";
import { ReactNode } from "react";

interface Column<T = Record<string, unknown>> {
  key: string;
  label: string;
  align?: "left" | "right" | "center";
  className?: string;
  render?: (value: unknown, row: T, index: number) => ReactNode;
}

interface DataTableProps<T = Record<string, unknown>> {
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
  renderExpandedRow?: (row: T, index: number) => ReactNode;
  // Pagination props
  pageSize?: number;
  pageSizeOptions?: number[];
  showPagination?: boolean;
}

export function DataTable<T extends Record<string, unknown> = Record<string, unknown>>({
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
  renderExpandedRow,
  pageSize: initialPageSize = 50,
  pageSizeOptions = [10, 25, 50, 100, 200],
  showPagination = true,
}: DataTableProps<T>) {
  const EmptyIconComponent = EmptyIcon || Icon;
  
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(initialPageSize);

  // Calculate pagination
  const totalPages = Math.ceil(data.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedData = showPagination ? data.slice(startIndex, endIndex) : data;

  // Reset to page 1 when data changes
  const handlePageSizeChange = (newSize: string) => {
    setPageSize(Number(newSize));
    setCurrentPage(1);
  };

  const goToPage = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

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
              {paginatedData.length === 0 ? (
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
                  {paginatedData.map((row, idx) => {
                    const actualIndex = startIndex + idx;
                    return (
                      <>
                        <TableRow
                          key={(row as { id?: string }).id || actualIndex}
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
                                ? column.render((row as Record<string, unknown>)[column.key], row, actualIndex)
                                : String((row as Record<string, unknown>)[column.key] ?? "")}
                            </TableCell>
                          ))}
                        </TableRow>
                        {renderExpandedRow && renderExpandedRow(row, actualIndex)}
                      </>
                    );
                  })}
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

        {/* Pagination Controls */}
        {showPagination && data.length > 0 && (
          <div className="flex items-center justify-between px-4 py-3 border-t bg-muted/20">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>Rows per page:</span>
              <Select value={String(pageSize)} onValueChange={handlePageSizeChange}>
                <SelectTrigger className="h-8 w-[70px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {pageSizeOptions.map((size) => (
                    <SelectItem key={size} value={String(size)}>
                      {size}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <span className="ml-4">
                Showing {startIndex + 1} to {Math.min(endIndex, data.length)} of {data.length} entries
              </span>
            </div>

            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => goToPage(1)}
                disabled={currentPage === 1}
              >
                <ChevronsLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => goToPage(currentPage - 1)}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <div className="flex items-center gap-1 px-2">
                <span className="text-sm font-medium">
                  Page {currentPage} of {totalPages}
                </span>
              </div>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => goToPage(currentPage + 1)}
                disabled={currentPage === totalPages}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => goToPage(totalPages)}
                disabled={currentPage === totalPages}
              >
                <ChevronsRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
