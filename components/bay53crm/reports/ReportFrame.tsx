"use client";

import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TableCell, TableRow } from "@/components/ui/table";
import { FileDown, FileText, List, Loader2, Printer, SlidersHorizontal } from "lucide-react";

export type ReportTab = "criteria" | "report";

interface ReportFrameProps {
  title: string;
  /** Shown under the title, e.g. "12 leads". */
  subtitle: string;
  tab: ReportTab;
  onTabChange: (tab: ReportTab) => void;
  /** Row count shown on the report tab, or null before the report has run. */
  count: number | null;
  /** True while the report loads; the run button shows it. */
  isRunning: boolean;
  onRun: () => void;
  onCsv?: () => void;
  onPdf?: () => void;
  onPrint?: () => void;
  /** The criteria inputs, laid out by the screen. */
  criteria: ReactNode;
  /** The report body, shown on the report tab. */
  children: ReactNode;
}

/** Title bar, export buttons and the Criteria / Report tabs shared by the report screens. */
export function ReportFrame({
  title,
  subtitle,
  tab,
  onTabChange,
  count,
  isRunning,
  onRun,
  onCsv,
  onPdf,
  onPrint,
  criteria,
  children,
}: ReportFrameProps) {
  const canExport = (count ?? 0) > 0;
  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
          <p className="text-sm text-muted-foreground">{subtitle}</p>
        </div>
        <div className="flex gap-2">
          {onCsv && (
            <Button variant="outline" size="sm" disabled={!canExport} onClick={onCsv}>
              <FileDown className="h-4 w-4 mr-1" />CSV
            </Button>
          )}
          {onPdf && (
            <Button variant="outline" size="sm" disabled={!canExport} onClick={onPdf}>
              <FileText className="h-4 w-4 mr-1" />PDF
            </Button>
          )}
          {onPrint && (
            <Button variant="outline" size="sm" disabled={!canExport} onClick={onPrint}>
              <Printer className="h-4 w-4 mr-1" />Print
            </Button>
          )}
        </div>
      </div>

      <Tabs value={tab} onValueChange={(v) => onTabChange(v as ReportTab)}>
        <TabsList>
          <TabsTrigger value="criteria"><SlidersHorizontal className="h-4 w-4 mr-1" />Criteria</TabsTrigger>
          <TabsTrigger value="report">
            <List className="h-4 w-4 mr-1" />Report{count !== null ? ` (${count})` : ""}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="criteria">
          <Card>
            <CardContent className="p-4 space-y-4">
              {criteria}
              <div className="flex justify-end">
                <Button onClick={onRun} disabled={isRunning}>
                  {isRunning && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
                  View Report
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="report">{children}</TabsContent>
      </Tabs>
    </div>
  );
}

interface ReportStateRowProps {
  colSpan: number;
  /** The report has not been run yet. */
  isIdle: boolean;
  isLoading: boolean;
  error: unknown;
  /** What to say when the report ran and returned nothing. */
  emptyMessage: string;
}

/** The single table row that explains why there are no data rows: not run, loading, failed or empty. */
export function ReportStateRow({ colSpan, isIdle, isLoading, error, emptyMessage }: ReportStateRowProps) {
  const message = isIdle
    ? 'Choose the criteria and click "View Report"'
    : isLoading
      ? "Loading report..."
      : error
        ? `Could not load the report: ${error instanceof Error ? error.message : "unknown error"}`
        : emptyMessage;
  return (
    <TableRow>
      <TableCell colSpan={colSpan} className={`text-center py-8 ${error ? "text-destructive" : "text-muted-foreground"}`}>
        {message}
      </TableCell>
    </TableRow>
  );
}
