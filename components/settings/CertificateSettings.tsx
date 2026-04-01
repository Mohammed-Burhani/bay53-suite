"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useCertificateConfig, useUpsertCertificateConfig } from "@/lib/hooks/useCertificates";
import { Loader2 } from "lucide-react";

interface CertificateSettingsProps {
  organizationId: string;
}

export function CertificateSettings({ organizationId }: CertificateSettingsProps) {
  const { data: config, isLoading } = useCertificateConfig(organizationId);
  const upsertConfig = useUpsertCertificateConfig();

  const [formData, setFormData] = useState({
    certificate_prefix: config?.certificate_prefix || "CERT",
    certificate_separator: config?.certificate_separator || "-",
    include_invoice_number: config?.include_invoice_number ?? true,
    include_date: config?.include_date ?? false,
    date_format: config?.date_format || "YYYYMMDD",
    counter_start: config?.counter_start || 1,
    counter_padding: config?.counter_padding || 4,
    custom_format: config?.custom_format || "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await upsertConfig.mutateAsync({
      organization_id: organizationId,
      ...formData,
    });
  };

  const getPreviewNumber = () => {
    const { certificate_prefix, certificate_separator, include_invoice_number, include_date, date_format, counter_padding, custom_format } = formData;
    
    if (custom_format) {
      return custom_format
        .replace("{prefix}", certificate_prefix)
        .replace("{separator}", certificate_separator)
        .replace("{invoice}", "INV001")
        .replace("{counter}", "1".padStart(counter_padding, "0"))
        .replace("{date}", "20240315");
    }

    let preview = certificate_prefix + certificate_separator;
    if (include_invoice_number) preview += "INV001" + certificate_separator;
    if (include_date) preview += "20240315" + certificate_separator;
    preview += "1".padStart(counter_padding, "0");
    return preview;
  };

  if (isLoading) {
    return (
      <Card className="py-4">
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="py-4">
      <CardHeader>
        <CardTitle>Certificate Configuration</CardTitle>
        <CardDescription>
          Customize how certificate numbers are generated
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <Tabs defaultValue="basic" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="basic">Basic Settings</TabsTrigger>
              <TabsTrigger value="advanced">Advanced</TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="space-y-4 mt-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="prefix">Certificate Prefix</Label>
                  <Input
                    id="prefix"
                    value={formData.certificate_prefix}
                    onChange={(e) => setFormData({ ...formData, certificate_prefix: e.target.value })}
                    placeholder="CERT"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="separator">Separator</Label>
                  <Input
                    id="separator"
                    value={formData.certificate_separator}
                    onChange={(e) => setFormData({ ...formData, certificate_separator: e.target.value })}
                    placeholder="-"
                    maxLength={5}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Include Invoice Number</Label>
                  <p className="text-sm text-muted-foreground">
                    Add invoice number to certificate number
                  </p>
                </div>
                <Switch
                  checked={formData.include_invoice_number}
                  onCheckedChange={(checked) => setFormData({ ...formData, include_invoice_number: checked })}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Include Date</Label>
                  <p className="text-sm text-muted-foreground">
                    Add date to certificate number
                  </p>
                </div>
                <Switch
                  checked={formData.include_date}
                  onCheckedChange={(checked) => setFormData({ ...formData, include_date: checked })}
                />
              </div>

              {formData.include_date && (
                <div className="space-y-2">
                  <Label htmlFor="dateFormat">Date Format</Label>
                  <Input
                    id="dateFormat"
                    value={formData.date_format}
                    onChange={(e) => setFormData({ ...formData, date_format: e.target.value })}
                    placeholder="YYYYMMDD"
                  />
                  <p className="text-xs text-muted-foreground">
                    Examples: YYYYMMDD, DDMMYY, YYMMDD
                  </p>
                </div>
              )}

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="counterStart">Counter Start</Label>
                  <Input
                    id="counterStart"
                    type="number"
                    value={formData.counter_start}
                    onChange={(e) => setFormData({ ...formData, counter_start: parseInt(e.target.value) })}
                    min={1}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="counterPadding">Counter Padding</Label>
                  <Input
                    id="counterPadding"
                    type="number"
                    value={formData.counter_padding}
                    onChange={(e) => setFormData({ ...formData, counter_padding: parseInt(e.target.value) })}
                    min={1}
                    max={10}
                  />
                  <p className="text-xs text-muted-foreground">
                    Number of digits (e.g., 4 = 0001)
                  </p>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="advanced" className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="customFormat">Custom Format</Label>
                <Input
                  id="customFormat"
                  value={formData.custom_format}
                  onChange={(e) => setFormData({ ...formData, custom_format: e.target.value })}
                  placeholder="{prefix}{separator}{invoice}{separator}{counter}"
                />
                <p className="text-xs text-muted-foreground">
                  Available placeholders: {"{prefix}"}, {"{separator}"}, {"{invoice}"}, {"{counter}"}, {"{date}"}
                </p>
              </div>

              <div className="rounded-lg border p-4 bg-muted/50">
                <p className="text-sm font-medium mb-2">Examples:</p>
                <ul className="text-sm space-y-1 text-muted-foreground">
                  <li>• {"{prefix}{separator}{counter}"} → CERT-0001</li>
                  <li>• {"{prefix}{separator}{invoice}{separator}{counter}"} → CERT-INV001-0001</li>
                  <li>• {"{prefix}/{date}/{counter}"} → CERT/20240315/001</li>
                  <li>• CAL-{"{date}"}-{"{counter}"} → CAL-20240315-0001</li>
                </ul>
              </div>
            </TabsContent>
          </Tabs>

          <div className="rounded-lg border p-4 bg-primary/5">
            <p className="text-sm font-medium mb-2">Preview:</p>
            <p className="text-lg font-mono">{getPreviewNumber()}</p>
          </div>

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setFormData({
                certificate_prefix: config?.certificate_prefix || "CERT",
                certificate_separator: config?.certificate_separator || "-",
                include_invoice_number: config?.include_invoice_number ?? true,
                include_date: config?.include_date ?? false,
                date_format: config?.date_format || "YYYYMMDD",
                counter_start: config?.counter_start || 1,
                counter_padding: config?.counter_padding || 4,
                custom_format: config?.custom_format || "",
              })}
            >
              Reset
            </Button>
            <Button type="submit" disabled={upsertConfig.isPending}>
              {upsertConfig.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Configuration
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
