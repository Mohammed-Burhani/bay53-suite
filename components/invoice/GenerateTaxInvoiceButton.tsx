"use client";

import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { FileText, Loader2, AlertCircle, X } from "lucide-react";
import { usePendingInvoices, useGenerateTaxInvoices } from "@/lib/api-services/invoice.service";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export function GenerateTaxInvoiceButton() {
  const [showDialog, setShowDialog] = useState(false);
  const [excludedSellers, setExcludedSellers] = useState<Set<string>>(new Set());
  const { data: pendingInvoices, isLoading: loadingPending } = usePendingInvoices();
  const generateTaxInvoices = useGenerateTaxInvoices();

  const handleGenerate = async () => {
    try {
      // Convert excluded sellers Set to array
      const excludedSellersArray = Array.from(excludedSellers);
      const result = await generateTaxInvoices.mutateAsync(excludedSellersArray);
      toast.success(`Successfully generated ${result.length} tax invoice(s)`);
      setShowDialog(false);
      setExcludedSellers(new Set()); // Reset exclusions
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to generate tax invoices");
    }
  };

  const handleRemoveSeller = (sellerKey: string) => {
    setExcludedSellers(prev => {
      const newSet = new Set(prev);
      newSet.add(sellerKey);
      return newSet;
    });
  };

  // Group pending invoices by seller (From field)
  const allInvoicesBySeller = useMemo(() => {
    return (pendingInvoices || []).reduce((acc, invoice) => {
      const sellerKey = invoice.seller_name.trim().toLowerCase();
      if (!acc[sellerKey]) {
        acc[sellerKey] = {
          seller_name: invoice.seller_name,
          count: 0,
          total: 0,
        };
      }
      acc[sellerKey].count++;
      acc[sellerKey].total += Number(invoice.grand_total);
      return acc;
    }, {} as Record<string, { seller_name: string; count: number; total: number }>);
  }, [pendingInvoices]);

  // Filter out excluded sellers
  const sellerGroups = useMemo(() => {
    return Object.entries(allInvoicesBySeller)
      .filter(([key]) => !excludedSellers.has(key))
      .map(([, value]) => value);
  }, [allInvoicesBySeller, excludedSellers]);

  const totalPending = pendingInvoices?.length || 0;
  const canRemoveSellers = sellerGroups.length > 1;

  // Reset exclusions when dialog opens
  const handleDialogChange = (open: boolean) => {
    setShowDialog(open);
    if (open) {
      setExcludedSellers(new Set());
    }
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            onClick={() => setShowDialog(true)}
            disabled={loadingPending || totalPending === 0}
            variant="secondary"
            className="gap-2 border border-indigo-300 text-purple-700 hover:bg-purple-200"
          >
            {loadingPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <FileText className="h-4 w-4" />
            )}
            Generate Tax Invoice
            {totalPending > 0 && (
              <span className="ml-1 px-2 py-0.5 text-xs bg-purple-100 text-purple-700 rounded-full font-medium">
                {totalPending}
              </span>
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent className="max-w-xs">
          <p className="text-xs">
            Consolidate multiple pending invoices from the same sender into one tax invoice. 
            Perfect for courier/logistics businesses.
          </p>
        </TooltipContent>
      </Tooltip>

      <Dialog open={showDialog} onOpenChange={handleDialogChange}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Generate Tax Invoices</DialogTitle>
            <DialogDescription>
              Consolidate pending invoices into tax invoices grouped by sender (From)
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
            ) : sellerGroups.length === 0 ? (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  All sellers have been excluded. Please include at least one seller to generate tax invoices.
                </AlertDescription>
              </Alert>
            ) : (
              <>
                <Alert>
                  <FileText className="h-4 w-4" />
                  <AlertDescription>
                    Found {totalPending} pending invoice(s) from {Object.keys(allInvoicesBySeller).length} sender(s).
                    This will create {sellerGroups.length} consolidated tax invoice(s).
                  </AlertDescription>
                </Alert>

                <div className="border rounded-lg divide-y max-h-96 overflow-y-auto">
                  {sellerGroups.map((group, index) => {
                    const sellerKey = group.seller_name.trim().toLowerCase();
                    return (
                      <div key={index} className="p-4 flex justify-between items-center gap-4">
                        <div className="flex-1">
                          <p className="font-medium">{group.seller_name}</p>
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
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                              onClick={() => handleRemoveSeller(sellerKey)}
                              disabled={!canRemoveSellers}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>{canRemoveSellers ? 'Exclude this seller' : 'Cannot remove the last seller'}</p>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                    );
                  })}
                </div>

                <div className="bg-muted p-4 rounded-lg">
                  <h4 className="font-semibold mb-2">What will happen:</h4>
                  <ul className="text-sm space-y-1 text-muted-foreground">
                    <li>• All pending invoices from selected sellers will be marked as &ldquo;ready&rdquo;</li>
                    <li>• {sellerGroups.length} new tax invoice(s) will be created</li>
                    <li>• Each tax invoice will consolidate all deliveries from the same sender</li>
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
              disabled={totalPending === 0 || sellerGroups.length === 0 || generateTaxInvoices.isPending}
            >
              {generateTaxInvoices.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <FileText className="h-4 w-4 mr-2" />
                  Generate {sellerGroups.length} Tax Invoice{sellerGroups.length > 1 ? 's' : ''}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </TooltipProvider>
  );
}
