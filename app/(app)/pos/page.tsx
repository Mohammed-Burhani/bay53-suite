"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getProducts,
  getParties,
  addInvoice,
  formatCurrency,
} from "@/lib/store";
import { InvoiceItem } from "@/lib/types";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Search,
  Plus,
  Minus,
  Trash2,
  ShoppingCart,
  CreditCard,
  Smartphone,
  Banknote,
  Building2,
  Receipt,
  User,
  History,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { useTenant } from "@/lib/contexts/TenantContext";
import { usePOSProducts, usePOSCustomers, useCreatePOSTransaction } from "@/lib/hooks/usePOSInventory";

interface CartItem extends InvoiceItem {
  maxStock: number;
}

const USE_SUPABASE = !!process.env.NEXT_PUBLIC_POS_SUPABASE_URL;

export default function POSPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { tenantId } = useTenant();
  const [search, setSearch] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedPartyId, setSelectedPartyId] = useState<string>("walk-in");
  const [paymentMode, setPaymentMode] = useState<"cash" | "upi" | "card" | "bank_transfer">("cash");
  const [discount, setDiscount] = useState(0);
  const [categoryFilter, setCategoryFilter] = useState<string>("all");

  // Supabase or Zustand fallback
  const { data: supabaseProducts } = usePOSProducts(tenantId);
  const { data: supabaseCustomers } = usePOSCustomers(tenantId);
  const createTransaction = useCreatePOSTransaction(tenantId);

  // Fallback to Zustand
  const { data: zustandProducts = [] } = useQuery({
    queryKey: ["products"],
    queryFn: getProducts,
    enabled: !USE_SUPABASE,
  });

  const { data: zustandCustomers = [] } = useQuery({
    queryKey: ["customers"],
    queryFn: () => getParties("customer"),
    enabled: !USE_SUPABASE,
  });

  // Use Supabase if configured, else Zustand
  const products = USE_SUPABASE && supabaseProducts ? 
    supabaseProducts.map(p => ({
      id: p.id,
      name: p.name,
      sku: p.sku,
      barcode: p.barcode,
      category: p.category,
      brand: p.brand,
      unit: p.unit,
      sellingPrice: Number(p.selling_price),
      mrp: Number(p.mrp || p.selling_price),
      stock: p.stock,
      gstRate: Number(p.gst_rate),
      hsnCode: p.hsn_code,
      isActive: p.is_active,
    })) : 
    zustandProducts;

  const customers = USE_SUPABASE && supabaseCustomers ?
    supabaseCustomers.map(c => ({
      id: c.id,
      name: c.name,
      phone: c.phone || '',
      email: c.email,
      gstin: c.gstin,
    })) :
    zustandCustomers;

  const categories = useMemo(() => {
    const cats = new Set(products.filter(p => p.isActive && p.stock > 0).map(p => p.category));
    return ["all", ...Array.from(cats)];
  }, [products]);

  const filteredProducts = products.filter(
    (p) =>
      p.isActive &&
      p.stock > 0 &&
      (categoryFilter === "all" || p.category === categoryFilter) &&
      (p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.sku.toLowerCase().includes(search.toLowerCase()) ||
        (p.barcode && p.barcode.includes(search)))
  );

  const addToCart = (productId: string) => {
    const product = products.find((p) => p.id === productId);
    if (!product) return;

    setCart((prev) => {
      const existing = prev.find((item) => item.productId === productId);
      if (existing) {
        if (existing.quantity >= product.stock) {
          toast.error("Not enough stock");
          return prev;
        }
        return prev.map((item) =>
          item.productId === productId
            ? {
                ...item,
                quantity: item.quantity + 1,
                total: (item.quantity + 1) * item.price - item.discount,
              }
            : item
        );
      }
      return [
        ...prev,
        {
          productId: product.id,
          productName: product.name,
          quantity: 1,
          unit: product.unit,
          price: product.sellingPrice,
          discount: 0,
          gstRate: product.gstRate,
          total: product.sellingPrice,
          maxStock: product.stock,
        },
      ];
    });
  };

  const updateQuantity = (productId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.productId !== productId) return item;
          const newQty = item.quantity + delta;
          if (newQty <= 0) return null;
          if (newQty > item.maxStock) {
            toast.error("Not enough stock");
            return item;
          }
          return { ...item, quantity: newQty, total: newQty * item.price - item.discount };
        })
        .filter(Boolean) as CartItem[]
    );
  };

  const removeFromCart = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.productId !== productId));
  };

  const updateItemDiscount = (productId: string, disc: number) => {
    setCart((prev) =>
      prev.map((item) =>
        item.productId === productId
          ? { ...item, discount: disc, total: item.quantity * item.price - disc }
          : item
      )
    );
  };

  const totals = useMemo(() => {
    const subtotal = cart.reduce((sum, item) => sum + item.quantity * item.price, 0);
    const itemDiscounts = cart.reduce((sum, item) => sum + item.discount, 0);
    const totalDiscount = itemDiscounts + discount;
    const taxableAmount = subtotal - totalDiscount;
    const totalGst = cart.reduce((sum, item) => {
      const itemTaxable = item.quantity * item.price - item.discount;
      return sum + (itemTaxable * item.gstRate) / 100;
    }, 0);
    const grandTotal = taxableAmount + totalGst;
    return { subtotal, totalDiscount, totalGst, grandTotal, taxableAmount };
  }, [cart, discount]);

  const handleCheckout = async () => {
    if (cart.length === 0) {
      toast.error("Cart is empty");
      return;
    }

    const party = customers.find((c) => c.id === selectedPartyId);
    
    // Calculate GST breakdown (assuming intra-state for CGST+SGST)
    const cgst = totals.totalGst / 2;
    const sgst = totals.totalGst / 2;

    if (USE_SUPABASE) {
      // Use Supabase
      try {
        await createTransaction.mutateAsync({
          tenant_id: tenantId,
          customer_id: selectedPartyId === "walk-in" ? undefined : selectedPartyId,
          customer_name: party ? party.name : "Walk-in Customer",
          payment_mode: paymentMode,
          items: cart.map(item => ({
            product_id: item.productId,
            product_name: item.productName,
            product_sku: item.productName, // TODO: Get actual SKU
            quantity: item.quantity,
            unit: item.unit,
            unit_price: item.price,
            discount: item.discount,
            gst_rate: item.gstRate,
            total: item.total,
          })),
          subtotal: totals.subtotal,
          total_discount: totals.totalDiscount,
          taxable_amount: totals.subtotal - totals.totalDiscount,
          cgst,
          sgst,
          igst: 0,
          total_gst: totals.totalGst,
          grand_total: totals.grandTotal,
          amount_paid: totals.grandTotal,
        });

        setCart([]);
        setDiscount(0);
        setSelectedPartyId("walk-in");
        setCategoryFilter("all");
        setSearch("");
      } catch (error) {
        console.error('Checkout error:', error);
      }
    } else {
      // Use Zustand fallback
      addInvoice({
        type: "sale",
        partyId: selectedPartyId === "walk-in" ? "walk-in" : selectedPartyId,
        partyName: party ? party.name : "Walk-in Customer",
        partyGstin: party?.gstin,
        items: cart.map(({ maxStock, ...item }) => item),
        subtotal: totals.subtotal,
        totalDiscount: totals.totalDiscount,
        taxableAmount: totals.subtotal - totals.totalDiscount,
        cgst,
        sgst,
        igst: 0,
        totalGst: totals.totalGst,
        grandTotal: totals.grandTotal,
        amountPaid: totals.grandTotal,
        paymentMode,
        status: "paid",
        date: new Date().toISOString(),
        invoiceDate: new Date().toISOString(),
      });

      toast.success(`Sale of ${formatCurrency(totals.grandTotal)} completed!`);
      setCart([]);
      setDiscount(0);
      setSelectedPartyId("walk-in");
      setCategoryFilter("all");
      setSearch("");
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    }
  };

  const clearCart = () => {
    setCart([]);
    setDiscount(0);
  };

  return (
    <div className="flex h-screen flex-col">
      {/* Header Bar */}
      <div className="flex items-center justify-between border-b border-border px-6 py-3">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
              <ShoppingCart className="h-4 w-4 text-primary" />
            </div>
            <h1 className="text-lg font-semibold">Point of Sale</h1>
          </div>
          <Separator orientation="vertical" className="h-6" />
          <Badge variant="secondary" className="gap-1">
            <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Live
          </Badge>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => router.push("/pos/history")}
          className="gap-2"
        >
          <History className="h-4 w-4" />
          History
        </Button>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Product Grid */}
        <div className="flex flex-1 flex-col overflow-hidden">
          <div className="border-b border-border px-6 py-4 space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Scan barcode or search products..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-10 pl-9 pr-9"
                autoFocus
              />
              {search && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                  onClick={() => setSearch("")}
                >
                  <X className="h-3.5 w-3.5" />
                </Button>
              )}
            </div>
            <div className="flex gap-2 overflow-x-auto scrollbar-hide">
              {categories.map((cat) => (
                <Button
                  key={cat}
                  variant={categoryFilter === cat ? "default" : "outline"}
                  size="sm"
                  onClick={() => setCategoryFilter(cat)}
                  className="shrink-0"
                >
                  {cat === "all" ? "All Products" : cat}
                </Button>
              ))}
            </div>
          </div>
          <div className="flex-1 overflow-auto p-6">
            <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
              {filteredProducts.map((product) => (
                <button
                  key={product.id}
                  onClick={() => addToCart(product.id)}
                  className="group relative flex flex-col rounded-lg border border-border bg-card p-3 text-left transition-all hover:border-primary hover:shadow-sm active:scale-[0.98]"
                >
                  <div className="mb-2 flex items-start justify-between gap-2">
                    <Badge variant="outline" className="text-[10px] font-normal shrink-0">
                      {product.category.split(" ")[0]}
                    </Badge>
                    <Badge 
                      variant={product.stock < 10 ? "destructive" : "secondary"} 
                      className="text-[10px] shrink-0"
                    >
                      {product.stock}
                    </Badge>
                  </div>
                  <p className="text-sm font-medium leading-tight line-clamp-2 mb-1">{product.name}</p>
                  {product.brand && (
                    <p className="text-xs text-muted-foreground truncate">{product.brand}</p>
                  )}
                  <div className="mt-auto pt-2">
                    <p className="text-base font-semibold">
                      {formatCurrency(product.sellingPrice)}
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      GST {product.gstRate}%
                    </p>
                  </div>
                  <div className="absolute inset-0 rounded-lg border-2 border-primary opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                </button>
              ))}
            </div>
            {filteredProducts.length === 0 && (
              <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
                <ShoppingCart className="h-10 w-10 mb-3 opacity-30" />
                <p className="text-sm font-medium">No products found</p>
                <p className="text-xs mt-1">Try adjusting your search or filter</p>
              </div>
            )}
          </div>
        </div>

        {/* Cart Panel */}
        <div className="flex w-full flex-col border-l border-border lg:w-[420px]">
          <div className="border-b border-border p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Receipt className="h-4 w-4 text-muted-foreground" />
                <h2 className="text-sm font-semibold">Current Bill</h2>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="text-xs">{cart.length}</Badge>
                {cart.length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearCart}
                    className="h-7 gap-1 text-xs text-destructive hover:text-destructive"
                  >
                    <X className="h-3 w-3" />
                    Clear
                  </Button>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground shrink-0" />
              <Select value={selectedPartyId} onValueChange={setSelectedPartyId}>
                <SelectTrigger className="h-9 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="walk-in">Walk-in Customer</SelectItem>
                  {customers.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Cart Items */}
          <div className="flex-1 overflow-auto p-4">
            {cart.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="rounded-full bg-muted p-4 mb-3">
                  <ShoppingCart className="h-8 w-8 text-muted-foreground" />
                </div>
                <p className="text-sm font-medium">Cart is empty</p>
                <p className="text-xs text-muted-foreground mt-1">Select products to start billing</p>
              </div>
            ) : (
              <div className="space-y-2">
                {cart.map((item, idx) => (
                  <Card key={item.productId} className="p-3">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="flex h-5 w-5 items-center justify-center rounded bg-muted text-[10px] font-medium shrink-0">
                            {idx + 1}
                          </span>
                          <p className="text-sm font-medium leading-tight truncate">
                            {item.productName}
                          </p>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1 ml-7">
                          {formatCurrency(item.price)} × {item.quantity} = {formatCurrency(item.quantity * item.price)}
                        </p>
                        {item.discount > 0 && (
                          <p className="text-xs text-emerald-600 ml-7">
                            Discount: -{formatCurrency(item.discount)}
                          </p>
                        )}
                      </div>
                      <p className="text-sm font-semibold whitespace-nowrap">
                        {formatCurrency(item.total)}
                      </p>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center rounded-md border border-border">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 rounded-r-none"
                          onClick={() => updateQuantity(item.productId, -1)}
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <div className="flex h-7 w-10 items-center justify-center border-x border-border">
                          <span className="text-sm font-medium">{item.quantity}</span>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 rounded-l-none"
                          onClick={() => updateQuantity(item.productId, 1)}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                      <div className="flex items-center gap-1">
                        <Input
                          type="number"
                          placeholder="₹ Disc"
                          className="h-7 w-20 text-xs"
                          value={item.discount || ""}
                          onChange={(e) =>
                            updateItemDiscount(item.productId, Number(e.target.value) || 0)
                          }
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={() => removeFromCart(item.productId)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Totals & Checkout */}
          {cart.length > 0 && (
            <div className="border-t border-border p-4 space-y-4">
              {/* Extra Discount */}
              <div className="flex items-center justify-between text-sm">
                <label htmlFor="extra-discount" className="text-muted-foreground">Extra Discount</label>
                <Input
                  id="extra-discount"
                  type="number"
                  className="h-8 w-24 text-xs text-right"
                  value={discount || ""}
                  onChange={(e) => setDiscount(Number(e.target.value) || 0)}
                  placeholder="₹0"
                />
              </div>
              <Separator />
              <div className="space-y-1.5 text-sm">
                <div className="flex justify-between text-muted-foreground">
                  <span>Subtotal</span>
                  <span>{formatCurrency(totals.subtotal)}</span>
                </div>
                {totals.totalDiscount > 0 && (
                  <div className="flex justify-between text-emerald-600">
                    <span>Discount</span>
                    <span>-{formatCurrency(totals.totalDiscount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-muted-foreground">
                  <span>GST</span>
                  <span>+{formatCurrency(totals.totalGst)}</span>
                </div>
                <Separator className="my-2" />
                <div className="flex justify-between text-lg font-semibold">
                  <span>Total</span>
                  <span>{formatCurrency(totals.grandTotal)}</span>
                </div>
              </div>

              {/* Payment Mode */}
              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground">Payment Method</label>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { mode: "cash" as const, icon: Banknote, label: "Cash" },
                    { mode: "upi" as const, icon: Smartphone, label: "UPI" },
                    { mode: "card" as const, icon: CreditCard, label: "Card" },
                    { mode: "bank_transfer" as const, icon: Building2, label: "Bank" },
                  ].map(({ mode, icon: Icon, label }) => (
                    <Button
                      key={mode}
                      variant={paymentMode === mode ? "default" : "outline"}
                      className="flex-col gap-1.5 h-auto py-2.5"
                      onClick={() => setPaymentMode(mode)}
                    >
                      <Icon className="h-4 w-4" />
                      <span className="text-xs">{label}</span>
                    </Button>
                  ))}
                </div>
              </div>

              <Button 
                className="w-full h-11 text-base font-semibold gap-2" 
                onClick={handleCheckout}
              >
                <Receipt className="h-4 w-4" />
                Charge {formatCurrency(totals.grandTotal)}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
