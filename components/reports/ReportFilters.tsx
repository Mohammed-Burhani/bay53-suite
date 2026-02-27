"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Calendar, Download, Printer } from "lucide-react";
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
  const hasActiveFilters = searchQuery || startDate || endDate || selectedCustomer !== "all";

  const handleClearAll = () => {
    setSearchQuery("");
    setStartDate("");
    setEndDate("");
    setSelectedCustomer("all");
  };

  return (
    <Card className="shadow-sm">
      <CardContent className="p-4">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Search className="h-4 w-4" />
              Filters
            </h3>
            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearAll}
                className="h-7 text-xs"
              >
                Clear All
              </Button>
            )}
          </div>
          
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-1.5">
              <label htmlFor="search-input" className="text-xs font-medium text-muted-foreground">
                Search
              </label>
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  id="search-input"
                  placeholder="Invoice or customer..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 h-9 text-sm"
                  aria-label="Search invoices or customers"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="start-date" className="text-xs font-medium text-muted-foreground">
                From Date
              </label>
              <div className="relative">
                <Calendar className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
                <Input
                  id="start-date"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="pl-8 h-9 text-sm"
                  aria-label="Start date filter"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="end-date" className="text-xs font-medium text-muted-foreground">
                To Date
              </label>
              <div className="relative">
                <Calendar className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
                <Input
                  id="end-date"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="pl-8 h-9 text-sm"
                  aria-label="End date filter"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="customer-select" className="text-xs font-medium text-muted-foreground">
                Customer
              </label>
              <Select value={selectedCustomer} onValueChange={setSelectedCustomer}>
                <SelectTrigger id="customer-select" className="h-9 text-sm" aria-label="Filter by customer">
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

          <div className="flex items-center justify-between pt-1 border-t">
            <div className="flex items-center gap-2">
              <Button 
                variant="default" 
                size="sm" 
                className="gap-1.5 h-8 text-xs"
                onClick={onExport}
              >
                <Download className="h-3.5 w-3.5" />
                Export
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className="gap-1.5 h-8 text-xs" 
                onClick={onPrint || (() => window.print())}
              >
                <Printer className="h-3.5 w-3.5" />
                Print
              </Button>
            </div>
            <div className="text-xs text-muted-foreground">
              <span className="font-medium text-foreground">{filteredCount}</span> of{" "}
              <span className="font-medium text-foreground">{totalCount}</span> invoices
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
