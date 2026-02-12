"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Undo2 } from "lucide-react";

export default function SalesReturnsPage() {
  return (
    <div className="flex flex-col gap-6 p-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Sales Returns</h1>
        <p className="text-sm text-muted-foreground">Manage product returns from customers</p>
      </div>

      <Card>
        <CardContent className="p-12 text-center">
          <Undo2 className="h-12 w-12 mx-auto text-muted-foreground/30" />
          <p className="mt-4 text-muted-foreground">No sales returns recorded</p>
        </CardContent>
      </Card>
    </div>
  );
}
