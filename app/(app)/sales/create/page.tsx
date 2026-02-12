"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Plus, FileText } from "lucide-react";

export default function CreateSalesInvoicePage() {
  const router = useRouter();

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Create Sales Invoice</h1>
          <p className="text-sm text-muted-foreground">Generate a new sales invoice</p>
        </div>
      </div>

      <Card>
        <CardContent className="p-12 text-center">
          <FileText className="h-12 w-12 mx-auto text-muted-foreground/30" />
          <p className="mt-4 text-muted-foreground">Sales invoice creation form coming soon</p>
          <p className="text-sm text-muted-foreground mt-2">Use POS for quick billing</p>
          <Button className="mt-4" onClick={() => router.push("/pos")}>
            Go to POS
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
