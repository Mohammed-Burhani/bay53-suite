"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CreditCard } from "lucide-react";
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
  paymentMode: "cash" | "upi" | "card" | "bank_transfer" | "credit";
  amountPaid: number;
  onDiscountChange: (value: number) => void;
  onPaymentModeChange: (value: "cash" | "upi" | "card" | "bank_transfer" | "credit") => void;
  onAmountPaidChange: (value: number) => void;
}

export function InvoiceSummary({
  totals,
  discount,
  paymentMode,
  amountPaid,
  onDiscountChange,
  onPaymentModeChange,
  onAmountPaidChange,
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
            {totals.cgst > 0 && (
              <>
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">CGST</span>
                  <span>+{formatCurrency(totals.cgst)}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">SGST</span>
                  <span>+{formatCurrency(totals.sgst)}</span>
                </div>
              </>
            )}
            {totals.igst > 0 && (
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">IGST</span>
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

      {/* Payment */}
      <Card>
        <CardContent className="p-6 space-y-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
            <CreditCard className="h-4 w-4" />
            Payment Details
          </div>
          <div className="space-y-3">
            <div className="space-y-2">
              <Label>Payment Mode</Label>
              <Select value={paymentMode} onValueChange={onPaymentModeChange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="upi">UPI</SelectItem>
                  <SelectItem value="card">Card</SelectItem>
                  <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                  <SelectItem value="credit">Credit</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Amount Paid</Label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={amountPaid}
                onChange={(e) => onAmountPaidChange(Number(e.target.value) || 0)}
                placeholder="0.00"
              />
              {amountPaid < totals.grandTotal && (
                <p className="text-xs text-amber-600">
                  Balance: {formatCurrency(totals.grandTotal - amountPaid)}
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
