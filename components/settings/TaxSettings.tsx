"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Save, Plus, Trash2 } from "lucide-react";

export default function TaxSettings() {
  return (
    <div className="space-y-6">
      <Card className="py-4">
        <CardHeader>
          <CardTitle>Tax Configuration</CardTitle>
          <CardDescription>
            Configure tax system and default rates
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="tax-system">Tax System</Label>
              <Select defaultValue="gst">
                <SelectTrigger id="tax-system">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="gst">GST (India)</SelectItem>
                  <SelectItem value="vat">VAT</SelectItem>
                  <SelectItem value="sales-tax">Sales Tax</SelectItem>
                  <SelectItem value="none">No Tax</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="tax-calculation">Tax Calculation Method</Label>
              <Select defaultValue="exclusive">
                <SelectTrigger id="tax-calculation">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="exclusive">Tax Exclusive (Add to price)</SelectItem>
                  <SelectItem value="inclusive">Tax Inclusive (Included in price)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center justify-between rounded-lg border p-4">
            <div className="space-y-0.5">
              <Label>Enable GST</Label>
              <p className="text-sm text-muted-foreground">
                Apply GST to all transactions
              </p>
            </div>
            <Switch defaultChecked />
          </div>

          <div className="flex items-center justify-between rounded-lg border p-4">
            <div className="space-y-0.5">
              <Label>Reverse Charge Mechanism</Label>
              <p className="text-sm text-muted-foreground">
                Enable RCM for applicable transactions
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
          <CardTitle>GST Rates</CardTitle>
          <CardDescription>
            Manage GST rate slabs for products
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            {[0, 5, 12, 18, 28].map((rate) => (
              <div key={rate} className="flex items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <Label>{rate}% GST</Label>
                  <p className="text-sm text-muted-foreground">
                    {rate === 0 && "Exempt items"}
                    {rate === 5 && "Essential goods"}
                    {rate === 12 && "Standard goods"}
                    {rate === 18 && "Most goods & services"}
                    {rate === 28 && "Luxury items"}
                  </p>
                </div>
                <Switch defaultChecked />
              </div>
            ))}
          </div>

          <div className="flex justify-end pt-4">
            <Button variant="outline">
              <Plus className="mr-2 h-4 w-4" />
              Add Custom Rate
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="py-4">
        <CardHeader>
          <CardTitle>Inter-State vs Intra-State</CardTitle>
          <CardDescription>
            Configure CGST/SGST and IGST handling
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between rounded-lg border p-4">
            <div className="space-y-0.5">
              <Label>Auto-detect Inter-State Transactions</Label>
              <p className="text-sm text-muted-foreground">
                Automatically apply IGST for different states
              </p>
            </div>
            <Switch defaultChecked />
          </div>

          <div className="flex items-center justify-between rounded-lg border p-4">
            <div className="space-y-0.5">
              <Label>Split CGST/SGST Display</Label>
              <p className="text-sm text-muted-foreground">
                Show CGST and SGST separately on invoices
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

      <Card className="py-4">
        <CardHeader>
          <CardTitle>Tax Exemptions</CardTitle>
          <CardDescription>
            Manage tax-exempt categories and customers
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Exempt Categories</Label>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Input placeholder="Enter category name" />
                <Button size="icon" variant="outline">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <div className="space-y-1">
                <div className="flex items-center justify-between rounded-lg border p-3">
                  <span className="text-sm">Healthcare Services</span>
                  <Button size="icon" variant="ghost">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex items-center justify-between rounded-lg border p-3">
                  <span className="text-sm">Educational Materials</span>
                  <Button size="icon" variant="ghost">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between rounded-lg border p-4">
            <div className="space-y-0.5">
              <Label>Allow Customer-Level Tax Exemption</Label>
              <p className="text-sm text-muted-foreground">
                Enable tax exemption for specific customers
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
          <CardTitle>Tax Reports & Filing</CardTitle>
          <CardDescription>
            Configure tax reporting preferences
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="gst-filing">GST Filing Frequency</Label>
              <Select defaultValue="monthly">
                <SelectTrigger id="gst-filing">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="quarterly">Quarterly</SelectItem>
                  <SelectItem value="annual">Annual</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="gst-portal">GST Portal Username</Label>
              <Input id="gst-portal" placeholder="Enter GST portal username" />
            </div>
          </div>

          <div className="flex items-center justify-between rounded-lg border p-4">
            <div className="space-y-0.5">
              <Label>Enable Auto GST Report Generation</Label>
              <p className="text-sm text-muted-foreground">
                Automatically generate GSTR reports
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
    </div>
  );
}
