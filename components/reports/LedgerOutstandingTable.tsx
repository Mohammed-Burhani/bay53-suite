"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
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
import { Printer, Search, Filter, Receipt, TrendingUp, AlertTriangle } from "lucide-react";
import { ModuleAIAssistant } from "@/components/ModuleAIAssistant";

interface LedgerOutstandingRow {
  party: string;
  contact: string;
  gstNo: string;
  billNo: string;
  date: string;
  refNo: string;
  refDate: string;
  orderNo: string;
  orderDate: string;
  voucher: string;
  amount: number;
  amountDrCr: string;
  pending: number;
  pendingDrCr: string;
  dueOn: string;
  remarks: string;
}

interface LedgerOutstandingTableProps {
  initialData?: LedgerOutstandingRow[];
}

export default function LedgerOutstandingTable({ initialData = [] }: LedgerOutstandingTableProps) {
  const [detailed, setDetailed] = useState(false);
  const [data] = useState<LedgerOutstandingRow[]>(initialData);
  const [isLoading, setIsLoading] = useState(false);

  const totalOutstanding = data.reduce((sum, row) => sum + row.pending, 0);
  const overdueCount = data.filter(row => new Date(row.dueOn) < new Date()).length;

  return (
    <TooltipProvider>
      <div className="flex flex-col gap-6">
        {/* Stats Cards */}
        {data.length > 0 && (
          <div className="grid gap-4 sm:grid-cols-3">
            <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16" />
              <CardContent className="p-6 relative">
                <Receipt className="h-8 w-8 opacity-80 mb-2" />
                <p className="text-sm font-medium opacity-90">Total Outstanding</p>
                <p className="text-3xl font-bold mt-1">₹{totalOutstanding.toLocaleString()}</p>
              </CardContent>
            </Card>

            <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-emerald-500 to-emerald-600 text-white shadow-lg">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16" />
              <CardContent className="p-6 relative">
                <TrendingUp className="h-8 w-8 opacity-80 mb-2" />
                <p className="text-sm font-medium opacity-90">Total Entries</p>
                <p className="text-3xl font-bold mt-1">{data.length}</p>
              </CardContent>
            </Card>

            <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-red-500 to-red-600 text-white shadow-lg">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16" />
              <CardContent className="p-6 relative">
                <AlertTriangle className="h-8 w-8 opacity-80 mb-2" />
                <p className="text-sm font-medium opacity-90">Overdue</p>
                <p className="text-3xl font-bold mt-1">{overdueCount}</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Filter Panel */}
        <Card className="border shadow-sm">
          <CardHeader className="border-b bg-gradient-to-r from-slate-50 to-gray-50 dark:from-slate-900 dark:to-gray-900 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 text-white">
                <Filter className="h-4 w-4" />
              </div>
              <div>
                <CardTitle className="text-base font-semibold">Ledger Outstanding Filters</CardTitle>
                <CardDescription className="text-xs">View outstanding balances by ledger</CardDescription>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-6 space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-x-4 gap-y-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium flex items-center gap-1.5 text-muted-foreground">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                  Ledger <span className="text-red-500">*</span>
                </Label>
                <Select>
                  <SelectTrigger className="h-9 w-full">
                    <SelectValue placeholder="Search and select ledger" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ledger1">Ledger 1</SelectItem>
                    <SelectItem value="ledger2">Ledger 2</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-medium flex items-center gap-1.5 text-muted-foreground">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                  Date
                </Label>
                <Select defaultValue="none">
                  <SelectTrigger className="h-9 w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    <SelectItem value="today">Today</SelectItem>
                    <SelectItem value="current_month">Current Month</SelectItem>
                    <SelectItem value="range">Range</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="quarterly">Quarterly</SelectItem>
                    <SelectItem value="half_yearly">Half Yearly</SelectItem>
                    <SelectItem value="yearly">Yearly</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5 flex items-end">
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="detailed" 
                    checked={detailed}
                    onCheckedChange={(c) => setDetailed(c as boolean)}
                  />
                  <Label htmlFor="detailed" className="cursor-pointer text-sm font-normal">Detailed</Label>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-2 pt-3 border-t">
              <Button 
                disabled={isLoading}
                size="sm"
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white h-9"
              >
                <Search className="h-3.5 w-3.5 mr-1.5" />
                {isLoading ? "Loading..." : "Outstanding"}
              </Button>
              <div className="flex-1" />
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" size="icon" className="h-9 w-9">
                    <Printer className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Print</TooltipContent>
              </Tooltip>
            </div>
          </CardContent>
        </Card>

        {/* Results Table */}
        <Card className="border shadow-sm">
          <CardHeader className="border-b">
            <CardTitle className="text-xl">Outstanding Balances</CardTitle>
            <CardDescription>Ledger-wise outstanding amounts</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20">
                    <TableHead className="font-semibold">Party</TableHead>
                    <TableHead className="font-semibold">Contact</TableHead>
                    <TableHead className="font-semibold">GST No</TableHead>
                    <TableHead className="font-semibold">Bill No</TableHead>
                    <TableHead className="font-semibold">Date</TableHead>
                    <TableHead className="font-semibold">Ref No</TableHead>
                    <TableHead className="font-semibold">Ref Date</TableHead>
                    <TableHead className="font-semibold">Order No</TableHead>
                    <TableHead className="font-semibold">Order Date</TableHead>
                    <TableHead className="font-semibold">Voucher</TableHead>
                    <TableHead className="text-right font-semibold">Amount</TableHead>
                    <TableHead className="font-semibold">Dr/Cr</TableHead>
                    <TableHead className="text-right font-semibold">Pending</TableHead>
                    <TableHead className="font-semibold">Dr/Cr</TableHead>
                    <TableHead className="font-semibold">Due On</TableHead>
                    <TableHead className="font-semibold">Remarks</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={16} className="text-center py-12 text-muted-foreground">
                        <Receipt className="h-12 w-12 mx-auto mb-3 opacity-50" />
                        <p className="text-lg font-medium">Select a ledger to view outstanding</p>
                        <p className="text-sm">Choose a ledger from the dropdown above</p>
                      </TableCell>
                    </TableRow>
                  ) : (
                    data.map((row, idx) => {
                      const isOverdue = new Date(row.dueOn) < new Date();
                      return (
                        <TableRow key={idx} className={`hover:bg-muted/50 ${isOverdue ? 'bg-red-50/50 dark:bg-red-950/10' : ''}`}>
                          <TableCell className="font-medium">{row.party}</TableCell>
                          <TableCell>{row.contact}</TableCell>
                          <TableCell className="font-mono text-sm">{row.gstNo}</TableCell>
                          <TableCell className="font-mono text-sm">{row.billNo}</TableCell>
                          <TableCell>{row.date}</TableCell>
                          <TableCell>{row.refNo}</TableCell>
                          <TableCell>{row.refDate}</TableCell>
                          <TableCell>{row.orderNo}</TableCell>
                          <TableCell>{row.orderDate}</TableCell>
                          <TableCell><Badge variant="outline">{row.voucher}</Badge></TableCell>
                          <TableCell className="text-right font-medium">₹{row.amount.toLocaleString()}</TableCell>
                          <TableCell><Badge variant={row.amountDrCr === 'Dr' ? 'destructive' : 'default'}>{row.amountDrCr}</Badge></TableCell>
                          <TableCell className="text-right font-bold text-blue-600">₹{row.pending.toLocaleString()}</TableCell>
                          <TableCell><Badge variant={row.pendingDrCr === 'Dr' ? 'destructive' : 'default'}>{row.pendingDrCr}</Badge></TableCell>
                          <TableCell>
                            {isOverdue ? (
                              <span className="text-red-600 font-medium">{row.dueOn}</span>
                            ) : (
                              row.dueOn
                            )}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">{row.remarks}</TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* AI Assistant */}
      <ModuleAIAssistant
        moduleName="Ledger Outstanding"
        moduleData={{ data, detailed, totalOutstanding }}
      />
    </TooltipProvider>
  );
}
