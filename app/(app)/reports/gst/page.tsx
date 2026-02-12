"use client";

import { Card, CardContent } from "@/components/ui/card";
import { FileText } from "lucide-react";

export default function GSTReportPage() {
  return (
    <div className="flex flex-col gap-6 p-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">GST Report</h1>
        <p className="text-sm text-muted-foreground">GST returns and compliance reports</p>
      </div>

      <Card>
        <CardContent className="p-12 text-center">
          <FileText className="h-12 w-12 mx-auto text-muted-foreground/30" />
          <p className="mt-4 text-muted-foreground">GST report coming soon</p>
          <p className="text-sm text-muted-foreground mt-2">GSTR-1, GSTR-3B reports will be available here</p>
        </CardContent>
      </Card>
    </div>
  );
}
