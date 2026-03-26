"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Invoice } from "@/lib/types";
import { Badge } from "@/components/ui/badge";

interface CertificatePreviewProps {
  invoice: Invoice;
}

export function CertificatePreview({ invoice }: CertificatePreviewProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Certificate Preview</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground">Invoice Number</p>
            <p className="font-medium">{invoice.invoiceNumber}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Customer</p>
            <p className="font-medium">{invoice.partyName}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Date</p>
            <p className="font-medium">
              {new Date(invoice.invoiceDate).toLocaleDateString()}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground">Total Items</p>
            <p className="font-medium">{invoice.items.length}</p>
          </div>
        </div>

        <div className="border-t pt-4">
          <p className="text-sm font-medium mb-2">Items to be Certified:</p>
          <div className="space-y-2">
            {invoice.items.map((item, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-2 bg-muted/50 rounded-md"
              >
                <div className="flex-1">
                  <p className="font-medium text-sm">{item.productName}</p>
                  <p className="text-xs text-muted-foreground">
                    Qty: {item.quantity} {item.unit}
                  </p>
                </div>
                <Badge variant="outline">Page {index + 1}</Badge>
              </div>
            ))}
          </div>
        </div>

        <div className="border-t pt-4 text-xs text-muted-foreground">
          <p>
            ℹ️ A separate calibration certificate will be generated for each item.
          </p>
          <p className="mt-1">
            All certificates will be combined into a single PDF file.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
