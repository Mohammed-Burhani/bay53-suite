"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCompany, useUpdateCompany } from "@/lib/bay53crm/api/queries";
import type { CrmCompany } from "@/lib/bay53crm/api";
import { formatCurrency } from "@/lib/bay53crm/constants";

// The CRM keeps a single company record; any other id answers "Record not found".
const COMPANY_ID = 1;

export function CompanyView() {
  const { data: company, isLoading, isError, error } = useCompany(COMPANY_ID);

  return (
    <div className="flex flex-col gap-6 p-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Company Settings</h1>
        <p className="text-sm text-muted-foreground">Manage your company information</p>
      </div>

      {isLoading && <p className="text-sm text-muted-foreground">Loading...</p>}
      {isError && (
        <p className="text-sm text-destructive">
          Could not load the company: {error instanceof Error ? error.message : "unknown error"}
        </p>
      )}
      {/* Keyed by the saved values, so the form restarts from the server copy after a save. */}
      {company && <CompanyForm key={`${company.name}|${company.yearlyTargetRevenue}`} company={company} />}
    </div>
  );
}

function CompanyForm({ company }: { company: CrmCompany }) {
  const updateCompany = useUpdateCompany();
  const [name, setName] = useState(company.name);
  const [yearlyTarget, setYearlyTarget] = useState(String(company.yearlyTargetRevenue));

  const canSave = !!name.trim() && Number(yearlyTarget) > 0;

  const handleSave = async () => {
    try {
      await updateCompany.mutateAsync({ id: company.id, name: name.trim(), yearlyTargetRevenue: Number(yearlyTarget) });
      toast.success("Company settings saved");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not save the company settings");
    }
  };

  return (
    <Card className="max-w-xl">
      <CardHeader>
        <CardTitle>Company Configuration</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="company-name">Company Name *</Label>
          <Input id="company-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Enter company name" />
        </div>

        <div className="space-y-2">
          <Label htmlFor="company-target">Yearly Target Revenue (₹) *</Label>
          <Input
            id="company-target"
            type="number"
            min={0}
            value={yearlyTarget}
            onChange={(e) => setYearlyTarget(e.target.value)}
            placeholder="150000000"
          />
          {Number(yearlyTarget) > 0 && (
            <p className="text-xs text-muted-foreground">Target: {formatCurrency(Number(yearlyTarget))}</p>
          )}
        </div>

        <Button onClick={handleSave} disabled={!canSave || updateCompany.isPending}>
          {updateCompany.isPending ? "Saving..." : "Save"}
        </Button>
      </CardContent>
    </Card>
  );
}
