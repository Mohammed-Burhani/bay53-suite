"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Save, Shield, Key, Lock } from "lucide-react";

export default function SecuritySettings() {
  return (
    <div className="space-y-6">
      <Card className="py-4">
        <CardHeader>
          <CardTitle>Password & Authentication</CardTitle>
          <CardDescription>
            Manage password and login security settings
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <Label>Two-Factor Authentication (2FA)</Label>
                <p className="text-sm text-muted-foreground">
                  Add an extra layer of security to your account
                </p>
              </div>
              <Switch />
            </div>

            <div className="flex items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <Label>Require Password Change</Label>
                <p className="text-sm text-muted-foreground">
                  Force password change every 90 days
                </p>
              </div>
              <Switch />
            </div>

            <div className="flex items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <Label>Remember Login</Label>
                <p className="text-sm text-muted-foreground">
                  Stay logged in on this device
                </p>
              </div>
              <Switch defaultChecked />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="session-timeout">Session Timeout</Label>
            <Select defaultValue="30">
              <SelectTrigger id="session-timeout">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="15">15 minutes</SelectItem>
                <SelectItem value="30">30 minutes</SelectItem>
                <SelectItem value="60">1 hour</SelectItem>
                <SelectItem value="120">2 hours</SelectItem>
                <SelectItem value="0">Never</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-3 pt-4">
            <Label>Change Password</Label>
            <div className="space-y-2">
              <Input type="password" placeholder="Current password" />
              <Input type="password" placeholder="New password" />
              <Input type="password" placeholder="Confirm new password" />
            </div>
            <Button variant="outline">
              <Key className="mr-2 h-4 w-4" />
              Update Password
            </Button>
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
          <CardTitle>Access Control</CardTitle>
          <CardDescription>
            Configure user access and permissions
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <Label>IP Whitelisting</Label>
                <p className="text-sm text-muted-foreground">
                  Restrict access to specific IP addresses
                </p>
              </div>
              <Switch />
            </div>

            <div className="flex items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <Label>Restrict Multiple Logins</Label>
                <p className="text-sm text-muted-foreground">
                  Prevent simultaneous logins from different devices
                </p>
              </div>
              <Switch />
            </div>

            <div className="flex items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <Label>Login Attempt Limit</Label>
                <p className="text-sm text-muted-foreground">
                  Lock account after failed login attempts
                </p>
              </div>
              <Switch defaultChecked />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="max-attempts">Max Login Attempts</Label>
              <Select defaultValue="5">
                <SelectTrigger id="max-attempts">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="3">3 attempts</SelectItem>
                  <SelectItem value="5">5 attempts</SelectItem>
                  <SelectItem value="10">10 attempts</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="lockout-duration">Lockout Duration</Label>
              <Select defaultValue="30">
                <SelectTrigger id="lockout-duration">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="15">15 minutes</SelectItem>
                  <SelectItem value="30">30 minutes</SelectItem>
                  <SelectItem value="60">1 hour</SelectItem>
                  <SelectItem value="1440">24 hours</SelectItem>
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
          <CardTitle>Data Security</CardTitle>
          <CardDescription>
            Configure data protection and encryption settings
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <Label>Encrypt Sensitive Data</Label>
                <p className="text-sm text-muted-foreground">
                  Encrypt customer and financial data
                </p>
              </div>
              <Switch defaultChecked />
            </div>

            <div className="flex items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <Label>Automatic Backups</Label>
                <p className="text-sm text-muted-foreground">
                  Enable automatic daily backups
                </p>
              </div>
              <Switch defaultChecked />
            </div>

            <div className="flex items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <Label>Audit Logging</Label>
                <p className="text-sm text-muted-foreground">
                  Track all user actions and changes
                </p>
              </div>
              <Switch defaultChecked />
            </div>

            <div className="flex items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <Label>Data Anonymization</Label>
                <p className="text-sm text-muted-foreground">
                  Anonymize data in reports and exports
                </p>
              </div>
              <Switch />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="backup-frequency">Backup Frequency</Label>
            <Select defaultValue="daily">
              <SelectTrigger id="backup-frequency">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="hourly">Hourly</SelectItem>
                <SelectItem value="daily">Daily</SelectItem>
                <SelectItem value="weekly">Weekly</SelectItem>
                <SelectItem value="monthly">Monthly</SelectItem>
              </SelectContent>
            </Select>
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
          <CardTitle>API & Integration Security</CardTitle>
          <CardDescription>
            Manage API keys and third-party integrations
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <Label>Enable API Access</Label>
                <p className="text-sm text-muted-foreground">
                  Allow external applications to access your data
                </p>
              </div>
              <Switch />
            </div>

            <div className="flex items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <Label>Require API Key Authentication</Label>
                <p className="text-sm text-muted-foreground">
                  Secure API endpoints with key authentication
                </p>
              </div>
              <Switch defaultChecked />
            </div>
          </div>

          <div className="space-y-2">
            <Label>API Key</Label>
            <div className="flex gap-2">
              <Input type="password" value="sk_live_xxxxxxxxxxxxxxxx" readOnly />
              <Button variant="outline">Regenerate</Button>
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

      <Card className="border-destructive">
        <CardHeader>
          <CardTitle className="text-destructive">Danger Zone</CardTitle>
          <CardDescription>
            Irreversible actions that affect your account
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between rounded-lg border border-destructive/50 p-4">
            <div className="space-y-0.5">
              <Label>Delete All Data</Label>
              <p className="text-sm text-muted-foreground">
                Permanently delete all business data
              </p>
            </div>
            <Button variant="destructive">Delete</Button>
          </div>

          <div className="flex items-center justify-between rounded-lg border border-destructive/50 p-4">
            <div className="space-y-0.5">
              <Label>Close Account</Label>
              <p className="text-sm text-muted-foreground">
                Permanently close your account
              </p>
            </div>
            <Button variant="destructive">Close Account</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
