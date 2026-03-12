"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { INDIAN_STATES } from "@/lib/types";
import { Save, Upload } from "lucide-react";

export default function BusinessSettings() {
  return (
    <div className="space-y-6">
      <Card className="py-4">
        <CardHeader>
          <CardTitle>Business Information</CardTitle>
          <CardDescription>
            Update your business details and contact information
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="business-name">Business Name *</Label>
              <Input id="business-name" placeholder="Enter business name" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="legal-name">Legal Name</Label>
              <Input id="legal-name" placeholder="Enter legal name" />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="gstin">GSTIN / Tax ID</Label>
              <Input id="gstin" placeholder="e.g., 27AAAAA0000A1Z5" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pan">PAN Number</Label>
              <Input id="pan" placeholder="e.g., AAAAA0000A" />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Address *</Label>
            <Textarea id="address" placeholder="Enter complete address" rows={3} />
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="city">City *</Label>
              <Input id="city" placeholder="Enter city" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="state">State *</Label>
              <Select>
                <SelectTrigger id="state">
                  <SelectValue placeholder="Select state" />
                </SelectTrigger>
                <SelectContent>
                  {INDIAN_STATES.map((state) => (
                    <SelectItem key={state} value={state}>
                      {state}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="pincode">Pincode *</Label>
              <Input id="pincode" placeholder="e.g., 110001" />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number *</Label>
              <Input id="phone" type="tel" placeholder="e.g., +91 9876543210" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email Address *</Label>
              <Input id="email" type="email" placeholder="business@example.com" />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="website">Website</Label>
              <Input id="website" type="url" placeholder="https://example.com" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="industry">Industry</Label>
              <Select>
                <SelectTrigger id="industry">
                  <SelectValue placeholder="Select industry" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="retail">Retail</SelectItem>
                  <SelectItem value="wholesale">Wholesale</SelectItem>
                  <SelectItem value="manufacturing">Manufacturing</SelectItem>
                  <SelectItem value="services">Services</SelectItem>
                  <SelectItem value="healthcare">Healthcare</SelectItem>
                  <SelectItem value="hospitality">Hospitality</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="logo">Business Logo</Label>
            <div className="flex items-center gap-4">
              <Button variant="outline" size="sm">
                <Upload className="mr-2 h-4 w-4" />
                Upload Logo
              </Button>
              <span className="text-sm text-muted-foreground">
                Recommended: 200x200px, PNG or JPG
              </span>
            </div>
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
          <CardTitle>Bank Details</CardTitle>
          <CardDescription>
            Add bank account information for payment references
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="bank-name">Bank Name</Label>
              <Input id="bank-name" placeholder="Enter bank name" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="account-number">Account Number</Label>
              <Input id="account-number" placeholder="Enter account number" />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="ifsc">IFSC Code</Label>
              <Input id="ifsc" placeholder="e.g., SBIN0001234" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="branch">Branch Name</Label>
              <Input id="branch" placeholder="Enter branch name" />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="upi">UPI ID</Label>
            <Input id="upi" placeholder="e.g., business@upi" />
          </div>

          <div className="flex justify-end pt-4">
            <Button>
              <Save className="mr-2 h-4 w-4" />
              Save Bank Details
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
