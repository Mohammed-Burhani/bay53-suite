"use client";

import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatCurrency } from "@/lib/store";

interface InvoiceTotals {
  subtotal: number;
  totalDiscount: number;
  taxableAmount: number;
  cgst: number;
  sgst: number;
  igst: number;
  totalGst: number;
  grandTotal: number;
}

interface InvoiceSummaryProps {
  totals: InvoiceTotals;
  discount: number;
  gstRate: number;
  onDiscountChange: (value: number) => void;
  onGstRateChange: (value: number) => void;
}

export function InvoiceSummary({
  totals,
  discount,
  gstRate,
  onDiscountChange,
  onGstRateChange,
}: InvoiceSummaryProps) {
  return (
    <div className="space-y-6">
      {/* GST Breakdown */}
      <Card>
        <CardContent className="p-6 space-y-4">
          <div className="text-sm font-semibold text-muted-foreground">Tax Summary</div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Subtotal</span>
              <span>{formatCurrency(totals.subtotal)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Extra Discount</span>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={discount || ""}
                onChange={(e) => onDiscountChange(Number(e.target.value) || 0)}
                className="h-7 w-24 text-xs text-right"
                placeholder="₹0"
              />
            </div>
            {totals.totalDiscount > 0 && (
              <div className="flex justify-between text-emerald-600">
                <span>Total Discount</span>
                <span>-{formatCurrency(totals.totalDiscount)}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-muted-foreground">Taxable Amount</span>
              <span>{formatCurrency(totals.taxableAmount)}</span>
            </div>
            <Separator />
            
            {/* GST Rate Selector */}
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">GST Rate</span>
              <Select 
                value={String(gstRate)} 
                onValueChange={(val) => onGstRateChange(Number(val))}
              >
                <SelectTrigger className="h-7 w-24 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">0%</SelectItem>
                  <SelectItem value="5">5%</SelectItem>
                  <SelectItem value="12">12%</SelectItem>
                  <SelectItem value="18">18%</SelectItem>
                  <SelectItem value="28">28%</SelectItem>
                  <SelectItem value="40">40%</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {totals.cgst > 0 && (
              <>
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">CGST ({gstRate / 2}%)</span>
                  <span>+{formatCurrency(totals.cgst)}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">SGST ({gstRate / 2}%)</span>
                  <span>+{formatCurrency(totals.sgst)}</span>
                </div>
              </>
            )}
            {totals.igst > 0 && (
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">IGST ({gstRate}%)</span>
                <span>+{formatCurrency(totals.igst)}</span>
              </div>
            )}
            <div className="flex justify-between font-medium">
              <span className="text-muted-foreground">Total GST</span>
              <span>+{formatCurrency(totals.totalGst)}</span>
            </div>
            <Separator />
            <div className="flex justify-between text-lg font-bold">
              <span>Grand Total</span>
              <span>{formatCurrency(totals.grandTotal)}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
