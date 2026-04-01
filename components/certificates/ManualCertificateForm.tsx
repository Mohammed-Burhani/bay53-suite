"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { useCreateCertificate } from "@/lib/hooks/useCertificates";

interface ManualCertificateFormProps {
  organizationId: string;
  onSuccess: () => void;
  onCancel: () => void;
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
}: ManualCertificateFormProps) {
  const { register, handleSubmit, formState: { errors } } = useForm<CertificateFormData>();
  const createMutation = useCreateCertificate();
  const [testResults, setTestResults] = useState<Array<{ reading: string; standard: string; error: string }>>([
    { reading: "", standard: "", error: "" }
  ]);

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
      await createMutation.mutateAsync({
        organization_id: organizationId,
        invoice_number: data.invoice_number,
        customer_name: data.customer_name,
        customer_address: data.customer_address,
        instrument_name: data.instrument_name,
        certificate_data: {
          customer_gstin: data.customer_gstin,
          customer_contact: data.customer_contact,
          customer_email: data.customer_email,
          make_serial: data.make_serial,
          mounting: data.mounting,
          range: data.range,
          accuracy: data.accuracy,
          calibration_due_date: data.calibration_due_date,
          test_conditions: data.test_conditions,
          master_range: data.master_range,
          master_calibration_due: data.master_calibration_due,
          master_certificate_no: data.master_certificate_no,
          test_results: testResults.filter(tr => tr.reading || tr.standard || tr.error),
          calibrated_by: data.calibrated_by,
          approved_by: data.approved_by,
          remarks: data.remarks,
        },
      });
      onSuccess();
    } catch (error) {
      console.error("Error creating certificate:", error);
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

            <div>
              <Label htmlFor="customer_name">Customer Name *</Label>
              <Input
                id="customer_name"
                {...register("customer_name", { required: "Customer name is required" })}
                placeholder="Customer name"
              />
              {errors.customer_name && (
                <p className="text-sm text-destructive mt-1">{errors.customer_name.message}</p>
              )}
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
        <Button type="submit" disabled={createMutation.isPending}>
          {createMutation.isPending ? "Creating..." : "Create Certificate"}
        </Button>
      </div>
    </form>
  );
}
