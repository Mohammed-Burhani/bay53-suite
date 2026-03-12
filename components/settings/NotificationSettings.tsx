"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Save } from "lucide-react";

export default function NotificationSettings() {
  return (
    <div className="space-y-6">
      <Card className="py-4">
        <CardHeader>
          <CardTitle>Email Notifications</CardTitle>
          <CardDescription>
            Configure email notification preferences
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <Label>Low Stock Alerts</Label>
                <p className="text-sm text-muted-foreground">
                  Get notified when products are running low
                </p>
              </div>
              <Switch defaultChecked />
            </div>

            <div className="flex items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <Label>Payment Reminders</Label>
                <p className="text-sm text-muted-foreground">
                  Send reminders for pending payments
                </p>
              </div>
              <Switch defaultChecked />
            </div>

            <div className="flex items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <Label>Daily Sales Summary</Label>
                <p className="text-sm text-muted-foreground">
                  Receive daily sales report via email
                </p>
              </div>
              <Switch />
            </div>

            <div className="flex items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <Label>New Customer Registration</Label>
                <p className="text-sm text-muted-foreground">
                  Get notified when new customers are added
                </p>
              </div>
              <Switch />
            </div>

            <div className="flex items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <Label>Invoice Status Updates</Label>
                <p className="text-sm text-muted-foreground">
                  Notifications for invoice payment status changes
                </p>
              </div>
              <Switch defaultChecked />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notification-email">Notification Email</Label>
            <Input id="notification-email" type="email" placeholder="notifications@example.com" />
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
          <CardTitle>SMS Notifications</CardTitle>
          <CardDescription>
            Configure SMS notification preferences
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <Label>Enable SMS Notifications</Label>
                <p className="text-sm text-muted-foreground">
                  Send SMS for important updates
                </p>
              </div>
              <Switch />
            </div>

            <div className="flex items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <Label>Invoice SMS to Customers</Label>
                <p className="text-sm text-muted-foreground">
                  Send invoice details via SMS
                </p>
              </div>
              <Switch />
            </div>

            <div className="flex items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <Label>Payment Confirmation SMS</Label>
                <p className="text-sm text-muted-foreground">
                  Send SMS when payment is received
                </p>
              </div>
              <Switch />
            </div>

            <div className="flex items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <Label>Due Date Reminders</Label>
                <p className="text-sm text-muted-foreground">
                  Send SMS reminders before due date
                </p>
              </div>
              <Switch />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="sms-provider">SMS Provider</Label>
              <Select defaultValue="twilio">
                <SelectTrigger id="sms-provider">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="twilio">Twilio</SelectItem>
                  <SelectItem value="msg91">MSG91</SelectItem>
                  <SelectItem value="textlocal">TextLocal</SelectItem>
                  <SelectItem value="custom">Custom</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="sender-id">Sender ID</Label>
              <Input id="sender-id" placeholder="e.g., MYBIZ" />
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
          <CardTitle>In-App Notifications</CardTitle>
          <CardDescription>
            Configure in-app notification preferences
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <Label>Desktop Notifications</Label>
                <p className="text-sm text-muted-foreground">
                  Show browser notifications
                </p>
              </div>
              <Switch defaultChecked />
            </div>

            <div className="flex items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <Label>Sound Alerts</Label>
                <p className="text-sm text-muted-foreground">
                  Play sound for important notifications
                </p>
              </div>
              <Switch defaultChecked />
            </div>

            <div className="flex items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <Label>Show Notification Badge</Label>
                <p className="text-sm text-muted-foreground">
                  Display unread notification count
                </p>
              </div>
              <Switch defaultChecked />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notification-duration">Notification Duration</Label>
            <Select defaultValue="5">
              <SelectTrigger id="notification-duration">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="3">3 seconds</SelectItem>
                <SelectItem value="5">5 seconds</SelectItem>
                <SelectItem value="10">10 seconds</SelectItem>
                <SelectItem value="0">Until dismissed</SelectItem>
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
          <CardTitle>Alert Thresholds</CardTitle>
          <CardDescription>
            Set thresholds for automated alerts
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="low-stock-threshold">Low Stock Threshold</Label>
              <Input id="low-stock-threshold" type="number" defaultValue="5" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="payment-reminder-days">Payment Reminder (Days Before)</Label>
              <Input id="payment-reminder-days" type="number" defaultValue="3" />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="overdue-alert-days">Overdue Alert (Days After)</Label>
              <Input id="overdue-alert-days" type="number" defaultValue="7" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="high-value-threshold">High Value Transaction Alert</Label>
              <Input id="high-value-threshold" type="number" placeholder="e.g., 50000" />
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
    </div>
  );
}
