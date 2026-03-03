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
import { Printer, Search } from "lucide-react";

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

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="space-y-2">
              <Label>Ledger <span className="text-red-500">*</span></Label>
              <Select>
                <SelectTrigger><SelectValue placeholder="Search and select ledger" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ledger1">Ledger 1</SelectItem>
                  <SelectItem value="ledger2">Ledger 2</SelectItem>
                </SelectContent>
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

            <div className="space-y-2 flex items-end">
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="detailed" 
                  checked={detailed}
                  onCheckedChange={(c) => setDetailed(c as boolean)}
                />
                <Label htmlFor="detailed" className="cursor-pointer">Detailed</Label>
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            <Button>
              <Search className="h-4 w-4 mr-2" />
              Outstanding
            </Button>
            <Button variant="outline">
              <Printer className="h-4 w-4 mr-2" />
              Print
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Party</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>GST No</TableHead>
                <TableHead>Bill No</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Ref No</TableHead>
                <TableHead>Ref Date</TableHead>
                <TableHead>Order No</TableHead>
                <TableHead>Order Date</TableHead>
                <TableHead>Voucher</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead>Dr/Cr</TableHead>
                <TableHead className="text-right">Pending</TableHead>
                <TableHead>Dr/Cr</TableHead>
                <TableHead>Due On</TableHead>
                <TableHead>Remarks</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={16} className="text-center text-muted-foreground">
                    Select a ledger to view outstanding
                  </TableCell>
                </TableRow>
              ) : (
                data.map((row, idx) => (
                  <TableRow key={idx}>
                    <TableCell>{row.party}</TableCell>
                    <TableCell>{row.contact}</TableCell>
                    <TableCell>{row.gstNo}</TableCell>
                    <TableCell>{row.billNo}</TableCell>
                    <TableCell>{row.date}</TableCell>
                    <TableCell>{row.refNo}</TableCell>
                    <TableCell>{row.refDate}</TableCell>
                    <TableCell>{row.orderNo}</TableCell>
                    <TableCell>{row.orderDate}</TableCell>
                    <TableCell>{row.voucher}</TableCell>
                    <TableCell className="text-right">{row.amount}</TableCell>
                    <TableCell>{row.amountDrCr}</TableCell>
                    <TableCell className="text-right">{row.pending}</TableCell>
                    <TableCell>{row.pendingDrCr}</TableCell>
                    <TableCell>{row.dueOn}</TableCell>
                    <TableCell>{row.remarks}</TableCell>
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
