"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Formik, Form, FieldArray } from "formik";
import * as Yup from "yup";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Save, Loader2, FileText } from "lucide-react";
import { Invoice, InvoiceItem } from "@/supabase/services/invoice-service";
import { InvoiceHeader } from "./InvoiceHeader";
import { AddressSection } from "./AddressSection";
import { InvoiceItemsTable, InvoiceLineItem } from "./InvoiceItemsTable";
import { ColumnSettings, CustomColumn } from "./ColumnSettings";
import { InvoiceSummary } from "./InvoiceSummary";
import { InvoiceNotes } from "./InvoiceNotes";
import { 
  initializeColumns, 
  saveColumns as saveColumnsToStorage 
} from "@/lib/invoice-columns-storage";
import { toast } from "sonner";

// Validation Schema
const invoiceValidationSchema = Yup.object().shape({
  invoice_number: Yup.string().required("Invoice number is required"),
  tax_invoice_number: Yup.string(),
  invoice_date: Yup.date().required("Invoice date is required"),
  
  seller_name: Yup.string().required("Seller name is required"),
  seller_gstin: Yup.string().matches(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/, "Invalid GSTIN format").nullable(),
  
  buyer_name: Yup.string().required("Buyer name is required"),
  buyer_gstin: Yup.string().matches(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/, "Invalid GSTIN format").nullable(),
  
  items: Yup.array()
    .of(
      Yup.object().shape({
        description: Yup.string().required("Description is required"),
        quantity: Yup.number().min(0.001, "Quantity must be greater than 0").required("Quantity is required"),
        rate: Yup.number().min(0, "Rate must be positive").required("Rate is required"),
        gst_rate: Yup.number().min(0).max(100).required("GST rate is required"),
      })
    )
    .min(1, "At least one item is required")
    .max(8, "Maximum 8 items allowed"),
  
  payment_mode: Yup.string().oneOf(['cash', 'upi', 'card', 'bank_transfer', 'credit', 'cheque']),
  amount_paid: Yup.number().min(0, "Amount paid must be positive"),
});

interface InvoiceFormValues extends Partial<Invoice> {
  items: InvoiceItem[];
}

interface InvoiceFormLayoutProps {
  initialValues: InvoiceFormValues;
  onSubmit: (values: InvoiceFormValues) => Promise<void>;
  isSubmitting: boolean;
  mode: 'create' | 'edit';
  invoiceNumber?: string;
  status?: string;
}

export function InvoiceFormLayout({ 
  initialValues, 
  onSubmit, 
  isSubmitting, 
  mode,
  invoiceNumber,
  status 
}: InvoiceFormLayoutProps) {
  const router = useRouter();
  const [columns, setColumns] = useState<CustomColumn[]>([]);
  const [showColumnSettings, setShowColumnSettings] = useState(false);

  // Initialize columns from localStorage on mount
  useEffect(() => {
    const savedColumns = initializeColumns();
    setColumns(savedColumns);
  }, []);

  const toggleColumn = (id: string) => {
    const col = columns.find((c) => c.id === id);
    if (!col) return;

    const currentEnabled = columns.filter((c) => c.enabled).length;
    const maxColumns = 5;

    if (col.enabled) {
      const newColumns = columns.map((c) => (c.id === id ? { ...c, enabled: false } : c));
      setColumns(newColumns);
      saveColumnsToStorage(newColumns);
    } else {
      if (currentEnabled >= maxColumns) {
        toast.error(`Maximum ${maxColumns} columns allowed`);
        return;
      }
      const newColumns = columns.map((c) => (c.id === id ? { ...c, enabled: true } : c));
      setColumns(newColumns);
      saveColumnsToStorage(newColumns);
    }
  };

  const updateColumnLabel = (id: string, label: string) => {
    const newColumns = columns.map((c) => (c.id === id ? { ...c, label } : c));
    setColumns(newColumns);
    saveColumnsToStorage(newColumns);
  };

  const addCustomColumn = (label: string, type: "text" | "number") => {
    const newCol: CustomColumn = {
      id: `custom_${Date.now()}`,
      label,
      enabled: true,
      isCustom: true,
      type,
    };
    const newColumns = [...columns, newCol];
    setColumns(newColumns);
    saveColumnsToStorage(newColumns);
    toast.success("Custom column added");
  };

  const deleteColumn = (id: string) => {
    const col = columns.find((c) => c.id === id);
    if (!col?.isCustom) {
      toast.error("Cannot delete default columns");
      return;
    }
    const newColumns = columns.filter((c) => c.id !== id);
    setColumns(newColumns);
    saveColumnsToStorage(newColumns);
    toast.success("Column deleted");
  };

  return (
    <Formik
      initialValues={initialValues}
      validationSchema={invoiceValidationSchema}
      onSubmit={onSubmit}
      enableReinitialize
    >
      {({ values, errors, touched, setFieldValue, handleChange, handleBlur }) => {
        // Calculate totals
        const calculateTotals = () => {
          const subtotal = values.items.reduce((sum, item) => sum + (item.quantity * item.rate), 0);
          const discount = Number(values.discount) || 0;
          const taxableAmount = subtotal - discount;
          
          let cgst = 0, sgst = 0, igst = 0;
          const isInterState = values.seller_state !== values.buyer_state;
          
          values.items.forEach(item => {
            const itemTaxable = (item.quantity * item.rate);
            const gstAmount = (itemTaxable * item.gst_rate) / 100;
            
            if (isInterState) {
              igst += gstAmount;
            } else {
              cgst += gstAmount / 2;
              sgst += gstAmount / 2;
            }
          });
          
          const totalGst = cgst + sgst + igst;
          const grandTotal = taxableAmount + totalGst;
          
          return { subtotal, discount, taxableAmount, cgst, sgst, igst, totalGst, grandTotal };
        };
        
        const totals = calculateTotals();
        
        // Update totals in form values
        useEffect(() => {
          setFieldValue('subtotal', totals.subtotal);
          setFieldValue('taxable_amount', totals.taxableAmount);
          setFieldValue('cgst', totals.cgst);
          setFieldValue('sgst', totals.sgst);
          setFieldValue('igst', totals.igst);
          setFieldValue('total_gst', totals.totalGst);
          setFieldValue('grand_total', totals.grandTotal);
          
          // Auto-calculate status
          const amountPaid = Number(values.amount_paid) || 0;
          if (amountPaid >= totals.grandTotal) {
            setFieldValue('status', 'paid');
          } else if (amountPaid > 0) {
            setFieldValue('status', 'partial');
          } else {
            setFieldValue('status', 'unpaid');
          }
        }, [values.items, values.discount, values.amount_paid, values.seller_state, values.buyer_state, setFieldValue, totals.subtotal, totals.taxableAmount, totals.cgst, totals.sgst, totals.igst, totals.totalGst, totals.grandTotal]);

        // Convert items to InvoiceLineItem format for the table
        const lineItems: InvoiceLineItem[] = values.items.map(item => ({
          productId: '',
          productName: item.description,
          quantity: item.quantity,
          unit: item.unit,
          price: item.rate,
          discount: 0,
          gstRate: item.gst_rate,
          total: item.quantity * item.rate,
          maxStock: 0,
          hsnCode: item.hsn_sac_code || '',
        }));

        const handleItemUpdate = (index: number, field: string, value: unknown) => {
          if (field === 'productName') {
            setFieldValue(`items.${index}.description`, value);
          } else if (field === 'price') {
            setFieldValue(`items.${index}.rate`, value);
            setFieldValue(`items.${index}.amount`, values.items[index].quantity * Number(value));
          } else if (field === 'quantity') {
            setFieldValue(`items.${index}.quantity`, value);
            setFieldValue(`items.${index}.amount`, Number(value) * values.items[index].rate);
          } else if (field === 'unit') {
            setFieldValue(`items.${index}.unit`, value);
          } else if (field === 'hsnCode') {
            setFieldValue(`items.${index}.hsn_sac_code`, value);
          }
        };

        const addItem = () => {
          if (values.items.length >= 8) {
            toast.error("Maximum 8 items allowed per invoice");
            return;
          }
          const newItems = [
            ...values.items,
            {
              item_order: values.items.length + 1,
              description: '',
              hsn_sac_code: '',
              quantity: 1,
              unit: 'Pcs',
              rate: 0,
              gst_rate: 18,
              amount: 0,
            }
          ];
          setFieldValue('items', newItems);
        };

        const removeItem = (index: number) => {
          if (values.items.length === 1) {
            toast.error("At least one item is required");
            return;
          }
          const newItems = values.items.filter((_, i) => i !== index);
          setFieldValue('items', newItems);
        };

        return (
          <Form>
            <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
              <div className="space-y-6">
                <InvoiceHeader
                  invoiceNumber={values.invoice_number || ''}
                  taxInvoiceNumber={values.tax_invoice_number || ''}
                  invoiceDate={values.invoice_date || ''}
                  onInvoiceNumberChange={(val) => setFieldValue('invoice_number', val)}
                  onTaxInvoiceNumberChange={(val) => setFieldValue('tax_invoice_number', val)}
                  onInvoiceDateChange={(val) => setFieldValue('invoice_date', val)}
                />

                <AddressSection
                  businessProps={{
                    businessName: values.seller_name || '',
                    businessGstin: values.seller_gstin || '',
                    businessAddress: values.seller_address || '',
                    businessCity: values.seller_city || '',
                    businessState: values.seller_state || '',
                    businessPincode: values.seller_pincode || '',
                    onBusinessNameChange: (val) => setFieldValue('seller_name', val),
                    onBusinessGstinChange: (val) => setFieldValue('seller_gstin', val),
                    onBusinessAddressChange: (val) => setFieldValue('seller_address', val),
                    onBusinessCityChange: (val) => setFieldValue('seller_city', val),
                    onBusinessStateChange: (val) => setFieldValue('seller_state', val),
                    onBusinessPincodeChange: (val) => setFieldValue('seller_pincode', val),
                  }}
                  customerProps={{
                    customers: [],
                    selectedPartyId: '',
                    selectedCustomer: undefined,
                    customerGstin: values.buyer_gstin || '',
                    onCustomerSelect: () => {},
                    onCustomerGstinChange: (val) => setFieldValue('buyer_gstin', val),
                  }}
                  buyerName={values.buyer_name || ''}
                  buyerAddress={values.buyer_address || ''}
                  buyerCity={values.buyer_city || ''}
                  buyerState={values.buyer_state || ''}
                  onBuyerNameChange={(val) => setFieldValue('buyer_name', val)}
                  onBuyerAddressChange={(val) => setFieldValue('buyer_address', val)}
                  onBuyerCityChange={(val) => setFieldValue('buyer_city', val)}
                  onBuyerStateChange={(val) => setFieldValue('buyer_state', val)}
                />

                <InvoiceItemsTable
                  items={lineItems}
                  columns={columns}
                  products={[]}
                  searchTerm=""
                  onSearchChange={() => {}}
                  onAddItem={addItem}
                  onRemoveItem={removeItem}
                  onUpdateItem={handleItemUpdate}
                  onToggleColumnSettings={() => setShowColumnSettings(!showColumnSettings)}
                  showColumnSettings={showColumnSettings}
                  columnSettingsComponent={
                    <ColumnSettings
                      columns={columns}
                      maxColumns={5}
                      onToggleColumn={toggleColumn}
                      onUpdateColumnLabel={updateColumnLabel}
                      onAddColumn={addCustomColumn}
                      onDeleteColumn={deleteColumn}
                      onClose={() => setShowColumnSettings(false)}
                    />
                  }
                />

                <InvoiceNotes 
                  notes={values.notes || ''} 
                  onNotesChange={(val) => setFieldValue('notes', val)} 
                />
              </div>

              <div className="space-y-6">
                <InvoiceSummary
                  totals={totals}
                  discount={Number(values.discount) || 0}
                  paymentMode={values.payment_mode || 'cash'}
                  amountPaid={Number(values.amount_paid) || 0}
                  gstRate={values.items[0]?.gst_rate || 18}
                  onDiscountChange={(val) => setFieldValue('discount', val)}
                  onPaymentModeChange={(val) => setFieldValue('payment_mode', val)}
                  onAmountPaidChange={(val) => setFieldValue('amount_paid', val)}
                  onGstRateChange={(val) => {
                    // Update GST rate for all items
                    const updatedItems = values.items.map(item => ({
                      ...item,
                      gst_rate: val
                    }));
                    setFieldValue('items', updatedItems);
                  }}
                />

                <div className="space-y-2">
                  <Button type="submit" className="w-full gap-2" disabled={isSubmitting}>
                    {isSubmitting ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        {mode === 'create' ? 'Creating...' : 'Updating...'}
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4" />
                        {mode === 'create' ? 'Save Invoice' : 'Update Invoice'}
                      </>
                    )}
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline" 
                    className="w-full" 
                    onClick={() => router.back()}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </div>
          </Form>
        );
      }}
    </Formik>
  );
}
