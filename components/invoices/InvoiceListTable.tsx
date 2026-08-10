"use client";

import { useState, useMemo, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Search,
  FileText,
  Loader2,
  X,
  ChevronsUpDown,
  SlidersHorizontal,
  Eye,
  Edit,
  Printer,
  Mail,
  Copy,
  Download,
  RotateCcw,
  XCircle,
  FileDown,
  Trash2,
} from "lucide-react";
import { format } from "date-fns";
import { formatCurrency } from "@/lib/store";
import { ContextMenu, ContextMenuItem } from "@/components/ui/context-menu";
import { useRouter } from "next/navigation";
import { TablePagination, usePagination } from "@/components/ui/table-pagination";
import { ModuleAIAssistant } from "@/components/ModuleAIAssistant";
import { InvoicePreviewDialog } from "@/components/invoices/InvoicePreviewDialog";
import { useInvoiceSearch, useInvoiceDelete } from "@/lib/hooks/useInvoices";
import type { InvoiceSearchItem } from "@/lib/types/invoice.types";
import { useInvoiceTypes, useStockPlaces } from "@/lib/hooks/useReports";
import { toast } from "sonner";
import { invoiceService } from "@/lib/api/invoice.service";
import { auth } from "@/lib/auth";
import { DateRangeFilter, type DateFilterType } from "@/components/reports/DateRangeFilter";
import { LedgerSearchInput } from "@/components/reports/LedgerSearchInput";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface InvoiceListTableProps {
  title: string;
  invType: number; // Invoice type to filter (0 = all, 1 = sales, 2 = purchase, etc.)
  showInvoiceTypeFilter?: boolean; // Whether to show the invoice type dropdown
  icon?: React.ElementType;
  iconColor?: string;
  hideActions?: boolean; // When true, hides Edit/Duplicate/Convert/Cancel context menu actions
}

export function InvoiceListTable({
  title,
  invType,
  showInvoiceTypeFilter = false,
  icon: Icon = FileText,
  iconColor = "bg-[var(--report-accent)]",
  hideActions = false,
}: InvoiceListTableProps) {
  const router = useRouter();
  
  // Invoice preview (bill) dialog
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewInvoice, setPreviewInvoice] = useState<InvoiceSearchItem | null>(null);

  // Delete confirmation
  const [deleteTarget, setDeleteTarget] = useState<InvoiceSearchItem | null>(null);
  const deleteMutation = useInvoiceDelete();

  // Cache setupInfo per invoice to avoid repeated API calls
  const setupInfoCache = useRef<Map<string, any>>(new Map());

  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedInvType, setSelectedInvType] = useState<number>(invType);
  const [selectedStockPlaceIds, setSelectedStockPlaceIds] = useState<number[]>([0]);
  const [invoiceNo, setInvoiceNo] = useState("");
  const [billNo, setBillNo] = useState("");
  const [itemName, setItemName] = useState("");
  
  // Date filter state
  const [dateType, setDateType] = useState<DateFilterType>("current_month");
  const [selectedMonth, setSelectedMonth] = useState("");
  const [selectedQuarter, setSelectedQuarter] = useState("");
  const [selectedHalfYear, setSelectedHalfYear] = useState("");
  const [selectedYear, setSelectedYear] = useState("");
  const [fromDate, setFromDate] = useState<string | null>(null);
  const [toDate, setToDate] = useState<string | null>(null);
  const [calculatedFromDate, setCalculatedFromDate] = useState<string | null>(null);
  const [calculatedToDate, setCalculatedToDate] = useState<string | null>(null);
  
  // Ledger filter state
  const [selectedLedgerIds, setSelectedLedgerIds] = useState<number[]>([]);
  const [selectedLedgers, setSelectedLedgers] = useState<Array<{ ledger_id: number; name: string; group: string | null }>>([]);

  // Check if invoice number is entered (disables date filter)
  const isInvoiceNoEntered = invoiceNo.trim().length > 0;

  // Pagination
  const { currentPage, pageSize, setCurrentPage, setPageSize } = usePagination(50);

  // Fetch dropdown data
  const { data: invoiceTypes = [], isLoading: isLoadingTypes } = useInvoiceTypes();
  const { data: stockPlaces = [], isLoading: isLoadingStockPlaces } = useStockPlaces();

  // Fetch invoices mutation
  const { mutate: searchInvoices, data: invoiceData, isPending: isLoadingInvoices } = useInvoiceSearch();

  const handleDateChange = (from: string | null, to: string | null) => {
    setCalculatedFromDate(from);
    setCalculatedToDate(to);
  };

  const handleSearch = () => {
    // Get party name from selected ledgers
    const partyName = selectedLedgers.length > 0 ? selectedLedgers[0].name : null;
    
    // Parse invoice number (should be numeric)
    const parsedInvoiceNo = invoiceNo.trim() ? parseInt(invoiceNo.trim(), 10) : null;
    
    // If invoice number is entered, dates should be null
    const shouldUseDates = !isInvoiceNoEntered;
    
    searchInvoices(
      {
        pageSize: 0, // 0 = fetch all
        pageNumber: 0,
        invType: selectedInvType,
        fromDate: shouldUseDates ? calculatedFromDate : null,
        toDate: shouldUseDates ? calculatedToDate : null,
        invoiceNo: parsedInvoiceNo,
        bill_No: billNo.trim() || null,
        spIds: selectedStockPlaceIds,
        partyName: partyName,
        itemName: itemName.trim() || null,
      },
      {
        onSuccess: (data) => {
          toast.success(`Loaded ${data.list.length} invoices`);
          setCurrentPage(1);
        },
        onError: (error) => {
          toast.error("Failed to load invoices");
          console.error(error);
        },
      }
    );
  };

  const handleClear = () => {
    setSelectedInvType(invType); // Reset to the prop value
    setSelectedStockPlaceIds([0]);
    setInvoiceNo("");
    setDateType("current_month");
    setSelectedMonth("");
    setSelectedQuarter("");
    setSelectedHalfYear("");
    setSelectedYear("");
    setFromDate(null);
    setToDate(null);
    setCalculatedFromDate(null);
    setCalculatedToDate(null);
    setBillNo("");
    setItemName("");
    setSelectedLedgerIds([]);
    setSelectedLedgers([]);
    setSearchTerm("");
  };

  // Filter and search
  const filteredInvoices = useMemo(() => {
    const invoices = invoiceData?.list || [];
    if (!invoices || invoices.length === 0) return [];

    return invoices.filter((inv) => {
      if (!searchTerm) return true;
      const search = searchTerm.toLowerCase();
      return (
        inv.bill_No?.toLowerCase().includes(search) ||
        inv.offline_Bill_No?.toLowerCase().includes(search) ||
        inv.partyName?.toLowerCase().includes(search) ||
        inv.shipToName?.toLowerCase().includes(search) ||
        inv.spName?.toLowerCase().includes(search) ||
        inv.recBy?.toLowerCase().includes(search) ||
        inv.irn?.toLowerCase().includes(search) ||
        String(inv.invoiceNo ?? "").includes(search)
      );
    });
  }, [invoiceData?.list, searchTerm]);

  // Calculate stats
  const totalAmount = filteredInvoices.reduce(
    (sum, inv) => sum + (inv.grandTotal || 0),
    0
  );

  // Pagination
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedInvoices = filteredInvoices.slice(startIndex, endIndex);

  const isLoading = isLoadingTypes || isLoadingStockPlaces || isLoadingInvoices;
  const advancedFilterCount = [
    showInvoiceTypeFilter && selectedInvType !== invType,
    selectedStockPlaceIds.length > 0 && !(selectedStockPlaceIds.length === 1 && selectedStockPlaceIds[0] === 0),
    billNo,
    itemName,
    selectedLedgerIds.length > 0,
  ].filter(Boolean).length;

  // Context menu handlers
  const handleViewInvoice = (invoice: InvoiceSearchItem) => {
    setPreviewInvoice(invoice);
    setPreviewOpen(true);
  };

  const handleEditInvoice = (invoice: InvoiceSearchItem) => {
    toast.info(`Edit invoice: ${invoice.bill_No}`);
    // router.push(`/invoices/${invoice.invCode}/edit`);
  };

  const handlePrintInvoice = (invoice: InvoiceSearchItem) => {
    toast.info(`Print invoice: ${invoice.bill_No}`);
  };

  const handleEmailInvoice = (invoice: InvoiceSearchItem) => {
    toast.info(`Email invoice: ${invoice.bill_No}`);
  };

  const handleDuplicateInvoice = (invoice: InvoiceSearchItem) => {
    toast.info(`Duplicate invoice: ${invoice.bill_No}`);
  };

  const handleDownloadPDF = (invoice: InvoiceSearchItem) => {
    toast.info(`Download PDF: ${invoice.bill_No}`);
  };

  const handleConvertToReturn = (invoice: InvoiceSearchItem) => {
    toast.info(`Convert to return: ${invoice.bill_No}`);
  };

  const handleCancelInvoice = (invoice: InvoiceSearchItem) => {
    toast.warning(`Cancel invoice: ${invoice.bill_No}`);
  };

  const handleDeleteConfirm = () => {
    if (!deleteTarget) return;
    deleteMutation.mutate(
      { id: deleteTarget.invCode, invType: deleteTarget.inv_Type },
      {
        onSuccess: () => {
          toast.success(`Invoice "${deleteTarget.bill_No}" deleted`);
          setDeleteTarget(null);
          // Refresh the listing
          if (invoiceData) {
            searchInvoices(
              { pageSize: 0, pageNumber: 0, invType: selectedInvType, fromDate: null, toDate: null, invoiceNo: null, bill_No: null, spIds: [0], partyName: null, itemName: null },
              { onError: () => toast.error("Failed to refresh list") }
            );
          }
        },
        onError: (error) => {
          toast.error("Failed to delete invoice");
          console.error(error);
        },
      }
    );
  };

  // Lazy-load submenu for Print options
  const loadPrintSubmenu = async (invoice: InvoiceSearchItem): Promise<ContextMenuItem[]> => {
    const sessionId = auth.getSessionId();
    if (!sessionId) {
      toast.error("Session expired");
      return [];
    }

    // Check cache first
    const cacheKey = `${invoice.invCode}_${invoice.inv_Type}`;
    if (setupInfoCache.current.has(cacheKey)) {
      const setupInfo = setupInfoCache.current.get(cacheKey);
      return setupInfo.printReports.map((report: any) => ({
        label: report.reportName,
        onClick: async () => {
          try {
            toast.loading(`Preparing print preview...`);
            
            const pdfBlob = await invoiceService.printInvoice({
              id: invoice.invCode,
              invType: invoice.inv_Type,
              reportName: report.fileName,
              sessionId: sessionId!,
              noOfCopies: report.noOfCopies,
            });

            const url = window.URL.createObjectURL(pdfBlob);
            const printWindow = window.open(url, '_blank');
            
            if (printWindow) {
              printWindow.onload = () => {
                printWindow.print();
                setTimeout(() => window.URL.revokeObjectURL(url), 1000);
              };
            } else {
              const link = document.createElement("a");
              link.href = url;
              link.download = `${invoice.bill_No || invoice.invCode}_${report.reportName}.pdf`;
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
              window.URL.revokeObjectURL(url);
            }

            toast.dismiss();
            toast.success(`Print preview opened`);
          } catch (error) {
            toast.dismiss();
            toast.error("Failed to print invoice");
            console.error("Print error:", error);
          }
        },
      }));
    }

    // Fetch + cache
    try {
      const setupInfo = await invoiceService.getSetupInfo({
        id: invoice.invCode,
        invType: invoice.inv_Type,
        sessionId,
        fromInvoice: true,
      });

      // Cache result
      setupInfoCache.current.set(cacheKey, setupInfo);

      const printOptions: ContextMenuItem[] = setupInfo.printReports.map((report) => ({
        label: report.reportName,
        onClick: async () => {
          try {
            toast.loading(`Preparing print preview...`);
            
            const pdfBlob = await invoiceService.printInvoice({
              id: invoice.invCode,
              invType: invoice.inv_Type,
              reportName: report.fileName,
              sessionId: sessionId!,
              noOfCopies: report.noOfCopies,
            });

            const url = window.URL.createObjectURL(pdfBlob);
            const printWindow = window.open(url, '_blank');
            
            if (printWindow) {
              printWindow.onload = () => {
                printWindow.print();
                setTimeout(() => window.URL.revokeObjectURL(url), 1000);
              };
            } else {
              const link = document.createElement("a");
              link.href = url;
              link.download = `${invoice.bill_No || invoice.invCode}_${report.reportName}.pdf`;
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
              window.URL.revokeObjectURL(url);
            }

            toast.dismiss();
            toast.success(`Print preview opened`);
          } catch (error) {
            toast.dismiss();
            toast.error("Failed to print invoice");
            console.error("Print error:", error);
          }
        },
      }));

      return printOptions;
    } catch (error) {
      console.error("Failed to load print options:", error);
      toast.error("Failed to load print options");
      return [];
    }
  };

  // Lazy-load submenu for Export options
  const loadExportSubmenu = async (invoice: InvoiceSearchItem): Promise<ContextMenuItem[]> => {
    const sessionId = auth.getSessionId();
    if (!sessionId) {
      toast.error("Session expired");
      return [];
    }

    // Check cache first
    const cacheKey = `${invoice.invCode}_${invoice.inv_Type}`;
    if (setupInfoCache.current.has(cacheKey)) {
      const setupInfo = setupInfoCache.current.get(cacheKey);
      return setupInfo.printReports.map((report: any) => ({
        label: report.reportName,
        onClick: async () => {
          try {
            toast.loading(`Exporting ${invoice.bill_No}...`);
            
            const pdfBlob = await invoiceService.printInvoice({
              id: invoice.invCode,
              invType: invoice.inv_Type,
              reportName: report.fileName,
              sessionId: sessionId!,
              noOfCopies: report.noOfCopies,
            });

            const url = window.URL.createObjectURL(pdfBlob);
            const link = document.createElement("a");
            link.href = url;
            link.download = `${invoice.bill_No || invoice.invCode}_${report.reportName}.pdf`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);

            toast.dismiss();
            toast.success(`Exported: ${report.reportName}`);
          } catch (error) {
            toast.dismiss();
            toast.error("Failed to export invoice");
            console.error("Export error:", error);
          }
        },
      }));
    }

    // Fetch + cache
    try {
      const setupInfo = await invoiceService.getSetupInfo({
        id: invoice.invCode,
        invType: invoice.inv_Type,
        sessionId,
        fromInvoice: true,
      });

      // Cache result
      setupInfoCache.current.set(cacheKey, setupInfo);

      const exportOptions: ContextMenuItem[] = setupInfo.printReports.map((report) => ({
        label: report.reportName,
        onClick: async () => {
          try {
            toast.loading(`Exporting ${invoice.bill_No}...`);
            
            const pdfBlob = await invoiceService.printInvoice({
              id: invoice.invCode,
              invType: invoice.inv_Type,
              reportName: report.fileName,
              sessionId: sessionId!,
              noOfCopies: report.noOfCopies,
            });

            const url = window.URL.createObjectURL(pdfBlob);
            const link = document.createElement("a");
            link.href = url;
            link.download = `${invoice.bill_No || invoice.invCode}_${report.reportName}.pdf`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);

            toast.dismiss();
            toast.success(`Exported: ${report.reportName}`);
          } catch (error) {
            toast.dismiss();
            toast.error("Failed to export invoice");
            console.error("Export error:", error);
          }
        },
      }));

      return exportOptions;
    } catch (error) {
      console.error("Failed to load export options:", error);
      toast.error("Failed to load export options");
      return [];
    }
  };

  const getInvoiceContextMenu = (invoice: InvoiceSearchItem): ContextMenuItem[] => {
    const items: ContextMenuItem[] = [
      {
        label: "View Invoice",
        icon: Eye,
        onClick: () => handleViewInvoice(invoice),
        shortcut: "⌘V",
      },
      {
        label: "Print",
        icon: Printer,
        shortcut: "⌘P",
        onSubmenuOpen: () => loadPrintSubmenu(invoice),
      },
      {
        label: "Export",
        icon: FileDown,
        onSubmenuOpen: () => loadExportSubmenu(invoice),
      },
      {
        label: "Email Invoice",
        icon: Mail,
        onClick: () => handleEmailInvoice(invoice),
        variant: "success",
      },
    ];

    if (!hideActions) {
      items.push(
        {
          label: "Edit",
          icon: Edit,
          onClick: () => handleEditInvoice(invoice),
        },
        {
          label: "Duplicate",
          icon: Copy,
          onClick: () => handleDuplicateInvoice(invoice),
          divider: true,
        },
        {
          label: "Convert to Return",
          icon: RotateCcw,
          onClick: () => handleConvertToReturn(invoice),
        },
        {
          label: "Cancel Invoice",
          icon: XCircle,
          onClick: () => handleCancelInvoice(invoice),
          variant: "danger",
        },
        {
          label: "Delete",
          icon: Trash2,
          onClick: () => setDeleteTarget(invoice),
          variant: "danger",
          divider: true,
        }
      );
    }

    return items;
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Stats Card */}
      {filteredInvoices.length > 0 && (
        <Card className="relative overflow-hidden border-0 bg-linear-to-br from-blue-500 to-blue-600 text-white shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium opacity-90">Total Amount</p>
                <p className="text-3xl font-bold mt-1">{formatCurrency(totalAmount)}</p>
              </div>
              <FileText className="h-12 w-12 opacity-80" />
            </div>
            <div className="mt-4 text-sm opacity-90">
              {filteredInvoices.length} invoice{filteredInvoices.length !== 1 ? "s" : ""}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filter Panel */}
      <Card className="border shadow-sm">
        <CardContent className="p-4 space-y-3">
          {/* Quick Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Quick search by bill no, party, type..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 h-9"
            />
          </div>

          <div className="flex flex-wrap items-end gap-2">
            {/* Invoice Number */}
            <div className="w-[160px]">
              <Input
                type="number"
                placeholder="Invoice No."
                value={invoiceNo}
                onChange={(e) => setInvoiceNo(e.target.value)}
                className="h-9"
              />
            </div>

            {/* Date Range */}
            <div className={`w-[200px] ${isInvoiceNoEntered ? "opacity-50 pointer-events-none" : ""}`}>
              <DateRangeFilter
                dateType={dateType}
                selectedMonth={selectedMonth}
                selectedQuarter={selectedQuarter}
                selectedHalfYear={selectedHalfYear}
                selectedYear={selectedYear}
                fromDate={fromDate}
                toDate={toDate}
                onDateTypeChange={setDateType}
                onSelectedMonthChange={setSelectedMonth}
                onSelectedQuarterChange={setSelectedQuarter}
                onSelectedHalfYearChange={setSelectedHalfYear}
                onSelectedYearChange={setSelectedYear}
                onFromDateChange={setFromDate}
                onToDateChange={setToDate}
                onDateChange={handleDateChange}
                label={isInvoiceNoEntered ? "Date (disabled)" : "Date Range"}
              />
            </div>

            {/* Advanced Filters Drawer */}
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" size="sm" className="h-9">
                  <SlidersHorizontal className="h-4 w-4 mr-2" />
                  Filters
                  {advancedFilterCount > 0 && (
                    <Badge variant="secondary" className="ml-2">{advancedFilterCount}</Badge>
                  )}
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[400px] sm:w-[480px] overflow-y-auto">
                <SheetHeader>
                  <SheetTitle>Advanced Filters</SheetTitle>
                  <SheetDescription>Narrow down invoices with additional filters</SheetDescription>
                </SheetHeader>

                <div className="space-y-5 mt-6">
                  {/* Invoice Type */}
                  {showInvoiceTypeFilter && (
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Invoice Type</label>
                      <Select
                        value={selectedInvType.toString()}
                        onValueChange={(value) => setSelectedInvType(Number(value))}
                        disabled={isLoadingTypes}
                      >
                        <SelectTrigger className="h-9 w-full">
                          <SelectValue placeholder="All Types" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="0">All Types</SelectItem>
                          {invoiceTypes.map((type) => (
                            <SelectItem key={type.invTypeId} value={type.invTypeId.toString()}>
                              {type.typeName}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {/* Bill Number */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Bill Number</label>
                    <Input
                      placeholder="Enter bill number"
                      value={billNo}
                      onChange={(e) => setBillNo(e.target.value)}
                      className="h-9"
                    />
                  </div>

                  {/* Item Name */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Item Name</label>
                    <Input
                      placeholder="Enter item name"
                      value={itemName}
                      onChange={(e) => setItemName(e.target.value)}
                      className="h-9"
                    />
                  </div>

                  {/* Stock Places */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Stock Places</label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full h-9 justify-between font-normal"
                          disabled={isLoadingStockPlaces}
                        >
                          {selectedStockPlaceIds.length === 0 || (selectedStockPlaceIds.length === 1 && selectedStockPlaceIds[0] === 0) ? (
                            <span className="text-muted-foreground">All Stock Places</span>
                          ) : (
                            <span className="truncate">
                              {selectedStockPlaceIds.length} place{selectedStockPlaceIds.length > 1 ? "s" : ""} selected
                            </span>
                          )}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-full p-0" align="start">
                        <Command>
                          <CommandInput placeholder="Search stock places..." />
                          <CommandList>
                            <CommandEmpty>No stock places found.</CommandEmpty>
                            <CommandGroup>
                              <CommandItem onSelect={() => setSelectedStockPlaceIds([0])}>
                                <Checkbox
                                  checked={selectedStockPlaceIds.length === 1 && selectedStockPlaceIds[0] === 0}
                                  className="mr-2"
                                />
                                <div className="flex-1">
                                  <div className="font-medium">All Stock Places</div>
                                </div>
                              </CommandItem>
                              {stockPlaces.map((sp) => (
                                <CommandItem
                                  key={sp.sp_ID}
                                  onSelect={() => {
                                    setSelectedStockPlaceIds((prev) => {
                                      const filtered = prev.filter(id => id !== 0);
                                      if (prev.includes(sp.sp_ID)) {
                                        const newIds = filtered.filter((id) => id !== sp.sp_ID);
                                        return newIds.length === 0 ? [0] : newIds;
                                      } else {
                                        return [...filtered, sp.sp_ID];
                                      }
                                    });
                                  }}
                                >
                                  <Checkbox
                                    checked={selectedStockPlaceIds.includes(sp.sp_ID)}
                                    className="mr-2"
                                  />
                                  <div className="flex-1">
                                    <div className="font-medium">{sp.name}</div>
                                    <div className="text-xs text-muted-foreground">Code: {sp.code}</div>
                                  </div>
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                    {selectedStockPlaceIds.length > 0 && !(selectedStockPlaceIds.length === 1 && selectedStockPlaceIds[0] === 0) && (
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {selectedStockPlaceIds.map((spId) => {
                          if (spId === 0) return null;
                          const sp = stockPlaces.find((s) => s.sp_ID === spId);
                          if (!sp) return null;
                          return (
                            <Badge key={spId} variant="secondary" className="text-xs gap-1 pr-1">
                              <span>{sp.name}</span>
                              <button
                                type="button"
                                className="ml-1 rounded-sm hover:bg-destructive/20 hover:text-destructive"
                                onClick={() => {
                                  setSelectedStockPlaceIds((prev) => {
                                    const newIds = prev.filter((id) => id !== spId);
                                    return newIds.length === 0 ? [0] : newIds;
                                  });
                                }}
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </Badge>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Party / Ledger */}
                  <div className="space-y-2">
                    <LedgerSearchInput
                      selectedLedgerIds={selectedLedgerIds}
                      onLedgerIdsChange={setSelectedLedgerIds}
                      selectedLedgers={selectedLedgers}
                      onSelectedLedgersChange={setSelectedLedgers}
                      label="Party (Ledger)"
                      placeholder="Search and select party..."
                      groups={null}
                      multiSelect={false}
                    />
                  </div>
                </div>
              </SheetContent>
            </Sheet>

            <Button
              onClick={handleSearch}
              disabled={isLoading}
              size="sm"
              className="h-9"
            >
              {isLoadingInvoices ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                  Loading...
                </>
              ) : (
                <>
                  <Search className="h-3.5 w-3.5 mr-1.5" />
                  Search
                </>
              )}
            </Button>
            <Button variant="outline" onClick={handleClear} size="sm" className="h-9">
              <X className="h-3.5 w-3.5 mr-1.5" />
              Clear
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Results Table */}
      {filteredInvoices.length > 0 ? (
        <Card className="border-0 shadow-lg">
          <CardHeader className="border-b">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl">{title}</CardTitle>
                <CardDescription>
                  Showing {filteredInvoices.length} invoices • Total: {formatCurrency(totalAmount)}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
                <TableHeader>
                  <TableRow className="bg-linear-to-r from-indigo-50 to-purple-50 dark:from-indigo-950/20 dark:to-purple-950/20">
                    <TableHead className="font-semibold">Bill No</TableHead>
                    <TableHead className="font-semibold text-center">Inv. No</TableHead>
                    <TableHead className="font-semibold">Date</TableHead>
                    <TableHead className="font-semibold">Party</TableHead>
                    <TableHead className="font-semibold">Stock Place</TableHead>
                    <TableHead className="text-right font-semibold">Amount</TableHead>
                    <TableHead className="font-semibold">Payment</TableHead>
                    <TableHead className="font-semibold text-center">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedInvoices.map((invoice) => (
                    <ContextMenu key={invoice.invCode} items={getInvoiceContextMenu(invoice)}>
                      <TableRow className="hover:bg-muted/50 cursor-context-menu">
                        <TableCell className="font-mono text-sm">
                          <div className="flex flex-col">
                            <span>{invoice.bill_No || "-"}</span>
                            {invoice.offline_Bill_No && (
                              <span className="text-[10px] text-muted-foreground">
                                Offline: {invoice.offline_Bill_No}
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-center tabular-nums">
                          {invoice.invoiceNo ?? "-"}
                        </TableCell>
                        <TableCell className="text-sm">
                          {invoice.date ? (
                            (() => {
                              try {
                                const date = new Date(invoice.date);
                                return format(date, "dd MMM yyyy");
                              } catch {
                                return invoice.date;
                              }
                            })()
                          ) : (
                            "-"
                          )}
                        </TableCell>
                        <TableCell className="text-sm">
                          <div className="flex flex-col">
                            <span className="font-medium">
                              {invoice.partyName || "-"}
                            </span>
                            {invoice.shipToName && invoice.shipToName !== invoice.partyName && (
                              <span className="text-[10px] text-muted-foreground">
                                Ship: {invoice.shipToName}
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-sm">{invoice.spName || "-"}</TableCell>
                        <TableCell className="text-right font-medium">
                          {formatCurrency(invoice.grandTotal)}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs">
                            {invoice.recBy || "N/A"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          {invoice.isAuthorized ? (
                            <Badge
                              variant="secondary"
                              className="text-[10px] bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"
                              title={
                                invoice.authorizedBy
                                  ? `Authorized by ${invoice.authorizedBy}`
                                  : "Authorized"
                              }
                            >
                              Authorized
                            </Badge>
                          ) : (
                            <Badge
                              variant="outline"
                              className="text-[10px] text-muted-foreground"
                            >
                              Pending
                            </Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    </ContextMenu>
                  ))}
                </TableBody>
              </Table>

            {/* Pagination */}
            <div className="border-t p-4">
              <TablePagination
                currentPage={currentPage}
                pageSize={pageSize}
                totalItems={filteredInvoices.length}
                onPageChange={setCurrentPage}
                onPageSizeChange={setPageSize}
                pageSizeOptions={[25, 50, 100, 200]}
              />
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="p-4">
          <CardContent className="py-12 text-center">
            <Icon className="mx-auto h-12 w-12 text-muted-foreground/40" />
            <p className="mt-4 text-sm text-muted-foreground">
              {isLoadingInvoices ? "Loading invoices..." : "No invoices found. Try adjusting your filters."}
            </p>
          </CardContent>
        </Card>
      )}

      {/* AI Assistant */}
      <ModuleAIAssistant
        moduleName={title}
        moduleData={{ invoices: filteredInvoices }}
      />

      {/* Delete confirmation dialog */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Invoice</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete invoice &quot;{deleteTarget?.bill_No}&quot;? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMutation.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={deleteMutation.isPending}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              {deleteMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Invoice bill preview */}
      <InvoicePreviewDialog
        open={previewOpen}
        onOpenChange={setPreviewOpen}
        invCode={previewInvoice?.invCode ?? null}
        invType={previewInvoice?.inv_Type ?? selectedInvType}
        fallback={previewInvoice}
      />
    </div>
  );
}
