"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { X } from "lucide-react";
import { useContacts } from "@/lib/bay53crm/api/queries";
import type { CrmContact } from "@/lib/bay53crm/api";
import { useDebouncedValue } from "@/lib/hooks/useDebouncedValue";

const MIN_SEARCH_LENGTH = 2;
const MAX_RESULTS = 8;
const ALL_CONTACTS = {};
const NO_CONTACTS: CrmContact[] = [];

interface ContactPickerProps {
  value: CrmContact | null;
  onChange: (contact: CrmContact | null) => void;
}

/** Search CRM contacts by company name and pick one. */
export function ContactPicker({ value, onChange }: ContactPickerProps) {
  const [search, setSearch] = useState("");
  const term = useDebouncedValue(search.trim().toLowerCase());
  const enabled = term.length >= MIN_SEARCH_LENGTH;
  // Contact/List ignores companyName and always returns every contact, so the list is fetched once and matched here.
  const { data: allContacts = NO_CONTACTS, isFetching } = useContacts(ALL_CONTACTS, { enabled });
  const contacts = useMemo(
    () =>
      enabled
        ? allContacts
            // Some contacts have no company name (null from the API); they cannot be a lead's customer.
            .filter(
              (c) =>
                !!c.companyName &&
                (c.companyName.toLowerCase().includes(term) || (c.firstName ?? "").toLowerCase().includes(term))
            )
            .slice(0, MAX_RESULTS)
        : NO_CONTACTS,
    [allContacts, term, enabled]
  );

  if (value) {
    return (
      <div className="flex items-center justify-between rounded-md border px-3 py-2 text-sm">
        <div>
          <p className="font-medium">{value.companyName}</p>
          <p className="text-xs text-muted-foreground">{value.firstName}</p>
        </div>
        <Button type="button" variant="ghost" size="icon" className="h-7 w-7" onClick={() => onChange(null)}>
          <X className="h-3.5 w-3.5" />
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <Input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search customer by company name"
      />
      {enabled && (
        <div className="max-h-48 overflow-y-auto rounded-md border">
          {contacts.map((contact) => (
            <button
              key={contact.id}
              type="button"
              className="block w-full px-3 py-2 text-left text-sm hover:bg-muted"
              onClick={() => onChange(contact)}
            >
              <span className="font-medium">{contact.companyName}</span>
              <span className="block text-xs text-muted-foreground">{contact.firstName}</span>
            </button>
          ))}
          {contacts.length === 0 && (
            <p className="px-3 py-2 text-xs text-muted-foreground">{isFetching ? "Searching..." : "No customers found"}</p>
          )}
        </div>
      )}
    </div>
  );
}
