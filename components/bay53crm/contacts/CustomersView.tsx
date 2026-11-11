"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { TablePagination } from "@/components/ui/table-pagination";
import { usePagedRows } from "@/components/bay53crm/reports/usePagedRows";
import { useCustomers } from "@/lib/bay53crm/api/queries";
import type { CrmCustomerRef } from "@/lib/bay53crm/api";
import { filterCustomers } from "@/lib/bay53crm/contacts";
import { useDebouncedValue } from "@/lib/hooks/useDebouncedValue";

const ALL_CUSTOMERS = {};
const NO_CUSTOMERS: CrmCustomerRef[] = [];

/** The companies leads are raised for. The API only lists them, so the screen is read-only. */
export function CustomersView() {
  const { data: customers = NO_CUSTOMERS, isLoading, isError, error } = useCustomers(ALL_CUSTOMERS);
  const [search, setSearch] = useState("");
  const term = useDebouncedValue(search);
  const filtered = useMemo(() => filterCustomers(customers, term), [customers, term]);
  const { paged, pagination } = usePagedRows(filtered);

  return (
    <div className="flex flex-col gap-6 p-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Customers</h1>
        <p className="text-sm text-muted-foreground">{filtered.length.toLocaleString("en-IN")} customers</p>
      </div>

      <Card>
        <CardContent className="p-3">
          <div className="relative max-w-md">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              aria-label="Search customers"
              placeholder="Search by company or state"
              className="pl-8 h-8"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <div className="overflow-auto max-h-[60vh]">
          <Table>
            <TableHeader>
              <TableRow className="sticky top-0 bg-background z-10">
                <TableHead>Company</TableHead>
                <TableHead>State</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paged.map((customer) => (
                <TableRow key={customer.id}>
                  <TableCell className="font-medium text-xs">{customer.companyName}</TableCell>
                  <TableCell className="text-xs">{customer.companyState}</TableCell>
                </TableRow>
              ))}
              {(isLoading || isError || filtered.length === 0) && (
                <TableRow>
                  <TableCell colSpan={2} className="text-center py-8 text-muted-foreground">
                    {isLoading
                      ? "Loading customers..."
                      : isError
                        ? `Could not load customers: ${error instanceof Error ? error.message : "unknown error"}`
                        : "No customers found matching the search"}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
        {filtered.length > 0 && <TablePagination {...pagination} />}
      </Card>
    </div>
  );
}
