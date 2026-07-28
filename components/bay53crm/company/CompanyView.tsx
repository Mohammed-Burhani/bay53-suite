"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCRMCompanyConfig, useUpdateCRMCompanyConfig } from "@/lib/hooks/useCRM";
import { formatCurrency } from "@/lib/bay53crm/constants";

export function CompanyView() {
  const { data: companyConfig, isLoading } = useCRMCompanyConfig();
  const updateMutation = useUpdateCRMCompanyConfig();

  const [companyName, setCompanyName] = useState("");
  const [yearlyTarget, setYearlyTarget] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (companyConfig) {
      setCompanyName(companyConfig.companyName);
      setYearlyTarget(String(companyConfig.yearlyTargetRevenue));
    }
  }, [companyConfig]);

  const handleSave = () => {
    if (!companyName.trim() || !yearlyTarget) return;
    updateMutation.mutate(
      {
        companyName: companyName.trim(),
        yearlyTargetRevenue: Number(yearlyTarget),
      },
      {
        onSuccess: () => {
          setSaved(true);
          setTimeout(() => setSaved(false), 3000);
        },
      }
    );
  };

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6 p-6">
        <h1 className="text-2xl font-bold tracking-tight">Company Settings</h1>
        <p className="text-sm text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Company Settings</h1>
        <p className="text-sm text-muted-foreground">Manage your company information</p>
      </div>

      <Card className="max-w-xl">
        <CardHeader>
          <CardTitle>Company Configuration</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Company Name *</Label>
            <Input
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              placeholder="Enter company name"
            />
          </div>

          <div className="space-y-2">
            <Label>Yearly Target Revenue (₹) *</Label>
            <Input
              type="number"
              value={yearlyTarget}
              onChange={(e) => setYearlyTarget(e.target.value)}
              placeholder="150000000"
            />
            {yearlyTarget && (
              <p className="text-xs text-muted-foreground">
                Target: {formatCurrency(Number(yearlyTarget))}
              </p>
            )}
          </div>

          {companyConfig && (
            <p className="text-xs text-muted-foreground">
              Last updated: {new Date(companyConfig.updatedAt).toLocaleString("en-IN")}
            </p>
          )}

          <div className="flex items-center gap-3">
            <Button
              onClick={handleSave}
              disabled={!companyName.trim() || !yearlyTarget || updateMutation.isPending}
            >
              {updateMutation.isPending ? "Saving..." : "Save"}
            </Button>
            {saved && (
              <span className="text-sm text-green-600">Saved successfully!</span>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
