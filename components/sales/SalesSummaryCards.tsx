import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, FileText } from "lucide-react";

interface SalesSummaryCardsProps {
  totalSales: number;
  invoiceCount: number;
  formatCurrency: (amount: number) => string;
}

export function SalesSummaryCards({
  totalSales,
  invoiceCount,
  formatCurrency,
}: SalesSummaryCardsProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <Card className="card-hover border-l-4 border-l-indigo-500">
        <CardContent className="p-4 flex items-center gap-3">
          <div className="rounded-xl bg-indigo-100 p-2.5">
            <TrendingUp className="h-5 w-5 text-indigo-600" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wider">
              Total Sales
            </p>
            <p className="text-xl font-bold mt-1">
              {formatCurrency(totalSales)}
            </p>
          </div>
        </CardContent>
      </Card>
      <Card className="card-hover border-l-4 border-l-amber-500">
        <CardContent className="p-4 flex items-center gap-3">
          <div className="rounded-xl bg-amber-100 p-2.5">
            <FileText className="h-5 w-5 text-amber-600" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wider">
              Total Invoices
            </p>
            <p className="text-xl font-bold mt-1 text-amber-600">
              {invoiceCount}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
