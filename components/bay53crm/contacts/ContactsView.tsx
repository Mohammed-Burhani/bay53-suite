"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Pencil, Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { TablePagination } from "@/components/ui/table-pagination";
import { DeleteButton } from "@/components/bay53crm/shared/RecordParts";
import { usePagedRows } from "@/components/bay53crm/reports/usePagedRows";
import { useAddContact, useContacts, useDeleteContact, useUpdateContact } from "@/lib/bay53crm/api/queries";
import type { CrmContact } from "@/lib/bay53crm/api";
import { EMPTY_CONTACT, filterContacts, toContactInput, toContactModel } from "@/lib/bay53crm/contacts";
import { tolerateNotification } from "@/lib/bay53crm/save";
import { useDebouncedValue } from "@/lib/hooks/useDebouncedValue";
import { ContactForm } from "./ContactForm";

// Contact/List ignores its filters and returns the whole contact book, so it is fetched once and searched here.
const ALL_CONTACTS = {};
const NO_CONTACTS: CrmContact[] = [];

export function ContactsView() {
  const { data: contacts = NO_CONTACTS, isLoading, isError, error } = useContacts(ALL_CONTACTS);
  const addContact = useAddContact();
  const updateContact = useUpdateContact();
  const deleteContact = useDeleteContact();

  const [search, setSearch] = useState("");
  const term = useDebouncedValue(search);
  // null: dialog closed; "new": creating; a contact: editing it.
  const [editing, setEditing] = useState<CrmContact | "new" | null>(null);

  const filtered = useMemo(() => filterContacts(contacts, term), [contacts, term]);
  const { paged, pagination } = usePagedRows(filtered);

  const save = async (input: Parameters<typeof toContactModel>[0]) => {
    const existing = editing !== "new" ? editing : null;
    try {
      await tolerateNotification(
        existing ? updateContact.mutateAsync(toContactModel(input, existing.id)) : addContact.mutateAsync(toContactModel(input))
      );
      toast.success(existing ? "Contact updated" : "Contact added");
      setEditing(null);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not save the contact");
    }
  };

  const remove = async (contact: CrmContact) => {
    try {
      await deleteContact.mutateAsync(contact.id);
      toast.success("Contact deleted");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not delete the contact");
    }
  };

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Contacts</h1>
          <p className="text-sm text-muted-foreground">{filtered.length.toLocaleString("en-IN")} contacts</p>
        </div>
        <Button onClick={() => setEditing("new")}>
          <Plus className="h-4 w-4 mr-1" />
          New Contact
        </Button>
      </div>

      <Card>
        <CardContent className="p-3">
          <div className="relative max-w-md">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              aria-label="Search contacts"
              placeholder="Search by name, company, phone or email"
              className="pl-8 h-8"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <div className="overflow-auto max-h-[60vh]">
          <Table>
            <TableHeader>
              <TableRow className="sticky top-0 bg-background z-10">
                <TableHead>Name</TableHead>
                <TableHead>Company</TableHead>
                <TableHead>Mobile</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paged.map((contact) => (
                <TableRow key={contact.id}>
                  <TableCell className="font-medium text-xs max-w-[200px] truncate" title={contact.firstName}>{contact.firstName}</TableCell>
                  <TableCell className="text-xs max-w-[260px] truncate" title={contact.companyName}>{contact.companyName}</TableCell>
                  <TableCell className="text-xs">{contact.mobile1}</TableCell>
                  <TableCell className="text-xs">{contact.phone1}</TableCell>
                  <TableCell className="text-xs max-w-[200px] truncate" title={contact.email}>{contact.email}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" className="h-7 w-7" aria-label="Edit contact" onClick={() => setEditing(contact)}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <DeleteButton what="this contact" onConfirm={() => remove(contact)} disabled={deleteContact.isPending} />
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {(isLoading || isError || filtered.length === 0) && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    {isLoading
                      ? "Loading contacts..."
                      : isError
                        ? `Could not load contacts: ${error instanceof Error ? error.message : "unknown error"}`
                        : "No contacts found matching the search"}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
        {filtered.length > 0 && <TablePagination {...pagination} />}
      </Card>

      <Dialog open={editing !== null} onOpenChange={(open) => !open && setEditing(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing === "new" ? "New Contact" : "Edit Contact"}</DialogTitle>
            <DialogDescription>The person a lead is raised for, and the company they work for.</DialogDescription>
          </DialogHeader>
          {/* Mounted only while open, so the form starts from the contact being edited each time. */}
          {editing !== null && (
            <ContactForm
              initial={editing === "new" ? EMPTY_CONTACT : toContactInput(editing)}
              isSaving={addContact.isPending || updateContact.isPending}
              submitLabel={editing === "new" ? "Add Contact" : "Save"}
              onCancel={() => setEditing(null)}
              onSubmit={save}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
