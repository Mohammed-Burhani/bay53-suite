"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Search, ArrowLeft, FileEdit } from "lucide-react";
import { useRouter } from "next/navigation";
import { getInvoices } from "@/lib/store";
import { Invoice } from "@/lib/types";
import { 
  generateCalibrationCertificatePDF, 
  generateCertificateNumber,
  CertificateData 
} from "@/lib/certificate-generator";
import { CertificateForm, CertificateFormData } from "@/components/certificates/CertificateForm";
import { toast } from "sonner";

export default function CalibrationCertificatesPage() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

  const { data: invoices = [], isLoading } = useQuery({
    queryKey: ["invoices", "sale"],
    queryFn: () => getInvoices("sale"),
  });

  const filteredInvoices = invoices.filter((inv: Invoice) =>
    inv.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    inv.partyName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleFormSubmit = async (formData: CertificateFormData) => {
    if (!selectedInvoice) return;

    try {
      const currentDate = new Date().toLocaleDateString("en-GB");
      
      // Convert form data to certificate data
      const certificatesData: CertificateData[] = formData.items.map((item, index) => ({
        certificateNumber: generateCertificateNumber(selectedInvoice.invoiceNumber, index),
        certificateDate: currentDate,
        customerName: formData.customerName,
        customerAddress: formData.customerAddress,
        instrumentName: item.instrumentName,
        makeSerial: item.makeSerial,
        mounting: item.mounting,
        range: item.range,
        accuracy: item.accuracy,
        calibrationDueDate: item.calibrationDueDate,
        testConditions: item.testConditions,
        masterRange: item.masterRange,
        masterCalibrationDue: item.masterCalibrationDue,
        masterCertificateNo: item.masterCertificateNo,
        testResults: item.testResults,
        calibratedBy: item.calibratedBy,
        approvedBy: item.approvedBy,
      }));

      await generateCalibrationCertificatePDF(selectedInvoice.invoiceNumber, certificatesData);
      toast.success(`Certificate generated successfully! (${certificatesData.length} pages)`);
      setSelectedInvoice(null);
    } catch (error) {
      console.error("Error generating certificate:", error);
      toast.error("Failed to generate certificate");
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push("/sales")}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Calibration Certificates</h1>
            <p className="text-muted-foreground">
              Generate calibration certificates for invoiced items
            </p>
          </div>
        </div>
      </div>

      <Card className="py-4">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Select Invoice</span>
            <div className="relative w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by invoice number or customer..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">
              Loading invoices...
            </div>
          ) : filteredInvoices.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No invoices found
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice Number</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Items</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredInvoices.map((invoice: Invoice) => (
                  <TableRow key={invoice.id}>
                    <TableCell className="font-medium">
                      {invoice.invoiceNumber}
                    </TableCell>
                    <TableCell>
                      {new Date(invoice.invoiceDate).toLocaleDateString()}
                    </TableCell>
                    <TableCell>{invoice.partyName}</TableCell>
                    <TableCell>{invoice.items.length} items</TableCell>
                    <TableCell>₹{invoice.grandTotal.toFixed(2)}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          invoice.status === "paid"
                            ? "default"
                            : invoice.status === "partial"
                            ? "secondary"
                            : "destructive"
                        }
                      >
                        {invoice.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        onClick={() => setSelectedInvoice(invoice)}
                      >
                        <FileEdit className="h-4 w-4 mr-2" />
                        Configure & Generate
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!selectedInvoice} onOpenChange={() => setSelectedInvoice(null)}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto py-4">
          <DialogHeader>
            <DialogTitle>Configure Calibration Certificate</DialogTitle>
            <DialogDescription>
              Enter the calibration details for each item in invoice {selectedInvoice?.invoiceNumber}
            </DialogDescription>
          </DialogHeader>
          {selectedInvoice && (
            <CertificateForm
              customerName={selectedInvoice.partyName}
              customerAddress={`${selectedInvoice.partyGstin ? "GSTIN: " + selectedInvoice.partyGstin : ""}`}
              items={selectedInvoice.items}
              onSubmit={handleFormSubmit}
              onCancel={() => setSelectedInvoice(null)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
