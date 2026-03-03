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

export default function ItemRegisterPage() {
  const [itemWise, setItemWise] = useState(true);
  const [dateWise, setDateWise] = useState(true);
  const [partyWise, setPartyWise] = useState(true);
  const [billDetail, setBillDetail] = useState(true);

  return (
    <div className="flex flex-col gap-6 p-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Item Register</h1>
        <p className="text-sm text-muted-foreground">Item-wise stock movement register</p>
      </div>

      <Card>
        <CardContent className="p-6">
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
              <Label>Party</Label>
              <Select>
                <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent><SelectItem value="party1">Party 1</SelectItem></SelectContent>
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
          </div>

          <div className="flex flex-wrap gap-4 mb-6">
            <div className="flex items-center space-x-2">
              <Checkbox id="itemwise" checked={itemWise} onCheckedChange={(c) => setItemWise(c as boolean)} />
              <Label htmlFor="itemwise" className="cursor-pointer">Item Wise</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox id="datewise" checked={dateWise} onCheckedChange={(c) => setDateWise(c as boolean)} />
              <Label htmlFor="datewise" className="cursor-pointer">Date Wise</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox id="partywise" checked={partyWise} onCheckedChange={(c) => setPartyWise(c as boolean)} />
              <Label htmlFor="partywise" className="cursor-pointer">Party Wise</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox id="billdetail" checked={billDetail} onCheckedChange={(c) => setBillDetail(c as boolean)} />
              <Label htmlFor="billdetail" className="cursor-pointer">Bill Detail</Label>
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
                <TableHead>Item Name / Particular</TableHead>
                <TableHead>ISDN No</TableHead>
                <TableHead>Rack No</TableHead>
                <TableHead className="text-right">Opening Stock</TableHead>
                <TableHead className="text-right">Purchased Qty</TableHead>
                <TableHead className="text-right">Sold Qty</TableHead>
                <TableHead className="text-right">Return Qty</TableHead>
                <TableHead className="text-right">Closing Stock</TableHead>
                <TableHead className="text-right">Rate</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead>Bill No</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Party</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell colSpan={13} className="text-center text-muted-foreground">
                  No data found
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
