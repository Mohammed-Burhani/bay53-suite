"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Save } from "lucide-react";
import { useTheme } from "next-themes";

export default function AppearanceSettings() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="space-y-6">
      <Card className="py-4">
        <CardHeader>
          <CardTitle>Theme</CardTitle>
          <CardDescription>
            Customize the look and feel of your application
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="theme-mode">Theme Mode</Label>
            <Select value={theme} onValueChange={setTheme}>
              <SelectTrigger id="theme-mode">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="light">Light</SelectItem>
                <SelectItem value="dark">Dark</SelectItem>
                <SelectItem value="system">System</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Color Scheme</Label>
            <div className="grid grid-cols-4 gap-3">
              {[
                { name: "Blue", color: "bg-blue-500" },
                { name: "Green", color: "bg-green-500" },
                { name: "Purple", color: "bg-purple-500" },
                { name: "Orange", color: "bg-orange-500" },
                { name: "Pink", color: "bg-pink-500" },
                { name: "Teal", color: "bg-teal-500" },
                { name: "Red", color: "bg-red-500" },
                { name: "Indigo", color: "bg-indigo-500" },
              ].map((scheme) => (
                <button
                  key={scheme.name}
                  className="flex flex-col items-center gap-2 rounded-lg border p-3 hover:border-primary transition-colors"
                >
                  <div className={`h-8 w-8 rounded-full ${scheme.color}`} />
                  <span className="text-xs">{scheme.name}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between rounded-lg border p-4">
            <div className="space-y-0.5">
              <Label>High Contrast Mode</Label>
              <p className="text-sm text-muted-foreground">
                Increase contrast for better visibility
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

      <Card className="py-4">
        <CardHeader>
          <CardTitle>Layout</CardTitle>
          <CardDescription>
            Configure layout and navigation preferences
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="sidebar-position">Sidebar Position</Label>
            <Select defaultValue="left">
              <SelectTrigger id="sidebar-position">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="left">Left</SelectItem>
                <SelectItem value="right">Right</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="sidebar-behavior">Sidebar Behavior</Label>
            <Select defaultValue="expanded">
              <SelectTrigger id="sidebar-behavior">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="expanded">Always Expanded</SelectItem>
                <SelectItem value="collapsed">Always Collapsed</SelectItem>
                <SelectItem value="auto">Auto (Based on screen size)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between rounded-lg border p-4">
            <div className="space-y-0.5">
              <Label>Compact Mode</Label>
              <p className="text-sm text-muted-foreground">
                Reduce spacing for more content
              </p>
            </div>
            <Switch />
          </div>

          <div className="flex items-center justify-between rounded-lg border p-4">
            <div className="space-y-0.5">
              <Label>Show Breadcrumbs</Label>
              <p className="text-sm text-muted-foreground">
                Display navigation breadcrumbs
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
          <CardTitle>Display</CardTitle>
          <CardDescription>
            Configure display and font preferences
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
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
                <SelectItem value="extra-large">Extra Large</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="font-family">Font Family</Label>
            <Select defaultValue="inter">
              <SelectTrigger id="font-family">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="inter">Inter</SelectItem>
                <SelectItem value="roboto">Roboto</SelectItem>
                <SelectItem value="open-sans">Open Sans</SelectItem>
                <SelectItem value="lato">Lato</SelectItem>
                <SelectItem value="system">System Default</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="density">Content Density</Label>
            <Select defaultValue="comfortable">
              <SelectTrigger id="density">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="compact">Compact</SelectItem>
                <SelectItem value="comfortable">Comfortable</SelectItem>
                <SelectItem value="spacious">Spacious</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between rounded-lg border p-4">
            <div className="space-y-0.5">
              <Label>Reduce Animations</Label>
              <p className="text-sm text-muted-foreground">
                Minimize motion for better performance
              </p>
            </div>
            <Switch />
          </div>

          <div className="flex items-center justify-between rounded-lg border p-4">
            <div className="space-y-0.5">
              <Label>Show Tooltips</Label>
              <p className="text-sm text-muted-foreground">
                Display helpful tooltips on hover
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
          <CardTitle>Dashboard Customization</CardTitle>
          <CardDescription>
            Customize your dashboard widgets and layout
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <Label>Show Sales Chart</Label>
                <p className="text-sm text-muted-foreground">
                  Display sales trend chart on dashboard
                </p>
              </div>
              <Switch defaultChecked />
            </div>

            <div className="flex items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <Label>Show Recent Transactions</Label>
                <p className="text-sm text-muted-foreground">
                  Display recent sales and purchases
                </p>
              </div>
              <Switch defaultChecked />
            </div>

            <div className="flex items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <Label>Show Low Stock Alerts</Label>
                <p className="text-sm text-muted-foreground">
                  Display low stock products widget
                </p>
              </div>
              <Switch defaultChecked />
            </div>

            <div className="flex items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <Label>Show Top Products</Label>
                <p className="text-sm text-muted-foreground">
                  Display best-selling products
                </p>
              </div>
              <Switch defaultChecked />
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
