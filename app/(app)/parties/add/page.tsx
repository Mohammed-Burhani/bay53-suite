"use client";

import { useRouter } from "next/navigation";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import { addParty } from "@/lib/store";
import { INDIAN_STATES } from "@/lib/types";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

const partySchema = Yup.object().shape({
  name: Yup.string().required("Name is required").min(2, "Min 2 characters"),
  type: Yup.string().required("Type is required"),
  phone: Yup.string().required("Phone is required").matches(/^[0-9]{10}$/, "Must be 10 digits"),
  email: Yup.string().email("Invalid email"),
  gstin: Yup.string().matches(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/, "Invalid GSTIN format").nullable(),
  address: Yup.string(),
  city: Yup.string(),
  state: Yup.string(),
  pincode: Yup.string().matches(/^[0-9]{6}$/, "Must be 6 digits").nullable(),
});

type PartyFormValues = Yup.InferType<typeof partySchema>;

const emptyParty: PartyFormValues = {
  name: "",
  type: "customer",
  phone: "",
  email: "",
  gstin: "",
  address: "",
  city: "",
  state: "",
  pincode: "",
};

export default function AddPartyPage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const handleSubmit = (values: PartyFormValues) => {
    const party = { ...values, balance: 0 };
    addParty(party as Parameters<typeof addParty>[0]);
    toast.success(`${values.type === "customer" ? "Customer" : "Supplier"} added successfully`);
    queryClient.invalidateQueries({ queryKey: ["parties"] });
    router.push("/parties");
  };

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Add New Party</h1>
          <p className="text-sm text-muted-foreground">Add a customer or supplier</p>
        </div>
      </div>

      <Card>
        <CardContent className="p-6">
          <Formik
            initialValues={emptyParty}
            validationSchema={partySchema}
            onSubmit={handleSubmit}
          >
            {({ setFieldValue, values, isSubmitting }) => (
              <Form className="grid gap-6">
                <div className="rounded-lg border p-4 space-y-4">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Basic Information</p>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium">Party Type *</label>
                    <select
                      className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
                      value={values.type}
                      onChange={(e) => setFieldValue("type", e.target.value)}
                    >
                      <option value="customer">Customer</option>
                      <option value="supplier">Supplier</option>
                    </select>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <FormField name="name" label="Name *" />
                    <FormField name="phone" label="Phone *" />
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <FormField name="email" label="Email" type="email" />
                    <FormField name="gstin" label="GSTIN" />
                  </div>
                </div>

                <div className="rounded-lg border p-4 space-y-4">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Address</p>
                  <FormField name="address" label="Address" />
                  <div className="grid gap-4 sm:grid-cols-3">
                    <FormField name="city" label="City" />
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium">State</label>
                      <select
                        className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
                        value={values.state}
                        onChange={(e) => setFieldValue("state", e.target.value)}
                      >
                        <option value="">Select state</option>
                        {INDIAN_STATES.map((s) => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    </div>
                    <FormField name="pincode" label="Pincode" />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <Button type="button" variant="outline" onClick={() => router.back()}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isSubmitting} className="gap-2">
                    <UserPlus className="h-4 w-4" />
                    Add Party
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
