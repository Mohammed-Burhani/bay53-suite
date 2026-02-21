"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getProducts, getParties, addInvoice } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, FileText, Save } from "lucide-react";
import { toast } from "sonner";

import { InvoiceHeader } from "@/components/invoice/InvoiceHeader";
import { AddressSection } from "@/components/invoice/AddressSection";
import { InvoiceItemsTable, InvoiceLineItem } from "@/components/invoice/InvoiceItemsTable";
import { ColumnSettings, CustomColumn } from "@/components/invoice/ColumnSettings";
import { InvoiceSummary } from "@/components/invoice/InvoiceSummary";
import { InvoiceNotes } from "@/components/invoice/InvoiceNotes";
import { 
  initializeColumns, 
  saveColumns as saveColumnsToStorage,
  extractCustomData 
} from "@/lib/invoice-columns-storage";

export default function CreateSalesInvoicePage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  // Business Details
  const [businessName, setBusinessName] = useState("Your Business Name");
  const [businessGstin, setBusinessGstin] = useState("");
  const [businessAddress, setBusinessAddress] = useState("");
  const [businessCity, setBusinessCity] = useState("");
  const [businessState, setBusinessState] = useState("");
  const [businessPincode, setBusinessPincode] = useState("");

  // Invoice Details
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [taxInvoiceNumber, setTaxInvoiceNumber] = useState("");
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().split("T")[0]);

  // Customer Details
  const [selectedPartyId, setSelectedPartyId] = useState<string>("");
  const [customerGstin, setCustomerGstin] = useState("");

  // Items & Columns
  const [items, setItems] = useState<InvoiceLineItem[]>([]);
  const [columns, setColumns] = useState<CustomColumn[]>([]);
  const [showColumnSettings, setShowColumnSettings] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  // Initialize columns from localStorage on mount
  useEffect(() => {
    const savedColumns = initializeColumns();
    setColumns(savedColumns);
  }, []);

  // Payment
  const [discount, setDiscount] = useState(0);
  const [paymentMode, setPaymentMode] = useState<"cash" | "upi" | "card" | "bank_transfer" | "credit">("cash");
  const [amountPaid, setAmountPaid] = useState(0);
  const [notes, setNotes] = useState("");

  const { data: products = [] } = useQuery({
    queryKey: ["products"],
    queryFn: getProducts,
  });

  const { data: customers = [] } = useQuery({
    queryKey: ["customers"],
    queryFn: () => getParties("customer"),
  });

  const activeProducts = products.filter((p) => p.isActive && p.stock > 0);
  const selectedCustomer = customers.find((c) => c.id === selectedPartyId);

  const addItem = () => {
    if (items.length >= 8) {
      toast.error("Maximum 8 items allowed per invoice");
      return;
    }
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
        hsnCode: "",
      },
    ]);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, field: string, value: any) => {
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
        item.hsnCode = product.hsnCode || "";
      }
    } else {
      (item as any)[field] = value;
    }

    const taxableValue = item.quantity * item.price;
    item.total = taxableValue + (taxableValue * item.gstRate) / 100;

    setItems(newItems);
  };

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

  const totals = useMemo(() => {
    const subtotal = items.reduce((sum, item) => sum + item.quantity * item.price, 0);
    const itemDiscounts = items.reduce((sum, item) => sum + item.discount, 0);
    const totalDiscount = itemDiscounts + discount;
    const taxableAmount = subtotal - totalDiscount;

    let cgst = 0;
    let sgst = 0;
    let igst = 0;

    const isInterState = false;

    items.forEach((item) => {
      const itemTaxable = item.quantity * item.price - item.discount;
      const gstAmount = (itemTaxable * item.gstRate) / 100;

      if (isInterState) {
        igst += gstAmount;
      } else {
        cgst += gstAmount / 2;
        sgst += gstAmount / 2;
      }
    });

    const totalGst = cgst + sgst + igst;
    const grandTotal = taxableAmount + totalGst;

    return { subtotal, totalDiscount, taxableAmount, cgst, sgst, igst, totalGst, grandTotal };
  }, [items, discount]);

  const handleSave = () => {
    if (!selectedPartyId) {
      toast.error("Please select a customer");
      return;
    }
    if (!invoiceNumber || !taxInvoiceNumber) {
      toast.error("Please enter invoice numbers");
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
    const status = amountPaid >= totals.grandTotal ? "paid" : amountPaid > 0 ? "partial" : "unpaid";

    addInvoice({
      type: "sale",
      partyId: selectedPartyId,
      partyName: party?.name || "",
      items: items.map(({ maxStock, hsnCode, ...item }) => item),
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
          <h1 className="text-2xl font-bold tracking-tight">Create Tax Invoice</h1>
          <p className="text-sm text-muted-foreground">
            GST compliant sales invoice for Indian businesses
          </p>
        </div>
        <Badge variant="outline" className="gap-1">
          <FileText className="h-3 w-3" />
          Draft
        </Badge>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="space-y-6">
          <InvoiceHeader
            invoiceNumber={invoiceNumber}
            taxInvoiceNumber={taxInvoiceNumber}
            invoiceDate={invoiceDate}
            onInvoiceNumberChange={setInvoiceNumber}
            onTaxInvoiceNumberChange={setTaxInvoiceNumber}
            onInvoiceDateChange={setInvoiceDate}
          />

          <AddressSection
            businessProps={{
              businessName,
              businessGstin,
              businessAddress,
              businessCity,
              businessState,
              businessPincode,
              onBusinessNameChange: setBusinessName,
              onBusinessGstinChange: setBusinessGstin,
              onBusinessAddressChange: setBusinessAddress,
              onBusinessCityChange: setBusinessCity,
              onBusinessStateChange: setBusinessState,
              onBusinessPincodeChange: setBusinessPincode,
            }}
            customerProps={{
              customers,
              selectedPartyId,
              selectedCustomer,
              customerGstin,
              onCustomerSelect: setSelectedPartyId,
              onCustomerGstinChange: setCustomerGstin,
            }}
          />

          <InvoiceItemsTable
            items={items}
            columns={columns}
            products={activeProducts}
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            onAddItem={addItem}
            onRemoveItem={removeItem}
            onUpdateItem={updateItem}
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

          <InvoiceNotes notes={notes} onNotesChange={setNotes} />
        </div>

        <div className="space-y-6">
          <InvoiceSummary
            totals={totals}
            discount={discount}
            paymentMode={paymentMode}
            amountPaid={amountPaid}
            onDiscountChange={setDiscount}
            onPaymentModeChange={setPaymentMode}
            onAmountPaidChange={setAmountPaid}
          />

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
