"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import {
  Plus, Eye, Trash2, SlidersHorizontal, List, Search, Download, Copy,
  FileText, Hourglass, Trophy, XCircle, AlarmClock,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useCRMMasterValues } from "@/lib/hooks/useCRM";
import { useCRMSalesDocsStore } from "@/lib/stores/crm-sales-docs-store";
import { CompactStat } from "@/components/bay53crm/dashboard/DashboardWidgets";
import { MultiSelectCheckbox } from "@/components/bay53crm/shared/MultiSelectCheckbox";
import { StatusBadge } from "@/components/bay53crm/shared/StatusBadge";
import { QuotationDetailSheet } from "./QuotationDetailSheet";
import { QuotationFormDialog } from "./QuotationFormDialog";
import { formatCompactCurrency, formatCurrency, formatDate } from "@/lib/bay53crm/constants";
import {
  QUOTATION_STATUSES,
  QUOTATION_STATUS_COLORS,
  addDays,
  calcQuotationTotals,
  daysUntil,
  newLineItem,
  type QuotationStatus,
} from "@/lib/bay53crm/sales-docs";

const PENDING: QuotationStatus[] = ["Draft", "Sent", "Under Negotiation"];

export function QuotationsView() {
  const router = useRouter();
  // "Create Quotation" from the Enquiries page lands here with ?fromEnquiry=ENQ/..
  const fromEnquiry = useSearchParams().get("fromEnquiry");
  const { quotations, addQuotation, deleteQuotation } = useCRMSalesDocsStore();
  const { data: regions = [] } = useCRMMasterValues("region");
  const { data: assignedTos = [] } = useCRMMasterValues("assigned_to");

  const [activeTab, setActiveTab] = useState("list");
  const [createOpen, setCreateOpen] = useState(!!fromEnquiry);
  const [prefillEnquiryNo, setPrefillEnquiryNo] = useState<string | null>(fromEnquiry);
  const [formKey, setFormKey] = useState(0);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  // Filters
  const [search, setSearch] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [status, setStatus] = useState("all");
  const [regionIds, setRegionIds] = useState<string[]>([]);
  const [preparedByFilter, setPreparedByFilter] = useState<string[]>([]);
  const [amountMin, setAmountMin] = useState("");
  const [amountMax, setAmountMax] = useState("");

  // Drop the query param once the prefilled dialog is open
  useEffect(() => {
    if (fromEnquiry) router.replace("/crm/quotations");
  }, [fromEnquiry, router]);

  const withTotals = useMemo(
    () => quotations.map((q) => ({ ...q, grandTotal: calcQuotationTotals(q).grandTotal })),
    [quotations]
  );

  // Everything except the status filter — used for the status chip counts
  const baseFiltered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return withTotals.filter((qt) => {
      if (q && ![qt.quotationNo, qt.customerName, qt.title, qt.enquiryNo || ""].some((f) => f.toLowerCase().includes(q))) return false;
      if (fromDate && qt.date < fromDate) return false;
      if (toDate && qt.date > toDate) return false;
      if (regionIds.length > 0 && !regionIds.includes(qt.regionId)) return false;
      if (preparedByFilter.length > 0 && !preparedByFilter.includes(qt.preparedBy)) return false;
      if (amountMin && qt.grandTotal < Number(amountMin)) return false;
      if (amountMax && qt.grandTotal > Number(amountMax)) return false;
      return true;
    });
  }, [withTotals, search, fromDate, toDate, regionIds, preparedByFilter, amountMin, amountMax]);

  const filteredQuotations = useMemo(
    () => (status === "all" ? baseFiltered : baseFiltered.filter((q) => q.status === status)),
    [baseFiltered, status]
  );

  const kpis = useMemo(() => {
    const sum = (list: typeof withTotals) => list.reduce((s, q) => s + q.grandTotal, 0);
    const pending = withTotals.filter((q) => q.status === "Sent" || q.status === "Under Negotiation");
    const accepted = withTotals.filter((q) => q.status === "Accepted");
    const lost = withTotals.filter((q) => q.status === "Rejected" || q.status === "Expired");
    const expiring = withTotals.filter((q) => PENDING.includes(q.status) && daysUntil(q.validUntil) >= 0 && daysUntil(q.validUntil) <= 7);
    const decided = accepted.length + lost.length;
    return {
      total: withTotals.length,
      totalValue: sum(withTotals),
      pending: pending.length,
      pendingValue: sum(pending),
      accepted: accepted.length,
      acceptedValue: sum(accepted),
      winRate: decided > 0 ? Math.round((accepted.length / decided) * 100) : 0,
      lost: lost.length,
      lostValue: sum(lost),
      expiring: expiring.length,
      expiringValue: sum(expiring),
    };
  }, [withTotals]);

  const activeFilterCount =
    [fromDate, toDate, amountMin, amountMax].filter(Boolean).length +
    (status !== "all" ? 1 : 0) +
    [regionIds, preparedByFilter].filter((a) => a.length > 0).length;

  const resetFilters = () => {
    setSearch("");
    setFromDate("");
    setToDate("");
    setStatus("all");
    setRegionIds([]);
    setPreparedByFilter([]);
    setAmountMin("");
    setAmountMax("");
  };

  const openCreate = () => {
    setPrefillEnquiryNo(null);
    setFormKey((k) => k + 1);
    setCreateOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this quotation?")) {
      deleteQuotation(id);
      toast.success("Quotation deleted");
    }
  };

  const handleDuplicate = (id: string) => {
    const source = quotations.find((q) => q.id === id);
    if (!source) return;
    const date = new Date().toISOString().slice(0, 10);
    const copy = addQuotation({
      ...source,
      enquiryNo: undefined,
      revision: 0,
      status: "Draft",
      date,
      validUntil: addDays(date, 30),
      items: source.items.map((i) => newLineItem(i)),
      revisions: [{ rev: 0, date, by: source.preparedBy, note: `Duplicated from ${source.quotationNo}` }],
    });
    toast.success(`Draft ${copy.quotationNo} created from ${source.quotationNo}`);
  };

  const handleView = (id: string) => {
    setSelectedId(id);
    setDetailOpen(true);
  };

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Quotations</h1>
          <p className="text-sm text-muted-foreground">
            {fromDate && toDate
              ? `${formatDate(fromDate)} to ${formatDate(toDate)}`
              : "All quotations"}
            {" · "}{filteredQuotations.length} quotations
            {" · "}{formatCompactCurrency(filteredQuotations.reduce((s, q) => s + q.grandTotal, 0))} quoted
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => toast.info("Export will be available in the full release")}>
            <Download className="h-4 w-4 mr-1" />
            Export
          </Button>
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4 mr-1" />
            New Quotation
          </Button>
        </div>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        <CompactStat icon={FileText} label="Total Quoted" value={formatCompactCurrency(kpis.totalValue)} sub={`${kpis.total} quotations (incl. GST)`} color="blue" />
        <CompactStat icon={Hourglass} label="Awaiting Response" value={String(kpis.pending)} sub={`${formatCompactCurrency(kpis.pendingValue)} in pipeline`} color="amber" />
        <CompactStat icon={Trophy} label="Accepted" value={formatCompactCurrency(kpis.acceptedValue)} sub={`${kpis.accepted} won · ${kpis.winRate}% win rate`} color="green" trendUp trend="of decided quotes" />
        <CompactStat icon={XCircle} label="Rejected / Expired" value={String(kpis.lost)} sub={formatCompactCurrency(kpis.lostValue)} color="red" trendDown={kpis.lost > 0} />
        <CompactStat icon={AlarmClock} label="Expiring in 7 Days" value={String(kpis.expiring)} sub={`${formatCompactCurrency(kpis.expiringValue)} — follow up`} color="purple" />
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <TabsList>
            <TabsTrigger value="criteria">
              <SlidersHorizontal className="h-4 w-4 mr-1" />Criteria
              {activeFilterCount > 0 && (
                <span className="ml-1.5 rounded-full bg-primary px-1.5 text-[10px] font-semibold text-primary-foreground">{activeFilterCount}</span>
              )}
            </TabsTrigger>
            <TabsTrigger value="list"><List className="h-4 w-4 mr-1" />List ({filteredQuotations.length})</TabsTrigger>
          </TabsList>
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search quote no, customer, title…"
              className="pl-8"
            />
          </div>
        </div>

        {/* Criteria Tab */}
        <TabsContent value="criteria">
          <Card>
            <CardContent className="p-4 space-y-4">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <div className="space-y-2">
                  <Label>Date From</Label>
                  <Input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Date To</Label>
                  <Input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select value={status} onValueChange={setStatus}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      {QUOTATION_STATUSES.map((s) => (
                        <SelectItem key={s} value={s}>{s}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <div className="space-y-2">
                  <Label>Region</Label>
                  <MultiSelectCheckbox
                    options={regions.map((r) => ({ label: r.name, value: r.code || r.name }))}
                    selected={regionIds}
                    onChange={setRegionIds}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Prepared By</Label>
                  <MultiSelectCheckbox
                    options={assignedTos.map((a) => ({ label: a.name, value: a.name }))}
                    selected={preparedByFilter}
                    onChange={setPreparedByFilter}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Amount Range (₹)</Label>
                  <div className="flex gap-2">
                    <Input placeholder="Min" type="number" value={amountMin} onChange={(e) => setAmountMin(e.target.value)} />
                    <Input placeholder="Max" type="number" value={amountMax} onChange={(e) => setAmountMax(e.target.value)} />
                  </div>
                </div>
              </div>

              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={resetFilters}>Clear</Button>
                <Button onClick={() => setActiveTab("list")}>Apply & View</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* List Tab */}
        <TabsContent value="list" className="space-y-3">
          {/* Quick status chips */}
          <div className="flex flex-wrap gap-2">
            {(["all", ...QUOTATION_STATUSES] as const).map((s) => {
              const count = s === "all" ? baseFiltered.length : baseFiltered.filter((q) => q.status === s).length;
              const isActive = status === s;
              return (
                <button
                  key={s}
                  type="button"
                  onClick={() => setStatus(s)}
                  className={cn(
                    "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                    isActive ? "border-primary bg-primary text-primary-foreground" : "bg-background text-muted-foreground hover:bg-muted"
                  )}
                >
                  {s === "all" ? "All" : s} <span className="ml-1 opacity-70">{count}</span>
                </button>
              );
            })}
          </div>

          <Card>
            <div className="overflow-auto max-h-[70vh]">
              <Table>
                <TableHeader>
                  <TableRow className="sticky top-0 bg-background z-10">
                    <TableHead>Quotation No</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Region</TableHead>
                    <TableHead className="text-center">Items</TableHead>
                    <TableHead className="text-right">Grand Total</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Valid Until</TableHead>
                    <TableHead>Prepared By</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredQuotations.map((quotation) => {
                    const validity = daysUntil(quotation.validUntil);
                    const isPending = PENDING.includes(quotation.status);
                    return (
                      <TableRow key={quotation.id} className="cursor-pointer" onClick={() => handleView(quotation.id)}>
                        <TableCell>
                          <div className="flex items-center gap-1.5">
                            <p className="font-medium text-xs whitespace-nowrap">{quotation.quotationNo}</p>
                            {quotation.revision > 0 && (
                              <span className="rounded bg-muted px-1 text-[10px] font-medium text-muted-foreground">R{quotation.revision}</span>
                            )}
                          </div>
                          <p className="text-[11px] text-muted-foreground">{formatDate(quotation.date)}</p>
                        </TableCell>
                        <TableCell>
                          <p className="text-xs font-medium">{quotation.customerName}</p>
                          <p className="text-[11px] text-muted-foreground">{quotation.contactPerson}</p>
                        </TableCell>
                        <TableCell className="max-w-[240px]">
                          <p className="text-xs truncate" title={quotation.title}>{quotation.title}</p>
                          <p className="text-[11px] text-muted-foreground">{quotation.enquiryNo ? `Ref: ${quotation.enquiryNo}` : "Direct quotation"}</p>
                        </TableCell>
                        <TableCell className="text-xs">{quotation.regionId}</TableCell>
                        <TableCell className="text-center text-xs">{quotation.items.length}</TableCell>
                        <TableCell className="text-right text-xs font-semibold tabular-nums">{formatCurrency(quotation.grandTotal)}</TableCell>
                        <TableCell><StatusBadge label={quotation.status} colors={QUOTATION_STATUS_COLORS[quotation.status]} /></TableCell>
                        <TableCell className="text-xs whitespace-nowrap">
                          <p>{formatDate(quotation.validUntil)}</p>
                          {isPending && (
                            <p className={cn("text-[11px]", validity < 0 ? "text-red-600 font-medium" : validity <= 7 ? "text-amber-600" : "text-muted-foreground")}>
                              {validity < 0 ? "Validity lapsed" : validity === 0 ? "Expires today" : `${validity}d left`}
                            </p>
                          )}
                        </TableCell>
                        <TableCell className="text-xs">{quotation.preparedBy}</TableCell>
                        <TableCell onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center gap-1">
                            <Button variant="ghost" size="icon" className="h-7 w-7" title="View" onClick={() => handleView(quotation.id)}>
                              <Eye className="h-3.5 w-3.5" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-7 w-7" title="Duplicate as draft" onClick={() => handleDuplicate(quotation.id)}>
                              <Copy className="h-3.5 w-3.5" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" title="Delete" onClick={() => handleDelete(quotation.id)}>
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {filteredQuotations.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={10} className="text-center py-8 text-muted-foreground">
                        No quotations found matching the criteria
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Detail Sheet */}
      {selectedId && (
        <QuotationDetailSheet
          quotationId={selectedId}
          open={detailOpen}
          onOpenChange={setDetailOpen}
        />
      )}

      <QuotationFormDialog key={formKey} open={createOpen} onOpenChange={setCreateOpen} prefillEnquiryNo={prefillEnquiryNo} />
    </div>
  );
}
