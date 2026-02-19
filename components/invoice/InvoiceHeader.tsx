"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar } from "lucide-react";

interface InvoiceHeaderProps {
  invoiceNumber: string;
  taxInvoiceNumber: string;
  invoiceDate: string;
  onInvoiceNumberChange: (value: string) => void;
  onTaxInvoiceNumberChange: (value: string) => void;
  onInvoiceDateChange: (value: string) => void;
}

export function InvoiceHeader({
  invoiceNumber,
  taxInvoiceNumber,
  invoiceDate,
  onInvoiceNumberChange,
  onTaxInvoiceNumberChange,
  onInvoiceDateChange,
}: InvoiceHeaderProps) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="grid gap-4 md:grid-cols-3">
          <div className="space-y-2">
            <Label>Invoice Number *</Label>
            <Input
              value={invoiceNumber}
              onChange={(e) => onInvoiceNumberChange(e.target.value)}
              placeholder="INV-2025-001"
            />
          </div>
          <div className="space-y-2">
            <Label>Tax Invoice Number *</Label>
            <Input
              value={taxInvoiceNumber}
              onChange={(e) => onTaxInvoiceNumberChange(e.target.value)}
              placeholder="TAX-2025-001"
            />
          </div>
          <div className="space-y-2">
            <Label>Invoice Date *</Label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="date"
                value={invoiceDate}
                onChange={(e) => onInvoiceDateChange(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
