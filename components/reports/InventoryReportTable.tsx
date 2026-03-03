"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
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
import { Download, Search, X } from "lucide-react";

interface InventoryReportTableProps {
  initialData?: any[];
}

export default function InventoryReportTable({ initialData = [] }: InventoryReportTableProps) {
  const [itemWise, setItemWise] = useState(true);
  const [partyWise, setPartyWise] = useState(true);
  const [billDetail, setBillDetail] = useState(true);
  const [dateWise, setDateWise] = useState(true);
  const [data, setData] = useState<any[]>(initialData);

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardContent className="p-6">
          <div className="mb-4">
            <h3 className="text-sm font-medium mb-3">Select Options — Item Details</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-6">
            <div className="space-y-2">
              <Label>Rack No</Label>
              <Select>
                <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent><SelectItem value="a1">A1</SelectItem></SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>ISDN No</Label>
              <Select>
                <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent><SelectItem value="123">123456</SelectItem></SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Bound</Label>
              <Select>
                <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent><SelectItem value="hardcover">Hardcover</SelectItem></SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Weight</Label>
              <Select>
                <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent><SelectItem value="500g">500g</SelectItem></SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Publication</Label>
              <Select>
                <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent><SelectItem value="abc">ABC Pub</SelectItem></SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Color</Label>
              <Select>
                <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent><SelectItem value="red">Red</SelectItem></SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Bill From</Label>
              <Select>
                <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent><SelectItem value="supplier1">Supplier 1</SelectItem></SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Party</Label>
              <Select>
                <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent><SelectItem value="party1">Party 1</SelectItem></SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Date</Label>
              <Select defaultValue="none">
                <SelectTrigger><SelectValue /></SelectTrigger>
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

            <div className="space-y-2">
              <Label>Bill Type</Label>
              <Select defaultValue="sales_invoice">
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="sales_invoice">Sales Invoice</SelectItem>
                  <SelectItem value="purchase">Purchase</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Salesman</Label>
              <Select>
                <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent><SelectItem value="s1">Salesman 1</SelectItem></SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Batch Code</Label>
              <Input placeholder="Enter batch code" />
            </div>

            <div className="space-y-2">
              <Label>Area</Label>
              <Select>
                <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent><SelectItem value="area1">Area 1</SelectItem></SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>City</Label>
              <Select>
                <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent><SelectItem value="city1">City 1</SelectItem></SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="flex items-center space-x-2">
              <Checkbox id="allitem" />
              <Label htmlFor="allitem" className="cursor-pointer">All Item</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox id="itemwise" checked={itemWise} onCheckedChange={(c) => setItemWise(c as boolean)} />
              <Label htmlFor="itemwise" className="cursor-pointer">Item Wise</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox id="inventory" />
              <Label htmlFor="inventory" className="cursor-pointer">Inventory</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox id="reorder" />
              <Label htmlFor="reorder" className="cursor-pointer">Re-order Details</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox id="billtypewise" />
              <Label htmlFor="billtypewise" className="cursor-pointer">Bill Type Wise</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox id="stockplacewise" />
              <Label htmlFor="stockplacewise" className="cursor-pointer">Stock Place Wise</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox id="batchcodewise" />
              <Label htmlFor="batchcodewise" className="cursor-pointer">Batch Code Wise</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox id="partywise" checked={partyWise} onCheckedChange={(c) => setPartyWise(c as boolean)} />
              <Label htmlFor="partywise" className="cursor-pointer">Party Wise</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox id="billdetail" checked={billDetail} onCheckedChange={(c) => setBillDetail(c as boolean)} />
              <Label htmlFor="billdetail" className="cursor-pointer">Bill Detail</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox id="datewise" checked={dateWise} onCheckedChange={(c) => setDateWise(c as boolean)} />
              <Label htmlFor="datewise" className="cursor-pointer">Date Wise</Label>
            </div>
          </div>

          <div className="flex gap-2">
            <Button><Search className="h-4 w-4 mr-2" />Search</Button>
            <Button variant="outline"><X className="h-4 w-4 mr-2" />Clear</Button>
            <Button variant="outline"><Download className="h-4 w-4 mr-2" />Export</Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Particular</TableHead>
                <TableHead className="text-right">Qty</TableHead>
                <TableHead className="text-right">Rate</TableHead>
                <TableHead className="text-right">Discount 1</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead>Bill Type</TableHead>
                <TableHead>Party</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Bill No</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>State Type</TableHead>
                <TableHead className="text-right">CGST</TableHead>
                <TableHead className="text-right">SGST</TableHead>
                <TableHead className="text-right">IGST</TableHead>
                <TableHead className="text-right">Extracharge Total</TableHead>
                <TableHead className="text-right">Grand Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={16} className="text-center text-muted-foreground">
                    No data found
                  </TableCell>
                </TableRow>
              ) : (
                data.map((row, idx) => (
                  <TableRow key={idx}>
                    <TableCell>{row.particular}</TableCell>
                    <TableCell className="text-right">{row.qty}</TableCell>
                    <TableCell className="text-right">{row.rate}</TableCell>
                    <TableCell className="text-right">{row.discount}</TableCell>
                    <TableCell className="text-right">{row.amount}</TableCell>
                    <TableCell>{row.billType}</TableCell>
                    <TableCell>{row.party}</TableCell>
                    <TableCell>{row.contact}</TableCell>
                    <TableCell>{row.billNo}</TableCell>
                    <TableCell>{row.date}</TableCell>
                    <TableCell>{row.stateType}</TableCell>
                    <TableCell className="text-right">{row.cgst}</TableCell>
                    <TableCell className="text-right">{row.sgst}</TableCell>
                    <TableCell className="text-right">{row.igst}</TableCell>
                    <TableCell className="text-right">{row.extracharge}</TableCell>
                    <TableCell className="text-right">{row.grandTotal}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
