"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
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
import { Download, Search, X, Filter, FileSpreadsheet, Printer, AlertCircle, Clock, CheckCircle } from "lucide-react";
import { ModuleAIAssistant } from "@/components/ModuleAIAssistant";
import { TablePagination, usePagination } from "@/components/ui/table-pagination";
import { exportToExcel, exportToPDF, printTable } from "@/lib/utils/report-export";
import { useClassificationLabels } from "@/lib/contexts/ClassificationContext";

interface PendingItemsTableProps {
  initialData?: Array<{
    size: string;
    material: string;
    quality: string;
    brand: string;
    type: string;
    party: string;
    billNo: string;
    orderNo: string;
    invoiceQty: number;
    unit: string;
    pendingQty: number;
    status: string;
  }>;
}

export default function PendingItemsTable({ initialData = [] }: PendingItemsTableProps) {
  const { getLabel } = useClassificationLabels();
  const [itemWise, setItemWise] = useState(true);
  const [partyWise, setPartyWise] = useState(true);
  const [billDetail, setBillDetail] = useState(true);
  const [dateWise, setDateWise] = useState(true);
  const [data] = useState(initialData);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const { currentPage, pageSize, setCurrentPage, setPageSize, getPaginatedData } = usePagination(50);

  const totalPending = data.reduce((sum, item) => sum + item.pendingQty, 0);
  const totalOrders = data.length;
  const paginatedData = getPaginatedData(data);

  // Export handlers
  const handlePrint = () => {
    const headers = [
      { key: "size", label: getLabel('size') },
      { key: "material", label: getLabel('category') },
      { key: "quality", label: getLabel('sub_cat') },
      { key: "brand", label: getLabel('ref_no') },
      { key: "type", label: "Type" },
      { key: "party", label: "Party" },
      { key: "billNo", label: "Bill No" },
      { key: "orderNo", label: "Order No" },
      { key: "invoiceQty", label: "Invoice Qty" },
      { key: "unit", label: "Unit" },
      { key: "pendingQty", label: "Pending Qty" },
      { key: "status", label: "Status" },
    ];
    printTable(data as unknown as Record<string, unknown>[], headers, "Pending Items Report");
  };

  const handleDownloadPDF = () => {
    const headers = [
      { key: "size", label: getLabel('size') },
      { key: "material", label: getLabel('category') },
      { key: "quality", label: getLabel('sub_cat') },
      { key: "brand", label: getLabel('ref_no') },
      { key: "type", label: "Type" },
      { key: "party", label: "Party" },
      { key: "billNo", label: "Bill No" },
      { key: "orderNo", label: "Order No" },
      { key: "invoiceQty", label: "Invoice Qty" },
      { key: "unit", label: "Unit" },
      { key: "pendingQty", label: "Pending Qty" },
      { key: "status", label: "Status" },
    ];
    exportToPDF(data as unknown as Record<string, unknown>[], headers, "Pending Items Report", "pending-items");
  };

  const handleExportExcel = () => {
    const headers = [
      { key: "size", label: getLabel('size') },
      { key: "material", label: getLabel('category') },
      { key: "quality", label: getLabel('sub_cat') },
      { key: "brand", label: getLabel('ref_no') },
      { key: "type", label: "Type" },
      { key: "party", label: "Party" },
      { key: "billNo", label: "Bill No" },
      { key: "orderNo", label: "Order No" },
      { key: "invoiceQty", label: "Invoice Qty" },
      { key: "unit", label: "Unit" },
      { key: "pendingQty", label: "Pending Qty" },
      { key: "status", label: "Status" },
    ];
    exportToExcel(data as unknown as Record<string, unknown>[], headers, "pending-items");
  };

  return (
    <TooltipProvider>
      <div className="flex flex-col gap-6">
        {/* Stats Cards */}
        {data.length > 0 && (
          <div className="grid gap-4 sm:grid-cols-3">
            <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-amber-500 to-amber-600 text-white shadow-lg">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16" />
              <CardContent className="p-6 relative">
                <Clock className="h-8 w-8 opacity-80 mb-2" />
                <p className="text-sm font-medium opacity-90">Total Pending Orders</p>
                <p className="text-3xl font-bold mt-1">{totalOrders}</p>
              </CardContent>
            </Card>

            <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-orange-500 to-orange-600 text-white shadow-lg">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16" />
              <CardContent className="p-6 relative">
                <AlertCircle className="h-8 w-8 opacity-80 mb-2" />
                <p className="text-sm font-medium opacity-90">Pending Quantity</p>
                <p className="text-3xl font-bold mt-1">{totalPending}</p>
              </CardContent>
            </Card>

            <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-emerald-500 to-emerald-600 text-white shadow-lg">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16" />
              <CardContent className="p-6 relative">
                <CheckCircle className="h-8 w-8 opacity-80 mb-2" />
                <p className="text-sm font-medium opacity-90">Fulfillment Rate</p>
                <p className="text-3xl font-bold mt-1">0%</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Filter Panel */}
        <Card className="border shadow-sm">
          <CardHeader className="border-b bg-gradient-to-r from-slate-50 to-gray-50 dark:from-slate-900 dark:to-gray-900 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 text-white">
                <Filter className="h-4 w-4" />
              </div>
              <div>
                <CardTitle className="text-base font-semibold">Pending Items Filters</CardTitle>
                <CardDescription className="text-xs">Track unfulfilled and partially fulfilled orders</CardDescription>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-6 space-y-5">
            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Quick search by order number, party, or item..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 h-10"
              />
            </div>

            {/* Filter Grid - First Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-x-4 gap-y-4">
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
                    <SelectItem value="a1">A1</SelectItem>
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
                    <SelectItem value="123">123456</SelectItem>
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
                    <SelectItem value="hardcover">Hardcover</SelectItem>
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
                    <SelectItem value="500g">500g</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Second Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-x-4 gap-y-4">
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
                    <SelectItem value="abc">ABC Pub</SelectItem>
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
                    <SelectItem value="red">Red</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-medium flex items-center gap-1.5 text-muted-foreground">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-500" />
                  Bill From
                </Label>
                <Select>
                  <SelectTrigger className="h-9 w-full">
                    <SelectValue placeholder="All Sources" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Sources</SelectItem>
                    <SelectItem value="supplier1">Supplier 1</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-medium flex items-center gap-1.5 text-muted-foreground">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                  Party
                </Label>
                <Select>
                  <SelectTrigger className="h-9 w-full">
                    <SelectValue placeholder="All Parties" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Parties</SelectItem>
                    <SelectItem value="party1">Party 1</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Third Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium flex items-center gap-1.5 text-muted-foreground">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
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
                  <span className="w-1.5 h-1.5 rounded-full bg-fuchsia-500" />
                  Batch Code
                </Label>
                <Input placeholder="Enter batch code" className="h-9" />
              </div>
            </div>

            {/* Display Options */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 pt-2">
              <div className="flex items-center space-x-2">
                <Checkbox id="allitem" />
                <Label htmlFor="allitem" className="cursor-pointer text-sm font-normal">All Item</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox id="itemwise" checked={itemWise} onCheckedChange={(c) => setItemWise(c as boolean)} />
                <Label htmlFor="itemwise" className="cursor-pointer text-sm font-normal">Item Wise</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox id="inventory" />
                <Label htmlFor="inventory" className="cursor-pointer text-sm font-normal">Inventory</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox id="reorder" />
                <Label htmlFor="reorder" className="cursor-pointer text-sm font-normal">Re-order Details</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox id="billtypewise" />
                <Label htmlFor="billtypewise" className="cursor-pointer text-sm font-normal">Bill Type Wise</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox id="stockplacewise" />
                <Label htmlFor="stockplacewise" className="cursor-pointer text-sm font-normal">Stock Place Wise</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox id="batchcodewise" />
                <Label htmlFor="batchcodewise" className="cursor-pointer text-sm font-normal">Batch Code Wise</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox id="partywise" checked={partyWise} onCheckedChange={(c) => setPartyWise(c as boolean)} />
                <Label htmlFor="partywise" className="cursor-pointer text-sm font-normal">Party Wise</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox id="billdetail" checked={billDetail} onCheckedChange={(c) => setBillDetail(c as boolean)} />
                <Label htmlFor="billdetail" className="cursor-pointer text-sm font-normal">Bill Detail</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox id="datewise" checked={dateWise} onCheckedChange={(c) => setDateWise(c as boolean)} />
                <Label htmlFor="datewise" className="cursor-pointer text-sm font-normal">Date Wise</Label>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-2 pt-3 border-t">
              <Button 
                disabled={isLoading}
                size="sm"
                className="bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white h-9"
              >
                <Search className="h-3.5 w-3.5 mr-1.5" />
                {isLoading ? "Loading..." : "Search"}
              </Button>
              <Button variant="outline" size="sm" className="h-9">
                <X className="h-3.5 w-3.5 mr-1.5" />
                Clear
              </Button>
              <div className="flex-1" />
              <div className="flex gap-2">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      variant="outline" 
                      size="icon" 
                      className="h-9 w-9"
                      onClick={handlePrint}
                      disabled={data.length === 0}
                    >
                      <Printer className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Print</TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      variant="outline" 
                      size="icon" 
                      className="h-9 w-9"
                      onClick={handleDownloadPDF}
                      disabled={data.length === 0}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Download PDF</TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      variant="outline" 
                      size="icon" 
                      className="h-9 w-9"
                      onClick={handleExportExcel}
                      disabled={data.length === 0}
                    >
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
            <CardTitle className="text-xl">Pending Orders</CardTitle>
            <CardDescription>Items awaiting fulfillment</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20">
                    <TableHead className="font-semibold">{getLabel('size')}</TableHead>
                    <TableHead className="font-semibold">{getLabel('category')}</TableHead>
                    <TableHead className="font-semibold">{getLabel('sub_cat')}</TableHead>
                    <TableHead className="font-semibold">{getLabel('ref_no')}</TableHead>
                    <TableHead className="font-semibold">Type</TableHead>
                    <TableHead className="font-semibold">Party</TableHead>
                    <TableHead className="font-semibold">Bill No</TableHead>
                    <TableHead className="font-semibold">Order No</TableHead>
                    <TableHead className="text-right font-semibold">Invoice Qty</TableHead>
                    <TableHead className="font-semibold">Per / Unit</TableHead>
                    <TableHead className="text-right font-semibold">Pending Qty</TableHead>
                    <TableHead className="font-semibold">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={12} className="text-center py-12 text-muted-foreground">
                        <Clock className="h-12 w-12 mx-auto mb-3 opacity-50" />
                        <p className="text-lg font-medium">No pending items found</p>
                        <p className="text-sm">All orders are fulfilled or apply filters to search</p>
                      </TableCell>
                    </TableRow>
                  ) : (
                    paginatedData.map((row, idx) => (
                      <TableRow key={idx} className="hover:bg-muted/50">
                        <TableCell>{row.size}</TableCell>
                        <TableCell>{row.material}</TableCell>
                        <TableCell>{row.quality}</TableCell>
                        <TableCell>{row.brand}</TableCell>
                        <TableCell><Badge variant="outline">{row.type}</Badge></TableCell>
                        <TableCell className="font-medium">{row.party}</TableCell>
                        <TableCell className="font-mono text-sm">{row.billNo}</TableCell>
                        <TableCell className="font-mono text-sm">{row.orderNo}</TableCell>
                        <TableCell className="text-right">{row.invoiceQty}</TableCell>
                        <TableCell>{row.unit}</TableCell>
                        <TableCell className="text-right font-bold text-amber-600">{row.pendingQty}</TableCell>
                        <TableCell>
                          <Badge className="bg-gradient-to-r from-amber-500 to-orange-600 text-white border-0">
                            {row.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))
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
          </CardContent>
        </Card>
      </div>

      {/* AI Assistant */}
      <ModuleAIAssistant
        moduleName="Pending Items"
        moduleData={{ data, itemWise, partyWise, billDetail, dateWise, totalPending, totalOrders }}
      />
    </TooltipProvider>
  );
}
