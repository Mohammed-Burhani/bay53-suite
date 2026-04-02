"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Search, Plus, Eye, Trash2, Download, Printer, FileText } from "lucide-react";
import { useCertificates, useDeleteCertificate } from "@/lib/hooks/useCertificates";
import { useSession } from "@/lib/hooks/useAuth";
import { ManualCertificateForm } from "@/components/certificates/ManualCertificateForm";
import { Certificate } from "@/lib/services/certificates.service";
import { generateCertificatePDF, printCertificate } from "@/lib/certificate-generator";

export default function CertificatesListingPage() {
  const session = useSession();
  const organizationId = String(session?.company?.id || "default-org");
  
  const [searchTerm, setSearchTerm] = useState("");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedCertificate, setSelectedCertificate] = useState<Certificate | null>(null);

  const { data: certificates = [], isLoading } = useCertificates(organizationId);
  const deleteMutation = useDeleteCertificate();

  const filteredCertificates = certificates.filter((cert: Certificate) =>
    cert.certificate_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cert.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cert.invoice_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cert.instrument_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this certificate?")) {
      await deleteMutation.mutateAsync(id);
    }
  };

  const handleView = (certificate: Certificate) => {
    setSelectedCertificate(certificate);
  };

  const handleGeneratePDF = (certificate: Certificate) => {
    generateCertificatePDF(certificate);
  };

  const handlePrint = (certificate: Certificate) => {
    printCertificate(certificate);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Certificates</h1>
          <p className="text-muted-foreground">
            Manage calibration certificates independently
          </p>
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          New Certificate
        </Button>
      </div>

      <Card className="py-4">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>All Certificates</span>
            <div className="relative w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search certificates..."
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
              Loading certificates...
            </div>
          ) : filteredCertificates.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No certificates found
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Certificate No.</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Invoice No.</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Instrument</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCertificates.map((certificate: Certificate) => (
                  <TableRow key={certificate.id}>
                    <TableCell className="font-medium">
                      {certificate.certificate_number}
                    </TableCell>
                    <TableCell>
                      {new Date(certificate.certificate_date).toLocaleDateString()}
                    </TableCell>
                    <TableCell>{certificate.invoice_number}</TableCell>
                    <TableCell>{certificate.customer_name}</TableCell>
                    <TableCell>{certificate.instrument_name}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          certificate.status === "issued"
                            ? "default"
                            : certificate.status === "cancelled"
                            ? "destructive"
                            : "secondary"
                        }
                      >
                        {certificate.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleView(certificate)}
                          title="View Details"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleGeneratePDF(certificate)}
                          title="Download PDF"
                        >
                          <FileText className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handlePrint(certificate)}
                          title="Print Certificate"
                        >
                          <Printer className="h-4 w-4" />
                        </Button>
                        {certificate.pdf_url && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => window.open(certificate.pdf_url, '_blank')}
                            title="View Stored PDF"
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDelete(certificate.id)}
                          title="Delete Certificate"
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Create Certificate Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Certificate</DialogTitle>
            <DialogDescription>
              Manually enter certificate details for a single invoice item
            </DialogDescription>
          </DialogHeader>
          <ManualCertificateForm
            organizationId={organizationId}
            onSuccess={() => setIsCreateDialogOpen(false)}
            onCancel={() => setIsCreateDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {/* View Certificate Dialog */}
      <Dialog open={!!selectedCertificate} onOpenChange={() => setSelectedCertificate(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Certificate Details</DialogTitle>
          </DialogHeader>
          {selectedCertificate && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Certificate Number</label>
                  <p className="text-sm text-muted-foreground">{selectedCertificate.certificate_number}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Date</label>
                  <p className="text-sm text-muted-foreground">
                    {new Date(selectedCertificate.certificate_date).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium">Invoice Number</label>
                  <p className="text-sm text-muted-foreground">{selectedCertificate.invoice_number}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Customer Name</label>
                  <p className="text-sm text-muted-foreground">{selectedCertificate.customer_name}</p>
                </div>
                <div className="col-span-2">
                  <label className="text-sm font-medium">Customer Address</label>
                  <p className="text-sm text-muted-foreground">{selectedCertificate.customer_address || "N/A"}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Instrument Name</label>
                  <p className="text-sm text-muted-foreground">{selectedCertificate.instrument_name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Make/Serial</label>
                  <p className="text-sm text-muted-foreground">{selectedCertificate.make_serial || "N/A"}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Range</label>
                  <p className="text-sm text-muted-foreground">{selectedCertificate.range || "N/A"}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Accuracy</label>
                  <p className="text-sm text-muted-foreground">{selectedCertificate.accuracy || "N/A"}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Calibrated By</label>
                  <p className="text-sm text-muted-foreground">{selectedCertificate.calibrated_by || "N/A"}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Approved By</label>
                  <p className="text-sm text-muted-foreground">{selectedCertificate.approved_by || "N/A"}</p>
                </div>
              </div>
              
              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={() => handleGeneratePDF(selectedCertificate)}
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Download PDF
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handlePrint(selectedCertificate)}
                >
                  <Printer className="h-4 w-4 mr-2" />
                  Print
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
