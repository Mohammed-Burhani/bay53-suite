"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
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
import { Download, Search, X } from "lucide-react";

export default function CurrentStockPage() {
  const [showReorderDetails, setShowReorderDetails] = useState(false);
  const [rackWise, setRackWise] = useState(false);
  const [data, setData] = useState<any[]>([]);

  const handleStock = () => {
    // Mock data - replace with actual API call
    setData([
      {
        category: "01",
        items: [
          { bound: "Hardcover", weight: "500g", publication: "ABC Pub", color: "Red", isdn: "123456", rackNo: "A1", headOffice: 50, totalBalance: 45 },
        ]
      }
    ]);
  };

  const handleClear = () => {
    setData([]);
  };

  return (
    <div className="flex flex-col gap-6 p-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Current Stock</h1>
        <p className="text-sm text-muted-foreground">View current stock levels</p>
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="mb-4">
            <h3 className="text-sm font-medium mb-3">Select Category or Item</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-6">
            <div className="space-y-2">
              <Label>Rack No</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="a1">A1</SelectItem>
                  <SelectItem value="a2">A2</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>ISDN No</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="123">123456</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Bound</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="hardcover">Hardcover</SelectItem>
                  <SelectItem value="paperback">Paperback</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Weight</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="500g">500g</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Publication</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="abc">ABC Pub</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Color</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="red">Red</SelectItem>
                  <SelectItem value="blue">Blue</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>StockPlace</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="warehouse">Warehouse</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex flex-wrap gap-4 mb-6">
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="reorder" 
                checked={showReorderDetails}
                onCheckedChange={(checked) => setShowReorderDetails(checked as boolean)}
              />
              <Label htmlFor="reorder" className="cursor-pointer">Show Reorder Details</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="rackwise" 
                checked={rackWise}
                onCheckedChange={(checked) => setRackWise(checked as boolean)}
              />
              <Label htmlFor="rackwise" className="cursor-pointer">Rack Wise</Label>
            </div>
          </div>

          <div className="flex gap-2">
            <Button onClick={handleStock}>
              <Search className="h-4 w-4 mr-2" />
              Stock
            </Button>
            <Button variant="outline" onClick={handleClear}>
              <X className="h-4 w-4 mr-2" />
              Clear
            </Button>
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </CardContent>
      </Card>

      {data.length > 0 && (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Bound</TableHead>
                  <TableHead>Weight</TableHead>
                  <TableHead>Publication</TableHead>
                  <TableHead>Color</TableHead>
                  <TableHead>ISDN No</TableHead>
                  <TableHead>Rack No</TableHead>
                  <TableHead className="text-right">Head Office</TableHead>
                  <TableHead className="text-right">Total Balance Qty</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((category, idx) => (
                  <>
                    <TableRow key={`cat-${idx}`} className="bg-muted/50">
                      <TableCell colSpan={8} className="font-semibold">
                        Category: {category.category}
                      </TableCell>
                    </TableRow>
                    {category.items.map((item: any, itemIdx: number) => (
                      <TableRow key={`item-${idx}-${itemIdx}`}>
                        <TableCell>{item.bound}</TableCell>
                        <TableCell>{item.weight}</TableCell>
                        <TableCell>{item.publication}</TableCell>
                        <TableCell>{item.color}</TableCell>
                        <TableCell>{item.isdn}</TableCell>
                        <TableCell>{item.rackNo}</TableCell>
                        <TableCell className="text-right">{item.headOffice}</TableCell>
                        <TableCell className={`text-right ${item.totalBalance < 0 ? 'text-red-600' : ''}`}>
                          {item.totalBalance}
                        </TableCell>
                      </TableRow>
                    ))}
                  </>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
