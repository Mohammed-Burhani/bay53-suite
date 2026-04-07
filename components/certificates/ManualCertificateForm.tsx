"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { useCreateCertificate, useUpdateCertificate } from "@/lib/hooks/useCertificates";
import type { Certificate } from "@/lib/services/certificates.service";
import { Command, CommandEmpty, CommandGroup, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useLedgersByGroup } from "@/lib/hooks/useReports";
import type { Ledger } from "@/lib/types/reports.types";
import { Search, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface ManualCertificateFormProps {
  organizationId: string;
  onSuccess: () => void;
  onCancel: () => void;
  initialData?: Certificate;
  mode?: 'create' | 'edit' | 'duplicate';
}

interface CertificateFormData {
  invoice_number: string;
  customer_name: string;
  customer_address: string;
  customer_gstin?: string;
  customer_contact?: string;
  customer_email?: string;
  instrument_name: string;
  make_serial?: string;
  mounting?: string;
  range?: string;
  accuracy?: string;
  calibration_due_date?: string;
  test_conditions?: string;
  master_range?: string;
  master_calibration_due?: string;
  master_certificate_no?: string;
  calibrated_by?: string;
  approved_by?: string;
  remarks?: string;
}

export function ManualCertificateForm({
  organizationId,
  onSuccess,
  onCancel,
  initialData,
  mode = 'create',
}: ManualCertificateFormProps) {
  // Calculate default date (1 year from today minus 1 day)
  const getDefaultDueDate = () => {
    const today = new Date();
    const nextYear = new Date(today);
    nextYear.setFullYear(nextYear.getFullYear() + 1);
    nextYear.setDate(nextYear.getDate() - 1); // Subtract 1 day
    return nextYear.toISOString().split('T')[0];
  };

  const defaultDueDate = getDefaultDueDate();

  const { register, handleSubmit, formState: { errors }, setValue } = useForm<CertificateFormData>({
    defaultValues: initialData ? {
      invoice_number: initialData.invoice_number,
      customer_name: initialData.customer_name,
      customer_address: initialData.customer_address || '',
      customer_gstin: initialData.customer_gstin || '',
      customer_contact: initialData.customer_contact || '',
      customer_email: initialData.customer_email || '',
      instrument_name: initialData.instrument_name,
      make_serial: initialData.make_serial || '',
      mounting: initialData.mounting || '',
      range: initialData.range || '',
      accuracy: initialData.accuracy || '',
      calibration_due_date: initialData.calibration_due_date || defaultDueDate,
      test_conditions: initialData.test_conditions || '',
      master_range: initialData.master_range || '',
      master_calibration_due: initialData.master_calibration_due || defaultDueDate,
      master_certificate_no: initialData.master_certificate_no || '',
      calibrated_by: initialData.calibrated_by || '',
      approved_by: initialData.approved_by || '',
      remarks: initialData.remarks || '',
    } : {
      calibration_due_date: defaultDueDate,
      master_calibration_due: defaultDueDate,
    },
  });
  const createMutation = useCreateCertificate();
  const updateMutation = useUpdateCertificate();
  const [testResults, setTestResults] = useState<Array<{ reading: string; standard: string; error: string }>>(
    initialData?.test_results || [{ reading: "", standard: "", error: "" }]
  );
  
  const [customerSearchOpen, setCustomerSearchOpen] = useState(false);
  const [customerSearchTerm, setCustomerSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  
  // Debounce search term (500ms delay)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(customerSearchTerm);
    }, 500);

    return () => clearTimeout(timer);
  }, [customerSearchTerm]);
  
  // Fetch all customers (group 16 = Sundry Creditors, 17 = Sundry Debtors)
  const { data: allCustomers = [], isLoading: customersLoading } = useLedgersByGroup([16, 17]);
  
  // Filter customers on frontend based on debounced search term
  const filteredCustomers = debouncedSearchTerm.length >= 2
    ? allCustomers.filter(customer => 
        customer.name.toLowerCase().includes(debouncedSearchTerm.toLowerCase())
      )
    : [];

  const handleCustomerSelect = (customer: Ledger) => {
    setValue("customer_name", customer.name);
    setValue("customer_address", customer.address || "");
    setValue("customer_gstin", customer.gstNo || "");
    setValue("customer_contact", customer.contactInfo || "");
    setCustomerSearchOpen(false);
    setCustomerSearchTerm("");
    toast.success(`Customer "${customer.name}" selected`);
  };

  const addTestResult = () => {
    setTestResults([...testResults, { reading: "", standard: "", error: "" }]);
  };

  const removeTestResult = (index: number) => {
    setTestResults(testResults.filter((_, i) => i !== index));
  };

  const updateTestResult = (index: number, field: string, value: string) => {
    const updated = [...testResults];
    updated[index] = { ...updated[index], [field]: value };
    setTestResults(updated);
  };

  const onSubmit = async (data: CertificateFormData) => {
    try {
      const certificatePayload = {
        organization_id: organizationId,
        invoice_number: data.invoice_number,
        customer_name: data.customer_name,
        customer_address: data.customer_address,
        instrument_name: data.instrument_name,
        make_serial: data.make_serial,
        range: data.range,
        accuracy: data.accuracy,
        calibrated_by: data.calibrated_by,
        approved_by: data.approved_by,
        certificate_data: {
          customer_gstin: data.customer_gstin,
          customer_contact: data.customer_contact,
          customer_email: data.customer_email,
          mounting: data.mounting,
          calibration_due_date: data.calibration_due_date,
          test_conditions: data.test_conditions,
          master_range: data.master_range,
          master_calibration_due: data.master_calibration_due,
          master_certificate_no: data.master_certificate_no,
          test_results: testResults.filter(tr => tr.reading || tr.standard || tr.error),
          remarks: data.remarks,
        },
      };

      if (mode === 'edit' && initialData) {
        await updateMutation.mutateAsync({
          id: initialData.id,
          updates: certificatePayload,
        });
      } else {
        await createMutation.mutateAsync(certificatePayload);
      }
      onSuccess();
    } catch (error) {
      console.error(`Error ${mode === 'edit' ? 'updating' : 'creating'} certificate:`, error);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Invoice & Customer Details */}
      <Card className="py-4">
        <CardContent className="pt-6 space-y-4">
          <h3 className="font-semibold text-lg">Invoice & Customer Details</h3>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="invoice_number">Invoice Number *</Label>
              <Input
                id="invoice_number"
                {...register("invoice_number", { required: "Invoice number is required" })}
                placeholder="INV-001"
              />
              {errors.invoice_number && (
                <p className="text-sm text-destructive mt-1">{errors.invoice_number.message}</p>
              )}
            </div>

            <div className="col-span-2">
              <Label htmlFor="customer_name">Customer Name *</Label>
              <Popover open={customerSearchOpen} onOpenChange={setCustomerSearchOpen}>
                <PopoverTrigger asChild>
                  <div className="relative">
                    <Input
                      id="customer_name"
                      {...register("customer_name", { required: "Customer name is required" })}
                      onChange={(e) => {
                        const value = e.target.value;
                        setCustomerSearchTerm(value);
                        setValue("customer_name", value);
                        // Open popover when user types
                        if (value.length >= 2) {
                          setCustomerSearchOpen(true);
                        }
                      }}
                      placeholder="Type customer name to search..."
                      className="pr-10"
                    />
                    <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none">
                      {customersLoading && debouncedSearchTerm.length >= 2 ? (
                        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                      ) : (
                        <Search className="h-4 w-4 text-muted-foreground" />
                      )}
                    </div>
                  </div>
                </PopoverTrigger>
                <PopoverContent className="w-[500px] p-0" align="start" onOpenAutoFocus={(e) => e.preventDefault()}>
                  <Command shouldFilter={false}>
                    <CommandList>
                      {customerSearchTerm.length < 2 ? (
                        <div className="py-6 text-center text-sm text-muted-foreground">
                          Type at least 2 characters to search
                        </div>
                      ) : customersLoading || customerSearchTerm !== debouncedSearchTerm ? (
                        <div className="py-6 text-center text-sm text-muted-foreground">
                          <Loader2 className="h-4 w-4 animate-spin mx-auto mb-2" />
                          Searching...
                        </div>
                      ) : filteredCustomers.length === 0 ? (
                        <CommandEmpty>No customers found.</CommandEmpty>
                      ) : (
                        <div className="max-h-[300px] overflow-auto">
                          <CommandGroup>
                            {filteredCustomers.map((customer) => (
                              <CommandItem
                                key={customer.ledger_id}
                                value={`${customer.name} ${customer.ledger_id}`}
                                onSelect={() => handleCustomerSelect(customer)}
                              >
                                <div className="flex-1">
                                  <div className="font-medium">{customer.name}</div>
                                  <div className="text-xs text-muted-foreground">
                                    {customer.address && customer.address.substring(0, 80)}
                                    {customer.address && customer.address.length > 80 && "..."}
                                  </div>
                                  {customer.gstNo && (
                                    <div className="text-xs text-muted-foreground">
                                      GST: {customer.gstNo}
                                    </div>
                                  )}
                                </div>
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </div>
                      )}
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
              {errors.customer_name && (
                <p className="text-sm text-destructive mt-1">{errors.customer_name.message}</p>
              )}
              <p className="text-xs text-muted-foreground mt-1">
                Start typing to search and autofill customer details
              </p>
            </div>

            <div className="col-span-2">
              <Label htmlFor="customer_address">Customer Address *</Label>
              <Textarea
                id="customer_address"
                {...register("customer_address", { required: "Customer address is required" })}
                placeholder="Full address"
                rows={2}
              />
              {errors.customer_address && (
                <p className="text-sm text-destructive mt-1">{errors.customer_address.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="customer_gstin">GSTIN</Label>
              <Input
                id="customer_gstin"
                {...register("customer_gstin")}
                placeholder="22AAAAA0000A1Z5"
              />
            </div>

            <div>
              <Label htmlFor="customer_contact">Contact</Label>
              <Input
                id="customer_contact"
                {...register("customer_contact")}
                placeholder="+91 9876543210"
              />
            </div>

            <div className="col-span-2">
              <Label htmlFor="customer_email">Email</Label>
              <Input
                id="customer_email"
                type="email"
                {...register("customer_email")}
                placeholder="customer@example.com"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Instrument Details */}
      <Card className="py-4">
        <CardContent className="pt-6 space-y-4">
          <h3 className="font-semibold text-lg">Instrument Details</h3>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Label htmlFor="instrument_name">Instrument Name *</Label>
              <Input
                id="instrument_name"
                {...register("instrument_name", { required: "Instrument name is required" })}
                placeholder="Digital Pressure Gauge"
              />
              {errors.instrument_name && (
                <p className="text-sm text-destructive mt-1">{errors.instrument_name.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="make_serial">Make/Serial No.</Label>
              <Input
                id="make_serial"
                {...register("make_serial")}
                placeholder="ABC-12345"
              />
            </div>

            <div>
              <Label htmlFor="mounting">Mounting</Label>
              <Input
                id="mounting"
                {...register("mounting")}
                placeholder="Wall mounted"
              />
            </div>

            <div>
              <Label htmlFor="range">Range</Label>
              <Input
                id="range"
                {...register("range")}
                placeholder="0-100 PSI"
              />
            </div>

            <div>
              <Label htmlFor="accuracy">Accuracy</Label>
              <Input
                id="accuracy"
                {...register("accuracy")}
                placeholder="±0.5%"
              />
            </div>

            <div>
              <Label htmlFor="calibration_due_date">Calibration Due Date</Label>
              <Input
                id="calibration_due_date"
                type="date"
                {...register("calibration_due_date")}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Test Conditions & Master Details */}
      <Card className="py-4">
        <CardContent className="pt-6 space-y-4">
          <h3 className="font-semibold text-lg">Test Conditions & Master Details</h3>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Label htmlFor="test_conditions">Test Conditions</Label>
              <Textarea
                id="test_conditions"
                {...register("test_conditions")}
                placeholder="Temperature: 25°C, Humidity: 60%"
                rows={2}
              />
            </div>

            <div>
              <Label htmlFor="master_range">Master Range</Label>
              <Input
                id="master_range"
                {...register("master_range")}
                placeholder="0-150 PSI"
              />
            </div>

            <div>
              <Label htmlFor="master_calibration_due">Master Calibration Due</Label>
              <Input
                id="master_calibration_due"
                type="date"
                {...register("master_calibration_due")}
              />
            </div>

            <div className="col-span-2">
              <Label htmlFor="master_certificate_no">Master Certificate No.</Label>
              <Input
                id="master_certificate_no"
                {...register("master_certificate_no")}
                placeholder="MAST-2024-001"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Test Results */}
      <Card className="py-4">
        <CardContent className="pt-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-lg">Test Results</h3>
            <Button type="button" variant="outline" size="sm" onClick={addTestResult}>
              Add Row
            </Button>
          </div>
          
          <div className="space-y-2">
            {testResults.map((result, index) => (
              <div key={index} className="grid grid-cols-4 gap-2 items-end">
                <div>
                  <Label>Reading</Label>
                  <Input
                    value={result.reading}
                    onChange={(e) => updateTestResult(index, "reading", e.target.value)}
                    placeholder="50.2"
                  />
                </div>
                <div>
                  <Label>Standard</Label>
                  <Input
                    value={result.standard}
                    onChange={(e) => updateTestResult(index, "standard", e.target.value)}
                    placeholder="50.0"
                  />
                </div>
                <div>
                  <Label>Error</Label>
                  <Input
                    value={result.error}
                    onChange={(e) => updateTestResult(index, "error", e.target.value)}
                    placeholder="+0.2"
                  />
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeTestResult(index)}
                  disabled={testResults.length === 1}
                >
                  Remove
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Signatures & Remarks */}
      <Card className="py-4">
        <CardContent className="pt-6 space-y-4">
          <h3 className="font-semibold text-lg">Signatures & Remarks</h3>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="calibrated_by">Calibrated By</Label>
              <Input
                id="calibrated_by"
                {...register("calibrated_by")}
                placeholder="Technician name"
              />
            </div>

            <div>
              <Label htmlFor="approved_by">Approved By</Label>
              <Input
                id="approved_by"
                {...register("approved_by")}
                placeholder="Manager name"
              />
            </div>

            <div className="col-span-2">
              <Label htmlFor="remarks">Remarks</Label>
              <Textarea
                id="remarks"
                {...register("remarks")}
                placeholder="Additional notes"
                rows={3}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
          {mode === 'edit' 
            ? (updateMutation.isPending ? "Updating..." : "Update Certificate")
            : (createMutation.isPending ? "Creating..." : "Create Certificate")
          }
        </Button>
      </div>
    </form>
  );
}
