"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Save } from "lucide-react";

export default function InvoiceSettings() {
  return (
    <div className="space-y-6">
      <Card className="py-4">
        <CardHeader>
          <CardTitle>Invoice Numbering</CardTitle>
          <CardDescription>
            Configure invoice number format and sequence
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="invoice-prefix">Invoice Prefix</Label>
              <Input id="invoice-prefix" placeholder="e.g., INV" defaultValue="INV" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="invoice-start">Starting Number</Label>
              <Input id="invoice-start" type="number" placeholder="e.g., 1" defaultValue="1" />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="invoice-format">Number Format</Label>
              <Select defaultValue="prefix-year-number">
                <SelectTrigger id="invoice-format">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="prefix-number">PREFIX-001</SelectItem>
                  <SelectItem value="prefix-year-number">PREFIX-2025-001</SelectItem>
                  <SelectItem value="prefix-month-number">PREFIX-0325-001</SelectItem>
                  <SelectItem value="year-prefix-number">2025-PREFIX-001</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="number-padding">Number Padding</Label>
              <Select defaultValue="3">
                <SelectTrigger id="number-padding">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="2">2 digits (01, 02...)</SelectItem>
                  <SelectItem value="3">3 digits (001, 002...)</SelectItem>
                  <SelectItem value="4">4 digits (0001, 0002...)</SelectItem>
                  <SelectItem value="5">5 digits (00001, 00002...)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center justify-between rounded-lg border p-4">
            <div className="space-y-0.5">
              <Label>Reset Numbering Annually</Label>
              <p className="text-sm text-muted-foreground">
                Start from 1 at the beginning of each fiscal year
              </p>
            </div>
            <Switch />
          </div>

          <div className="flex justify-end pt-4">
            <Button>
              <Save className="mr-2 h-4 w-4" />
              Save Changes
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="py-4">
        <CardHeader>
          <CardTitle>Invoice Display</CardTitle>
          <CardDescription>
            Customize invoice appearance and content
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <Label>Show Company Logo</Label>
                <p className="text-sm text-muted-foreground">
                  Display business logo on invoices
                </p>
              </div>
              <Switch defaultChecked />
            </div>

            <div className="flex items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <Label>Show GSTIN</Label>
                <p className="text-sm text-muted-foreground">
                  Display GST identification number
                </p>
              </div>
              <Switch defaultChecked />
            </div>

            <div className="flex items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <Label>Show HSN/SAC Codes</Label>
                <p className="text-sm text-muted-foreground">
                  Display HSN/SAC codes for items
                </p>
              </div>
              <Switch defaultChecked />
            </div>

            <div className="flex items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <Label>Show Item Discount</Label>
                <p className="text-sm text-muted-foreground">
                  Display discount column in invoice
                </p>
              </div>
              <Switch defaultChecked />
            </div>

            <div className="flex items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <Label>Show Bank Details</Label>
                <p className="text-sm text-muted-foreground">
                  Display bank account information
                </p>
              </div>
              <Switch defaultChecked />
            </div>

            <div className="flex items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <Label>Show Terms & Conditions</Label>
                <p className="text-sm text-muted-foreground">
                  Display terms at the bottom of invoice
                </p>
              </div>
              <Switch defaultChecked />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="invoice-template">Invoice Template</Label>
            <Select defaultValue="standard">
              <SelectTrigger id="invoice-template">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="standard">Standard</SelectItem>
                <SelectItem value="modern">Modern</SelectItem>
                <SelectItem value="classic">Classic</SelectItem>
                <SelectItem value="minimal">Minimal</SelectItem>
                <SelectItem value="detailed">Detailed</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end pt-4">
            <Button>
              <Save className="mr-2 h-4 w-4" />
              Save Changes
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="py-4">
        <CardHeader>
          <CardTitle>Default Terms & Conditions</CardTitle>
          <CardDescription>
            Set default terms and conditions for invoices
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="terms">Terms & Conditions</Label>
            <Textarea
              id="terms"
              rows={6}
              placeholder="Enter default terms and conditions..."
              defaultValue="1. Payment is due within 30 days of invoice date.&#10;2. Late payments may incur additional charges.&#10;3. Goods once sold will not be taken back.&#10;4. Subject to local jurisdiction."
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Default Notes</Label>
            <Textarea
              id="notes"
              rows={3}
              placeholder="Enter default notes..."
              defaultValue="Thank you for your business!"
            />
          </div>

          <div className="flex justify-end pt-4">
            <Button>
              <Save className="mr-2 h-4 w-4" />
              Save Changes
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="py-4">
        <CardHeader>
          <CardTitle>Payment Settings</CardTitle>
          <CardDescription>
            Configure payment terms and methods
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="payment-terms">Default Payment Terms</Label>
              <Select defaultValue="30">
                <SelectTrigger id="payment-terms">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">Due on Receipt</SelectItem>
                  <SelectItem value="7">Net 7 Days</SelectItem>
                  <SelectItem value="15">Net 15 Days</SelectItem>
                  <SelectItem value="30">Net 30 Days</SelectItem>
                  <SelectItem value="45">Net 45 Days</SelectItem>
                  <SelectItem value="60">Net 60 Days</SelectItem>
                  <SelectItem value="90">Net 90 Days</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="default-payment">Default Payment Mode</Label>
              <Select defaultValue="cash">
                <SelectTrigger id="default-payment">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="upi">UPI</SelectItem>
                  <SelectItem value="card">Card</SelectItem>
                  <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                  <SelectItem value="cheque">Cheque</SelectItem>
                  <SelectItem value="credit">Credit</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center justify-between rounded-lg border p-4">
            <div className="space-y-0.5">
              <Label>Allow Partial Payments</Label>
              <p className="text-sm text-muted-foreground">
                Enable customers to make partial payments
              </p>
            </div>
            <Switch defaultChecked />
          </div>

          <div className="flex justify-end pt-4">
            <Button>
              <Save className="mr-2 h-4 w-4" />
              Save Changes
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
