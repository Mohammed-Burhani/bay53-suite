"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
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

interface DayBookRow {
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

export default function DayBookTable({ initialData = [] }: DayBookTableProps) {
  const [transactionType, setTransactionType] = useState("sales");
  const [data] = useState<DayBookRow[]>(initialData);

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="space-y-2">
              <Label>Date</Label>
              <Select defaultValue="yearly">
                <SelectTrigger><SelectValue /></SelectTrigger>
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
            </div>

            <div className="space-y-2">
              <Label>Transaction Type</Label>
              <RadioGroup value={transactionType} onValueChange={setTransactionType} className="grid grid-cols-2 gap-2">
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="sales" id="sales" />
                  <Label htmlFor="sales" className="cursor-pointer font-normal">Sales</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="purchase" id="purchase" />
                  <Label htmlFor="purchase" className="cursor-pointer font-normal">Purchase</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="sales_return" id="sales_return" />
                  <Label htmlFor="sales_return" className="cursor-pointer font-normal">Sales Return</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="purchase_return" id="purchase_return" />
                  <Label htmlFor="purchase_return" className="cursor-pointer font-normal">Purchase Return</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="receipt" id="receipt" />
                  <Label htmlFor="receipt" className="cursor-pointer font-normal">Receipt</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="payment" id="payment" />
                  <Label htmlFor="payment" className="cursor-pointer font-normal">Payment</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="credit_note" id="credit_note" />
                  <Label htmlFor="credit_note" className="cursor-pointer font-normal">Credit Note</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="debit_note" id="debit_note" />
                  <Label htmlFor="debit_note" className="cursor-pointer font-normal">Debit Note</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="journal" id="journal" />
                  <Label htmlFor="journal" className="cursor-pointer font-normal">Journal</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="contra" id="contra" />
                  <Label htmlFor="contra" className="cursor-pointer font-normal">Contra</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="all" id="all" />
                  <Label htmlFor="all" className="cursor-pointer font-normal">All</Label>
                </div>
              </RadioGroup>
            </div>
          </div>

          <div className="flex gap-2">
            <Button>
              <Search className="h-4 w-4 mr-2" />
              Register
            </Button>
            <Button variant="outline">
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

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Bill No</TableHead>
                <TableHead>Bill Date</TableHead>
                <TableHead>Party Name</TableHead>
                <TableHead>Bill Type</TableHead>
                <TableHead className="text-right">Bill Amount</TableHead>
                <TableHead>Particular</TableHead>
                <TableHead className="text-right">Debit Amount</TableHead>
                <TableHead className="text-right">Credit Amount</TableHead>
                <TableHead>Narration / Remarks</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center text-muted-foreground">
                    No data found
                  </TableCell>
                </TableRow>
              ) : (
                data.map((row, idx) => (
                  <TableRow key={idx}>
                    <TableCell>{row.billNo}</TableCell>
                    <TableCell>{row.billDate}</TableCell>
                    <TableCell>{row.partyName}</TableCell>
                    <TableCell>{row.billType}</TableCell>
                    <TableCell className="text-right">{row.billAmount}</TableCell>
                    <TableCell>{row.particular}</TableCell>
                    <TableCell className="text-right">{row.debitAmount}</TableCell>
                    <TableCell className="text-right">{row.creditAmount}</TableCell>
                    <TableCell>{row.narration}</TableCell>
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
