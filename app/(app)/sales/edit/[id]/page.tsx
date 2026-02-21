"use client";

import { useRouter, useParams } from "next/navigation";
import { useInvoice, useUpdateInvoiceWithItems } from "@/lib/api-services/invoice.service";
import { InvoiceFormLayout } from "@/components/invoice/InvoiceFormLayout";
import { Button } from "@/components/ui/button";
import { ArrowLeft, FileText } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Invoice, InvoiceItem } from "@/supabase/services/invoice-service";

export default function EditSalesInvoicePage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  
  const { data: invoiceData, isLoading } = useInvoice(id);
  const updateInvoice = useUpdateInvoiceWithItems();

  interface InvoiceFormValues extends Partial<Invoice> {
    items: InvoiceItem[];
  }

  const handleSubmit = async (values: InvoiceFormValues) => {
    try {
      const invoice: Partial<Invoice> = {
        invoice_number: values.invoice_number,
        tax_invoice_number: values.tax_invoice_number,
        invoice_date: values.invoice_date,
        
        seller_name: values.seller_name,
        seller_gstin: values.seller_gstin,
        seller_address: values.seller_address,
        seller_city: values.seller_city,
        seller_state: values.seller_state,
        seller_pincode: values.seller_pincode,
        seller_phone: values.seller_phone,
        seller_email: values.seller_email,
        
        buyer_name: values.buyer_name,
        buyer_gstin: values.buyer_gstin,
        buyer_address: values.buyer_address,
        buyer_city: values.buyer_city,
        buyer_state: values.buyer_state,
        buyer_pincode: values.buyer_pincode,
        buyer_phone: values.buyer_phone,
        buyer_email: values.buyer_email,
        
        subtotal: values.subtotal,
        discount: values.discount,
        taxable_amount: values.taxable_amount,
        cgst: values.cgst,
        sgst: values.sgst,
        igst: values.igst,
        total_gst: values.total_gst,
        grand_total: values.grand_total,
        amount_paid: values.amount_paid,
        payment_mode: values.payment_mode,
        status: values.status,
        
        notes: values.notes,
        terms_conditions: values.terms_conditions,
      };
      
      const items: InvoiceItem[] = values.items.map((item, index: number) => ({
        item_order: index + 1,
        description: item.description,
        hsn_sac_code: item.hsn_sac_code,
        quantity: item.quantity,
        unit: item.unit,
        rate: item.rate,
        gst_rate: item.gst_rate,
        amount: item.quantity * item.rate,
        custom_data: item.custom_data || {},
      }));
      
      await updateInvoice.mutateAsync({ id, invoice, items });
      
      toast.success("Invoice updated successfully!");
      router.push('/sales');
    } catch (error) {
      console.error('Error updating invoice:', error);
      toast.error(error instanceof Error ? error.message : "Failed to update invoice");
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading invoice...</p>
        </div>
      </div>
    );
  }

  if (!invoiceData) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <FileText className="mx-auto h-12 w-12 text-muted-foreground/40" />
          <p className="mt-4 text-muted-foreground">Invoice not found</p>
          <Button onClick={() => router.back()} className="mt-4">
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  const initialValues = {
    ...invoiceData,
    items: invoiceData.items || [],
  };

  return (
    <div className="flex flex-col gap-6 p-6 max-w-7xl mx-auto">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold tracking-tight">Edit Invoice</h1>
          <p className="text-sm text-muted-foreground">
            Update invoice {invoiceData.invoice_number}
          </p>
        </div>
        <Badge 
          variant={
            invoiceData.status === "paid" ? "default" : 
            invoiceData.status === "partial" ? "secondary" : 
            "destructive"
          } 
          className="gap-1 capitalize"
        >
          <FileText className="h-3 w-3" />
          {invoiceData.status}
        </Badge>
      </div>

      <InvoiceFormLayout
        initialValues={initialValues}
        onSubmit={handleSubmit}
        isSubmitting={updateInvoice.isPending}
        mode="edit"
        invoiceNumber={invoiceData.invoice_number}
        status={invoiceData.status}
      />
    </div>
  );
}
