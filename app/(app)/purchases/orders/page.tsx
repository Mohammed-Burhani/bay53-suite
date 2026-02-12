"use client";

import { Card, CardContent } from "@/components/ui/card";
import { FileText } from "lucide-react";

export default function PurchaseOrdersPage() {
  return (
    <div className="flex flex-col gap-6 p-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Purchase Orders</h1>
        <p className="text-sm text-muted-foreground">Manage purchase orders to suppliers</p>
      </div>

      <Card>
        <CardContent className="p-12 text-center">
          <FileText className="h-12 w-12 mx-auto text-muted-foreground/30" />
          <p className="mt-4 text-muted-foreground">No purchase orders created</p>
        </CardContent>
      </Card>
    </div>
  );
}
