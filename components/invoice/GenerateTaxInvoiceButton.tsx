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
import { usePendingInvoices, useGenerateTaxInvoices } from "@/lib/api-services/invoice.service";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";

export function GenerateTaxInvoiceButton() {
  const [showDialog, setShowDialog] = useState(false);
  const { data: pendingInvoices, isLoading: loadingPending } = usePendingInvoices();
  const generateTaxInvoices = useGenerateTaxInvoices();

  const handleGenerate = async () => {
    try {
      const result = await generateTaxInvoices.mutateAsync();
      toast.success(`Successfully generated ${result.length} tax invoice(s)`);
      setShowDialog(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to generate tax invoices");
    }
  };

  // Group pending invoices by buyer
  const invoicesByBuyer = (pendingInvoices || []).reduce((acc, invoice) => {
    const buyerKey = invoice.buyer_name.trim().toLowerCase();
    if (!acc[buyerKey]) {
      acc[buyerKey] = {
        buyer_name: invoice.buyer_name,
        count: 0,
        total: 0,
      };
    }
    acc[buyerKey].count++;
    acc[buyerKey].total += Number(invoice.grand_total);
    return acc;
  }, {} as Record<string, { buyer_name: string; count: number; total: number }>);

  const buyerGroups = Object.values(invoicesByBuyer);
  const totalPending = pendingInvoices?.length || 0;

  return (
    <>
      <Button
        onClick={() => setShowDialog(true)}
        disabled={loadingPending || totalPending === 0}
        className="gap-2"
      >
        {loadingPending ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <FileText className="h-4 w-4" />
        )}
        Generate Tax Invoice
        {totalPending > 0 && (
          <span className="ml-1 px-2 py-0.5 text-xs bg-primary-foreground text-primary rounded-full">
            {totalPending}
          </span>
        )}
      </Button>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Generate Tax Invoices</DialogTitle>
            <DialogDescription>
              Consolidate pending invoices into tax invoices grouped by company
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {totalPending === 0 ? (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  No pending invoices found. All invoices have been processed.
                </AlertDescription>
              </Alert>
            ) : (
              <>
                <Alert>
                  <FileText className="h-4 w-4" />
                  <AlertDescription>
                    Found {totalPending} pending invoice(s) from {buyerGroups.length} company(ies).
                    This will create {buyerGroups.length} consolidated tax invoice(s).
                  </AlertDescription>
                </Alert>

                <div className="border rounded-lg divide-y max-h-96 overflow-y-auto">
                  {buyerGroups.map((group, index) => (
                    <div key={index} className="p-4 flex justify-between items-center">
                      <div>
                        <p className="font-medium">{group.buyer_name}</p>
                        <p className="text-sm text-muted-foreground">
                          {group.count} invoice{group.count > 1 ? 's' : ''}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">
                          Rs. {group.total.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </p>
                        <p className="text-xs text-muted-foreground">Total Amount</p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="bg-muted p-4 rounded-lg">
                  <h4 className="font-semibold mb-2">What will happen:</h4>
                  <ul className="text-sm space-y-1 text-muted-foreground">
                    <li>• All pending invoices will be marked as &ldquo;ready&rdquo;</li>
                    <li>• {buyerGroups.length} new tax invoice(s) will be created</li>
                    <li>• Each tax invoice will consolidate all deliveries for one company</li>
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
              disabled={totalPending === 0 || generateTaxInvoices.isPending}
            >
              {generateTaxInvoices.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <FileText className="h-4 w-4 mr-2" />
                  Generate {buyerGroups.length} Tax Invoice{buyerGroups.length > 1 ? 's' : ''}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
