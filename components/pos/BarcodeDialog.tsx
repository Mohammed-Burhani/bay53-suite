"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Printer, Download, Barcode as BarcodeIcon } from "lucide-react";
import { toast } from "sonner";
import { BarcodeLabel } from "./BarcodeLabel";
import {
  printBarcodeLabels,
  downloadBarcodeLabelsPdf,
  type LabelSize,
  type BarcodeLabelData,
} from "@/lib/utils/pos-print";

const LABEL_SIZES: { id: string; label: string; size: LabelSize }[] = [
  { id: "50x25", label: "50 × 25 mm (standard)", size: { widthMm: 50, heightMm: 25 } },
  { id: "40x30", label: "40 × 30 mm", size: { widthMm: 40, heightMm: 30 } },
  { id: "38x25", label: "38 × 25 mm (small)", size: { widthMm: 38, heightMm: 25 } },
  { id: "65x35", label: "65 × 35 mm (large)", size: { widthMm: 65, heightMm: 35 } },
  { id: "100x50", label: "100 × 50 mm (shelf)", size: { widthMm: 100, heightMm: 50 } },
];

export interface BarcodeDialogProduct {
  name: string;
  barcode?: string | null;
  sku?: string;
  price?: number;
}

interface BarcodeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: BarcodeDialogProduct | null;
  /** Formats a number into a display price string (e.g. ₹599.00). */
  formatPrice?: (n: number) => string;
}

export function BarcodeDialog({ open, onOpenChange, product, formatPrice }: BarcodeDialogProps) {
  const [quantity, setQuantity] = useState(1);
  const [sizeId, setSizeId] = useState("50x25");
  const [downloading, setDownloading] = useState(false);

  const barcode = (product?.barcode || "").toString();
  const hasBarcode = barcode.trim().length > 0;
  const size = LABEL_SIZES.find((s) => s.id === sizeId)?.size ?? LABEL_SIZES[0].size;
  const priceText =
    product && typeof product.price === "number" && formatPrice ? formatPrice(product.price) : undefined;

  const labelData: BarcodeLabelData | null = product
    ? {
        barcode,
        productName: product.name,
        sku: product.sku,
        price: typeof product.price === "number" ? product.price : undefined,
        priceLabel: "MRP",
      }
    : null;

  const copies = Math.max(1, Math.min(500, Math.floor(quantity) || 1));

  const handlePrint = () => {
    if (!labelData || !hasBarcode) return;
    const ok = printBarcodeLabels(labelData, copies, size);
    if (!ok) {
      toast.error("Couldn't open the print window. Please allow pop-ups for this site and try again.");
    }
  };

  const handleDownload = async () => {
    if (!labelData || !hasBarcode) return;
    setDownloading(true);
    try {
      await downloadBarcodeLabelsPdf(labelData, copies, size);
      toast.success(`Downloaded ${copies} label${copies > 1 ? "s" : ""} (PDF).`);
    } catch (e) {
      toast.error(`Could not generate PDF: ${(e as Error).message}`);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BarcodeIcon className="h-5 w-5" />
            Print Barcode
          </DialogTitle>
          <DialogDescription>
            {product ? product.name : "Product"} — print or download barcode labels at a standard label size.
          </DialogDescription>
        </DialogHeader>

        {!hasBarcode ? (
          <div className="rounded-md border border-dashed bg-muted/30 p-6 text-center text-sm text-muted-foreground">
            This product has no barcode yet. Edit the product and generate or enter a barcode first.
          </div>
        ) : (
          <div className="space-y-4">
            {/* Preview */}
            <div className="flex justify-center rounded-lg border bg-white p-3">
              <BarcodeLabel
                value={barcode}
                productName={product?.name}
                priceText={priceText}
                showPrice={!!priceText}
                barHeight={56}
                moduleWidth={2}
              />
            </div>

            {/* Controls */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="label-qty">Quantity</Label>
                <Input
                  id="label-qty"
                  type="number"
                  min={1}
                  max={500}
                  value={quantity}
                  onChange={(e) => setQuantity(Number(e.target.value))}
                />
              </div>
              <div>
                <Label htmlFor="label-size">Label size</Label>
                <Select value={sizeId} onValueChange={setSizeId}>
                  <SelectTrigger id="label-size">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {LABEL_SIZES.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <p className="text-xs text-muted-foreground">
              Labels print at the selected size (not A4). Use your label/thermal printer, or &ldquo;Save as PDF&rdquo;
              in the print dialog.
            </p>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          <Button variant="outline" onClick={handleDownload} disabled={!hasBarcode || downloading} className="gap-2">
            <Download className="h-4 w-4" />
            {downloading ? "Preparing…" : "Download PDF"}
          </Button>
          <Button onClick={handlePrint} disabled={!hasBarcode} className="gap-2">
            <Printer className="h-4 w-4" />
            Print
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
