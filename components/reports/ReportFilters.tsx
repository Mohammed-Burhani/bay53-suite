"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Search, Calendar, Download, Printer, SlidersHorizontal } from "lucide-react";
import type { Party } from "@/lib/types";

interface ReportFiltersProps {
  searchQuery: string;
  setSearchQuery: (value: string) => void;
  startDate: string;
  setStartDate: (value: string) => void;
  endDate: string;
  setEndDate: (value: string) => void;
  selectedCustomer: string;
  setSelectedCustomer: (value: string) => void;
  customers: Party[];
  filteredCount: number;
  totalCount: number;
  onExport?: () => void;
  onPrint?: () => void;
}

export function ReportFilters({
  searchQuery,
  setSearchQuery,
  startDate,
  setStartDate,
  endDate,
  setEndDate,
  selectedCustomer,
  setSelectedCustomer,
  customers,
  filteredCount,
  totalCount,
  onExport,
  onPrint,
}: ReportFiltersProps) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const hasActiveFilters = searchQuery || startDate || endDate || selectedCustomer !== "all";
  const advancedActive = selectedCustomer !== "all";

  const handleClearAll = () => {
    setSearchQuery("");
    setStartDate("");
    setEndDate("");
    setSelectedCustomer("all");
  };

  return (
    <Card className="shadow-sm">
      <CardContent className="p-3">
        <div className="flex flex-wrap items-center gap-2">
          {/* Search */}
          <div className="relative flex-1 min-w-[180px]">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Invoice or customer..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 h-9 text-sm"
            />
          </div>

          {/* From Date */}
          <div className="relative">
            <Calendar className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
            <Input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="pl-8 h-9 text-sm w-[150px]"
            />
          </div>

          {/* To Date */}
          <div className="relative">
            <Calendar className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
            <Input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="pl-8 h-9 text-sm w-[150px]"
            />
          </div>

          {/* Advanced Filters Drawer */}
          <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="sm" className="h-9">
                <SlidersHorizontal className="h-4 w-4 mr-2" />
                Filters
                {advancedActive && <Badge variant="secondary" className="ml-2">1</Badge>}
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[320px]">
              <SheetHeader>
                <SheetTitle>Advanced Filters</SheetTitle>
                <SheetDescription>Refine your report results</SheetDescription>
              </SheetHeader>
              <div className="space-y-4 mt-6">
                <div className="space-y-2">
                  <Label className="text-sm">Customer</Label>
                  <Select value={selectedCustomer} onValueChange={setSelectedCustomer}>
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="All Customers" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Customers</SelectItem>
                      {customers.map(customer => (
                        <SelectItem key={customer.id} value={customer.id}>
                          {customer.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </SheetContent>
          </Sheet>

          {hasActiveFilters && (
            <Button variant="ghost" size="sm" onClick={handleClearAll} className="h-9 text-xs">
              Clear
            </Button>
          )}

          <div className="flex-1" />

          <div className="text-xs text-muted-foreground">
            <span className="font-medium text-foreground">{filteredCount}</span> of{" "}
            <span className="font-medium text-foreground">{totalCount}</span>
          </div>

          <Button variant="default" size="sm" className="gap-1.5 h-9 text-xs" onClick={onExport}>
            <Download className="h-3.5 w-3.5" />
            Export
          </Button>
          <Button variant="outline" size="sm" className="gap-1.5 h-9 text-xs" onClick={onPrint || (() => window.print())}>
            <Printer className="h-3.5 w-3.5" />
            Print
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
