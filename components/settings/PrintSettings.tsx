"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Save } from "lucide-react";

export default function PrintSettings() {
  return (
    <div className="space-y-6">
      <Card className="py-4">
        <CardHeader>
          <CardTitle>Print Layout</CardTitle>
          <CardDescription>
            Configure print layout and paper settings
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="paper-size">Paper Size</Label>
              <Select defaultValue="a4">
                <SelectTrigger id="paper-size">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="a4">A4 (210 x 297 mm)</SelectItem>
                  <SelectItem value="a5">A5 (148 x 210 mm)</SelectItem>
                  <SelectItem value="letter">Letter (8.5 x 11 in)</SelectItem>
                  <SelectItem value="legal">Legal (8.5 x 14 in)</SelectItem>
                  <SelectItem value="thermal-80mm">Thermal 80mm</SelectItem>
                  <SelectItem value="thermal-58mm">Thermal 58mm</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="orientation">Orientation</Label>
              <Select defaultValue="portrait">
                <SelectTrigger id="orientation">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="portrait">Portrait</SelectItem>
                  <SelectItem value="landscape">Landscape</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-4">
            <div className="space-y-2">
              <Label htmlFor="margin-top">Top Margin (mm)</Label>
              <Input id="margin-top" type="number" defaultValue="10" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="margin-right">Right Margin (mm)</Label>
              <Input id="margin-right" type="number" defaultValue="10" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="margin-bottom">Bottom Margin (mm)</Label>
              <Input id="margin-bottom" type="number" defaultValue="10" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="margin-left">Left Margin (mm)</Label>
              <Input id="margin-left" type="number" defaultValue="10" />
            </div>
          </div>

          <div className="flex items-center justify-between rounded-lg border p-4">
            <div className="space-y-0.5">
              <Label>Auto-fit Content</Label>
              <p className="text-sm text-muted-foreground">
                Automatically adjust content to fit page
              </p>
            </div>
            <Switch defaultChecked />
          </div>

          <div className="flex justify-end pt-4">
            <Button>
              <Save className="mr-2 h-4 w-4" />
              Save Changes
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="py-4">
        <CardHeader>
          <CardTitle>Print Options</CardTitle>
          <CardDescription>
            Configure default print behavior
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <Label>Auto-print After Save</Label>
                <p className="text-sm text-muted-foreground">
                  Automatically open print dialog after saving invoice
                </p>
              </div>
              <Switch />
            </div>

            <div className="flex items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <Label>Print Header on Every Page</Label>
                <p className="text-sm text-muted-foreground">
                  Show business details on all pages
                </p>
              </div>
              <Switch defaultChecked />
            </div>

            <div className="flex items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <Label>Print Footer on Every Page</Label>
                <p className="text-sm text-muted-foreground">
                  Show terms and page numbers on all pages
                </p>
              </div>
              <Switch defaultChecked />
            </div>

            <div className="flex items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <Label>Print Background Colors</Label>
                <p className="text-sm text-muted-foreground">
                  Include background colors in print
                </p>
              </div>
              <Switch />
            </div>

            <div className="flex items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <Label>Print Watermark</Label>
                <p className="text-sm text-muted-foreground">
                  Add watermark to printed documents
                </p>
              </div>
              <Switch />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="copies">Default Number of Copies</Label>
              <Select defaultValue="1">
                <SelectTrigger id="copies">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 Copy</SelectItem>
                  <SelectItem value="2">2 Copies</SelectItem>
                  <SelectItem value="3">3 Copies</SelectItem>
                  <SelectItem value="4">4 Copies</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="print-quality">Print Quality</Label>
              <Select defaultValue="high">
                <SelectTrigger id="print-quality">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <Button>
              <Save className="mr-2 h-4 w-4" />
              Save Changes
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="py-4">
        <CardHeader>
          <CardTitle>Thermal Printer Settings</CardTitle>
          <CardDescription>
            Configure thermal printer specific options
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="printer-type">Printer Type</Label>
              <Select defaultValue="standard">
                <SelectTrigger id="printer-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="standard">Standard Printer</SelectItem>
                  <SelectItem value="thermal">Thermal Printer</SelectItem>
                  <SelectItem value="dot-matrix">Dot Matrix</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="font-size">Font Size</Label>
              <Select defaultValue="medium">
                <SelectTrigger id="font-size">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="small">Small</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="large">Large</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center justify-between rounded-lg border p-4">
            <div className="space-y-0.5">
              <Label>Auto-cut Paper</Label>
              <p className="text-sm text-muted-foreground">
                Automatically cut paper after printing
              </p>
            </div>
            <Switch defaultChecked />
          </div>

          <div className="flex items-center justify-between rounded-lg border p-4">
            <div className="space-y-0.5">
              <Label>Open Cash Drawer</Label>
              <p className="text-sm text-muted-foreground">
                Trigger cash drawer after printing receipt
              </p>
            </div>
            <Switch />
          </div>

          <div className="flex justify-end pt-4">
            <Button>
              <Save className="mr-2 h-4 w-4" />
              Save Changes
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
