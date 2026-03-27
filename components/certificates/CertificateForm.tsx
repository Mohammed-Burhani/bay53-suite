"use client";

import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Trash2 } from "lucide-react";
import { InvoiceItem } from "@/lib/types";
import { toast } from "sonner";

export interface CertificateFormData {
  // Customer Details
  customerName: string;
  customerAddress: string;

  // Instrument Details (per item)
  items: Array<{
    itemIndex: number;
    productName: string;
    instrumentName: string;
    makeSerial: string;
    mounting: string;
    range: string;
    accuracy: string;
    calibrationDueDate: string;
    testConditions: string;

    // Master Instrument
    masterRange: string;
    masterCalibrationDue: string;
    masterCertificateNo: string;

    // Test Results
    testResults: Array<{
      calibratedRange: string;
      masterValue: string;
      instrumentValue: string;
      deviation: string;
    }>;

    // Signatures
    calibratedBy: string;
    approvedBy: string;
  }>;
}

interface CertificateFormProps {
  customerName: string;
  customerAddress: string;
  items: InvoiceItem[];
  onSubmit: (data: CertificateFormData) => void;
  onCancel: () => void;
}

export function CertificateForm({
  customerName,
  customerAddress,
  items,
  onSubmit,
  onCancel,
}: CertificateFormProps) {
  const defaultDates = useMemo(() => {
    const now = new Date();
    const calibrationDue = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000);
    const masterDue = new Date(now.getTime() + 150 * 24 * 60 * 60 * 1000);
    
    return {
      calibrationDueDate: calibrationDue.toISOString().split("T")[0],
      masterCalibrationDue: masterDue.toISOString().split("T")[0],
    };
  }, []);

  const [formData, setFormData] = useState<CertificateFormData>({
    customerName,
    customerAddress,
    items: items.map((item, index) => ({
      itemIndex: index,
      productName: item.productName,
      instrumentName: item.productName,
      makeSerial: "",
      mounting: "Direct bottom & 3/8\" bsp",
      range: `0/${item.quantity} ${item.unit}`,
      accuracy: "+/- 1%",
      calibrationDueDate: defaultDates.calibrationDueDate,
      testConditions: "Temperature: 25 +/- 2°C & Humidity: 40-70%",
      masterRange: `0/${Math.ceil(item.quantity * 2.5)} ${item.unit}`,
      masterCalibrationDue: defaultDates.masterCalibrationDue,
      masterCertificateNo: "",
      testResults: [
        { calibratedRange: "0", masterValue: "0.0", instrumentValue: "0.0", deviation: "0.0" },
      ],
      calibratedBy: "",
      approvedBy: "",
    })),
  });

  const [currentItemIndex, setCurrentItemIndex] = useState(0);
  const currentItem = formData.items[currentItemIndex];

  const updateCurrentItem = (field: string, value: string | Array<{
    calibratedRange: string;
    masterValue: string;
    instrumentValue: string;
    deviation: string;
  }>) => {
    setFormData((prev) => ({
      ...prev,
      items: prev.items.map((item, idx) =>
        idx === currentItemIndex ? { ...item, [field]: value } : item
      ),
    }));
  };

  const addTestResult = () => {
    updateCurrentItem("testResults", [
      ...currentItem.testResults,
      { calibratedRange: "", masterValue: "", instrumentValue: "", deviation: "" },
    ]);
  };

  const removeTestResult = (index: number) => {
    updateCurrentItem(
      "testResults",
      currentItem.testResults.filter((_, idx) => idx !== index)
    );
  };

  const updateTestResult = (index: number, field: string, value: string) => {
    updateCurrentItem(
      "testResults",
      currentItem.testResults.map((result, idx) =>
        idx === index ? { ...result, [field]: value } : result
      )
    );
  };

  const isItemComplete = (item: typeof formData.items[0]): boolean => {
    return !!(
      item.instrumentName.trim() &&
      item.makeSerial.trim() &&
      item.mounting.trim() &&
      item.range.trim() &&
      item.accuracy.trim() &&
      item.calibrationDueDate.trim() &&
      item.testConditions.trim() &&
      item.masterRange.trim() &&
      item.masterCalibrationDue.trim() &&
      item.masterCertificateNo.trim() &&
      item.calibratedBy.trim() &&
      item.approvedBy.trim() &&
      item.testResults.length > 0 &&
      item.testResults.every(
        (result) =>
          result.masterValue.trim() &&
          result.instrumentValue.trim() &&
          result.deviation.trim()
      )
    );
  };

  const validateAllItems = (): { isValid: boolean; errors: string[] } => {
    const errors: string[] = [];

    formData.items.forEach((item, index) => {
      const itemNum = index + 1;

      if (!item.instrumentName.trim()) {
        errors.push(`Item ${itemNum}: Instrument Name is required`);
      }
      if (!item.makeSerial.trim()) {
        errors.push(`Item ${itemNum}: Make & Serial No. is required`);
      }
      if (!item.mounting.trim()) {
        errors.push(`Item ${itemNum}: Mounting & Connection is required`);
      }
      if (!item.range.trim()) {
        errors.push(`Item ${itemNum}: Range is required`);
      }
      if (!item.accuracy.trim()) {
        errors.push(`Item ${itemNum}: Accuracy is required`);
      }
      if (!item.calibrationDueDate.trim()) {
        errors.push(`Item ${itemNum}: Calibration Due Date is required`);
      }
      if (!item.testConditions.trim()) {
        errors.push(`Item ${itemNum}: Test Conditions is required`);
      }
      if (!item.masterRange.trim()) {
        errors.push(`Item ${itemNum}: Master Range is required`);
      }
      if (!item.masterCalibrationDue.trim()) {
        errors.push(`Item ${itemNum}: Master Calibration Due Date is required`);
      }
      if (!item.masterCertificateNo.trim()) {
        errors.push(`Item ${itemNum}: Master Certificate No. is required`);
      }
      if (!item.calibratedBy.trim()) {
        errors.push(`Item ${itemNum}: Calibrated By is required`);
      }
      if (!item.approvedBy.trim()) {
        errors.push(`Item ${itemNum}: Approved By is required`);
      }

      // Validate test results
      if (item.testResults.length === 0) {
        errors.push(`Item ${itemNum}: At least one test result is required`);
      } else {
        item.testResults.forEach((result, resultIndex) => {
          if (!result.calibratedRange.trim() && resultIndex > 0) {
            // First row can have empty calibrated range (typically "0")
            errors.push(`Item ${itemNum}, Test Result Row ${resultIndex + 1}: Calibrated Range is required`);
          }
          if (!result.masterValue.trim()) {
            errors.push(`Item ${itemNum}, Test Result Row ${resultIndex + 1}: Master Value is required`);
          }
          if (!result.instrumentValue.trim()) {
            errors.push(`Item ${itemNum}, Test Result Row ${resultIndex + 1}: Instrument Value is required`);
          }
          if (!result.deviation.trim()) {
            errors.push(`Item ${itemNum}, Test Result Row ${resultIndex + 1}: Deviation is required`);
          }
        });
      }
    });

    return { isValid: errors.length === 0, errors };
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validate customer details
    if (!formData.customerName.trim()) {
      toast.error("Customer Name is required");
      return;
    }

    // Validate all items
    const validation = validateAllItems();
    if (!validation.isValid) {
      toast.error("Please fill in all required fields for all items");
      // Show first few errors
      validation.errors.slice(0, 3).forEach((error) => {
        toast.error(error);
      });
      if (validation.errors.length > 3) {
        toast.error(`...and ${validation.errors.length - 3} more errors`);
      }
      return;
    }

    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Customer Details */}
      <Card className="py-4">
        <CardHeader>
          <CardTitle>Customer Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="customerName">Customer Name</Label>
            <Input
              id="customerName"
              value={formData.customerName}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, customerName: e.target.value }))
              }
              required
            />
          </div>
          <div>
            <Label htmlFor="customerAddress">Customer Address</Label>
            <Textarea
              id="customerAddress"
              value={formData.customerAddress}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, customerAddress: e.target.value }))
              }
              rows={2}
            />
          </div>
        </CardContent>
      </Card>

      {/* Item Selection */}
      {formData.items.length > 1 && (
        <Card className="py-4">
          <CardHeader>
            <CardTitle>Select Item to Configure</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {formData.items.map((item, index) => {
                const isComplete = isItemComplete(item);
                return (
                  <Button
                    key={index}
                    type="button"
                    variant={currentItemIndex === index ? "default" : "outline"}
                    onClick={() => setCurrentItemIndex(index)}
                    className="relative"
                  >
                    <span className="flex items-center gap-2">
                      Item {index + 1}: {item.productName}
                      {isComplete && (
                        <span className="text-green-500">✓</span>
                      )}
                      {!isComplete && currentItemIndex !== index && (
                        <span className="text-yellow-500">⚠</span>
                      )}
                    </span>
                  </Button>
                );
              })}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              ✓ = Complete | ⚠ = Incomplete
            </p>
          </CardContent>
        </Card>
      )}

      {/* Instrument Details */}
      <Card className="py-4">
        <CardHeader>
          <CardTitle>
            Instrument Details - Item {currentItemIndex + 1}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="instrumentName">Instrument Name</Label>
              <Input
                id="instrumentName"
                value={currentItem.instrumentName}
                onChange={(e) => updateCurrentItem("instrumentName", e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="makeSerial">Make & Serial No.</Label>
              <Input
                id="makeSerial"
                value={currentItem.makeSerial}
                onChange={(e) => updateCurrentItem("makeSerial", e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="mounting">Mounting & Connection</Label>
              <Input
                id="mounting"
                value={currentItem.mounting}
                onChange={(e) => updateCurrentItem("mounting", e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="range">Range</Label>
              <Input
                id="range"
                value={currentItem.range}
                onChange={(e) => updateCurrentItem("range", e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="accuracy">Accuracy</Label>
              <Input
                id="accuracy"
                value={currentItem.accuracy}
                onChange={(e) => updateCurrentItem("accuracy", e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="calibrationDueDate">Calibration Due Date</Label>
              <Input
                id="calibrationDueDate"
                type="date"
                value={currentItem.calibrationDueDate}
                onChange={(e) => updateCurrentItem("calibrationDueDate", e.target.value)}
                required
              />
            </div>
          </div>
          <div>
            <Label htmlFor="testConditions">Test Conditions</Label>
            <Input
              id="testConditions"
              value={currentItem.testConditions}
              onChange={(e) => updateCurrentItem("testConditions", e.target.value)}
              required
            />
          </div>
        </CardContent>
      </Card>

      {/* Master Instrument Details */}
      <Card className="py-4">
        <CardHeader>
          <CardTitle>Master Instrument Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label htmlFor="masterRange">Range</Label>
              <Input
                id="masterRange"
                value={currentItem.masterRange}
                onChange={(e) => updateCurrentItem("masterRange", e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="masterCalibrationDue">Calibration Due Date</Label>
              <Input
                id="masterCalibrationDue"
                type="date"
                value={currentItem.masterCalibrationDue}
                onChange={(e) => updateCurrentItem("masterCalibrationDue", e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="masterCertificateNo">Certificate No.</Label>
              <Input
                id="masterCertificateNo"
                value={currentItem.masterCertificateNo}
                onChange={(e) => updateCurrentItem("masterCertificateNo", e.target.value)}
                required
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Test Results */}
      <Card className="py-4">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Test Results</span>
            <Button type="button" size="sm" onClick={addTestResult}>
              <Plus className="h-4 w-4 mr-2" />
              Add Row
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {currentItem.testResults.map((result, index) => (
              <div key={index} className="grid grid-cols-5 gap-2 items-end">
                <div>
                  <Label className="text-xs">Calibrated Range</Label>
                  <Input
                    value={result.calibratedRange}
                    onChange={(e) =>
                      updateTestResult(index, "calibratedRange", e.target.value)
                    }
                    placeholder="0"
                  />
                </div>
                <div>
                  <Label className="text-xs">Master Value</Label>
                  <Input
                    value={result.masterValue}
                    onChange={(e) => updateTestResult(index, "masterValue", e.target.value)}
                    placeholder="0.0"
                  />
                </div>
                <div>
                  <Label className="text-xs">Instrument Value</Label>
                  <Input
                    value={result.instrumentValue}
                    onChange={(e) =>
                      updateTestResult(index, "instrumentValue", e.target.value)
                    }
                    placeholder="0.0"
                  />
                </div>
                <div>
                  <Label className="text-xs">Deviation</Label>
                  <Input
                    value={result.deviation}
                    onChange={(e) => updateTestResult(index, "deviation", e.target.value)}
                    placeholder="0.0"
                  />
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removeTestResult(index)}
                  disabled={currentItem.testResults.length === 1}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Signatures */}
      <Card className="py-4">
        <CardHeader>
          <CardTitle>Signatures</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="calibratedBy">Calibrated By</Label>
              <Input
                id="calibratedBy"
                value={currentItem.calibratedBy}
                onChange={(e) => updateCurrentItem("calibratedBy", e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="approvedBy">Approved By</Label>
              <Input
                id="approvedBy"
                value={currentItem.approvedBy}
                onChange={(e) => updateCurrentItem("approvedBy", e.target.value)}
                required
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex justify-between items-center gap-2">
        <div className="text-sm text-muted-foreground">
          {formData.items.length > 1 && (
            <span>
              {formData.items.filter(isItemComplete).length} of {formData.items.length} items complete
            </span>
          )}
        </div>
        <div className="flex gap-2">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit">Generate Certificate</Button>
        </div>
      </div>
    </form>
  );
}
