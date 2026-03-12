"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { 
  Building2, 
  Globe, 
  Receipt, 
  Bell, 
  Shield, 
  Palette, 
  Database, 
  Users, 
  FileText, 
  Printer,
  ChevronRight,
  Settings2,
  Search,
  Menu
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import BusinessSettings from "@/components/settings/BusinessSettings";
import LocalizationSettings from "@/components/settings/LocalizationSettings";
import InvoiceSettings from "@/components/settings/InvoiceSettings";
import NotificationSettings from "@/components/settings/NotificationSettings";
import SecuritySettings from "@/components/settings/SecuritySettings";
import AppearanceSettings from "@/components/settings/AppearanceSettings";
import DataSettings from "@/components/settings/DataSettings";
import UserManagementSettings from "@/components/settings/UserManagementSettings";
import TaxSettings from "@/components/settings/TaxSettings";
import PrintSettings from "@/components/settings/PrintSettings";

interface SettingCategory {
  id: string;
  label: string;
  description: string;
  icon: React.ElementType;
  badge?: string;
  group: "general" | "documents" | "system";
}

const settingsCategories: SettingCategory[] = [
  {
    id: "business",
    label: "Business Profile",
    description: "Company information and branding",
    icon: Building2,
    group: "general"
  },
  {
    id: "localization",
    label: "Localization",
    description: "Language, currency, and regional settings",
    icon: Globe,
    group: "general"
  },
  {
    id: "appearance",
    label: "Appearance",
    description: "Theme, colors, and display preferences",
    icon: Palette,
    group: "general"
  },
  {
    id: "invoice",
    label: "Invoice Settings",
    description: "Invoice templates and numbering",
    icon: Receipt,
    group: "documents"
  },
  {
    id: "tax",
    label: "Tax Configuration",
    description: "GST, VAT, and tax rates",
    icon: FileText,
    group: "documents"
  },
  {
    id: "print",
    label: "Print Settings",
    description: "Paper size, margins, and print layout",
    icon: Printer,
    group: "documents"
  },
  {
    id: "users",
    label: "User Management",
    description: "Manage users and permissions",
    icon: Users,
    badge: "Pro",
    group: "system"
  },
  {
    id: "security",
    label: "Security",
    description: "Password, authentication, and access control",
    icon: Shield,
    group: "system"
  },
  {
    id: "notifications",
    label: "Notifications",
    description: "Email and push notification preferences",
    icon: Bell,
    group: "system"
  },
  {
    id: "data",
    label: "Data Management",
    description: "Backup, export, and import data",
    icon: Database,
    group: "system"
  }
];

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("business");
  const [searchQuery, setSearchQuery] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const filteredCategories = settingsCategories.filter(
    (category) =>
      category.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
      category.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const groupedCategories = {
    general: filteredCategories.filter((c) => c.group === "general"),
    documents: filteredCategories.filter((c) => c.group === "documents"),
    system: filteredCategories.filter((c) => c.group === "system")
  };

  const activeCategory = settingsCategories.find((c) => c.id === activeTab);

  const handleCategorySelect = (categoryId: string) => {
    setActiveTab(categoryId);
    setMobileMenuOpen(false);
  };

  const sidebarContent = (
    <Card className="border-2 shadow-lg py-4 h-full lg:h-auto">
      <CardHeader className="pb-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search settings..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-10"
          />
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[calc(100vh-200px)] lg:h-[calc(100vh-280px)] px-3 pb-3">
          <div className="space-y-6">
            {/* General Settings */}
            {groupedCategories.general.length > 0 && (
              <div>
                <h3 className="px-3 mb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  General
                </h3>
                <nav className="space-y-1">
                  {groupedCategories.general.map((category) => (
                    <SettingNavItem
                      key={category.id}
                      category={category}
                      isActive={activeTab === category.id}
                      onClick={() => handleCategorySelect(category.id)}
                    />
                  ))}
                </nav>
              </div>
            )}

            {/* Documents Settings */}
            {groupedCategories.documents.length > 0 && (
              <div>
                <Separator className="mb-3" />
                <h3 className="px-3 mb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Documents
                </h3>
                <nav className="space-y-1">
                  {groupedCategories.documents.map((category) => (
                    <SettingNavItem
                      key={category.id}
                      category={category}
                      isActive={activeTab === category.id}
                      onClick={() => handleCategorySelect(category.id)}
                    />
                  ))}
                </nav>
              </div>
            )}

            {/* System Settings */}
            {groupedCategories.system.length > 0 && (
              <div>
                <Separator className="mb-3" />
                <h3 className="px-3 mb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  System
                </h3>
                <nav className="space-y-1">
                  {groupedCategories.system.map((category) => (
                    <SettingNavItem
                      key={category.id}
                      category={category}
                      isActive={activeTab === category.id}
                      onClick={() => handleCategorySelect(category.id)}
                    />
                  ))}
                </nav>
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <div className="container mx-auto p-4 md:p-6 lg:p-8 max-w-[1600px]">
        {/* Header */}
        <div className="mb-4 md:mb-6 lg:mb-8">
          <div className="flex items-center justify-between gap-3 mb-2">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Settings2 className="h-5 w-5 md:h-6 md:w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold tracking-tight">Settings</h1>
                <p className="text-muted-foreground text-xs md:text-sm lg:text-base mt-1 hidden sm:block">
                  Customize your workspace and manage preferences
                </p>
              </div>
            </div>
            
            {/* Mobile Menu Toggle */}
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" size="icon" className="lg:hidden">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[300px] p-0">
                {sidebarContent}
              </SheetContent>
            </Sheet>
          </div>
        </div>

        {/* Main Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-6">
          {/* Desktop Sidebar Navigation */}
          <aside className="hidden lg:block space-y-4">
            {sidebarContent}
          </aside>

          {/* Content Area */}
          <main className="space-y-4 md:space-y-6">
            {/* Active Section Header */}
            {activeCategory && (
              <Card className="border-2 shadow-lg bg-gradient-to-br from-card to-card/50 py-3 md:py-4">
                <CardHeader className="p-4 md:p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3 md:gap-4">
                      <div className="p-2 md:p-3 rounded-xl bg-primary/10">
                        <activeCategory.icon className="h-5 w-5 md:h-6 md:w-6 text-primary" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <CardTitle className="text-lg md:text-xl lg:text-2xl">{activeCategory.label}</CardTitle>
                          {activeCategory.badge && (
                            <Badge variant="secondary" className="text-xs">
                              {activeCategory.badge}
                            </Badge>
                          )}
                        </div>
                        <CardDescription className="mt-1 text-sm md:text-base">
                          {activeCategory.description}
                        </CardDescription>
                      </div>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            )}

            {/* Settings Content */}
            <div className="space-y-4 md:space-y-6">
              {activeTab === "business" && <BusinessSettings />}
              {activeTab === "localization" && <LocalizationSettings />}
              {activeTab === "invoice" && <InvoiceSettings />}
              {activeTab === "tax" && <TaxSettings />}
              {activeTab === "print" && <PrintSettings />}
              {activeTab === "notifications" && <NotificationSettings />}
              {activeTab === "security" && <SecuritySettings />}
              {activeTab === "appearance" && <AppearanceSettings />}
              {activeTab === "users" && <UserManagementSettings />}
              {activeTab === "data" && <DataSettings />}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}

function SettingNavItem({
  category,
  isActive,
  onClick
}: {
  category: SettingCategory;
  isActive: boolean;
  onClick: () => void;
}) {
  const Icon = category.icon;

  return (
    <Button
      variant="ghost"
      className={cn(
        "w-full justify-start gap-3 h-auto py-3 px-3 rounded-lg transition-all",
        isActive
          ? "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground shadow-md"
          : "hover:bg-muted/50"
      )}
      onClick={onClick}
    >
      <Icon className={cn("h-5 w-5 shrink-0", isActive ? "text-primary-foreground" : "text-muted-foreground")} />
      <div className="flex-1 text-left">
        <div className="flex items-center gap-2">
          <span className="font-medium text-sm">{category.label}</span>
          {category.badge && !isActive && (
            <Badge variant="outline" className="text-xs px-1.5 py-0">
              {category.badge}
            </Badge>
          )}
        </div>
        <p className={cn(
          "text-xs mt-0.5 line-clamp-1",
          isActive ? "text-primary-foreground/80" : "text-muted-foreground"
        )}>
          {category.description}
        </p>
      </div>
      {isActive && <ChevronRight className="h-4 w-4 shrink-0" />}
    </Button>
  );
}
