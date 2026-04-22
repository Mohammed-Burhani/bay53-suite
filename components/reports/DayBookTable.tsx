"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Download, Search, X, Filter, FileSpreadsheet, Printer, Calendar, TrendingUp, TrendingDown, SlidersHorizontal } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { ModuleAIAssistant } from "@/components/ModuleAIAssistant";
import { TablePagination, usePagination } from "@/components/ui/table-pagination";

import { exportToExcel, exportToPDF, printTable } from "@/lib/utils/report-export";
  billNo: string;
  billDate: string;
  partyName: string;
  billType: string;
  billAmount: number;
  particular: string;
  debitAmount: number;
  creditAmount: number;
  narration: string;
}

interface DayBookTableProps {
  initialData?: DayBookRow[];
}

// Pagination component for Day Book table
function DayBookTableWithPagination({ data, totalDebit, totalCredit }: { data: DayBookRow[], totalDebit: number, totalCredit: number }) {
  const { currentPage, pageSize, setCurrentPage, setPageSize, getPaginatedData } = usePagination(50);
  const paginatedData = getPaginatedData(data);

  return (
    <>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/20 dark:to-teal-950/20">
              <TableHead className="font-semibold">Bill No</TableHead>
              <TableHead className="font-semibold">Bill Date</TableHead>
              <TableHead className="font-semibold">Party Name</TableHead>
              <TableHead className="font-semibold">Bill Type</TableHead>
              <TableHead className="text-right font-semibold">Bill Amount</TableHead>
              <TableHead className="font-semibold">Particular</TableHead>
              <TableHead className="text-right font-semibold">Debit Amount</TableHead>
              <TableHead className="text-right font-semibold">Credit Amount</TableHead>
              <TableHead className="font-semibold">Narration / Remarks</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-12 text-muted-foreground">
                  <Calendar className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p className="text-lg font-medium">No data found</p>
                  <p className="text-sm">Select filters and click Register to view transactions</p>
                </TableCell>
              </TableRow>
            ) : (
              <>
                {paginatedData.map((row, idx) => (
                  <TableRow key={idx} className="hover:bg-muted/50">
                    <TableCell className="font-mono text-sm">{row.billNo}</TableCell>
                    <TableCell>{row.billDate}</TableCell>
                    <TableCell className="font-medium">{row.partyName}</TableCell>
                    <TableCell><Badge variant="outline">{row.billType}</Badge></TableCell>
                    <TableCell className="text-right font-medium">₹{row.billAmount.toLocaleString()}</TableCell>
                    <TableCell>{row.particular}</TableCell>
                    <TableCell className="text-right font-medium text-emerald-600">
                      {row.debitAmount > 0 ? `₹${row.debitAmount.toLocaleString()}` : '-'}
                    </TableCell>
                    <TableCell className="text-right font-medium text-red-600">
                      {row.creditAmount > 0 ? `₹${row.creditAmount.toLocaleString()}` : '-'}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{row.narration}</TableCell>
                  </TableRow>
                ))}
                <TableRow className="bg-muted/50 font-semibold">
                  <TableCell colSpan={6} className="text-right">Total:</TableCell>
                  <TableCell className="text-right text-emerald-600">₹{totalDebit.toLocaleString()}</TableCell>
                  <TableCell className="text-right text-red-600">₹{totalCredit.toLocaleString()}</TableCell>
                  <TableCell></TableCell>
                </TableRow>
              </>
            )}
          </TableBody>
        </Table>
      </div>

      <TablePagination
        totalItems={data.length}
        pageSize={pageSize}
        currentPage={currentPage}
        onPageChange={setCurrentPage}
        onPageSizeChange={setPageSize}
      />
    </>
  );
}

export default function DayBookTable({ initialData = [] }: DayBookTableProps) {
  const [transactionType, setTransactionType] = useState("sales");
  const [data] = useState<DayBookRow[]>(initialData);
  const [isLoading, setIsLoading] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const totalDebit = data.reduce((sum, row) => sum + row.debitAmount, 0);
  const totalCredit = data.reduce((sum, row) => sum + row.creditAmount, 0);

  // Export handlers
  const handlePrint = () => {
    const headers = [
      { key: "billNo", label: "Bill No" },
      { key: "billDate", label: "Bill Date" },
      { key: "partyName", label: "Party Name" },
      { key: "billType", label: "Bill Type" },
      { key: "billAmount", label: "Bill Amount" },
      { key: "particular", label: "Particular" },
      { key: "debitAmount", label: "Debit Amount" },
      { key: "creditAmount", label: "Credit Amount" },
      { key: "narration", label: "Narration" },
    ];
    printTable(data as unknown as Record<string, unknown>[], headers, "Day Book Report");
  };

  const handleDownloadPDF = () => {
    const headers = [
      { key: "billNo", label: "Bill No" },
      { key: "billDate", label: "Bill Date" },
      { key: "partyName", label: "Party Name" },
      { key: "billType", label: "Bill Type" },
      { key: "billAmount", label: "Bill Amount" },
      { key: "particular", label: "Particular" },
      { key: "debitAmount", label: "Debit Amount" },
      { key: "creditAmount", label: "Credit Amount" },
      { key: "narration", label: "Narration" },
    ];
    exportToPDF(data as unknown as Record<string, unknown>[], headers, "Day Book Report", "day-book");
  };

  const handleExportExcel = () => {
    const headers = [
      { key: "billNo", label: "Bill No" },
      { key: "billDate", label: "Bill Date" },
      { key: "partyName", label: "Party Name" },
      { key: "billType", label: "Bill Type" },
      { key: "billAmount", label: "Bill Amount" },
      { key: "particular", label: "Particular" },
      { key: "debitAmount", label: "Debit Amount" },
      { key: "creditAmount", label: "Credit Amount" },
      { key: "narration", label: "Narration" },
    ];
    exportToExcel(data as unknown as Record<string, unknown>[], headers, "day-book");
  };

  return (
    <TooltipProvider>
      <div className="flex flex-col gap-6">
        {/* Stats Cards */}
        {data.length > 0 && (
          <div className="grid gap-4 sm:grid-cols-3">
            <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-emerald-500 to-emerald-600 text-white shadow-lg">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16" />
              <CardContent className="p-6 relative">
                <TrendingUp className="h-8 w-8 opacity-80 mb-2" />
                <p className="text-sm font-medium opacity-90">Total Debit</p>
                <p className="text-3xl font-bold mt-1">₹{totalDebit.toLocaleString()}</p>
              </CardContent>
            </Card>

            <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-red-500 to-red-600 text-white shadow-lg">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16" />
              <CardContent className="p-6 relative">
                <TrendingDown className="h-8 w-8 opacity-80 mb-2" />
                <p className="text-sm font-medium opacity-90">Total Credit</p>
                <p className="text-3xl font-bold mt-1">₹{totalCredit.toLocaleString()}</p>
              </CardContent>
            </Card>

            <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16" />
              <CardContent className="p-6 relative">
                <Calendar className="h-8 w-8 opacity-80 mb-2" />
                <p className="text-sm font-medium opacity-90">Total Entries</p>
                <p className="text-3xl font-bold mt-1">{data.length}</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Filter Panel */}
        <Card className="border shadow-sm">
          <CardContent className="p-4">
            <div className="flex flex-wrap items-center gap-2">
              {/* Date Select */}
              <Select defaultValue="yearly">
                <SelectTrigger className="h-9 w-[160px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="current_month">Current Month</SelectItem>
                  <SelectItem value="range">Range</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="quarterly">Quarterly</SelectItem>
                  <SelectItem value="half_yearly">Half Yearly</SelectItem>
                  <SelectItem value="yearly">Yearly</SelectItem>
                </SelectContent>
              </Select>

              {/* Advanced Filters Drawer */}
              <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
                <SheetTrigger asChild>
                  <Button variant="outline" size="sm" className="h-9">
                    <SlidersHorizontal className="h-4 w-4 mr-2" />
                    Transaction Type
                    <span className="ml-2 text-xs text-muted-foreground capitalize">({transactionType.replace('_', ' ')})</span>
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-[360px]">
                  <SheetHeader>
                    <SheetTitle>Transaction Type</SheetTitle>
                    <SheetDescription>Select the type of transactions to view</SheetDescription>
                  </SheetHeader>
                  <div className="mt-6">
                    <RadioGroup value={transactionType} onValueChange={setTransactionType} className="grid grid-cols-2 gap-3">
                      {[
                        { value: "sales", label: "Sales" },
                        { value: "purchase", label: "Purchase" },
                        { value: "sales_return", label: "Sales Return" },
                        { value: "purchase_return", label: "Purchase Return" },
                        { value: "receipt", label: "Receipt" },
                        { value: "payment", label: "Payment" },
                        { value: "credit_note", label: "Credit Note" },
                        { value: "debit_note", label: "Debit Note" },
                        { value: "journal", label: "Journal" },
                        { value: "contra", label: "Contra" },
                        { value: "all", label: "All" },
                      ].map(({ value, label }) => (
                        <div key={value} className="flex items-center space-x-2">
                          <RadioGroupItem value={value} id={value} />
                          <Label htmlFor={value} className="cursor-pointer font-normal text-sm">{label}</Label>
                        </div>
                      ))}
                    </RadioGroup>
                  </div>
                </SheetContent>
              </Sheet>

              <Button disabled={isLoading} size="sm" className="h-9">
                <Search className="h-3.5 w-3.5 mr-1.5" />
                {isLoading ? "Loading..." : "Register"}
              </Button>
              <Button variant="outline" size="sm" className="h-9">
                <X className="h-3.5 w-3.5 mr-1.5" />
                Clear
              </Button>

              <div className="flex-1" />

              <div className="flex gap-2">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="outline" size="icon" className="h-9 w-9" onClick={handlePrint} disabled={data.length === 0}>
                      <Printer className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Print</TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="outline" size="icon" className="h-9 w-9" onClick={handleDownloadPDF} disabled={data.length === 0}>
                      <Download className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Download PDF</TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="outline" size="icon" className="h-9 w-9" onClick={handleExportExcel} disabled={data.length === 0}>
                      <FileSpreadsheet className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Export to Excel</TooltipContent>
                </Tooltip>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Results Table */}
        <Card className="border shadow-sm">
          <CardHeader className="border-b">
            <CardTitle className="text-xl">Transaction Register</CardTitle>
            <CardDescription>Daily financial entries</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <DayBookTableWithPagination data={data} totalDebit={totalDebit} totalCredit={totalCredit} />
          </CardContent>
        </Card>
      </div>

      {/* AI Assistant */}
      <ModuleAIAssistant
        moduleName="Day Book"
        moduleData={{ data, transactionType, totalDebit, totalCredit }}
      />
    </TooltipProvider>
  );
}
