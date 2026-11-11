"use client";

import { useMemo, useState } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useContactCompanies } from "@/lib/bay53crm/api/queries";
import type { CrmCompanyRef } from "@/lib/bay53crm/api";
import { contactProblems, filterCompanies, type ContactInput } from "@/lib/bay53crm/contacts";
import { useDebouncedValue } from "@/lib/hooks/useDebouncedValue";

const NO_COMPANIES: CrmCompanyRef[] = [];

/** Search the CRM's companies by name and pick one. */
function CompanyPicker({ value, onChange }: { value: { id: string; name: string } | null; onChange: (company: CrmCompanyRef | null) => void }) {
  const [search, setSearch] = useState("");
  const term = useDebouncedValue(search);
  const { data: companies = NO_COMPANIES, isLoading } = useContactCompanies();
  const matches = useMemo(() => filterCompanies(companies, term), [companies, term]);

  if (value) {
    return (
      <div className="flex items-center justify-between rounded-md border px-3 py-2 text-sm">
        <span className="font-medium break-words">{value.name}</span>
        <Button type="button" variant="ghost" size="icon" className="h-7 w-7 shrink-0" aria-label="Change company" onClick={() => onChange(null)}>
          <X className="h-3.5 w-3.5" />
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <Input
        id="contact-company"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder={isLoading ? "Loading companies..." : "Search the company by name"}
        autoComplete="off"
      />
      {term.trim() && (
        <div className="max-h-48 overflow-y-auto rounded-md border">
          {matches.map((company) => (
            <button key={company.id} type="button" className="block w-full px-3 py-2 text-left text-sm hover:bg-muted" onClick={() => onChange(company)}>
              {company.companyName}
            </button>
          ))}
          {matches.length === 0 && <p className="px-3 py-2 text-xs text-muted-foreground">No company found</p>}
        </div>
      )}
    </div>
  );
}

interface ContactFormProps {
  initial: ContactInput;
  isSaving: boolean;
  submitLabel: string;
  onSubmit: (input: ContactInput) => void;
  onCancel: () => void;
}

/** Fields of a contact, for both the create and the edit dialog. */
export function ContactForm({ initial, isSaving, submitLabel, onSubmit, onCancel }: ContactFormProps) {
  const [value, setValue] = useState(initial);
  const set = <K extends keyof ContactInput>(key: K, next: ContactInput[K]) => setValue((v) => ({ ...v, [key]: next }));
  const problems = contactProblems(value);

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="contact-name">Name *</Label>
        <Input id="contact-name" value={value.firstName} onChange={(e) => set("firstName", e.target.value)} placeholder="Mr. Name Surname" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="contact-company">Company *</Label>
        <CompanyPicker
          value={value.companyId ? { id: value.companyId, name: value.companyName } : null}
          onChange={(company) => setValue((v) => ({ ...v, companyId: company?.id ?? "", companyName: company?.companyName ?? "" }))}
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="contact-mobile">Mobile</Label>
          <Input id="contact-mobile" value={value.mobile1} onChange={(e) => set("mobile1", e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="contact-email">Email</Label>
          <Input id="contact-email" type="email" value={value.email} onChange={(e) => set("email", e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="contact-phone1">Phone</Label>
          <Input id="contact-phone1" value={value.phone1} onChange={(e) => set("phone1", e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="contact-phone2">Alternate phone</Label>
          <Input id="contact-phone2" value={value.phone2} onChange={(e) => set("phone2", e.target.value)} />
        </div>
      </div>
      {problems.length > 0 && <p className="text-xs text-muted-foreground">{problems[0]}</p>}
      <div className="flex justify-end gap-2 pt-2">
        <Button variant="outline" onClick={onCancel} disabled={isSaving}>Cancel</Button>
        <Button onClick={() => onSubmit(value)} disabled={isSaving || problems.length > 0}>
          {isSaving ? "Saving..." : submitLabel}
        </Button>
      </div>
    </div>
  );
}
