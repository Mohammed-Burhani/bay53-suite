"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
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
import { Download, FileSpreadsheet } from "lucide-react";

interface GSTFilingRow {
  [key: string]: string | number;
}

interface GSTFilingTableProps {
  initialData?: GSTFilingRow[];
}

export default function GSTFilingTable({ initialData = [] }: GSTFilingTableProps) {
  const [reportType, setReportType] = useState("b2b");
  const [dateType, setDateType] = useState("yearly");
  const [data] = useState<GSTFilingRow[]>(initialData);

  const renderTableHeaders = () => {
    switch (reportType) {
      case "b2b":
        return (
          <TableRow>
            <TableHead>GSTIN</TableHead>
            <TableHead>Party Name</TableHead>
            <TableHead>Invoice No</TableHead>
            <TableHead>Invoice Date</TableHead>
            <TableHead className="text-right">Invoice Value</TableHead>
            <TableHead className="text-right">Taxable Value</TableHead>
            <TableHead>GST Rate</TableHead>
            <TableHead className="text-right">CGST</TableHead>
            <TableHead className="text-right">SGST</TableHead>
            <TableHead className="text-right">IGST</TableHead>
          </TableRow>
        );
      case "b2cl":
      case "b2cs":
        return (
          <TableRow>
            <TableHead>Invoice No</TableHead>
            <TableHead>Invoice Date</TableHead>
            <TableHead className="text-right">Invoice Value</TableHead>
            <TableHead className="text-right">Taxable Value</TableHead>
            <TableHead>GST Rate</TableHead>
            <TableHead className="text-right">CGST</TableHead>
            <TableHead className="text-right">SGST</TableHead>
            <TableHead className="text-right">IGST</TableHead>
            <TableHead>Place of Supply</TableHead>
          </TableRow>
        );
      case "hsn":
        return (
          <TableRow>
            <TableHead>HSN Code</TableHead>
            <TableHead>Description</TableHead>
            <TableHead>UOM</TableHead>
            <TableHead className="text-right">Total Qty</TableHead>
            <TableHead className="text-right">Taxable Value</TableHead>
            <TableHead>CGST Rate</TableHead>
            <TableHead className="text-right">CGST Amount</TableHead>
            <TableHead>SGST Rate</TableHead>
            <TableHead className="text-right">SGST Amount</TableHead>
            <TableHead>IGST Rate</TableHead>
            <TableHead className="text-right">IGST Amount</TableHead>
          </TableRow>
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="space-y-2">
              <Label>Date</Label>
              <Select value={dateType} onValueChange={setDateType}>
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

            {dateType === "yearly" && (
              <div className="space-y-2">
                <Label>Year</Label>
                <Input type="number" defaultValue={new Date().getFullYear()} />
              </div>
            )}

            <div className="space-y-2">
              <Label>Transaction Type</Label>
              <Select defaultValue="sales">
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="sales">Sales</SelectItem>
                  <SelectItem value="purchase">Purchase</SelectItem>
                  <SelectItem value="sales_return">Sales Return</SelectItem>
                  <SelectItem value="purchase_return">Purchase Return</SelectItem>
                  <SelectItem value="exempted_sales">Exempted Sales</SelectItem>
                  <SelectItem value="exempted_purchase">Exempted Purchase</SelectItem>
                  <SelectItem value="exempted_sales_return">Exempted Sales Return</SelectItem>
                  <SelectItem value="exempted_purchase_return">Exempted Purchase Return</SelectItem>
                  <SelectItem value="income">Income</SelectItem>
                  <SelectItem value="expense">Expense</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2 mb-6">
            <Label>Report Type</Label>
            <RadioGroup value={reportType} onValueChange={setReportType} className="flex flex-wrap gap-4">
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="b2b" id="b2b" />
                <Label htmlFor="b2b" className="cursor-pointer font-normal">B2B</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="b2cl" id="b2cl" />
                <Label htmlFor="b2cl" className="cursor-pointer font-normal">B2CL</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="b2cs" id="b2cs" />
                <Label htmlFor="b2cs" className="cursor-pointer font-normal">B2CS</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="hsn" id="hsn" />
                <Label htmlFor="hsn" className="cursor-pointer font-normal">HSN</Label>
              </div>
            </RadioGroup>
          </div>

          <div className="flex gap-2">
            <Button variant="outline">
              <FileSpreadsheet className="h-4 w-4 mr-2" />
              Export To CSV
            </Button>
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export To Excel
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              {renderTableHeaders()}
            </TableHeader>
            <TableBody>
              {data.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10} className="text-center text-muted-foreground">
                    No data found
                  </TableCell>
                </TableRow>
              ) : (
                data.map((row, idx) => (
                  <TableRow key={idx}>
                    {/* Dynamic rendering based on reportType */}
                    {Object.values(row).map((value, cellIdx) => (
                      <TableCell key={cellIdx}>{String(value)}</TableCell>
                    ))}
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
