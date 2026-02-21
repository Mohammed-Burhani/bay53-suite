"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Building2 } from "lucide-react";
import { Party } from "@/lib/types";

interface BusinessAddressProps {
  businessName: string;
  businessGstin: string;
  businessAddress: string;
  businessCity: string;
  businessState: string;
  businessPincode: string;
  onBusinessNameChange: (value: string) => void;
  onBusinessGstinChange: (value: string) => void;
  onBusinessAddressChange: (value: string) => void;
  onBusinessCityChange: (value: string) => void;
  onBusinessStateChange: (value: string) => void;
  onBusinessPincodeChange: (value: string) => void;
}

interface CustomerAddressProps {
  customers: Party[];
  selectedPartyId: string;
  selectedCustomer?: Party;
  customerGstin: string;
  onCustomerSelect: (value: string) => void;
  onCustomerGstinChange: (value: string) => void;
  // Manual input props
  buyerName?: string;
  buyerAddress?: string;
  buyerCity?: string;
  buyerState?: string;
  onBuyerNameChange?: (value: string) => void;
  onBuyerAddressChange?: (value: string) => void;
  onBuyerCityChange?: (value: string) => void;
  onBuyerStateChange?: (value: string) => void;
}

export function BusinessAddress({
  businessName,
  businessGstin,
  businessAddress,
  businessCity,
  businessState,
  businessPincode,
  onBusinessNameChange,
  onBusinessGstinChange,
  onBusinessAddressChange,
  onBusinessCityChange,
  onBusinessStateChange,
  onBusinessPincodeChange,
}: BusinessAddressProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
        <Building2 className="h-4 w-4" />
        From (Seller Details)
      </div>
      <div className="space-y-3">
        <div className="space-y-1.5">
          <Label className="text-xs">Business Name</Label>
          <Input
            value={businessName}
            onChange={(e) => onBusinessNameChange(e.target.value)}
            placeholder="Your Business Name"
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">GSTIN</Label>
          <Input
            value={businessGstin}
            onChange={(e) => onBusinessGstinChange(e.target.value)}
            placeholder="27AAAAA0000A1Z5"
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Address</Label>
          <Input
            value={businessAddress}
            onChange={(e) => onBusinessAddressChange(e.target.value)}
            placeholder="Street address"
          />
        </div>
        <div className="grid grid-cols-3 gap-2">
          <div className="space-y-1.5">
            <Label className="text-xs">City</Label>
            <Input
              value={businessCity}
              onChange={(e) => onBusinessCityChange(e.target.value)}
              placeholder="City"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">State</Label>
            <Input
              value={businessState}
              onChange={(e) => onBusinessStateChange(e.target.value)}
              placeholder="State"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Pincode</Label>
            <Input
              value={businessPincode}
              onChange={(e) => onBusinessPincodeChange(e.target.value)}
              placeholder="000000"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export function CustomerAddress({
  customers,
  selectedPartyId,
  selectedCustomer,
  customerGstin,
  onCustomerSelect,
  onCustomerGstinChange,
  buyerName,
  buyerAddress,
  buyerCity,
  buyerState,
  onBuyerNameChange,
  onBuyerAddressChange,
  onBuyerCityChange,
  onBuyerStateChange,
}: CustomerAddressProps) {
  // Use manual input mode if handlers are provided
  const isManualMode = !!onBuyerNameChange;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
        <Building2 className="h-4 w-4" />
        To (Buyer Details)
      </div>
      <div className="space-y-3">
        {isManualMode ? (
          <>
            <div className="space-y-1.5">
              <Label className="text-xs">Customer Name *</Label>
              <Input
                value={buyerName || ''}
                onChange={(e) => onBuyerNameChange?.(e.target.value)}
                placeholder="Customer name"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">GSTIN</Label>
              <Input
                value={customerGstin}
                onChange={(e) => onCustomerGstinChange(e.target.value)}
                placeholder="27BBBBB1111B1Z5"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Address</Label>
              <Input
                value={buyerAddress || ''}
                onChange={(e) => onBuyerAddressChange?.(e.target.value)}
                placeholder="Street address"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1.5">
                <Label className="text-xs">City</Label>
                <Input
                  value={buyerCity || ''}
                  onChange={(e) => onBuyerCityChange?.(e.target.value)}
                  placeholder="City"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">State</Label>
                <Input
                  value={buyerState || ''}
                  onChange={(e) => onBuyerStateChange?.(e.target.value)}
                  placeholder="State"
                />
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="space-y-1.5">
              <Label className="text-xs">Customer *</Label>
              <Select value={selectedPartyId} onValueChange={onCustomerSelect}>
                <SelectTrigger>
                  <SelectValue placeholder="Select customer" />
                </SelectTrigger>
                <SelectContent>
                  {customers.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name} - {c.phone}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {selectedCustomer && (
              <>
                <div className="space-y-1.5">
                  <Label className="text-xs">GSTIN</Label>
                  <Input
                    value={customerGstin || selectedCustomer.gstin || ""}
                    onChange={(e) => onCustomerGstinChange(e.target.value)}
                    placeholder="Customer GSTIN (if available)"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Address</Label>
                  <Input
                    value={selectedCustomer.address || ""}
                    disabled
                    placeholder="Customer address"
                  />
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div className="space-y-1.5">
                    <Label className="text-xs">City</Label>
                    <Input value={selectedCustomer.city || ""} disabled />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">State</Label>
                    <Input value={selectedCustomer.state || ""} disabled />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Pincode</Label>
                    <Input value={selectedCustomer.pincode || ""} disabled />
                  </div>
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export function AddressSection({
  businessProps,
  customerProps,
  buyerName,
  buyerAddress,
  buyerCity,
  buyerState,
  onBuyerNameChange,
  onBuyerAddressChange,
  onBuyerCityChange,
  onBuyerStateChange,
}: {
  businessProps: BusinessAddressProps;
  customerProps: CustomerAddressProps;
  buyerName?: string;
  buyerAddress?: string;
  buyerCity?: string;
  buyerState?: string;
  onBuyerNameChange?: (value: string) => void;
  onBuyerAddressChange?: (value: string) => void;
  onBuyerCityChange?: (value: string) => void;
  onBuyerStateChange?: (value: string) => void;
}) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="grid gap-6 md:grid-cols-2">
          <BusinessAddress {...businessProps} />
          <CustomerAddress 
            {...customerProps} 
            buyerName={buyerName}
            buyerAddress={buyerAddress}
            buyerCity={buyerCity}
            buyerState={buyerState}
            onBuyerNameChange={onBuyerNameChange}
            onBuyerAddressChange={onBuyerAddressChange}
            onBuyerCityChange={onBuyerCityChange}
            onBuyerStateChange={onBuyerStateChange}
          />
        </div>
      </CardContent>
    </Card>
  );
}
