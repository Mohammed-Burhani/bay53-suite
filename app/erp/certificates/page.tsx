"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Search, Plus, Trash2, Download, Printer, FileText, Edit, Copy } from "lucide-react";
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
  const [dialogMode, setDialogMode] = useState<'create' | 'edit' | 'duplicate'>('create');

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

  const handleEdit = (certificate: Certificate) => {
    setSelectedCertificate(certificate);
    setDialogMode('edit');
    setIsCreateDialogOpen(true);
  };

  const handleDuplicate = (certificate: Certificate) => {
    setSelectedCertificate(certificate);
    setDialogMode('duplicate');
    setIsCreateDialogOpen(true);
  };

  const handleCreateNew = () => {
    setSelectedCertificate(null);
    setDialogMode('create');
    setIsCreateDialogOpen(true);
  };

  const handleDialogClose = () => {
    setIsCreateDialogOpen(false);
    setSelectedCertificate(null);
    setDialogMode('create');
  };

  const handleGeneratePDF = async (certificate: Certificate) => {
    await generateCertificatePDF(certificate);
  };

  const handlePrint = async (certificate: Certificate) => {
    await printCertificate(certificate);
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
        <Button onClick={handleCreateNew}>
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
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDuplicate(certificate)}
                          title="Duplicate Certificate"
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleEdit(certificate)}
                          title="Edit Certificate"
                        >
                          <Edit className="h-4 w-4" />
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

      {/* Create/Edit/Duplicate Certificate Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={handleDialogClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {dialogMode === 'edit' 
                ? 'Edit Certificate' 
                : dialogMode === 'duplicate'
                ? 'Duplicate Certificate'
                : 'Create New Certificate'
              }
            </DialogTitle>
            <DialogDescription>
              {dialogMode === 'edit'
                ? 'Update certificate details'
                : dialogMode === 'duplicate'
                ? 'Create a new certificate based on existing data'
                : 'Manually enter certificate details for a single invoice item'
              }
            </DialogDescription>
          </DialogHeader>
          <ManualCertificateForm
            organizationId={organizationId}
            onSuccess={handleDialogClose}
            onCancel={handleDialogClose}
            initialData={selectedCertificate || undefined}
            mode={dialogMode}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
