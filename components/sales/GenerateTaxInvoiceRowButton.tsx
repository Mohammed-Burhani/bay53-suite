"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { FileText, Loader2, AlertCircle } from "lucide-react";
import { usePendingInvoices, useGenerateTaxInvoiceForSeller } from "@/lib/api-services/invoice.service";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface GenerateTaxInvoiceRowButtonProps {
  sellerName: string;
}

export function GenerateTaxInvoiceRowButton({ sellerName }: GenerateTaxInvoiceRowButtonProps) {
  const [showDialog, setShowDialog] = useState(false);
  const { data: pendingInvoices, isLoading: loadingPending } = usePendingInvoices();
  const generateTaxInvoice = useGenerateTaxInvoiceForSeller();

  const handleGenerate = async () => {
    try {
      const result = await generateTaxInvoice.mutateAsync(sellerName);
      toast.success(`Successfully generated tax invoice ${result.invoice_number}`);
      setShowDialog(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to generate tax invoice");
    }
  };

  // Filter pending invoices for this seller
  const sellerKey = sellerName.trim().toLowerCase();
  const sellerPendingInvoices = (pendingInvoices || []).filter(
    inv => inv.seller_name.trim().toLowerCase() === sellerKey
  );

  const totalAmount = sellerPendingInvoices.reduce((sum, inv) => sum + Number(inv.grand_total), 0);
  const invoiceCount = sellerPendingInvoices.length;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            onClick={() => setShowDialog(true)}
            disabled={loadingPending}
            variant="ghost"
            size="sm"
            className="h-8 gap-1.5 text-purple-700 hover:bg-purple-50 hover:text-purple-800"
          >
            {loadingPending ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <FileText className="h-3.5 w-3.5" />
            )}
            Generate
          </Button>
        </TooltipTrigger>
        <TooltipContent className="max-w-xs">
          <p className="text-xs">
            Generate tax invoice for all pending invoices from {sellerName}
          </p>
        </TooltipContent>
      </Tooltip>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Generate Tax Invoice</DialogTitle>
            <DialogDescription>
              Consolidate pending invoices from {sellerName} into one tax invoice
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {invoiceCount === 0 ? (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  No pending invoices found for {sellerName}.
                </AlertDescription>
              </Alert>
            ) : (
              <>
                <Alert>
                  <FileText className="h-4 w-4" />
                  <AlertDescription>
                    Found {invoiceCount} pending invoice{invoiceCount > 1 ? 's' : ''} from {sellerName}.
                    This will create 1 consolidated tax invoice.
                  </AlertDescription>
                </Alert>

                <div className="border rounded-lg p-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-medium">{sellerName}</p>
                      <p className="text-sm text-muted-foreground">
                        {invoiceCount} invoice{invoiceCount > 1 ? 's' : ''}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">
                        Rs. {totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </p>
                      <p className="text-xs text-muted-foreground">Total Amount</p>
                    </div>
                  </div>
                </div>

                <div className="bg-muted p-4 rounded-lg">
                  <h4 className="font-semibold mb-2">What will happen:</h4>
                  <ul className="text-sm space-y-1 text-muted-foreground">
                    <li>• All {invoiceCount} pending invoice{invoiceCount > 1 ? 's' : ''} will be marked as &ldquo;ready&rdquo;</li>
                    <li>• 1 new tax invoice will be created</li>
                    <li>• The tax invoice will consolidate all deliveries from {sellerName}</li>
                    <li>• Original invoice details will be preserved in the tax invoice items</li>
                  </ul>
                </div>
              </>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleGenerate}
              disabled={invoiceCount === 0 || generateTaxInvoice.isPending}
            >
              {generateTaxInvoice.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <FileText className="h-4 w-4 mr-2" />
                  Generate Tax Invoice
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </TooltipProvider>
  );
}
