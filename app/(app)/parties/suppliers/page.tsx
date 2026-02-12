"use client";

import { useQuery } from "@tanstack/react-query";
import { getParties, formatCurrency } from "@/lib/store";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Users, TrendingDown } from "lucide-react";

export default function SuppliersPage() {
  const { data: parties = [] } = useQuery({
    queryKey: ["parties"],
    queryFn: () => getParties(),
  });

  const suppliers = parties.filter(p => p.type === "supplier");
  const totalPayables = suppliers.reduce((sum, s) => sum + (s.balance < 0 ? Math.abs(s.balance) : 0), 0);

  return (
    <div className="flex flex-col gap-6 p-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Suppliers</h1>
        <p className="text-sm text-muted-foreground">{suppliers.length} suppliers</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card className="border-l-4 border-l-violet-500">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="rounded-xl bg-violet-100 p-2.5">
              <Users className="h-5 w-5 text-violet-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-medium">Total Suppliers</p>
              <p className="text-xl font-bold">{suppliers.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-red-500">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="rounded-xl bg-red-100 p-2.5">
              <TrendingDown className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-medium">Payables</p>
              <p className="text-xl font-bold">{formatCurrency(totalPayables)}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>City</TableHead>
                <TableHead className="text-right">Balance</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {suppliers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-12 text-muted-foreground">
                    No suppliers found
                  </TableCell>
                </TableRow>
              ) : (
                suppliers.map(supplier => (
                  <TableRow key={supplier.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{supplier.name}</p>
                        {supplier.gstin && <p className="text-xs text-muted-foreground">{supplier.gstin}</p>}
                      </div>
                    </TableCell>
                    <TableCell>{supplier.phone}</TableCell>
                    <TableCell>{supplier.city || "-"}</TableCell>
                    <TableCell className="text-right">
                      {supplier.balance < 0 ? (
                        <Badge variant="destructive">{formatCurrency(Math.abs(supplier.balance))}</Badge>
                      ) : supplier.balance > 0 ? (
                        <Badge className="bg-emerald-100 text-emerald-700">{formatCurrency(supplier.balance)}</Badge>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
