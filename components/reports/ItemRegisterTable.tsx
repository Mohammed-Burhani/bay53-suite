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
import { Download, Search, X, Filter, FileSpreadsheet, Printer, Package, TrendingUp, TrendingDown } from "lucide-react";

interface ItemRegisterTableProps {
  initialData?: any[];
}

export default function ItemRegisterTable({ initialData = [] }: ItemRegisterTableProps) {
  const [itemWise, setItemWise] = useState(true);
  const [dateWise, setDateWise] = useState(true);
  const [partyWise, setPartyWise] = useState(true);
  const [billDetail, setBillDetail] = useState(true);
  const [data, setData] = useState<any[]>(initialData);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

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
                <p className="text-sm font-medium opacity-90">Total Purchased</p>
                <p className="text-3xl font-bold mt-1">0</p>
              </CardContent>
            </Card>

            <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16" />
              <CardContent className="p-6 relative">
                <TrendingDown className="h-8 w-8 opacity-80 mb-2" />
                <p className="text-sm font-medium opacity-90">Total Sold</p>
                <p className="text-3xl font-bold mt-1">0</p>
              </CardContent>
            </Card>

            <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-purple-500 to-purple-600 text-white shadow-lg">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16" />
              <CardContent className="p-6 relative">
                <Package className="h-8 w-8 opacity-80 mb-2" />
                <p className="text-sm font-medium opacity-90">Closing Stock</p>
                <p className="text-3xl font-bold mt-1">0</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Filter Panel */}
        <Card className="border shadow-sm">
          <CardHeader className="border-b bg-gradient-to-r from-slate-50 to-gray-50 dark:from-slate-900 dark:to-gray-900 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 text-white">
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
                placeholder="Quick search by item name, ISDN, or rack..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 h-10"
              />
            </div>

            {/* Filter Grid */}
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
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-500" />
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
                    <SelectItem value="s1">Salesman 1</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

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
                disabled={isLoading}
                size="sm"
                className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white h-9"
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
                    <Button variant="outline" size="icon" className="h-9 w-9">
                      <Printer className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Print</TooltipContent>
                </Tooltip>
              </div>
            </div>
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
                  <TableRow className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950/20 dark:to-purple-950/20">
                    <TableHead className="font-semibold">Item Name</TableHead>
                    <TableHead className="font-semibold">ISDN No</TableHead>
                    <TableHead className="font-semibold">Rack No</TableHead>
                    <TableHead className="text-right font-semibold">Opening Stock</TableHead>
                    <TableHead className="text-right font-semibold">Purchased Qty</TableHead>
                    <TableHead className="text-right font-semibold">Sold Qty</TableHead>
                    <TableHead className="text-right font-semibold">Return Qty</TableHead>
                    <TableHead className="text-right font-semibold">Closing Stock</TableHead>
                    <TableHead className="text-right font-semibold">Rate</TableHead>
                    <TableHead className="text-right font-semibold">Amount</TableHead>
                    <TableHead className="font-semibold">Bill No</TableHead>
                    <TableHead className="font-semibold">Date</TableHead>
                    <TableHead className="font-semibold">Party</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={13} className="text-center py-12 text-muted-foreground">
                        <Package className="h-12 w-12 mx-auto mb-3 opacity-50" />
                        <p className="text-lg font-medium">No data found</p>
                        <p className="text-sm">Apply filters and click Search to view results</p>
                      </TableCell>
                    </TableRow>
                  ) : (
                    data.map((row, idx) => (
                      <TableRow key={idx} className="hover:bg-muted/50">
                        <TableCell className="font-medium">{row.itemName}</TableCell>
                        <TableCell className="font-mono text-sm">{row.isdnNo}</TableCell>
                        <TableCell><Badge variant="outline">{row.rackNo}</Badge></TableCell>
                        <TableCell className="text-right">{row.openingStock}</TableCell>
                        <TableCell className="text-right text-emerald-600 font-medium">{row.purchasedQty}</TableCell>
                        <TableCell className="text-right text-blue-600 font-medium">{row.soldQty}</TableCell>
                        <TableCell className="text-right text-amber-600">{row.returnQty}</TableCell>
                        <TableCell className="text-right font-bold">{row.closingStock}</TableCell>
                        <TableCell className="text-right">{row.rate}</TableCell>
                        <TableCell className="text-right font-medium">{row.amount}</TableCell>
                        <TableCell className="font-mono text-sm">{row.billNo}</TableCell>
                        <TableCell>{row.date}</TableCell>
                        <TableCell>{row.party}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </TooltipProvider>
  );
}
