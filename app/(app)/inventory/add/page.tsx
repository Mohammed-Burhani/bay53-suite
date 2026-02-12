"use client";

import { useRouter } from "next/navigation";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import { addProduct } from "@/lib/store";
import { PRODUCT_CATEGORIES, GST_RATES, UNITS } from "@/lib/types";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Plus } from "lucide-react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

const productSchema = Yup.object().shape({
  name: Yup.string().required("Product name is required").min(2, "Min 2 characters"),
  sku: Yup.string().required("SKU is required"),
  barcode: Yup.string(),
  category: Yup.string().required("Category is required"),
  brand: Yup.string(),
  description: Yup.string(),
  costPrice: Yup.number().required("Cost price is required").min(0, "Must be positive"),
  sellingPrice: Yup.number().required("Selling price is required").min(0, "Must be positive"),
  mrp: Yup.number().required("MRP is required").min(0, "Must be positive"),
  gstRate: Yup.number().required("GST rate is required"),
  hsnCode: Yup.string(),
  unit: Yup.string().required("Unit is required"),
  stock: Yup.number().required("Stock is required").min(0, "Must be positive"),
  lowStockThreshold: Yup.number().required("Threshold is required").min(0),
});

type ProductFormValues = Yup.InferType<typeof productSchema>;

const emptyProduct: ProductFormValues = {
  name: "",
  sku: "",
  barcode: "",
  category: "",
  brand: "",
  description: "",
  costPrice: 0,
  sellingPrice: 0,
  mrp: 0,
  gstRate: 18,
  hsnCode: "",
  unit: "Pcs",
  stock: 0,
  lowStockThreshold: 5,
};

export default function AddProductPage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const handleSubmit = (values: ProductFormValues) => {
    const product = { 
      ...values, 
      isActive: true,
      imageUrl: undefined,
    };
    addProduct(product as Parameters<typeof addProduct>[0]);
    toast.success("Product added successfully");
    queryClient.invalidateQueries({ queryKey: ["products"] });
    queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    router.push("/inventory");
  };

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Add New Product</h1>
          <p className="text-sm text-muted-foreground">Create a new product in your inventory</p>
        </div>
      </div>

      <Card>
        <CardContent className="p-6">
          <Formik
            initialValues={emptyProduct}
            validationSchema={productSchema}
            onSubmit={handleSubmit}
          >
            {({ setFieldValue, values, isSubmitting }) => (
              <Form className="grid gap-6">
                {/* Basic Info */}
                <div className="rounded-lg border p-4 space-y-4">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Basic Information</p>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <FormField name="name" label="Product Name *" />
                    <FormField name="sku" label="SKU *" />
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <FormField name="barcode" label="Barcode" />
                    <FormField name="brand" label="Brand" />
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium">Category *</label>
                      <select
                        className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
                        value={values.category}
                        onChange={(e) => setFieldValue("category", e.target.value)}
                      >
                        <option value="">Select category</option>
                        {PRODUCT_CATEGORIES.map((c) => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                      <ErrorMessage name="category" component="p" className="text-xs text-destructive" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium">Unit *</label>
                      <select
                        className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
                        value={values.unit}
                        onChange={(e) => setFieldValue("unit", e.target.value)}
                      >
                        {UNITS.map((u) => (
                          <option key={u} value={u}>{u}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Pricing */}
                <div className="rounded-lg border p-4 space-y-4">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Pricing & Tax</p>
                  <div className="grid gap-4 sm:grid-cols-3">
                    <FormField name="costPrice" label="Cost Price (₹) *" type="number" />
                    <FormField name="sellingPrice" label="Selling Price (₹) *" type="number" />
                    <FormField name="mrp" label="MRP (₹) *" type="number" />
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium">GST Rate *</label>
                      <select
                        className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
                        value={values.gstRate}
                        onChange={(e) => setFieldValue("gstRate", Number(e.target.value))}
                      >
                        {GST_RATES.map((r) => (
                          <option key={r} value={r}>{r}%</option>
                        ))}
                      </select>
                    </div>
                    <FormField name="hsnCode" label="HSN Code" />
                  </div>
                </div>

                {/* Stock */}
                <div className="rounded-lg border p-4 space-y-4">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Stock</p>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <FormField name="stock" label="Opening Stock *" type="number" />
                    <FormField name="lowStockThreshold" label="Low Stock Threshold" type="number" />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Description</label>
                  <Field
                    as="textarea"
                    name="description"
                    className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    rows={3}
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <Button type="button" variant="outline" onClick={() => router.back()}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isSubmitting} className="gap-2">
                    <Plus className="h-4 w-4" />
                    Add Product
                  </Button>
                </div>
              </Form>
            )}
          </Formik>
        </CardContent>
      </Card>
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
