"use client";

import { InvoiceListTable } from "@/components/invoices/InvoiceListTable";
import { Truck } from "lucide-react";

export default function SalesChallanPage() {
  return (
    <div className="flex flex-col gap-6 p-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Sales Challans</h1>
        <p className="text-sm text-muted-foreground">
          View and manage delivery challans
        </p>
      </div>

      <InvoiceListTable
        title="Sales Challans"
        invType={7}
        showInvoiceTypeFilter={false}
        icon={Truck}
        iconColor="bg-orange-500"
        hideActions={true}
        createUrl="/erp/sales/challan/create"
      />
    </div>
  );
}
