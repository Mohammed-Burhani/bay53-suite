"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { FileText, Eye, Edit, Trash2, Printer, Download } from "lucide-react";
import { Invoice } from "@/supabase/services/invoice-service";

interface SalesTableProps {
  invoices: Invoice[];
  formatCurrency: (amount: number) => string;
  onView: (id: string) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onPrint: (id: string) => void;
  onDownload: (id: string) => void;
  emptyMessage?: string;
}

export function SalesTable({
  invoices,
  formatCurrency,
  onView,
  onEdit,
  onDelete,
  onPrint,
  onDownload,
  emptyMessage = "No invoices yet. Create your first invoice!",
}: SalesTableProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Invoice #</TableHead>
          <TableHead>Date</TableHead>
          <TableHead>From</TableHead>
          <TableHead>To</TableHead>
          <TableHead className="text-right">Amount</TableHead>
          <TableHead className="text-center">Status</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {invoices.length === 0 ? (
          <TableRow>
            <TableCell colSpan={7} className="py-12 text-center">
              <FileText className="mx-auto h-8 w-8 text-muted-foreground/40" />
              <p className="mt-2 text-sm text-muted-foreground">
                {emptyMessage}
              </p>
            </TableCell>
          </TableRow>
        ) : (
          invoices.map((inv) => (
            <TableRow
              key={inv.id}
              className="hover:bg-muted/30 transition-colors"
            >
              <TableCell className="font-mono text-xs">
                {inv.invoice_number}
              </TableCell>
              <TableCell className="text-sm">
                {new Date(inv.invoice_date).toLocaleDateString("en-IN")}
              </TableCell>
              <TableCell className="text-sm font-medium">
                {inv.seller_name}
              </TableCell>
              <TableCell className="text-sm font-medium">
                {inv.buyer_name}
              </TableCell>
              <TableCell className="text-right text-sm font-medium">
                {formatCurrency(Number(inv.grand_total))}
              </TableCell>
              <TableCell className="text-center">
                <Badge
                  variant={
                    inv.invoice_status === "pending"
                      ? "destructive"
                      : inv.invoice_status === "ready"
                        ? "secondary"
                        : "default"
                  }
                  className="text-xs capitalize"
                >
                  {inv.invoice_status}
                </Badge>
              </TableCell>
              <TableCell className="text-right">
                <div className="flex items-center justify-end gap-1">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => onPrint(inv.id!)}
                      >
                        <Printer className="h-3.5 w-3.5" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Print Invoice</p>
                    </TooltipContent>
                  </Tooltip>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => onDownload(inv.id!)}
                      >
                        <Download className="h-3.5 w-3.5" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Download as PDF</p>
                    </TooltipContent>
                  </Tooltip>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => onEdit(inv.id!)}
                      >
                        <Edit className="h-3.5 w-3.5" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Edit Invoice</p>
                    </TooltipContent>
                  </Tooltip>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => onView(inv.id!)}
                      >
                        <Eye className="h-3.5 w-3.5" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>View Details</p>
                    </TooltipContent>
                  </Tooltip>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => onDelete(inv.id!)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Delete Invoice</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
              </TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  );
}
