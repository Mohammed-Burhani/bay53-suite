import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { InvoiceGuide } from "@/components/invoice/InvoiceGuide";
import { GenerateTaxInvoiceButton } from "@/components/invoice/GenerateTaxInvoiceButton";

interface SalesHeaderProps {
  invoiceCount: number;
  onCreateClick: () => void;
}

export function SalesHeader({ invoiceCount, onCreateClick }: SalesHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Sales & Invoices
        </h1>
        <p className="text-sm text-muted-foreground">
          {invoiceCount} sale invoices
        </p>
      </div>
      <div className="flex gap-2 items-end">
        <InvoiceGuide mode="list" />
        <GenerateTaxInvoiceButton />
        <Button onClick={onCreateClick} className="gap-2">
          <Plus className="h-4 w-4" />
          Create Invoice
        </Button>
      </div>
    </div>
  );
}
