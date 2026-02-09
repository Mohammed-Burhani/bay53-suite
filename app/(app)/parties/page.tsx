"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import {
  getParties,
  addParty,
  updateParty,
  deleteParty,
  formatCurrency,
} from "@/lib/store";
import { Party, INDIAN_STATES } from "@/lib/types";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { Plus, Search, Edit, Trash2, Users, Phone, MapPin } from "lucide-react";
import { toast } from "sonner";

const partySchema = Yup.object().shape({
  name: Yup.string().required("Name is required"),
  phone: Yup.string().required("Phone is required").matches(/^[6-9]\d{9}$/, "Enter a valid 10-digit Indian mobile number"),
  email: Yup.string().email("Invalid email"),
  gstin: Yup.string().matches(/^$|^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/, "Invalid GSTIN format"),
  address: Yup.string(),
  city: Yup.string(),
  state: Yup.string(),
  pincode: Yup.string().matches(/^$|^\d{6}$/, "Invalid pincode"),
});

export default function PartiesPage() {
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<"customer" | "supplier">("customer");
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingParty, setEditingParty] = useState<Party | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data: parties = [] } = useQuery({
    queryKey: ["parties", tab],
    queryFn: () => getParties(tab),
  });

  const filtered = parties.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.phone.includes(search) ||
      (p.gstin && p.gstin.toLowerCase().includes(search.toLowerCase()))
  );

  const totalBalance = parties.reduce((sum, p) => sum + p.balance, 0);

  const handleSubmit = (values: Yup.InferType<typeof partySchema>) => {
    if (editingParty) {
      updateParty(editingParty.id, values);
      toast.success(`${tab === "customer" ? "Customer" : "Supplier"} updated`);
    } else {
      addParty({ ...values, type: tab, balance: 0 } as Omit<Party, "id" | "createdAt">);
      toast.success(`${tab === "customer" ? "Customer" : "Supplier"} added`);
    }
    queryClient.invalidateQueries({ queryKey: ["parties"] });
    queryClient.invalidateQueries({ queryKey: ["customers"] });
    queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    setDialogOpen(false);
    setEditingParty(null);
  };

  const handleDelete = () => {
    if (deleteId) {
      deleteParty(deleteId);
      toast.success("Deleted successfully");
      queryClient.invalidateQueries({ queryKey: ["parties"] });
      setDeleteId(null);
    }
  };

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Parties</h1>
          <p className="text-sm text-muted-foreground">Manage customers & suppliers</p>
        </div>
          <Button onClick={() => { setEditingParty(null); setDialogOpen(true); }} className="gap-2 bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 text-white shadow-md shadow-indigo-500/25">
          <Plus className="h-4 w-4" />
          Add {tab === "customer" ? "Customer" : "Supplier"}
        </Button>
      </div>

      <Tabs value={tab} onValueChange={(v) => setTab(v as "customer" | "supplier")}>
        <TabsList>
          <TabsTrigger value="customer" className="gap-2">
            <Users className="h-3.5 w-3.5" />
            Customers
          </TabsTrigger>
          <TabsTrigger value="supplier" className="gap-2">
            <Users className="h-3.5 w-3.5" />
            Suppliers
          </TabsTrigger>
        </TabsList>

        <TabsContent value={tab} className="mt-4 space-y-4">
            {/* Summary */}
            <div className="grid gap-4 sm:grid-cols-3">
              <Card className="card-hover border-l-4 border-l-pink-500">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="rounded-xl bg-pink-100 p-2.5">
                    <Users className="h-5 w-5 text-pink-600" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider">
                      Total {tab === "customer" ? "Customers" : "Suppliers"}
                    </p>
                    <p className="text-xl font-bold mt-1">{parties.length}</p>
                  </div>
                </CardContent>
              </Card>
              <Card className={`card-hover border-l-4 ${tab === "customer" ? "border-l-emerald-500" : "border-l-amber-500"}`}>
                <CardContent className="p-4 flex items-center gap-3">
                  <div className={`rounded-xl p-2.5 ${tab === "customer" ? "bg-emerald-100" : "bg-amber-100"}`}>
                    <Phone className={`h-5 w-5 ${tab === "customer" ? "text-emerald-600" : "text-amber-600"}`} />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider">
                      {tab === "customer" ? "Total Receivable" : "Total Payable"}
                    </p>
                    <p className={`text-xl font-bold mt-1 ${tab === "customer" ? "text-emerald-600" : "text-amber-600"}`}>
                      {formatCurrency(Math.abs(totalBalance))}
                    </p>
                  </div>
                </CardContent>
              </Card>
              <Card className="card-hover border-l-4 border-l-indigo-500">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="rounded-xl bg-indigo-100 p-2.5">
                    <MapPin className="h-5 w-5 text-indigo-600" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider">With Balance</p>
                    <p className="text-xl font-bold mt-1">
                      {parties.filter((p) => p.balance !== 0).length}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>

          {/* Search */}
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by name, phone, or GSTIN..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Table */}
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>GSTIN</TableHead>
                    <TableHead className="text-right">Balance</TableHead>
                    <TableHead className="text-right w-[100px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="py-12 text-center">
                        <Users className="mx-auto h-8 w-8 text-muted-foreground/40" />
                        <p className="mt-2 text-sm text-muted-foreground">
                          No {tab === "customer" ? "customers" : "suppliers"} found
                        </p>
                      </TableCell>
                    </TableRow>
                  ) : (
                      filtered.map((party) => (
                        <TableRow key={party.id} className="hover:bg-muted/30 transition-colors">
                        <TableCell>
                          <div>
                            <p className="font-medium text-sm">{party.name}</p>
                            {party.email && (
                              <p className="text-xs text-muted-foreground">{party.email}</p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="flex items-center gap-1 text-sm">
                            <Phone className="h-3 w-3 text-muted-foreground" />
                            {party.phone}
                          </span>
                        </TableCell>
                        <TableCell>
                          {party.city ? (
                            <span className="flex items-center gap-1 text-sm text-muted-foreground">
                              <MapPin className="h-3 w-3" />
                              {party.city}{party.state ? `, ${party.state}` : ""}
                            </span>
                          ) : (
                            <span className="text-xs text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {party.gstin ? (
                            <span className="font-mono text-xs">{party.gstin}</span>
                          ) : (
                            <span className="text-xs text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          {party.balance !== 0 ? (
                            <Badge
                              variant={party.balance > 0 ? "default" : "secondary"}
                              className="text-xs"
                            >
                              {formatCurrency(Math.abs(party.balance))}
                            </Badge>
                          ) : (
                            <span className="text-xs text-muted-foreground">Settled</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => { setEditingParty(party); setDialogOpen(true); }}
                            >
                              <Edit className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive hover:text-destructive"
                              onClick={() => setDeleteId(party.id)}
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
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) setEditingParty(null); }}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingParty ? "Edit" : "Add"} {tab === "customer" ? "Customer" : "Supplier"}
            </DialogTitle>
          </DialogHeader>
          <Formik
            initialValues={editingParty ? {
              name: editingParty.name,
              phone: editingParty.phone,
              email: editingParty.email || "",
              gstin: editingParty.gstin || "",
              address: editingParty.address || "",
              city: editingParty.city || "",
              state: editingParty.state || "",
              pincode: editingParty.pincode || "",
            } : {
              name: "",
              phone: "",
              email: "",
              gstin: "",
              address: "",
              city: "",
              state: "",
              pincode: "",
            }}
            validationSchema={partySchema}
            onSubmit={handleSubmit}
            enableReinitialize
          >
            {({ setFieldValue, values, isSubmitting }) => (
              <Form className="grid gap-4">
                <PartyFormField name="name" label="Name *" />
                <PartyFormField name="phone" label="Phone * (10-digit)" />
                <PartyFormField name="email" label="Email" />
                <PartyFormField name="gstin" label="GSTIN" placeholder="e.g. 07AAACR5055K1Z5" />
                <PartyFormField name="address" label="Address" />
                <div className="grid gap-4 sm:grid-cols-3">
                  <PartyFormField name="city" label="City" />
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium">State</label>
                    <select
                      className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                      value={values.state}
                      onChange={(e) => setFieldValue("state", e.target.value)}
                    >
                      <option value="">Select</option>
                      {INDIAN_STATES.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>
                  <PartyFormField name="pincode" label="Pincode" />
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isSubmitting}>
                    {editingParty ? "Update" : "Add"} {tab === "customer" ? "Customer" : "Supplier"}
                  </Button>
                </div>
              </Form>
            )}
          </Formik>
        </DialogContent>
      </Dialog>

      {/* Delete */}
      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {tab === "customer" ? "Customer" : "Supplier"}</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. All related data will be lost.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-white hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function PartyFormField({
  name,
  label,
  placeholder,
}: {
  name: string;
  label: string;
  placeholder?: string;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium">{label}</label>
      <Field
        name={name}
        placeholder={placeholder}
        className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
      />
      <ErrorMessage name={name} component="p" className="text-xs text-destructive" />
    </div>
  );
}
