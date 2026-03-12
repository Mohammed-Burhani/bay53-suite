"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Save } from "lucide-react";

export default function LocalizationSettings() {
  return (
    <div className="space-y-6">
      <Card className="py-4">
        <CardHeader>
          <CardTitle>Regional Settings</CardTitle>
          <CardDescription>
            Configure language, timezone, and regional preferences
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="language">Language</Label>
              <Select defaultValue="en">
                <SelectTrigger id="language">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="hi">हिन्दी (Hindi)</SelectItem>
                  <SelectItem value="mr">मराठी (Marathi)</SelectItem>
                  <SelectItem value="gu">ગુજરાતી (Gujarati)</SelectItem>
                  <SelectItem value="ta">தமிழ் (Tamil)</SelectItem>
                  <SelectItem value="te">తెలుగు (Telugu)</SelectItem>
                  <SelectItem value="kn">ಕನ್ನಡ (Kannada)</SelectItem>
                  <SelectItem value="ml">മലയാളം (Malayalam)</SelectItem>
                  <SelectItem value="bn">বাংলা (Bengali)</SelectItem>
                  <SelectItem value="pa">ਪੰਜਾਬੀ (Punjabi)</SelectItem>
                  <SelectItem value="es">Español (Spanish)</SelectItem>
                  <SelectItem value="fr">Français (French)</SelectItem>
                  <SelectItem value="de">Deutsch (German)</SelectItem>
                  <SelectItem value="ar">العربية (Arabic)</SelectItem>
                  <SelectItem value="zh">中文 (Chinese)</SelectItem>
                  <SelectItem value="ja">日本語 (Japanese)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="timezone">Timezone</Label>
              <Select defaultValue="asia-kolkata">
                <SelectTrigger id="timezone">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="asia-kolkata">Asia/Kolkata (IST)</SelectItem>
                  <SelectItem value="utc">UTC</SelectItem>
                  <SelectItem value="america-new_york">America/New York (EST)</SelectItem>
                  <SelectItem value="america-los_angeles">America/Los Angeles (PST)</SelectItem>
                  <SelectItem value="europe-london">Europe/London (GMT)</SelectItem>
                  <SelectItem value="europe-paris">Europe/Paris (CET)</SelectItem>
                  <SelectItem value="asia-dubai">Asia/Dubai (GST)</SelectItem>
                  <SelectItem value="asia-singapore">Asia/Singapore (SGT)</SelectItem>
                  <SelectItem value="asia-tokyo">Asia/Tokyo (JST)</SelectItem>
                  <SelectItem value="australia-sydney">Australia/Sydney (AEDT)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="date-format">Date Format</Label>
              <Select defaultValue="dd-mm-yyyy">
                <SelectTrigger id="date-format">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="dd-mm-yyyy">DD-MM-YYYY (31-12-2025)</SelectItem>
                  <SelectItem value="mm-dd-yyyy">MM-DD-YYYY (12-31-2025)</SelectItem>
                  <SelectItem value="yyyy-mm-dd">YYYY-MM-DD (2025-12-31)</SelectItem>
                  <SelectItem value="dd/mm/yyyy">DD/MM/YYYY (31/12/2025)</SelectItem>
                  <SelectItem value="mm/dd/yyyy">MM/DD/YYYY (12/31/2025)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="time-format">Time Format</Label>
              <Select defaultValue="12">
                <SelectTrigger id="time-format">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="12">12-hour (02:30 PM)</SelectItem>
                  <SelectItem value="24">24-hour (14:30)</SelectItem>
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
          <CardTitle>Currency Settings</CardTitle>
          <CardDescription>
            Configure currency display and formatting
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="currency">Currency</Label>
              <Select defaultValue="inr">
                <SelectTrigger id="currency">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="inr">₹ INR - Indian Rupee</SelectItem>
                  <SelectItem value="usd">$ USD - US Dollar</SelectItem>
                  <SelectItem value="eur">€ EUR - Euro</SelectItem>
                  <SelectItem value="gbp">£ GBP - British Pound</SelectItem>
                  <SelectItem value="aed">د.إ AED - UAE Dirham</SelectItem>
                  <SelectItem value="sar">﷼ SAR - Saudi Riyal</SelectItem>
                  <SelectItem value="sgd">S$ SGD - Singapore Dollar</SelectItem>
                  <SelectItem value="aud">A$ AUD - Australian Dollar</SelectItem>
                  <SelectItem value="cad">C$ CAD - Canadian Dollar</SelectItem>
                  <SelectItem value="jpy">¥ JPY - Japanese Yen</SelectItem>
                  <SelectItem value="cny">¥ CNY - Chinese Yuan</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="decimal-places">Decimal Places</Label>
              <Select defaultValue="2">
                <SelectTrigger id="decimal-places">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">0 (₹1,234)</SelectItem>
                  <SelectItem value="2">2 (₹1,234.56)</SelectItem>
                  <SelectItem value="3">3 (₹1,234.567)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="number-format">Number Format</Label>
              <Select defaultValue="indian">
                <SelectTrigger id="number-format">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="indian">Indian (1,23,45,678)</SelectItem>
                  <SelectItem value="international">International (12,345,678)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="currency-position">Currency Symbol Position</Label>
              <Select defaultValue="before">
                <SelectTrigger id="currency-position">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="before">Before (₹1,234.56)</SelectItem>
                  <SelectItem value="after">After (1,234.56₹)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center justify-between rounded-lg border p-4">
            <div className="space-y-0.5">
              <Label>Show Currency Symbol</Label>
              <p className="text-sm text-muted-foreground">
                Display currency symbol in amounts
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
          <CardTitle>Fiscal Year Settings</CardTitle>
          <CardDescription>
            Configure your financial year preferences
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="fiscal-start">Fiscal Year Start Month</Label>
              <Select defaultValue="4">
                <SelectTrigger id="fiscal-start">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">January</SelectItem>
                  <SelectItem value="2">February</SelectItem>
                  <SelectItem value="3">March</SelectItem>
                  <SelectItem value="4">April</SelectItem>
                  <SelectItem value="5">May</SelectItem>
                  <SelectItem value="6">June</SelectItem>
                  <SelectItem value="7">July</SelectItem>
                  <SelectItem value="8">August</SelectItem>
                  <SelectItem value="9">September</SelectItem>
                  <SelectItem value="10">October</SelectItem>
                  <SelectItem value="11">November</SelectItem>
                  <SelectItem value="12">December</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="week-start">Week Starts On</Label>
              <Select defaultValue="1">
                <SelectTrigger id="week-start">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">Sunday</SelectItem>
                  <SelectItem value="1">Monday</SelectItem>
                  <SelectItem value="6">Saturday</SelectItem>
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
    </div>
  );
}
