"use client";

import { useRouter } from "next/navigation";
import { useCreateInvoice, useNextInvoiceNumber } from "@/lib/api-services/invoice.service";
import { InvoiceFormLayout } from "@/components/invoice/InvoiceFormLayout";
import { Button } from "@/components/ui/button";
import { ArrowLeft, FileText } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Invoice, InvoiceItem } from "@/supabase/services/invoice-service";

export default function CreateSalesInvoicePage() {
  const router = useRouter();
  const createInvoice = useCreateInvoice();
  const { data: nextNumber, isLoading: loadingNumber } = useNextInvoiceNumber('INV', new Date().getFullYear());

  interface InvoiceFormValues extends Partial<Invoice> {
    items: InvoiceItem[];
  }

  const initialValues: InvoiceFormValues = {
    invoice_number: nextNumber || '',
    tax_invoice_number: '',
    type: 'sale',
    status: 'draft',
    invoice_date: new Date().toISOString().split('T')[0],
    
    seller_name: '',
    seller_gstin: '',
    seller_address: '',
    seller_city: '',
    seller_state: '',
    seller_pincode: '',
    seller_phone: '',
    seller_email: '',
    
    buyer_name: '',
    buyer_gstin: '',
    buyer_address: '',
    buyer_city: '',
    buyer_state: '',
    buyer_pincode: '',
    buyer_phone: '',
    buyer_email: '',
    
    subtotal: 0,
    discount: 0,
    taxable_amount: 0,
    cgst: 0,
    sgst: 0,
    igst: 0,
    total_gst: 0,
    grand_total: 0,
    amount_paid: 0,
    payment_mode: 'cash',
    
    notes: '',
    terms_conditions: '',
    
    items: [
      {
        item_order: 1,
        description: '',
        hsn_sac_code: '',
        quantity: 1,
        unit: 'Pcs',
        rate: 0,
        gst_rate: 18,
        amount: 0,
      }
    ],
  };

  const handleSubmit = async (values: InvoiceFormValues) => {
    try {
      const invoice: Invoice = {
        ...values,
        type: 'sale',
      };
      
      const items: InvoiceItem[] = values.items.map((item, index: number) => ({
        ...item,
        item_order: index + 1,
        amount: item.quantity * item.rate,
      }));
      
      await createInvoice.mutateAsync({ invoice, items });
      
      toast.success("Invoice created successfully!");
      router.push('/sales');
    } catch (error) {
      console.error('Error creating invoice:', error);
      toast.error(error instanceof Error ? error.message : "Failed to create invoice");
    }
  };

  if (loadingNumber) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 p-6 max-w-7xl mx-auto">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold tracking-tight">Create Sales Invoice</h1>
          <p className="text-sm text-muted-foreground">
            GST compliant sales invoice for Indian businesses
          </p>
        </div>
        <Badge variant="outline" className="gap-1">
          <FileText className="h-3 w-3" />
          Draft
        </Badge>
      </div>

      <InvoiceFormLayout
        initialValues={initialValues}
        onSubmit={handleSubmit}
        isSubmitting={createInvoice.isPending}
        mode="create"
      />
    </div>
  );
}
