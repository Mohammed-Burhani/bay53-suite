"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useInvoicesByType, useDeleteInvoice } from "@/lib/api-services/invoice.service";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Info } from "lucide-react";
import { InvoiceWithItems, invoiceService } from "@/supabase/services/invoice-service";
import { toast } from "sonner";
import { printInvoice, downloadInvoice } from "@/lib/invoice-utils";
import { SalesHeader } from "./SalesHeader";
import { SalesSummaryCards } from "./SalesSummaryCards";
import { SalesFilters } from "./SalesFilters";
import { SalesTable } from "./SalesTable";
import { InvoiceDetailDialog } from "./InvoiceDetailDialog";
import { DeleteInvoiceDialog } from "./DeleteInvoiceDialog";

export function SalesPageClient() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [viewInvoice, setViewInvoice] = useState<InvoiceWithItems | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [activeTab, setActiveTab] = useState("all");

  const { data: invoices = [], isLoading } = useInvoicesByType("sale");
  const deleteInvoice = useDeleteInvoice();

  const getFilteredByTab = (invs: typeof invoices) => {
    if (activeTab === "pending-ready") {
      return invs.filter((inv) => inv.invoice_status !== "tax-invoice");
    }
    if (activeTab === "tax-invoice") {
      return invs.filter((inv) => inv.invoice_status === "tax-invoice");
    }
    return invs;
  };

  const tabFilteredInvoices = getFilteredByTab(invoices);

  const filteredTotalSales =
    activeTab === "all"
      ? tabFilteredInvoices
          .filter((inv) => inv.invoice_status !== "tax-invoice")
          .reduce((sum, inv) => sum + Number(inv.grand_total), 0)
      : tabFilteredInvoices.reduce((sum, inv) => sum + Number(inv.grand_total), 0);

  const filteredInvoiceCount = tabFilteredInvoices.length;

  const filtered = tabFilteredInvoices.filter(
    (inv) =>
      inv.invoice_number.toLowerCase().includes(search.toLowerCase()) ||
      inv.buyer_name.toLowerCase().includes(search.toLowerCase())
  );

  const handleDelete = async () => {
    if (!deleteId) return;

    try {
      await deleteInvoice.mutateAsync(deleteId);
      toast.success("Invoice deleted successfully");
      setDeleteId(null);
    } catch {
      toast.error("Failed to delete invoice");
    }
  };

  const handleViewInvoice = async (invoiceId: string) => {
    try {
      setLoadingPreview(true);
      const fullInvoice = await invoiceService.getInvoiceById(invoiceId);
      if (fullInvoice) {
        setViewInvoice(fullInvoice);
      } else {
        toast.error("Invoice not found");
      }
    } catch (err) {
      console.error("Error fetching invoice:", err);
      toast.error("Failed to load invoice");
    } finally {
      setLoadingPreview(false);
    }
  };

  const handlePrint = async (invoiceId: string) => {
    try {
      const fullInvoice = await invoiceService.getInvoiceById(invoiceId);
      if (fullInvoice) {
        printInvoice(fullInvoice);
      } else {
        toast.error("Invoice not found");
      }
    } catch (err) {
      console.error("Error fetching invoice:", err);
      toast.error("Failed to load invoice");
    }
  };

  const handleDownload = async (invoiceId: string) => {
    try {
      const fullInvoice = await invoiceService.getInvoiceById(invoiceId);
      if (fullInvoice) {
        downloadInvoice(fullInvoice);
        toast.success("Invoice downloaded as PDF");
      } else {
        toast.error("Invoice not found");
      }
    } catch (err) {
      console.error("Error fetching invoice:", err);
      toast.error("Failed to load invoice");
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 2,
    }).format(amount);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading invoices...</p>
        </div>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="flex flex-col gap-6 p-6">
        <SalesHeader
          invoiceCount={filteredInvoiceCount}
          onCreateClick={() => router.push("/sales/create")}
        />

        {invoices.length === 0 && (
          <Alert className="border-indigo-200 bg-indigo-50/50">
            <Info className="h-4 w-4 text-indigo-600" />
            <AlertDescription className="text-sm text-indigo-900">
              <span className="font-medium">Get Started:</span> Create your
              first invoice to start tracking sales. All invoices are GST
              compliant and can be printed or downloaded as PDF.
            </AlertDescription>
          </Alert>
        )}

        <SalesSummaryCards
          totalSales={filteredTotalSales}
          invoiceCount={filteredInvoiceCount}
          formatCurrency={formatCurrency}
        />

        <SalesFilters
          search={search}
          onSearchChange={setSearch}
          activeTab={activeTab}
          onTabChange={setActiveTab}
        />

        <Card>
          <CardContent className="p-0">
            <SalesTable
              invoices={filtered}
              formatCurrency={formatCurrency}
              onView={handleViewInvoice}
              onEdit={(id) => router.push(`/sales/edit/${id}`)}
              onDelete={setDeleteId}
              onPrint={handlePrint}
              onDownload={handleDownload}
              emptyMessage={
                search
                  ? "No invoices found"
                  : "No invoices yet. Create your first invoice!"
              }
            />
          </CardContent>
        </Card>

        <InvoiceDetailDialog
          invoice={viewInvoice}
          isLoading={loadingPreview}
          onClose={() => setViewInvoice(null)}
          onPrint={printInvoice}
          onDownload={(inv) => {
            downloadInvoice(inv);
            toast.success("Invoice downloaded as PDF");
          }}
          formatCurrency={formatCurrency}
        />

        <DeleteInvoiceDialog
          open={!!deleteId}
          onClose={() => setDeleteId(null)}
          onConfirm={handleDelete}
        />
      </div>
    </TooltipProvider>
  );
}
