"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { FileText, Printer, Download } from "lucide-react";
import { InvoiceWithItems } from "@/supabase/services/invoice-service";

interface InvoiceDetailDialogProps {
  invoice: InvoiceWithItems | null;
  isLoading: boolean;
  onClose: () => void;
  onPrint: (invoice: InvoiceWithItems) => void;
  onDownload: (invoice: InvoiceWithItems) => void;
  formatCurrency: (amount: number) => string;
}

export function InvoiceDetailDialog({
  invoice,
  isLoading,
  onClose,
  onPrint,
  onDownload,
  formatCurrency,
}: InvoiceDetailDialogProps) {
  return (
    <Dialog open={!!invoice || isLoading} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-xl max-h-[85vh] overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mx-auto"></div>
              <p className="mt-3 text-sm text-muted-foreground">
                Loading invoice...
              </p>
            </div>
          </div>
        ) : invoice ? (
          <>
            <DialogHeader className="space-y-2 pb-2">
              <DialogTitle className="text-xl font-bold">
                Invoice Preview
              </DialogTitle>
              <DialogDescription>
                {invoice.invoice_number}
              </DialogDescription>
            </DialogHeader>
            <InvoiceDetail invoice={invoice} formatCurrency={formatCurrency} />
            <div className="flex gap-2 pt-2 border-t">
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 flex-1"
                onClick={() => onPrint(invoice)}
              >
                <Printer className="h-4 w-4" />
                Print
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 flex-1"
                onClick={() => onDownload(invoice)}
              >
                <Download className="h-4 w-4" />
                Download
              </Button>
            </div>
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

function InvoiceDetail({
  invoice,
  formatCurrency,
}: {
  invoice: InvoiceWithItems;
  formatCurrency: (n: number) => string;
}) {
  return (
    <div className="space-y-4">
      <Card className="border-l-4 border-l-indigo-500 bg-gradient-to-br from-indigo-50/50 to-purple-50/30 dark:from-indigo-950/20 dark:to-purple-950/10">
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1.5 flex-1">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                <h3 className="text-base font-semibold text-foreground">
                  {invoice.buyer_name}
                </h3>
              </div>
              <p className="text-sm text-muted-foreground">
                Date:{" "}
                {new Date(invoice.invoice_date).toLocaleDateString("en-IN", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
              </p>
            </div>
            <Badge
              variant={
                invoice.invoice_status === "tax-invoice"
                  ? "default"
                  : invoice.invoice_status === "ready"
                    ? "secondary"
                    : "outline"
              }
              className="capitalize text-xs"
            >
              {invoice.invoice_status}
            </Badge>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-2">
        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Invoice Items
        </h4>
        <Card>
          <CardContent className="p-0">
            {invoice.items && invoice.items.length > 0 ? (
              <div className="divide-y divide-border">
                {invoice.items.map((item, i) => (
                  <div
                    key={item.id || i}
                    className="p-3 hover:bg-muted/30 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 space-y-1">
                        <p className="text-sm font-medium text-foreground">
                          {item.description}
                        </p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span>
                            Qty:{" "}
                            <span className="text-foreground font-medium">
                              {item.quantity} {item.unit}
                            </span>
                          </span>
                          <span className="text-border">•</span>
                          <span>
                            Rate:{" "}
                            <span className="text-foreground font-medium">
                              {formatCurrency(Number(item.rate))}
                            </span>
                          </span>
                        </div>
                      </div>
                      <p className="text-sm font-semibold text-foreground">
                        {formatCurrency(Number(item.amount))}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-6 text-center text-sm text-muted-foreground">
                No items in this invoice
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="border-t-2 border-t-indigo-500">
        <CardContent className="p-4 space-y-2.5">
          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Payment Summary
          </h4>

          <div className="space-y-2">
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground">Subtotal</span>
              <span className="font-medium text-foreground">
                {formatCurrency(Number(invoice.subtotal))}
              </span>
            </div>

            {Number(invoice.discount) > 0 && (
              <div className="flex justify-between items-center text-sm">
                <span className="text-emerald-600 dark:text-emerald-400">
                  Discount
                </span>
                <span className="font-medium text-emerald-600 dark:text-emerald-400">
                  -{formatCurrency(Number(invoice.discount))}
                </span>
              </div>
            )}

            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground">GST</span>
              <span className="font-medium text-foreground">
                +{formatCurrency(Number(invoice.total_gst))}
              </span>
            </div>

            <Separator className="my-2" />

            <div className="flex justify-between items-center pt-1">
              <span className="text-base font-bold text-foreground">
                Grand Total
              </span>
              <span className="text-lg font-bold text-indigo-600 dark:text-indigo-400">
                {formatCurrency(Number(invoice.grand_total))}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
