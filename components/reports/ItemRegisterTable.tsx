"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
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
import { Download, Search, X, Filter, FileSpreadsheet, Printer, Package, TrendingUp, TrendingDown, Loader2 } from "lucide-react";
import { ModuleAIAssistant } from "@/components/ModuleAIAssistant";
import { useItemRegister } from "@/lib/hooks/useReports";
import type { ItemRegisterItem } from "@/lib/types/reports.types";
import { format, subMonths } from "date-fns";

type DatePreset = "none" | "today" | "current_month" | "range" | "monthly" | "quarterly" | "half_yearly" | "yearly";

function toApiDate(date: Date) {
  return format(date, "dd/MM/yyyy HH:mm:ss");
}

function resolveDateRange(preset: DatePreset): { from: Date; to: Date } {
  const now = new Date();
  switch (preset) {
    case "today":
      return { from: new Date(new Date().setHours(0, 0, 0, 0)), to: new Date() };
    case "current_month":
      return { from: new Date(now.getFullYear(), now.getMonth(), 1), to: new Date() };
    case "monthly":
      return { from: subMonths(new Date(), 1), to: new Date() };
    case "quarterly":
      return { from: subMonths(new Date(), 3), to: new Date() };
    case "half_yearly":
      return { from: subMonths(new Date(), 6), to: new Date() };
    case "yearly":
      return { from: new Date(now.getFullYear(), 0, 1), to: new Date() };
    default:
      return { from: new Date("2022-01-01"), to: new Date() };
  }
}

export default function ItemRegisterTable() {
  const [itemWise, setItemWise] = useState(true);
  const [dateWise, setDateWise] = useState(true);
  const [partyWise, setPartyWise] = useState(true);
  const [billDetail, setBillDetail] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [datePreset, setDatePreset] = useState<DatePreset>("none");
  const [fromDate, setFromDate] = useState(format(new Date("2026-01-01"), "yyyy-MM-dd"));
  const [toDate, setToDate] = useState(format(new Date(), "yyyy-MM-dd"));
  // itemId input — placeholder until item master API is available
  const [itemIdInput, setItemIdInput] = useState("");

  const { mutate: fetchItemRegister, data, isPending, error, reset } = useItemRegister();

  const handleSearch = () => {
    const itemId = parseInt(itemIdInput.trim(), 10);
    if (isNaN(itemId)) return;

    const range =
      datePreset === "range"
        ? { from: new Date(fromDate), to: new Date(toDate) }
        : resolveDateRange(datePreset);

    fetchItemRegister({
      fromDate: toApiDate(range.from),
      toDate: toApiDate(range.to),
      itemId,
      isOpeningStock: true,
      spIds: [0],
      stockDetail: billDetail,
      includeInternalMov: true,
      mfrItemName: "",
    });
  };

  const handleClear = () => {
    setSearchTerm("");
    setItemIdInput("");
    setDatePreset("none");
    reset();
  };

  const rows: ItemRegisterItem[] = data ?? [];

  // Derive stats from API response
  const openingRow = rows.find((r) => r.Type === "Opening");
  const closingRow = rows.find((r) => r.Type === "Closing");
  const transactionRows = rows.filter((r) => r.Type !== "Opening" && r.Type !== "Closing");

  const totalReceived = transactionRows.reduce((s, r) => s + (r.Received ?? 0), 0);
  const totalIssued = transactionRows.reduce((s, r) => s + (r.Issued ?? 0), 0);
  const closingBalance = closingRow?.Balance ?? 0;

  // Client-side search filter on party / bill no
  const filtered = searchTerm
    ? rows.filter(
        (r) =>
          r.Party?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          r.BillNo?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : rows;

  return (
    <TooltipProvider>
      <div className="flex flex-col gap-6">
        {/* Stats Cards */}
        {rows.length > 0 && (
          <div className="grid gap-4 sm:grid-cols-3">
            <Card className="relative overflow-hidden border-0 bg-linear-to-br from-emerald-500 to-emerald-600 text-white shadow-lg">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16" />
              <CardContent className="p-6 relative">
                <TrendingUp className="h-8 w-8 opacity-80 mb-2" />
                <p className="text-sm font-medium opacity-90">Total Received</p>
                <p className="text-3xl font-bold mt-1">{totalReceived}</p>
              </CardContent>
            </Card>

            <Card className="relative overflow-hidden border-0 bg-linear-to-br from-blue-500 to-blue-600 text-white shadow-lg">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16" />
              <CardContent className="p-6 relative">
                <TrendingDown className="h-8 w-8 opacity-80 mb-2" />
                <p className="text-sm font-medium opacity-90">Total Issued</p>
                <p className="text-3xl font-bold mt-1">{totalIssued}</p>
              </CardContent>
            </Card>

            <Card className="relative overflow-hidden border-0 bg-linear-to-br from-purple-500 to-purple-600 text-white shadow-lg">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16" />
              <CardContent className="p-6 relative">
                <Package className="h-8 w-8 opacity-80 mb-2" />
                <p className="text-sm font-medium opacity-90">Closing Balance</p>
                <p className="text-3xl font-bold mt-1">{closingBalance}</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Filter Panel */}
        <Card className="border shadow-sm">
          <CardHeader className="border-b bg-linear-to-r from-slate-50 to-gray-50 dark:from-slate-900 dark:to-gray-900 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-linear-to-br from-indigo-500 to-purple-600 text-white">
                <Filter className="h-4 w-4" />
              </div>
              <div>
                <CardTitle className="text-base font-semibold">Item Register Filters</CardTitle>
                <CardDescription className="text-xs">Track item-wise stock movement</CardDescription>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-6 space-y-5">
            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Quick search by party or bill no..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 h-10"
              />
            </div>

            {/* Filter Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-x-4 gap-y-4">
              {/* Item ID — placeholder until item master API is ready */}
              <div className="space-y-1.5">
                <Label className="text-xs font-medium flex items-center gap-1.5 text-muted-foreground">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                  Item ID <span className="text-red-500">*</span>
                </Label>
                <Input
                  className="h-9"
                  placeholder="e.g. 2767"
                  value={itemIdInput}
                  onChange={(e) => setItemIdInput(e.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-medium flex items-center gap-1.5 text-muted-foreground">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                  Date
                </Label>
                <Select
                  value={datePreset}
                  onValueChange={(v) => setDatePreset(v as DatePreset)}
                >
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

              {/* Remaining filter dropdowns — kept as-is, will be wired when master APIs are ready */}
              <div className="space-y-1.5">
                <Label className="text-xs font-medium flex items-center gap-1.5 text-muted-foreground">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                  Rack No
                </Label>
                <Select>
                  <SelectTrigger className="h-9 w-full">
                    <SelectValue placeholder="All Racks" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Racks</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-medium flex items-center gap-1.5 text-muted-foreground">
                  <span className="w-1.5 h-1.5 rounded-full bg-purple-500" />
                  ISDN No
                </Label>
                <Select>
                  <SelectTrigger className="h-9 w-full">
                    <SelectValue placeholder="All ISDNs" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All ISDNs</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-medium flex items-center gap-1.5 text-muted-foreground">
                  <span className="w-1.5 h-1.5 rounded-full bg-pink-500" />
                  Bound
                </Label>
                <Select>
                  <SelectTrigger className="h-9 w-full">
                    <SelectValue placeholder="All Types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-medium flex items-center gap-1.5 text-muted-foreground">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                  Weight
                </Label>
                <Select>
                  <SelectTrigger className="h-9 w-full">
                    <SelectValue placeholder="All Weights" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Weights</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-medium flex items-center gap-1.5 text-muted-foreground">
                  <span className="w-1.5 h-1.5 rounded-full bg-teal-500" />
                  Publication
                </Label>
                <Select>
                  <SelectTrigger className="h-9 w-full">
                    <SelectValue placeholder="All Publishers" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Publishers</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-medium flex items-center gap-1.5 text-muted-foreground">
                  <span className="w-1.5 h-1.5 rounded-full bg-orange-500" />
                  Color
                </Label>
                <Select>
                  <SelectTrigger className="h-9 w-full">
                    <SelectValue placeholder="All Colors" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Colors</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-medium flex items-center gap-1.5 text-muted-foreground">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-500" />
                  Party
                </Label>
                <Select>
                  <SelectTrigger className="h-9 w-full">
                    <SelectValue placeholder="All Parties" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Parties</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-medium flex items-center gap-1.5 text-muted-foreground">
                  <span className="w-1.5 h-1.5 rounded-full bg-lime-500" />
                  Bill Type
                </Label>
                <Select defaultValue="sales_invoice">
                  <SelectTrigger className="h-9 w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sales_invoice">Sales Invoice</SelectItem>
                    <SelectItem value="purchase">Purchase</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-medium flex items-center gap-1.5 text-muted-foreground">
                  <span className="w-1.5 h-1.5 rounded-full bg-sky-500" />
                  Salesman
                </Label>
                <Select>
                  <SelectTrigger className="h-9 w-full">
                    <SelectValue placeholder="All Salesmen" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Salesmen</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Custom date range — only when preset is "range" */}
            {datePreset === "range" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-muted-foreground">From Date</Label>
                  <Input type="date" className="h-9" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-muted-foreground">To Date</Label>
                  <Input type="date" className="h-9" value={toDate} onChange={(e) => setToDate(e.target.value)} />
                </div>
              </div>
            )}

            {/* Display Options */}
            <div className="flex flex-wrap items-center gap-6 pt-2">
              <div className="flex items-center space-x-2">
                <Checkbox id="itemwise" checked={itemWise} onCheckedChange={(c) => setItemWise(c as boolean)} />
                <Label htmlFor="itemwise" className="cursor-pointer text-sm font-normal">Item Wise</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox id="datewise" checked={dateWise} onCheckedChange={(c) => setDateWise(c as boolean)} />
                <Label htmlFor="datewise" className="cursor-pointer text-sm font-normal">Date Wise</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox id="partywise" checked={partyWise} onCheckedChange={(c) => setPartyWise(c as boolean)} />
                <Label htmlFor="partywise" className="cursor-pointer text-sm font-normal">Party Wise</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox id="billdetail" checked={billDetail} onCheckedChange={(c) => setBillDetail(c as boolean)} />
                <Label htmlFor="billdetail" className="cursor-pointer text-sm font-normal">Bill Detail</Label>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-2 pt-3 border-t">
              <Button
                onClick={handleSearch}
                disabled={isPending || !itemIdInput.trim()}
                size="sm"
                className="bg-linear-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white h-9"
              >
                {isPending ? (
                  <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                ) : (
                  <Search className="h-3.5 w-3.5 mr-1.5" />
                )}
                {isPending ? "Loading..." : "Search"}
              </Button>
              <Button variant="outline" size="sm" className="h-9" onClick={handleClear}>
                <X className="h-3.5 w-3.5 mr-1.5" />
                Clear
              </Button>
              <div className="flex-1" />
              <div className="flex gap-2">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="outline" size="icon" className="h-9 w-9">
                      <FileSpreadsheet className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Export to Excel</TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="outline" size="icon" className="h-9 w-9">
                      <Download className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Export to CSV</TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="outline" size="icon" className="h-9 w-9" onClick={() => window.print()}>
                      <Printer className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Print</TooltipContent>
                </Tooltip>
              </div>
            </div>

            {error && (
              <p className="text-sm text-destructive">
                Failed to fetch data. Please check the item ID and try again.
              </p>
            )}
          </CardContent>
        </Card>

        {/* Results Table */}
        <Card className="border shadow-sm">
          <CardHeader className="border-b">
            <CardTitle className="text-xl">Item Movement Register</CardTitle>
            <CardDescription>Track stock movement for each item</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-linear-to-r from-indigo-50 to-purple-50 dark:from-indigo-950/20 dark:to-purple-950/20">
                    <TableHead className="font-semibold">Type</TableHead>
                    <TableHead className="font-semibold">Party</TableHead>
                    <TableHead className="font-semibold">Bill No</TableHead>
                    <TableHead className="font-semibold">Bill Date</TableHead>
                    <TableHead className="font-semibold">Stock Place</TableHead>
                    <TableHead className="text-right font-semibold">Received</TableHead>
                    <TableHead className="text-right font-semibold">Issued</TableHead>
                    <TableHead className="text-right font-semibold">Balance</TableHead>
                    <TableHead className="text-right font-semibold">Rate</TableHead>
                    <TableHead className="text-right font-semibold">Net Rate</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={10} className="text-center py-12 text-muted-foreground">
                        <Package className="h-12 w-12 mx-auto mb-3 opacity-50" />
                        <p className="text-lg font-medium">No data found</p>
                        <p className="text-sm">Enter an item ID and click Search to view results</p>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filtered.map((row, idx) => {
                      const isSpecial = row.Type === "Opening" || row.Type === "Closing";
                      return (
                        <TableRow
                          key={idx}
                          className={`hover:bg-muted/50 ${isSpecial ? "bg-muted/30 font-semibold" : ""}`}
                        >
                          <TableCell>
                            <Badge
                              variant={
                                row.Type === "Opening"
                                  ? "outline"
                                  : row.Type === "Closing"
                                  ? "secondary"
                                  : "default"
                              }
                            >
                              {row.Type}
                            </Badge>
                          </TableCell>
                          <TableCell>{row.Party ?? "—"}</TableCell>
                          <TableCell className="font-mono text-sm">{row.BillNo ?? "—"}</TableCell>
                          <TableCell>
                            {row.BillDate ? new Date(row.BillDate).toLocaleDateString("en-IN") : "—"}
                          </TableCell>
                          <TableCell>{row.StockPlace ?? "—"}</TableCell>
                          <TableCell className="text-right text-emerald-600 font-medium">
                            {row.Received ?? "—"}
                          </TableCell>
                          <TableCell className="text-right text-blue-600 font-medium">
                            {row.Issued ?? "—"}
                          </TableCell>
                          <TableCell className="text-right font-bold">{row.Balance ?? "—"}</TableCell>
                          <TableCell className="text-right">{row.Rate ?? "—"}</TableCell>
                          <TableCell className="text-right">{row.NetRate ?? "—"}</TableCell>
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
        moduleName="Item Register"
        moduleData={{ data: rows, itemWise, dateWise, partyWise, billDetail, openingRow, closingRow }}
      />
    </TooltipProvider>
  );
}
