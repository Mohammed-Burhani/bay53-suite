"use client";

import { useState, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getProducts,
  getParties,
  addInvoice,
  formatCurrency,
} from "@/lib/store";
import { InvoiceItem } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
} from "lucide-react";
import { toast } from "sonner";

interface CartItem extends InvoiceItem {
  maxStock: number;
}

export default function POSPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedPartyId, setSelectedPartyId] = useState<string>("walk-in");
  const [paymentMode, setPaymentMode] = useState<"cash" | "upi" | "card" | "bank_transfer">("cash");
  const [discount, setDiscount] = useState(0);

  const { data: products = [] } = useQuery({
    queryKey: ["products"],
    queryFn: getProducts,
  });

  const { data: customers = [] } = useQuery({
    queryKey: ["customers"],
    queryFn: () => getParties("customer"),
  });

  const filteredProducts = products.filter(
    (p) =>
      p.isActive &&
      p.stock > 0 &&
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

  const handleCheckout = () => {
    if (cart.length === 0) {
      toast.error("Cart is empty");
      return;
    }

    const party = customers.find((c) => c.id === selectedPartyId);
    addInvoice({
      type: "sale",
      partyId: selectedPartyId === "walk-in" ? "walk-in" : selectedPartyId,
      partyName: party ? party.name : "Walk-in Customer",
      items: cart.map(({ maxStock, ...item }) => item),
      subtotal: totals.subtotal,
      totalDiscount: totals.totalDiscount,
      totalGst: totals.totalGst,
      grandTotal: totals.grandTotal,
      amountPaid: totals.grandTotal,
      paymentMode,
      status: "paid",
      date: new Date().toISOString(),
    });

    toast.success(`Sale of ${formatCurrency(totals.grandTotal)} completed!`);
    setCart([]);
    setDiscount(0);
    setSelectedPartyId("walk-in");
    queryClient.invalidateQueries({ queryKey: ["products"] });
    queryClient.invalidateQueries({ queryKey: ["invoices"] });
    queryClient.invalidateQueries({ queryKey: ["dashboard"] });
  };

  return (
    <div className="flex h-[calc(100vh)] flex-col lg:flex-row">
      {/* Product Grid */}
      <div className="flex flex-1 flex-col overflow-hidden border-r border-border">
        <div className="border-b border-border p-4">
          <h1 className="text-lg font-bold tracking-tight">Point of Sale</h1>
          <div className="relative mt-3">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Scan barcode or search products..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
              autoFocus
            />
          </div>
        </div>
        <div className="flex-1 overflow-auto p-4">
          <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4">
            {filteredProducts.map((product) => (
              <button
                key={product.id}
                onClick={() => addToCart(product.id)}
                className="group relative flex flex-col rounded-xl border border-border bg-card p-3 text-left transition-all hover:border-primary/50 hover:shadow-md active:scale-[0.98]"
              >
                <div className="mb-2 flex items-start justify-between">
                  <Badge variant="outline" className="text-[10px] font-normal">
                    {product.category.split(" ")[0]}
                  </Badge>
                  <Badge variant="secondary" className="text-[10px]">
                    {product.stock} left
                  </Badge>
                </div>
                <p className="text-sm font-medium leading-tight line-clamp-2">{product.name}</p>
                {product.brand && (
                  <p className="mt-0.5 text-xs text-muted-foreground">{product.brand}</p>
                )}
                <div className="mt-auto pt-2">
                  <p className="text-base font-bold text-primary">
                    {formatCurrency(product.sellingPrice)}
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    MRP: {formatCurrency(product.mrp)} &middot; GST {product.gstRate}%
                  </p>
                </div>
              </button>
            ))}
          </div>
          {filteredProducts.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
              <ShoppingCart className="h-8 w-8 mb-2 opacity-40" />
              <p className="text-sm">No products found</p>
            </div>
          )}
        </div>
      </div>

      {/* Cart Panel */}
      <div className="flex w-full flex-col bg-card lg:w-[400px]">
        <div className="border-b border-border p-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold flex items-center gap-2">
              <Receipt className="h-4 w-4" />
              Current Bill
            </h2>
            <Badge variant="secondary">{cart.length} items</Badge>
          </div>
          {/* Customer Select */}
          <div className="mt-3 flex items-center gap-2">
            <User className="h-4 w-4 text-muted-foreground" />
            <Select value={selectedPartyId} onValueChange={setSelectedPartyId}>
              <SelectTrigger className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="walk-in">Walk-in Customer</SelectItem>
                {customers.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name} ({c.phone})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Cart Items */}
        <div className="flex-1 overflow-auto p-3">
          {cart.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <ShoppingCart className="h-10 w-10 mb-3 opacity-30" />
              <p className="text-sm">No items in cart</p>
              <p className="text-xs mt-1">Click products to add them</p>
            </div>
          ) : (
            <div className="space-y-2">
              {cart.map((item) => (
                <div
                  key={item.productId}
                  className="rounded-lg border border-border p-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium leading-tight truncate">
                        {item.productName}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {formatCurrency(item.price)} &times; {item.quantity}
                        {item.discount > 0 && (
                          <span className="text-emerald-600"> (-{formatCurrency(item.discount)})</span>
                        )}
                      </p>
                    </div>
                    <p className="text-sm font-semibold whitespace-nowrap">
                      {formatCurrency(item.total)}
                    </p>
                  </div>
                  <div className="mt-2 flex items-center justify-between">
                    <div className="flex items-center gap-1">
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => updateQuantity(item.productId, -1)}
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                      <span className="w-8 text-center text-sm font-medium">
                        {item.quantity}
                      </span>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => updateQuantity(item.productId, 1)}
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                    <div className="flex items-center gap-1">
                      <Input
                        type="number"
                        placeholder="Disc"
                        className="h-7 w-16 text-xs"
                        value={item.discount || ""}
                        onChange={(e) =>
                          updateItemDiscount(item.productId, Number(e.target.value) || 0)
                        }
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-destructive hover:text-destructive"
                        onClick={() => removeFromCart(item.productId)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Totals & Checkout */}
        {cart.length > 0 && (
          <div className="border-t border-border p-4 space-y-3">
            {/* Extra Discount */}
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Extra Discount</span>
              <Input
                type="number"
                className="h-7 w-20 text-xs text-right"
                value={discount || ""}
                onChange={(e) => setDiscount(Number(e.target.value) || 0)}
                placeholder="₹0"
              />
            </div>
            <Separator />
            <div className="space-y-1 text-sm">
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
              <Separator />
              <div className="flex justify-between text-lg font-bold">
                <span>Total</span>
                <span>{formatCurrency(totals.grandTotal)}</span>
              </div>
            </div>

            {/* Payment Mode */}
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
                  className="flex-col gap-1 h-auto py-2 text-xs"
                  onClick={() => setPaymentMode(mode)}
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </Button>
              ))}
            </div>

              <Button className="w-full h-12 text-base font-semibold gap-2 bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 text-white shadow-lg shadow-indigo-500/25" onClick={handleCheckout}>
              <Receipt className="h-5 w-5" />
              Charge {formatCurrency(totals.grandTotal)}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
