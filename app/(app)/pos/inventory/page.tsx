"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Package,
  ArrowLeft,
  X,
  Barcode as BarcodeIcon,
  Wand2,
  PackagePlus,
  Layers,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useTenant } from "@/lib/contexts/TenantContext";
import { usePOSProducts, useAddProduct, useUpdateProduct, useDeleteProduct } from "@/lib/hooks/usePOSInventory";
import { StockAdjustmentsPanel } from "@/components/pos/StockAdjustmentsPanel";
import { OpeningStockPanel } from "@/components/pos/OpeningStockPanel";
import { Product } from "@/lib/services/pos.service";
import { formatCurrency } from "@/lib/store";
import { Formik, Form, Field, ErrorMessage, useFormikContext } from "formik";
import * as Yup from "yup";
import { toast } from "sonner";
import {
  generateUniqueBarcodeValue,
  validateBarcode,
  canRenderBarcode,
} from "@/lib/utils/barcode";
import { BarcodeLabel } from "@/components/pos/BarcodeLabel";
import { BarcodeDialog } from "@/components/pos/BarcodeDialog";

const makeProductSchema = (products: Product[], editingId?: string) =>
  Yup.object({
    sku: Yup.string().required("SKU required"),
    name: Yup.string().required("Name required").min(3),
    category: Yup.string().required("Category required"),
    selling_price: Yup.number().required("Price required").min(0),
    cost_price: Yup.number().required("Cost required").min(0),
    stock: Yup.number().required("Stock required").min(0),
    min_stock: Yup.number().required("Min stock required").min(0),
    gst_rate: Yup.number().required("GST required").min(0).max(100),
    barcode: Yup.string()
      .nullable()
      .test("barcode-format", "Invalid barcode", function (value) {
        const err = validateBarcode(value as string | undefined);
        return err ? this.createError({ message: err }) : true;
      })
      .test(
        "barcode-unique",
        "This barcode is already used by another product",
        (value) => {
          if (!value) return true;
          return !products.some((p) => p.barcode === value && p.id !== editingId);
        }
      ),
  });

type ProductFormValues = Omit<Product, 'id' | 'tenant_id' | 'created_at' | 'updated_at'>;

export default function POSInventoryPage() {
  const router = useRouter();
  const { tenantId } = useTenant();
  const [mode, setMode] = useState<"products" | "adjustments" | "opening">("products");
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [barcodeProduct, setBarcodeProduct] = useState<Product | null>(null);

  const { data: products = [], isLoading } = usePOSProducts(tenantId);
  const addProduct = useAddProduct(tenantId);
  const updateProduct = useUpdateProduct(tenantId);
  const deleteProduct = useDeleteProduct(tenantId);

  const validationSchema = useMemo(
    () => makeProductSchema(products, editingProduct?.id),
    [products, editingProduct]
  );

  const categories = useMemo(() => {
    const cats = new Set(products.map(p => p.category));
    return ["all", ...Array.from(cats)];
  }, [products]);

  const filtered = useMemo(() => {
    return products.filter((p) => {
      const matchesSearch =
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.sku.toLowerCase().includes(search.toLowerCase()) ||
        (p.barcode && p.barcode.includes(search));
      const matchesCategory = categoryFilter === "all" || p.category === categoryFilter;
      return matchesSearch && matchesCategory && p.is_active;
    });
  }, [products, search, categoryFilter]);

  const handleSubmit = async (values: ProductFormValues) => {
    // Normalize the barcode: trim, and auto-generate a unique one when blank.
    const typed = (values.barcode ?? "").toString().trim();
    let finalBarcode = typed;
    if (!typed) {
      finalBarcode = generateUniqueBarcodeValue(products.map((p) => p.barcode));
      toast.success(`Barcode auto-generated: ${finalBarcode}`);
    }
    const finalValues: ProductFormValues = { ...values, barcode: finalBarcode };

    if (editingProduct) {
      await updateProduct.mutateAsync({ id: editingProduct.id, ...finalValues });
    } else {
      await addProduct.mutateAsync({
        ...finalValues,
        tenant_id: tenantId,
        is_active: true,
      } as Omit<Product, 'id' | 'created_at' | 'updated_at'>);
    }
    setDialogOpen(false);
    setEditingProduct(null);
  };

  const handleDelete = async () => {
    if (deleteId) {
      await deleteProduct.mutateAsync(deleteId);
      setDeleteId(null);
    }
  };

  const openEdit = (product: Product) => {
    setEditingProduct(product);
    setDialogOpen(true);
  };

  const openAdd = () => {
    setEditingProduct(null);
    setDialogOpen(true);
  };

  const emptyProduct: ProductFormValues = {
    sku: "",
    barcode: undefined,
    name: "",
    description: undefined,
    category: "",
    brand: undefined,
    unit: "Pcs",
    cost_price: 0,
    selling_price: 0,
    mrp: undefined,
    stock: 0,
    min_stock: 5,
    max_stock: undefined,
    hsn_code: undefined,
    gst_rate: 18,
    is_active: true,
    image_url: undefined,
    attributes: undefined,
  };

  const lowStockCount = products.filter(p => p.stock <= p.min_stock && p.stock > 0).length;
  const outOfStockCount = products.filter(p => p.stock === 0).length;
  const totalValue = products.reduce((sum, p) => sum + p.stock * Number(p.selling_price), 0);

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.push("/pos")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">POS Inventory</h1>
            <p className="text-sm text-muted-foreground">
              Manage {products.length} products for your store
            </p>
          </div>
        </div>
        {mode === "products" && (
          <Button onClick={openAdd} className="gap-2">
            <Plus className="h-4 w-4" />
            Add Product
          </Button>
        )}
      </div>

      {/* Mode switcher */}
      <Tabs value={mode} onValueChange={(v) => setMode(v as typeof mode)} className="w-full">
        <TabsList>
          <TabsTrigger value="products" className="gap-1.5">
            <Package className="h-4 w-4" />
            Products
          </TabsTrigger>
          <TabsTrigger value="adjustments" className="gap-1.5">
            <PackagePlus className="h-4 w-4" />
            Adjustments
          </TabsTrigger>
          <TabsTrigger value="opening" className="gap-1.5">
            <Layers className="h-4 w-4" />
            Open Stock
          </TabsTrigger>
        </TabsList>

        <TabsContent value="products" className="mt-6 space-y-6">

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Total Products</p>
                <p className="text-2xl font-bold">{products.length}</p>
              </div>
              <Package className="h-8 w-8 text-muted-foreground opacity-50" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Stock Value</p>
                <p className="text-2xl font-bold">{formatCurrency(totalValue)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Low / Out</p>
                <p className="text-2xl font-bold">
                  <span className="text-amber-600">{lowStockCount}</span>
                  {" / "}
                  <span className="text-red-600">{outOfStockCount}</span>
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4 space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search products..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-9"
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
          <div className="flex gap-2">
            {categories.map((cat) => (
              <Button
                key={cat}
                variant={categoryFilter === cat ? "default" : "outline"}
                size="sm"
                onClick={() => setCategoryFilter(cat)}
              >
                {cat === "all" ? "All" : cat}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Product</TableHead>
              <TableHead>SKU</TableHead>
              <TableHead>Category</TableHead>
              <TableHead className="text-right">Price</TableHead>
              <TableHead className="text-center">Stock</TableHead>
              <TableHead className="text-center">GST</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  Loading...
                </TableCell>
              </TableRow>
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  No products found
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((product) => (
                <TableRow key={product.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{product.name}</p>
                      {product.brand && (
                        <p className="text-xs text-muted-foreground">{product.brand}</p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="font-mono text-xs">
                    <div>{product.sku}</div>
                    {product.barcode ? (
                      <div className="text-[10px] text-muted-foreground">{product.barcode}</div>
                    ) : (
                      <div className="text-[10px] text-amber-600">no barcode</div>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{product.category}</Badge>
                  </TableCell>
                  <TableCell className="text-right font-semibold">
                    {formatCurrency(Number(product.selling_price))}
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge
                      variant={
                        product.stock === 0
                          ? "destructive"
                          : product.stock <= product.min_stock
                          ? "secondary"
                          : "default"
                      }
                    >
                      {product.stock}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center text-xs">
                    {product.gst_rate}%
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        title="Print / download barcode"
                        onClick={() => setBarcodeProduct(product)}
                      >
                        <BarcodeIcon className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => openEdit(product)}
                      >
                        <Edit className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-destructive hover:text-destructive"
                        onClick={() => setDeleteId(product.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>
        </TabsContent>

        <TabsContent value="adjustments" className="mt-6">
          <StockAdjustmentsPanel tenantId={tenantId} products={products} isLoading={isLoading} />
        </TabsContent>

        <TabsContent value="opening" className="mt-6">
          <OpeningStockPanel tenantId={tenantId} products={products} isLoading={isLoading} />
        </TabsContent>
      </Tabs>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>{editingProduct ? "Edit Product" : "Add Product"}</DialogTitle>
          </DialogHeader>
          <Formik
            initialValues={editingProduct || emptyProduct}
            validationSchema={validationSchema}
            onSubmit={handleSubmit}
            enableReinitialize
          >
            {({ isSubmitting }) => (
              <Form className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField name="name" label="Product Name *" />
                  <FormField name="sku" label="SKU *" />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField name="category" label="Category *" />
                  <FormField name="brand" label="Brand" />
                </div>
                <div className="grid gap-4 sm:grid-cols-3">
                  <FormField name="cost_price" label="Cost Price *" type="number" />
                  <FormField name="selling_price" label="Selling Price *" type="number" />
                  <FormField name="mrp" label="MRP" type="number" />
                </div>
                <div className="grid gap-4 sm:grid-cols-3">
                  <FormField name="stock" label="Stock *" type="number" />
                  <FormField name="min_stock" label="Min Stock *" type="number" />
                  <FormField name="gst_rate" label="GST Rate *" type="number" />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField name="unit" label="Unit" />
                  <FormField name="hsn_code" label="HSN Code" />
                </div>
                <BarcodeField products={products} editingId={editingProduct?.id} />
                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setDialogOpen(false)}
                    disabled={isSubmitting}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isSubmitting}>
                    {editingProduct ? "Update" : "Add"}
                  </Button>
                </div>
              </Form>
            )}
          </Formik>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Product?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the product. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Barcode print / download dialog */}
      <BarcodeDialog
        open={!!barcodeProduct}
        onOpenChange={(open) => !open && setBarcodeProduct(null)}
        product={
          barcodeProduct
            ? {
                name: barcodeProduct.name,
                barcode: barcodeProduct.barcode,
                sku: barcodeProduct.sku,
                price: Number(barcodeProduct.mrp || barcodeProduct.selling_price),
              }
            : null
        }
        formatPrice={formatCurrency}
      />
    </div>
  );
}

function FormField({ name, label, type = "text" }: { name: string; label: string; type?: string }) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium">{label}</label>
      <Field
        name={name}
        type={type}
        className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
      />
      <ErrorMessage name={name} component="p" className="text-xs text-destructive" />
    </div>
  );
}

/**
 * Barcode form field: text input + "Generate" button + live preview + helper
 * text. Validation (format + uniqueness) is handled by the Formik schema; this
 * component surfaces the live barcode so the user understands what will be saved.
 */
function BarcodeField({ products, editingId }: { products: Product[]; editingId?: string }) {
  const { values, setFieldValue } = useFormikContext<ProductFormValues>();
  const value = ((values.barcode as string | undefined) ?? "").toString();
  const trimmed = value.trim();

  const handleGenerate = () => {
    const existing = products
      .filter((p) => p.id !== editingId)
      .map((p) => p.barcode);
    const generated = generateUniqueBarcodeValue(existing);
    setFieldValue("barcode", generated, true);
    toast.success(`Generated barcode ${generated}`);
  };

  return (
    <div className="space-y-2 rounded-lg border bg-muted/20 p-3">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium">Barcode</label>
        {trimmed ? (
          <button
            type="button"
            className="text-xs text-muted-foreground underline-offset-2 hover:underline"
            onClick={() => setFieldValue("barcode", "", true)}
          >
            Clear
          </button>
        ) : null}
      </div>
      <div className="flex gap-2">
        <Field
          name="barcode"
          type="text"
          placeholder="Leave blank to auto-generate"
          className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm font-mono"
        />
        <Button type="button" variant="outline" className="shrink-0 gap-1.5" onClick={handleGenerate}>
          <Wand2 className="h-4 w-4" />
          Generate
        </Button>
      </div>
      <ErrorMessage name="barcode" component="p" className="text-xs text-destructive" />
      <p className="text-xs text-muted-foreground">
        Leave blank to auto-generate a unique 13-digit barcode on save, or type your own
        (4–48 characters: letters, numbers, hyphen, dot or underscore). Each product gets a
        unique barcode.
      </p>
      {trimmed ? (
        canRenderBarcode(trimmed) ? (
          <div className="flex justify-center rounded-md border bg-white p-2">
            <BarcodeLabel value={trimmed} showName={false} showPrice={false} barHeight={48} moduleWidth={1.6} />
          </div>
        ) : (
          <p className="text-xs text-amber-600">
            This value contains characters that can&apos;t be turned into a barcode.
          </p>
        )
      ) : null}
    </div>
  );
}
