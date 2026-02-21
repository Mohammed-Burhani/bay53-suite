"use client";

import { useEffect } from "react";
import { Formik, Form, FieldArray } from "formik";
import * as Yup from "yup";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Trash2, Save, Loader2 } from "lucide-react";
import { Invoice, InvoiceItem } from "@/supabase/services/invoice-service";
import { INDIAN_STATES } from "@/lib/types";

// Validation Schema
const invoiceValidationSchema = Yup.object().shape({
  invoice_number: Yup.string().required("Invoice number is required"),
  tax_invoice_number: Yup.string(),
  invoice_date: Yup.date().required("Invoice date is required"),
  
  seller_name: Yup.string().required("Seller name is required"),
  seller_gstin: Yup.string().matches(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/, "Invalid GSTIN format").nullable(),
  seller_city: Yup.string(),
  seller_state: Yup.string(),
  
  buyer_name: Yup.string().required("Buyer name is required"),
  buyer_gstin: Yup.string().matches(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/, "Invalid GSTIN format").nullable(),
  buyer_city: Yup.string(),
  buyer_state: Yup.string(),
  
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

interface InvoiceFormProps {
  initialValues: InvoiceFormValues;
  onSubmit: (values: InvoiceFormValues) => Promise<void>;
  isSubmitting: boolean;
  mode: 'create' | 'edit';
}

export function InvoiceForm({ initialValues, onSubmit, isSubmitting, mode }: InvoiceFormProps) {
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
        
        const formatCurrency = (amount: number) => {
          return new Intl.NumberFormat("en-IN", {
            style: "currency",
            currency: "INR",
            maximumFractionDigits: 2,
          }).format(amount);
        };
        
        return (
          <Form className="space-y-6 pb-20">
            {/* Invoice Header */}
            <Card>
              <CardHeader>
                <CardTitle>Invoice Details</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-3">
                <div>
                  <Label htmlFor="invoice_number">Invoice Number *</Label>
                  <Input
                    id="invoice_number"
                    name="invoice_number"
                    value={values.invoice_number}
                    onChange={handleChange}
                    onBlur={handleBlur}
                  />
                  {errors.invoice_number && touched.invoice_number && (
                    <p className="text-xs text-destructive mt-1">{errors.invoice_number}</p>
                  )}
                </div>
                
                <div>
                  <Label htmlFor="tax_invoice_number">Tax Invoice Number</Label>
                  <Input
                    id="tax_invoice_number"
                    name="tax_invoice_number"
                    value={values.tax_invoice_number || ''}
                    onChange={handleChange}
                    onBlur={handleBlur}
                  />
                </div>
                
                <div>
                  <Label htmlFor="invoice_date">Invoice Date *</Label>
                  <Input
                    id="invoice_date"
                    name="invoice_date"
                    type="date"
                    value={values.invoice_date}
                    onChange={handleChange}
                    onBlur={handleBlur}
                  />
                  {errors.invoice_date && touched.invoice_date && (
                    <p className="text-xs text-destructive mt-1">{errors.invoice_date as string}</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Seller Details */}
            <Card>
              <CardHeader>
                <CardTitle>Seller Details (From)</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label htmlFor="seller_name">Business Name *</Label>
                  <Input
                    id="seller_name"
                    name="seller_name"
                    value={values.seller_name}
                    onChange={handleChange}
                    onBlur={handleBlur}
                  />
                  {errors.seller_name && touched.seller_name && (
                    <p className="text-xs text-destructive mt-1">{errors.seller_name}</p>
                  )}
                </div>
                
                <div>
                  <Label htmlFor="seller_gstin">GSTIN</Label>
                  <Input
                    id="seller_gstin"
                    name="seller_gstin"
                    value={values.seller_gstin || ''}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    placeholder="27AAAAA0000A1Z5"
                  />
                  {errors.seller_gstin && touched.seller_gstin && (
                    <p className="text-xs text-destructive mt-1">{errors.seller_gstin}</p>
                  )}
                </div>
                
                <div className="md:col-span-2">
                  <Label htmlFor="seller_address">Address</Label>
                  <Input
                    id="seller_address"
                    name="seller_address"
                    value={values.seller_address || ''}
                    onChange={handleChange}
                    onBlur={handleBlur}
                  />
                </div>
                
                <div>
                  <Label htmlFor="seller_city">City</Label>
                  <Input
                    id="seller_city"
                    name="seller_city"
                    value={values.seller_city || ''}
                    onChange={handleChange}
                    onBlur={handleBlur}
                  />
                </div>
                
                <div>
                  <Label htmlFor="seller_state">State</Label>
                  <Select
                    value={values.seller_state || ''}
                    onValueChange={(value) => setFieldValue('seller_state', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select state" />
                    </SelectTrigger>
                    <SelectContent>
                      {INDIAN_STATES.map((state) => (
                        <SelectItem key={state} value={state}>
                          {state}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Buyer Details */}
            <Card>
              <CardHeader>
                <CardTitle>Buyer Details (To)</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label htmlFor="buyer_name">Customer Name *</Label>
                  <Input
                    id="buyer_name"
                    name="buyer_name"
                    value={values.buyer_name}
                    onChange={handleChange}
                    onBlur={handleBlur}
                  />
                  {errors.buyer_name && touched.buyer_name && (
                    <p className="text-xs text-destructive mt-1">{errors.buyer_name}</p>
                  )}
                </div>
                
                <div>
                  <Label htmlFor="buyer_gstin">GSTIN</Label>
                  <Input
                    id="buyer_gstin"
                    name="buyer_gstin"
                    value={values.buyer_gstin || ''}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    placeholder="27BBBBB1111B1Z5"
                  />
                  {errors.buyer_gstin && touched.buyer_gstin && (
                    <p className="text-xs text-destructive mt-1">{errors.buyer_gstin}</p>
                  )}
                </div>
                
                <div className="md:col-span-2">
                  <Label htmlFor="buyer_address">Address</Label>
                  <Input
                    id="buyer_address"
                    name="buyer_address"
                    value={values.buyer_address || ''}
                    onChange={handleChange}
                    onBlur={handleBlur}
                  />
                </div>
                
                <div>
                  <Label htmlFor="buyer_city">City</Label>
                  <Input
                    id="buyer_city"
                    name="buyer_city"
                    value={values.buyer_city || ''}
                    onChange={handleChange}
                    onBlur={handleBlur}
                  />
                </div>
                
                <div>
                  <Label htmlFor="buyer_state">State</Label>
                  <Select
                    value={values.buyer_state || ''}
                    onValueChange={(value) => setFieldValue('buyer_state', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select state" />
                    </SelectTrigger>
                    <SelectContent>
                      {INDIAN_STATES.map((state) => (
                        <SelectItem key={state} value={state}>
                          {state}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Items */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Invoice Items</CardTitle>
                  <FieldArray name="items">
                    {({ push }) => (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          if (values.items.length >= 8) {
                            alert("Maximum 8 items allowed");
                            return;
                          }
                          push({
                            item_order: values.items.length + 1,
                            description: '',
                            hsn_sac_code: '',
                            quantity: 1,
                            unit: 'Pcs',
                            rate: 0,
                            gst_rate: 18,
                            amount: 0,
                          });
                        }}
                        disabled={values.items.length >= 8}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Item
                      </Button>
                    )}
                  </FieldArray>
                </div>
              </CardHeader>
              <CardContent>
                <FieldArray name="items">
                  {({ remove }) => (
                    <div className="space-y-4">
                      {values.items.map((item, index) => {
                        const itemAmount = item.quantity * item.rate;
                        const itemGst = (itemAmount * item.gst_rate) / 100;
                        const itemTotal = itemAmount + itemGst;
                        
                        return (
                          <div key={index} className="p-4 border rounded-lg space-y-3">
                            <div className="flex items-center justify-between">
                              <h4 className="font-medium">Item {index + 1}</h4>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => remove(index)}
                                disabled={values.items.length === 1}
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </div>
                            
                            <div className="grid gap-3 md:grid-cols-6">
                              <div className="md:col-span-2">
                                <Label htmlFor={`items.${index}.description`}>Description *</Label>
                                <Input
                                  id={`items.${index}.description`}
                                  name={`items.${index}.description`}
                                  value={item.description}
                                  onChange={handleChange}
                                  onBlur={handleBlur}
                                />
                                {errors.items?.[index] && touched.items?.[index] && (
                                  <p className="text-xs text-destructive mt-1">
                                    {typeof errors.items[index] === 'object' && errors.items[index] && 'description' in errors.items[index] 
                                      ? (errors.items[index] as { description?: string }).description 
                                      : ''}
                                  </p>
                                )}
                              </div>
                              
                              <div>
                                <Label htmlFor={`items.${index}.quantity`}>Quantity *</Label>
                                <Input
                                  id={`items.${index}.quantity`}
                                  name={`items.${index}.quantity`}
                                  type="number"
                                  step="0.001"
                                  value={item.quantity}
                                  onChange={(e) => {
                                    setFieldValue(`items.${index}.quantity`, Number(e.target.value));
                                    setFieldValue(`items.${index}.amount`, Number(e.target.value) * item.rate);
                                  }}
                                  onBlur={handleBlur}
                                />
                              </div>
                              
                              <div>
                                <Label htmlFor={`items.${index}.unit`}>Unit</Label>
                                <Input
                                  id={`items.${index}.unit`}
                                  name={`items.${index}.unit`}
                                  value={item.unit}
                                  onChange={handleChange}
                                  onBlur={handleBlur}
                                />
                              </div>
                              
                              <div>
                                <Label htmlFor={`items.${index}.rate`}>Rate *</Label>
                                <Input
                                  id={`items.${index}.rate`}
                                  name={`items.${index}.rate`}
                                  type="number"
                                  step="0.01"
                                  value={item.rate}
                                  onChange={(e) => {
                                    setFieldValue(`items.${index}.rate`, Number(e.target.value));
                                    setFieldValue(`items.${index}.amount`, item.quantity * Number(e.target.value));
                                  }}
                                  onBlur={handleBlur}
                                />
                              </div>
                              
                              <div>
                                <Label htmlFor={`items.${index}.gst_rate`}>GST %</Label>
                                <Select
                                  value={String(item.gst_rate)}
                                  onValueChange={(value) => setFieldValue(`items.${index}.gst_rate`, Number(value))}
                                >
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="0">0%</SelectItem>
                                    <SelectItem value="5">5%</SelectItem>
                                    <SelectItem value="12">12%</SelectItem>
                                    <SelectItem value="18">18%</SelectItem>
                                    <SelectItem value="28">28%</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>
                            
                            <div className="text-sm text-muted-foreground">
                              Amount: {formatCurrency(itemAmount)} + GST: {formatCurrency(itemGst)} = Total: {formatCurrency(itemTotal)}
                            </div>
                          </div>
                        );
                      })}
                      {errors.items && typeof errors.items === 'string' && (
                        <p className="text-xs text-destructive">{errors.items}</p>
                      )}
                    </div>
                  )}
                </FieldArray>
              </CardContent>
            </Card>

            {/* Payment & Summary */}
            <div className="grid gap-6 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Payment Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="discount">Discount</Label>
                    <Input
                      id="discount"
                      name="discount"
                      type="number"
                      step="0.01"
                      value={values.discount || 0}
                      onChange={handleChange}
                      onBlur={handleBlur}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="payment_mode">Payment Mode</Label>
                    <Select
                      value={values.payment_mode || 'cash'}
                      onValueChange={(value) => setFieldValue('payment_mode', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cash">Cash</SelectItem>
                        <SelectItem value="upi">UPI</SelectItem>
                        <SelectItem value="card">Card</SelectItem>
                        <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                        <SelectItem value="credit">Credit</SelectItem>
                        <SelectItem value="cheque">Cheque</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="amount_paid">Amount Paid</Label>
                    <Input
                      id="amount_paid"
                      name="amount_paid"
                      type="number"
                      step="0.01"
                      value={values.amount_paid || 0}
                      onChange={handleChange}
                      onBlur={handleBlur}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="notes">Notes</Label>
                    <Textarea
                      id="notes"
                      name="notes"
                      value={values.notes || ''}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      rows={3}
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Invoice Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span className="font-medium">{formatCurrency(totals.subtotal)}</span>
                  </div>
                  {totals.discount > 0 && (
                    <div className="flex justify-between text-emerald-600">
                      <span>Discount:</span>
                      <span>-{formatCurrency(totals.discount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span>Taxable Amount:</span>
                    <span className="font-medium">{formatCurrency(totals.taxableAmount)}</span>
                  </div>
                  {totals.cgst > 0 && (
                    <>
                      <div className="flex justify-between text-sm">
                        <span>CGST:</span>
                        <span>{formatCurrency(totals.cgst)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>SGST:</span>
                        <span>{formatCurrency(totals.sgst)}</span>
                      </div>
                    </>
                  )}
                  {totals.igst > 0 && (
                    <div className="flex justify-between text-sm">
                      <span>IGST:</span>
                      <span>{formatCurrency(totals.igst)}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-medium">
                    <span>Total GST:</span>
                    <span>{formatCurrency(totals.totalGst)}</span>
                  </div>
                  <div className="border-t pt-2 flex justify-between text-lg font-bold">
                    <span>Grand Total:</span>
                    <span>{formatCurrency(totals.grandTotal)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Amount Paid:</span>
                    <span>{formatCurrency(Number(values.amount_paid) || 0)}</span>
                  </div>
                  {totals.grandTotal - (Number(values.amount_paid) || 0) > 0 && (
                    <div className="flex justify-between text-amber-600 font-medium">
                      <span>Balance Due:</span>
                      <span>{formatCurrency(totals.grandTotal - (Number(values.amount_paid) || 0))}</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Submit Button */}
            <div className="flex gap-3">
              <Button type="submit" disabled={isSubmitting} className="flex-1">
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {mode === 'create' ? 'Creating...' : 'Updating...'}
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    {mode === 'create' ? 'Create Invoice' : 'Update Invoice'}
                  </>
                )}
              </Button>
            </div>
          </Form>
        );
      }}
    </Formik>
  );
}
