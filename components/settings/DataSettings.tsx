"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Download, Upload, Trash2, Database, FileDown, FileUp, RefreshCw } from "lucide-react";
import { Progress } from "@/components/ui/progress";

export default function DataSettings() {
  return (
    <div className="space-y-6">
      <Card className="py-4">
        <CardHeader>
          <CardTitle>Backup & Restore</CardTitle>
          <CardDescription>
            Manage your data backups and restoration
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <Label>Automatic Backups</Label>
                <p className="text-sm text-muted-foreground">
                  Enable scheduled automatic backups
                </p>
              </div>
              <Switch defaultChecked />
            </div>

            <div className="flex items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <Label>Cloud Backup</Label>
                <p className="text-sm text-muted-foreground">
                  Store backups in cloud storage
                </p>
              </div>
              <Switch defaultChecked />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="backup-frequency">Backup Frequency</Label>
              <Select defaultValue="daily">
                <SelectTrigger id="backup-frequency">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="hourly">Every Hour</SelectItem>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="backup-retention">Retention Period</Label>
              <Select defaultValue="30">
                <SelectTrigger id="backup-retention">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7">7 days</SelectItem>
                  <SelectItem value="30">30 days</SelectItem>
                  <SelectItem value="90">90 days</SelectItem>
                  <SelectItem value="365">1 year</SelectItem>
                  <SelectItem value="0">Forever</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-3 pt-4">
            <Label>Manual Backup</Label>
            <div className="flex gap-2">
              <Button className="flex-1">
                <Download className="mr-2 h-4 w-4" />
                Create Backup Now
              </Button>
              <Button variant="outline" className="flex-1">
                <Upload className="mr-2 h-4 w-4" />
                Restore from Backup
              </Button>
            </div>
          </div>

          <div className="space-y-2 pt-4">
            <Label>Recent Backups</Label>
            <div className="space-y-2">
              {[
                { date: "2025-03-06 10:30 AM", size: "45.2 MB", status: "completed" },
                { date: "2025-03-05 10:30 AM", size: "44.8 MB", status: "completed" },
                { date: "2025-03-04 10:30 AM", size: "44.5 MB", status: "completed" },
              ].map((backup, i) => (
                <div key={i} className="flex items-center justify-between rounded-lg border p-3">
                  <div>
                    <div className="text-sm font-medium">{backup.date}</div>
                    <div className="text-xs text-muted-foreground">{backup.size}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button size="sm" variant="outline">
                      <Download className="h-3 w-3" />
                    </Button>
                    <Button size="sm" variant="outline">
                      <RefreshCw className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="py-4">
        <CardHeader>
          <CardTitle>Import & Export</CardTitle>
          <CardDescription>
            Import and export your business data
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Export Data</Label>
            <div className="grid gap-2 md:grid-cols-2">
              <Button variant="outline">
                <FileDown className="mr-2 h-4 w-4" />
                Export Products
              </Button>
              <Button variant="outline">
                <FileDown className="mr-2 h-4 w-4" />
                Export Customers
              </Button>
              <Button variant="outline">
                <FileDown className="mr-2 h-4 w-4" />
                Export Invoices
              </Button>
              <Button variant="outline">
                <FileDown className="mr-2 h-4 w-4" />
                Export Reports
              </Button>
            </div>
          </div>

          <div className="space-y-2 pt-4">
            <Label>Import Data</Label>
            <div className="grid gap-2 md:grid-cols-2">
              <Button variant="outline">
                <FileUp className="mr-2 h-4 w-4" />
                Import Products
              </Button>
              <Button variant="outline">
                <FileUp className="mr-2 h-4 w-4" />
                Import Customers
              </Button>
            </div>
          </div>

          <div className="space-y-2 pt-4">
            <Label htmlFor="export-format">Export Format</Label>
            <Select defaultValue="csv">
              <SelectTrigger id="export-format">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="csv">CSV</SelectItem>
                <SelectItem value="excel">Excel (XLSX)</SelectItem>
                <SelectItem value="json">JSON</SelectItem>
                <SelectItem value="pdf">PDF</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between rounded-lg border p-4">
            <div className="space-y-0.5">
              <Label>Include Archived Data</Label>
              <p className="text-sm text-muted-foreground">
                Export archived and deleted records
              </p>
            </div>
            <Switch />
          </div>
        </CardContent>
      </Card>

      <Card className="py-4">
        <CardHeader>
          <CardTitle>Data Cleanup</CardTitle>
          <CardDescription>
            Manage and clean up old data
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <Label>Auto-delete Old Records</Label>
                <p className="text-sm text-muted-foreground">
                  Automatically remove old data after specified period
                </p>
              </div>
              <Switch />
            </div>

            <div className="flex items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <Label>Archive Completed Transactions</Label>
                <p className="text-sm text-muted-foreground">
                  Move old transactions to archive
                </p>
              </div>
              <Switch defaultChecked />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="retention-period">Data Retention Period</Label>
            <Select defaultValue="365">
              <SelectTrigger id="retention-period">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="90">3 months</SelectItem>
                <SelectItem value="180">6 months</SelectItem>
                <SelectItem value="365">1 year</SelectItem>
                <SelectItem value="730">2 years</SelectItem>
                <SelectItem value="1825">5 years</SelectItem>
                <SelectItem value="0">Never delete</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2 pt-4">
            <Label>Storage Usage</Label>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Database Size</span>
                <span className="font-medium">245 MB / 1 GB</span>
              </div>
              <Progress value={24.5} />
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <Button variant="outline">
              <Trash2 className="mr-2 h-4 w-4" />
              Clean Up Now
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="py-4">
        <CardHeader>
          <CardTitle>Database Maintenance</CardTitle>
          <CardDescription>
            Optimize and maintain database performance
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <Label>Auto-optimize Database</Label>
                <p className="text-sm text-muted-foreground">
                  Automatically optimize database weekly
                </p>
              </div>
              <Switch defaultChecked />
            </div>

            <div className="flex items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <Label>Vacuum Database</Label>
                <p className="text-sm text-muted-foreground">
                  Reclaim storage space from deleted records
                </p>
              </div>
              <Switch defaultChecked />
            </div>
          </div>

          <div className="space-y-2 pt-4">
            <Label>Database Statistics</Label>
            <div className="grid gap-3 md:grid-cols-2">
              <div className="rounded-lg border p-3">
                <div className="text-sm text-muted-foreground">Total Records</div>
                <div className="text-2xl font-bold">12,458</div>
              </div>
              <div className="rounded-lg border p-3">
                <div className="text-sm text-muted-foreground">Last Optimized</div>
                <div className="text-2xl font-bold">2 days ago</div>
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <Button>
              <Database className="mr-2 h-4 w-4" />
              Optimize Now
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="border-destructive">
        <CardHeader>
          <CardTitle className="text-destructive">Danger Zone</CardTitle>
          <CardDescription>
            Irreversible data operations
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between rounded-lg border border-destructive/50 p-4">
            <div className="space-y-0.5">
              <Label>Reset All Data</Label>
              <p className="text-sm text-muted-foreground">
                Delete all data and start fresh
              </p>
            </div>
            <Button variant="destructive">Reset</Button>
          </div>

          <div className="flex items-center justify-between rounded-lg border border-destructive/50 p-4">
            <div className="space-y-0.5">
              <Label>Delete Database</Label>
              <p className="text-sm text-muted-foreground">
                Permanently delete entire database
              </p>
            </div>
            <Button variant="destructive">Delete</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
