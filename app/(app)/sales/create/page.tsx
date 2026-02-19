"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getProducts, getParties, addInvoice, formatCurrency } from "@/lib/store";
import { InvoiceItem } from "@/lib/types";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ArrowLeft,
  Plus,
  Trash2,
  FileText,
  User,
  Calendar,
  CreditCard,
  Save,
  Search,
} from "lucide-react";
import { toast } from "sonner";

interface InvoiceLineItem extends InvoiceItem {
  maxStock: number;
}

export default function CreateSalesInvoicePage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().split("T")[0]);
  const [selectedPartyId, setSelectedPartyId] = useState<string>("");
  const [items, setItems] = useState<InvoiceLineItem[]>([]);
  const [discount, setDiscount] = useState(0);
  const [paymentMode, setPaymentMode] = useState<"cash" | "upi" | "card" | "bank_transfer" | "credit">("cash");
  const [amountPaid, setAmountPaid] = useState(0);
  const [notes, setNotes] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  const { data: products = [] } = useQuery({
    queryKey: ["products"],
    queryFn: getProducts,
  });

  const { data: customers = [] } = useQuery({
    queryKey: ["customers"],
    queryFn: () => getParties("customer"),
  });

  const activeProducts = products.filter((p) => p.isActive && p.stock > 0);
  const filteredProducts = activeProducts.filter(
    (p) =>
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.barcode && p.barcode.includes(searchTerm))
  );

  const addItem = () => {
    setItems([
      ...items,
      {
        productId: "",
        productName: "",
        quantity: 1,
        unit: "Pcs",
        price: 0,
        discount: 0,
        gstRate: 18,
        total: 0,
        maxStock: 0,
      },
    ]);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, field: keyof InvoiceLineItem, value: any) => {
    const newItems = [...items];
    const item = newItems[index];

    if (field === "productId") {
      const product = products.find((p) => p.id === value);
      if (product) {
        item.productId = product.id;
        item.productName = product.name;
        item.unit = product.unit;
        item.price = product.sellingPrice;
        item.gstRate = product.gstRate;
        item.maxStock = product.stock;
      }
    } else {
      (item as any)[field] = value;
    }

    // Recalculate total
    item.total = item.quantity * item.price - item.discount;

    setItems(newItems);
  };

  const totals = useMemo(() => {
    const subtotal = items.reduce((sum, item) => sum + item.quantity * item.price, 0);
    const itemDiscounts = items.reduce((sum, item) => sum + item.discount, 0);
    const totalDiscount = itemDiscounts + discount;
    const taxableAmount = subtotal - totalDiscount;
    const totalGst = items.reduce((sum, item) => {
      const itemTaxable = item.quantity * item.price - item.discount;
      return sum + (itemTaxable * item.gstRate) / 100;
    }, 0);
    const grandTotal = taxableAmount + totalGst;
    return { subtotal, totalDiscount, totalGst, grandTotal, taxableAmount };
  }, [items, discount]);

  const handleSave = () => {
    // Validation
    if (!selectedPartyId) {
      toast.error("Please select a customer");
      return;
    }
    if (items.length === 0) {
      toast.error("Please add at least one item");
      return;
    }
    if (items.some((item) => !item.productId)) {
      toast.error("Please select products for all items");
      return;
    }
    if (items.some((item) => item.quantity <= 0)) {
      toast.error("Quantity must be greater than 0");
      return;
    }
    if (items.some((item) => item.quantity > item.maxStock)) {
      toast.error("Quantity exceeds available stock");
      return;
    }

    const party = customers.find((c) => c.id === selectedPartyId);
    const status =
      amountPaid >= totals.grandTotal
        ? "paid"
        : amountPaid > 0
        ? "partial"
        : "unpaid";

    addInvoice({
      type: "sale",
      partyId: selectedPartyId,
      partyName: party?.name || "",
      items: items.map(({ maxStock, ...item }) => item),
      subtotal: totals.subtotal,
      totalDiscount: totals.totalDiscount,
      totalGst: totals.totalGst,
      grandTotal: totals.grandTotal,
      amountPaid,
      paymentMode,
      status,
      date: new Date(invoiceDate).toISOString(),
    });

    toast.success("Invoice created successfully!");
    queryClient.invalidateQueries({ queryKey: ["products"] });
    queryClient.invalidateQueries({ queryKey: ["invoices"] });
    queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    router.push("/sales");
  };

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold tracking-tight">Create Sales Invoice</h1>
          <p className="text-sm text-muted-foreground">
            Generate a detailed sales invoice for any business type
          </p>
        </div>
        <Badge variant="outline" className="gap-1">
          <FileText className="h-3 w-3" />
          Draft
        </Badge>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
        {/* Main Form */}
        <div className="space-y-6">
          {/* Customer & Date */}
          <Card>
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
                <User className="h-4 w-4" />
                Customer Details
              </div>
              <div className="grid gap-4 grid-cols-2">
                <div className="space-y-2">
                  <Label>Customer *</Label>
                  <Select value={selectedPartyId} onValueChange={setSelectedPartyId}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select customer" />
                    </SelectTrigger>
                    <SelectContent>
                      {customers.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.name} - {c.phone}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Invoice Date *</Label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="date"
                      value={invoiceDate}
                      onChange={(e) => setInvoiceDate(e.target.value)}
                      className="pl-9 w-full"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Items */}
          <Card>
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
                  <FileText className="h-4 w-4" />
                  Invoice Items
                </div>
                <Button size="sm" variant="outline" onClick={addItem} className="gap-2">
                  <Plus className="h-3 w-3" />
                  Add Item
                </Button>
              </div>

              {items.length === 0 ? (
                <div className="py-12 text-center text-muted-foreground">
                  <FileText className="h-10 w-10 mx-auto mb-3 opacity-30" />
                  <p className="text-sm">No items added yet</p>
                  <p className="text-xs mt-1">Click "Add Item" to start</p>
                </div>
              ) : (
                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="min-w-[300px]">Product</TableHead>
                        <TableHead className="w-[120px]">Qty</TableHead>
                        <TableHead className="w-[140px]">Price</TableHead>
                        <TableHead className="w-[120px]">Disc</TableHead>
                        <TableHead className="w-[100px]">GST%</TableHead>
                        <TableHead className="w-[140px] text-right">Total</TableHead>
                        <TableHead className="w-[60px]"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {items.map((item, index) => (
                        <TableRow key={index}>
                          <TableCell>
                            <Select
                              value={item.productId}
                              onValueChange={(value) => updateItem(index, "productId", value)}
                            >
                              <SelectTrigger className="h-9 text-sm w-full">
                                <SelectValue placeholder="Select product" />
                              </SelectTrigger>
                              <SelectContent>
                                <div className="p-2">
                                  <div className="relative">
                                    <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
                                    <Input
                                      placeholder="Search..."
                                      value={searchTerm}
                                      onChange={(e) => setSearchTerm(e.target.value)}
                                      className="h-8 text-sm pl-7"
                                    />
                                  </div>
                                </div>
                                {filteredProducts.map((p) => (
                                  <SelectItem key={p.id} value={p.id} className="text-sm">
                                    {p.name} - {formatCurrency(p.sellingPrice)} (Stock: {p.stock})
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            {item.productId && (
                              <p className="text-xs text-muted-foreground mt-1">
                                Stock: {item.maxStock} {item.unit}
                              </p>
                            )}
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              min="1"
                              max={item.maxStock}
                              value={item.quantity}
                              onChange={(e) =>
                                updateItem(index, "quantity", Number(e.target.value) || 1)
                              }
                              className="h-9 text-sm w-full"
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              min="0"
                              step="0.01"
                              value={item.price}
                              onChange={(e) =>
                                updateItem(index, "price", Number(e.target.value) || 0)
                              }
                              className="h-9 text-sm w-full"
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              min="0"
                              step="0.01"
                              value={item.discount}
                              onChange={(e) =>
                                updateItem(index, "discount", Number(e.target.value) || 0)
                              }
                              className="h-9 text-sm w-full"
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              value={item.gstRate}
                              onChange={(e) =>
                                updateItem(index, "gstRate", Number(e.target.value) || 0)
                              }
                              className="h-9 text-sm w-full"
                            />
                          </TableCell>
                          <TableCell className="text-right font-medium text-sm">
                            {formatCurrency(item.total)}
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-destructive"
                              onClick={() => removeItem(index)}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Notes */}
          <Card>
            <CardContent className="p-6 space-y-2">
              <Label>Notes / Terms & Conditions</Label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add any additional notes, terms, or conditions..."
                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                rows={3}
              />
            </CardContent>
          </Card>
        </div>

        {/* Summary Sidebar */}
        <div className="space-y-6">
          {/* Totals */}
          <Card>
            <CardContent className="p-6 space-y-4">
              <div className="text-sm font-semibold text-muted-foreground">Invoice Summary</div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>{formatCurrency(totals.subtotal)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Extra Discount</span>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={discount || ""}
                    onChange={(e) => setDiscount(Number(e.target.value) || 0)}
                    className="h-7 w-24 text-xs text-right"
                    placeholder="₹0"
                  />
                </div>
                {totals.totalDiscount > 0 && (
                  <div className="flex justify-between text-emerald-600">
                    <span>Total Discount</span>
                    <span>-{formatCurrency(totals.totalDiscount)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-muted-foreground">GST</span>
                  <span>+{formatCurrency(totals.totalGst)}</span>
                </div>
                <Separator />
                <div className="flex justify-between text-lg font-bold">
                  <span>Grand Total</span>
                  <span>{formatCurrency(totals.grandTotal)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Payment */}
          <Card>
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
                <CreditCard className="h-4 w-4" />
                Payment Details
              </div>
              <div className="space-y-3">
                <div className="space-y-2">
                  <Label>Payment Mode</Label>
                  <Select value={paymentMode} onValueChange={(v: any) => setPaymentMode(v)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cash">Cash</SelectItem>
                      <SelectItem value="upi">UPI</SelectItem>
                      <SelectItem value="card">Card</SelectItem>
                      <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                      <SelectItem value="credit">Credit</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Amount Paid</Label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={amountPaid}
                    onChange={(e) => setAmountPaid(Number(e.target.value) || 0)}
                    placeholder="0.00"
                  />
                  {amountPaid < totals.grandTotal && (
                    <p className="text-xs text-amber-600">
                      Balance: {formatCurrency(totals.grandTotal - amountPaid)}
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="space-y-2">
            <Button className="w-full gap-2" onClick={handleSave}>
              <Save className="h-4 w-4" />
              Save Invoice
            </Button>
            <Button variant="outline" className="w-full" onClick={() => router.back()}>
              Cancel
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
