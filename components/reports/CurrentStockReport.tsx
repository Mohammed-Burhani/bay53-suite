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
import { 
  Download, 
  Search, 
  X, 
  Filter, 
  Package, 
  AlertCircle, 
  TrendingDown,
  TrendingUp,
  FileSpreadsheet,
  Printer,
  Sparkles,
  BarChart3,
  Layers
} from "lucide-react";
import { ModuleAIAssistant } from "@/components/ModuleAIAssistant";

interface StockItem {
  bound: string;
  weight: string;
  publication: string;
  color: string;
  isdn: string;
  rackNo: string;
  headOffice: number;
  totalBalance: number;
}

interface StockCategory {
  category: string;
  items: StockItem[];
}

interface CurrentStockReportProps {
  initialData?: StockCategory[];
}

export default function CurrentStockReport({ initialData = [] }: CurrentStockReportProps) {
  const [showReorderDetails, setShowReorderDetails] = useState(false);
  const [rackWise, setRackWise] = useState(false);
  const [data, setData] = useState<StockCategory[]>(initialData);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const handleStock = () => {
    setIsLoading(true);
    setTimeout(() => {
      setData([
        {
          category: "01 - Books",
          items: [
            { bound: "Hardcover", weight: "500g", publication: "ABC Publishers", color: "Red", isdn: "123456", rackNo: "A1", headOffice: 50, totalBalance: 45 },
            { bound: "Paperback", weight: "300g", publication: "XYZ Press", color: "Blue", isdn: "789012", rackNo: "A2", headOffice: 30, totalBalance: -5 },
            { bound: "Hardcover", weight: "600g", publication: "DEF Books", color: "Green", isdn: "345678", rackNo: "B1", headOffice: 100, totalBalance: 95 },
          ]
        },
        {
          category: "02 - Stationery",
          items: [
            { bound: "N/A", weight: "100g", publication: "Office Supplies Co", color: "White", isdn: "111222", rackNo: "C1", headOffice: 200, totalBalance: 180 },
          ]
        }
      ]);
      setIsLoading(false);
    }, 800);
  };

  const handleClear = () => {
    setData([]);
    setSearchTerm("");
  };

  const handleExport = (format: 'csv' | 'excel' | 'pdf') => {
    console.log(`Exporting as ${format}`);
  };

  const totalItems = data.reduce((sum, cat) => sum + cat.items.length, 0);
  const totalStock = data.reduce((sum, cat) => 
    sum + cat.items.reduce((itemSum, item) => itemSum + item.totalBalance, 0), 0
  );
  const lowStockItems = data.reduce((sum, cat) => 
    sum + cat.items.filter(item => item.totalBalance < 10 && item.totalBalance >= 0).length, 0
  );
  const negativeStockItems = data.reduce((sum, cat) => 
    sum + cat.items.filter(item => item.totalBalance < 0).length, 0
  );

  return (
    <TooltipProvider>
      <div className="flex flex-col gap-6">
        {/* Hero Stats Section */}
        {data.length > 0 && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card className="relative overflow-hidden border-0 bg-linear-to-br from-blue-500 to-blue-600 text-white shadow-lg hover:shadow-xl transition-all duration-300">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16" />
              <CardContent className="p-6 relative">
                <div className="flex items-center justify-between mb-2">
                  <Package className="h-8 w-8 opacity-80" />
                  <Sparkles className="h-5 w-5 opacity-60" />
                </div>
                <p className="text-sm font-medium opacity-90">Total Items</p>
                <p className="text-3xl font-bold mt-1">{totalItems}</p>
              </CardContent>
            </Card>

            <Card className="relative overflow-hidden border-0 bg-linear-to-br from-emerald-500 to-emerald-600 text-white shadow-lg hover:shadow-xl transition-all duration-300">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16" />
              <CardContent className="p-6 relative">
                <div className="flex items-center justify-between mb-2">
                  <TrendingUp className="h-8 w-8 opacity-80" />
                  <BarChart3 className="h-5 w-5 opacity-60" />
                </div>
                <p className="text-sm font-medium opacity-90">Total Stock</p>
                <p className="text-3xl font-bold mt-1">{totalStock}</p>
              </CardContent>
            </Card>

            <Card className="relative overflow-hidden border-0 bg-linear-to-br from-amber-500 to-amber-600 text-white shadow-lg hover:shadow-xl transition-all duration-300">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16" />
              <CardContent className="p-6 relative">
                <div className="flex items-center justify-between mb-2">
                  <AlertCircle className="h-8 w-8 opacity-80" />
                  <Layers className="h-5 w-5 opacity-60" />
                </div>
                <p className="text-sm font-medium opacity-90">Low Stock</p>
                <p className="text-3xl font-bold mt-1">{lowStockItems}</p>
              </CardContent>
            </Card>

            <Card className="relative overflow-hidden border-0 bg-linear-to-br from-red-500 to-red-600 text-white shadow-lg hover:shadow-xl transition-all duration-300">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16" />
              <CardContent className="p-6 relative">
                <div className="flex items-center justify-between mb-2">
                  <TrendingDown className="h-8 w-8 opacity-80" />
                  <AlertCircle className="h-5 w-5 opacity-60" />
                </div>
                <p className="text-sm font-medium opacity-90">Negative Stock</p>
                <p className="text-3xl font-bold mt-1">{negativeStockItems}</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Modern Filter Panel */}
        <Card className="border shadow-sm">
          <CardHeader className="border-b bg-linear-to-r from-slate-50 to-gray-50 dark:from-slate-900 dark:to-gray-900">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-linear-to-br from-indigo-500 to-purple-600 text-white">
                <Filter className="h-4 w-4" />
              </div>
              <div>
                <CardTitle className="text-base font-semibold">Smart Filters</CardTitle>
                <CardDescription className="text-xs">Refine your stock view with intelligent filtering</CardDescription>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-6 space-y-5">
            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Quick search by ISDN, rack, or publisher..."
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
                  Rack Number
                </Label>
                <Select>
                  <SelectTrigger className="h-9 w-full">
                    <SelectValue placeholder="All Racks" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Racks</SelectItem>
                    <SelectItem value="a1">Rack A1</SelectItem>
                    <SelectItem value="a2">Rack A2</SelectItem>
                    <SelectItem value="b1">Rack B1</SelectItem>
                    <SelectItem value="c1">Rack C1</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-medium flex items-center gap-1.5 text-muted-foreground">
                  <span className="w-1.5 h-1.5 rounded-full bg-purple-500" />
                  ISDN Number
                </Label>
                <Select>
                  <SelectTrigger className="h-9 w-full">
                    <SelectValue placeholder="All ISDNs" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All ISDNs</SelectItem>
                    <SelectItem value="123456">123456</SelectItem>
                    <SelectItem value="789012">789012</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-medium flex items-center gap-1.5 text-muted-foreground">
                  <span className="w-1.5 h-1.5 rounded-full bg-pink-500" />
                  Binding Type
                </Label>
                <Select>
                  <SelectTrigger className="h-9 w-full">
                    <SelectValue placeholder="All Types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="hardcover">Hardcover</SelectItem>
                    <SelectItem value="paperback">Paperback</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-medium flex items-center gap-1.5 text-muted-foreground">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                  Publisher
                </Label>
                <Select>
                  <SelectTrigger className="h-9 w-full">
                    <SelectValue placeholder="All Publishers" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Publishers</SelectItem>
                    <SelectItem value="abc">ABC Publishers</SelectItem>
                    <SelectItem value="xyz">XYZ Press</SelectItem>
                    <SelectItem value="def">DEF Books</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Filter Grid - Second Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium flex items-center gap-1.5 text-muted-foreground">
                  <span className="w-1.5 h-1.5 rounded-full bg-orange-500" />
                  Weight
                </Label>
                <Select>
                  <SelectTrigger className="h-9 w-full">
                    <SelectValue placeholder="All Weights" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Weights</SelectItem>
                    <SelectItem value="100g">100g</SelectItem>
                    <SelectItem value="300g">300g</SelectItem>
                    <SelectItem value="500g">500g</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-medium flex items-center gap-1.5 text-muted-foreground">
                  <span className="w-1.5 h-1.5 rounded-full bg-teal-500" />
                  Color
                </Label>
                <Select>
                  <SelectTrigger className="h-9 w-full">
                    <SelectValue placeholder="All Colors" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Colors</SelectItem>
                    <SelectItem value="red">Red</SelectItem>
                    <SelectItem value="blue">Blue</SelectItem>
                    <SelectItem value="green">Green</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-medium flex items-center gap-1.5 text-muted-foreground">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-500" />
                  Stock Location
                </Label>
                <Select>
                  <SelectTrigger className="h-9 w-full">
                    <SelectValue placeholder="All Locations" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Locations</SelectItem>
                    <SelectItem value="warehouse">Warehouse</SelectItem>
                    <SelectItem value="store">Store</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Display Options */}
            <div className="flex flex-wrap items-center gap-6 pt-2">
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="reorder" 
                  checked={showReorderDetails}
                  onCheckedChange={(checked) => setShowReorderDetails(checked as boolean)}
                />
                <Label htmlFor="reorder" className="cursor-pointer text-sm font-normal">
                  Show Reorder Details
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="rackwise" 
                  checked={rackWise}
                  onCheckedChange={(checked) => setRackWise(checked as boolean)}
                />
                <Label htmlFor="rackwise" className="cursor-pointer text-sm font-normal">
                  Group by Rack
                </Label>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-2 pt-3 border-t">
              <Button 
                onClick={handleStock} 
                disabled={isLoading}
                size="sm"
                className="bg-linear-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white h-9"
              >
                <Search className="h-3.5 w-3.5 mr-1.5" />
                {isLoading ? "Loading..." : "Apply Filters"}
              </Button>
              <Button variant="outline" onClick={handleClear} size="sm" className="h-9">
                <X className="h-3.5 w-3.5 mr-1.5" />
                Clear All
              </Button>
              <div className="flex-1" />
              <div className="flex gap-2">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="outline" size="icon" onClick={() => handleExport('excel')} className="h-9 w-9">
                      <FileSpreadsheet className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Export to Excel</TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="outline" size="icon" onClick={() => handleExport('csv')} className="h-9 w-9">
                      <Download className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Export to CSV</TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="outline" size="icon" onClick={() => handleExport('pdf')} className="h-9 w-9">
                      <Printer className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Print Report</TooltipContent>
                </Tooltip>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Results Table */}
        {data.length > 0 ? (
          <Card className="border-0 shadow-lg">
            <CardHeader className="border-b">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-xl">Stock Results</CardTitle>
                  <CardDescription>Showing {totalItems} items across {data.length} categories</CardDescription>
                </div>
                <Badge variant="secondary" className="text-base px-4 py-2">
                  {totalStock} Units
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-linear-to-r from-indigo-50 to-purple-50 dark:from-indigo-950/20 dark:to-purple-950/20">
                      <TableHead className="font-semibold">Binding</TableHead>
                      <TableHead className="font-semibold">Weight</TableHead>
                      <TableHead className="font-semibold">Publisher</TableHead>
                      <TableHead className="font-semibold">Color</TableHead>
                      <TableHead className="font-semibold">ISDN</TableHead>
                      <TableHead className="font-semibold">Rack</TableHead>
                      <TableHead className="text-right font-semibold">Head Office</TableHead>
                      <TableHead className="text-right font-semibold">Balance</TableHead>
                      <TableHead className="text-center font-semibold">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.map((category, idx) => (
                      <>
                        <TableRow key={`cat-${idx}`} className="bg-linear-to-r from-indigo-100/50 to-purple-100/50 dark:from-indigo-950/30 dark:to-purple-950/30 hover:from-indigo-100 hover:to-purple-100 dark:hover:from-indigo-950/40 dark:hover:to-purple-950/40">
                          <TableCell colSpan={9} className="font-semibold">
                            <div className="flex items-center gap-3">
                              <div className="p-1.5 rounded-lg bg-linear-to-br from-indigo-500 to-purple-600 text-white">
                                <Package className="h-4 w-4" />
                              </div>
                              <span className="text-base">{category.category}</span>
                              <Badge variant="secondary" className="ml-2">
                                {category.items.length} items
                              </Badge>
                            </div>
                          </TableCell>
                        </TableRow>
                        {category.items.map((item, itemIdx) => {
                          const stockStatus = item.totalBalance < 0 ? 'negative' : item.totalBalance < 10 ? 'low' : 'good';
                          
                          return (
                            <TableRow key={`item-${idx}-${itemIdx}`} className="hover:bg-muted/50 transition-colors">
                              <TableCell className="font-medium">{item.bound}</TableCell>
                              <TableCell>{item.weight}</TableCell>
                              <TableCell>{item.publication}</TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <div 
                                    className="w-4 h-4 rounded-full border-2 shadow-sm" 
                                    style={{ backgroundColor: item.color.toLowerCase() }}
                                  />
                                  {item.color}
                                </div>
                              </TableCell>
                              <TableCell className="font-mono text-sm">{item.isdn}</TableCell>
                              <TableCell>
                                <Badge variant="outline" className="font-mono">{item.rackNo}</Badge>
                              </TableCell>
                              <TableCell className="text-right font-medium">{item.headOffice}</TableCell>
                              <TableCell className={`text-right font-bold text-lg ${
                                stockStatus === 'negative' ? 'text-red-600' : 
                                stockStatus === 'low' ? 'text-amber-600' : 
                                'text-emerald-600'
                              }`}>
                                {item.totalBalance}
                              </TableCell>
                              <TableCell className="text-center">
                                {stockStatus === 'negative' ? (
                                  <Badge className="bg-linear-to-r from-red-500 to-red-600 text-white border-0 shadow-md">
                                    <TrendingDown className="h-3 w-3 mr-1" />
                                    Negative
                                  </Badge>
                                ) : stockStatus === 'low' ? (
                                  <Badge className="bg-linear-to-r from-amber-500 to-amber-600 text-white border-0 shadow-md">
                                    <AlertCircle className="h-3 w-3 mr-1" />
                                    Low Stock
                                  </Badge>
                                ) : (
                                  <Badge className="bg-linear-to-r from-emerald-500 to-emerald-600 text-white border-0 shadow-md">
                                    <TrendingUp className="h-3 w-3 mr-1" />
                                    Good
                                  </Badge>
                                )}
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="border-0 shadow-lg">
            <CardContent className="flex flex-col items-center justify-center py-20">
              <div className="relative mb-6">
                <div className="absolute inset-0 bg-linear-to-r from-indigo-500 to-purple-600 rounded-full blur-2xl opacity-20 animate-pulse" />
                <div className="relative p-6 rounded-full bg-linear-to-br from-indigo-100 to-purple-100 dark:from-indigo-950/50 dark:to-purple-950/50">
                  <Package className="h-16 w-16 text-indigo-600" />
                </div>
              </div>
              <h3 className="text-2xl font-bold mb-2 bg-linear-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                No Stock Data Yet
              </h3>
              <p className="text-muted-foreground text-center max-w-md mb-8">
                Apply your filters above and click the button below to load your current stock levels
              </p>
              <Button 
                onClick={handleStock}
                size="lg"
                className="bg-linear-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-300"
              >
                <Search className="h-5 w-5 mr-2" />
                Load Stock Data
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* AI Assistant */}
      <ModuleAIAssistant
        moduleName="Current Stock Report"
        moduleData={{ data, showReorderDetails, rackWise }}
      />
    </TooltipProvider>
  );
}
