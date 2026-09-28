"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import {
  Plus, Eye, Trash2, SlidersHorizontal, List, Search, Download, FileText,
  Inbox, Sparkles, FileCheck2, Trophy, AlarmClock,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useCRMMasterValues } from "@/lib/hooks/useCRM";
import { useCRMSalesDocsStore } from "@/lib/stores/crm-sales-docs-store";
import { CompactStat } from "@/components/bay53crm/dashboard/DashboardWidgets";
import { MultiSelectCheckbox } from "@/components/bay53crm/shared/MultiSelectCheckbox";
import { StatusBadge } from "@/components/bay53crm/shared/StatusBadge";
import { EnquiryDetailSheet } from "./EnquiryDetailSheet";
import { EnquiryFormDialog } from "./EnquiryFormDialog";
import { formatCompactCurrency, formatCurrency, formatDate } from "@/lib/bay53crm/constants";
import {
  ENQUIRY_PRIORITIES,
  ENQUIRY_STATUSES,
  ENQUIRY_STATUS_COLORS,
  PRIORITY_COLORS,
  daysUntil,
  type EnquiryStatus,
} from "@/lib/bay53crm/sales-docs";

const OPEN_STATUSES: EnquiryStatus[] = ["New", "In Progress"];

export function EnquiriesView() {
  const router = useRouter();
  const { enquiries, deleteEnquiry } = useCRMSalesDocsStore();
  const { data: regions = [] } = useCRMMasterValues("region");
  const { data: verticals = [] } = useCRMMasterValues("vertical");
  const { data: sources = [] } = useCRMMasterValues("lead_source");
  const { data: assignedTos = [] } = useCRMMasterValues("assigned_to");

  const [activeTab, setActiveTab] = useState("list");
  const [createOpen, setCreateOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  // Filters
  const [search, setSearch] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [status, setStatus] = useState("all");
  const [priority, setPriority] = useState("all");
  const [regionIds, setRegionIds] = useState<string[]>([]);
  const [verticalFilter, setVerticalFilter] = useState<string[]>([]);
  const [sourceFilter, setSourceFilter] = useState<string[]>([]);
  const [assignedFilter, setAssignedFilter] = useState<string[]>([]);

  // Everything except the status filter — used for the status chip counts
  const baseFiltered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return enquiries.filter((e) => {
      if (q && ![e.enquiryNo, e.customerName, e.subject, e.contactPerson].some((f) => f.toLowerCase().includes(q))) return false;
      if (fromDate && e.date < fromDate) return false;
      if (toDate && e.date > toDate) return false;
      if (priority !== "all" && e.priority !== priority) return false;
      if (regionIds.length > 0 && !regionIds.includes(e.regionId)) return false;
      if (verticalFilter.length > 0 && !verticalFilter.includes(e.vertical)) return false;
      if (sourceFilter.length > 0 && !sourceFilter.includes(e.source)) return false;
      if (assignedFilter.length > 0 && !assignedFilter.includes(e.assignedTo)) return false;
      return true;
    });
  }, [enquiries, search, fromDate, toDate, priority, regionIds, verticalFilter, sourceFilter, assignedFilter]);

  const filteredEnquiries = useMemo(
    () => (status === "all" ? baseFiltered : baseFiltered.filter((e) => e.status === status)),
    [baseFiltered, status]
  );

  const kpis = useMemo(() => {
    const open = enquiries.filter((e) => OPEN_STATUSES.includes(e.status));
    const quoted = enquiries.filter((e) => e.status === "Quoted");
    const converted = enquiries.filter((e) => e.status === "Converted");
    const decided = converted.length + enquiries.filter((e) => e.status === "Closed").length;
    const overdue = open.filter((e) => daysUntil(e.responseDue) < 0);
    return {
      total: enquiries.length,
      pipeline: enquiries.reduce((s, e) => s + e.estimatedValue, 0),
      open: open.length,
      highPriority: open.filter((e) => e.priority === "High").length,
      quoted: quoted.length,
      quotedValue: quoted.reduce((s, e) => s + e.estimatedValue, 0),
      converted: converted.length,
      convertedValue: converted.reduce((s, e) => s + e.estimatedValue, 0),
      conversionRate: decided > 0 ? Math.round((converted.length / decided) * 100) : 0,
      overdue: overdue.length,
    };
  }, [enquiries]);

  const activeFilterCount =
    [fromDate, toDate].filter(Boolean).length +
    (status !== "all" ? 1 : 0) +
    (priority !== "all" ? 1 : 0) +
    [regionIds, verticalFilter, sourceFilter, assignedFilter].filter((a) => a.length > 0).length;

  const resetFilters = () => {
    setSearch("");
    setFromDate("");
    setToDate("");
    setStatus("all");
    setPriority("all");
    setRegionIds([]);
    setVerticalFilter([]);
    setSourceFilter([]);
    setAssignedFilter([]);
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this enquiry?")) {
      deleteEnquiry(id);
      toast.success("Enquiry deleted");
    }
  };

  const handleView = (id: string) => {
    setSelectedId(id);
    setDetailOpen(true);
  };

  const handleCreateQuotation = (enquiryNo: string) => {
    router.push(`/crm/quotations?fromEnquiry=${encodeURIComponent(enquiryNo)}`);
  };

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Enquiries</h1>
          <p className="text-sm text-muted-foreground">
            {fromDate && toDate
              ? `${formatDate(fromDate)} to ${formatDate(toDate)}`
              : "All enquiries"}
            {" · "}{filteredEnquiries.length} enquiries
            {" · "}{formatCompactCurrency(filteredEnquiries.reduce((s, e) => s + e.estimatedValue, 0))} est. value
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => toast.info("Export will be available in the full release")}>
            <Download className="h-4 w-4 mr-1" />
            Export
          </Button>
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4 mr-1" />
            New Enquiry
          </Button>
        </div>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        <CompactStat icon={Inbox} label="Total Enquiries" value={String(kpis.total)} sub={`${formatCompactCurrency(kpis.pipeline)} est. value`} color="blue" />
        <CompactStat icon={Sparkles} label="Open" value={String(kpis.open)} sub={`${kpis.highPriority} high priority`} color="amber" />
        <CompactStat icon={FileCheck2} label="Quoted" value={String(kpis.quoted)} sub={`${formatCompactCurrency(kpis.quotedValue)} awaiting decision`} color="purple" />
        <CompactStat icon={Trophy} label="Converted" value={String(kpis.converted)} sub={`${kpis.conversionRate}% conversion · ${formatCompactCurrency(kpis.convertedValue)}`} color="green" trendUp trend="vs closed enquiries" />
        <CompactStat icon={AlarmClock} label="Response Overdue" value={String(kpis.overdue)} sub="Open & past due date" color="red" trendDown={kpis.overdue > 0} />
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
            <TabsTrigger value="list"><List className="h-4 w-4 mr-1" />List ({filteredEnquiries.length})</TabsTrigger>
          </TabsList>
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search enquiry no, customer, subject…"
              className="pl-8"
            />
          </div>
        </div>

        {/* Criteria Tab */}
        <TabsContent value="criteria">
          <Card>
            <CardContent className="p-4 space-y-4">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
                      {ENQUIRY_STATUSES.map((s) => (
                        <SelectItem key={s} value={s}>{s}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Priority</Label>
                  <Select value={priority} onValueChange={setPriority}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      {ENQUIRY_PRIORITIES.map((p) => (
                        <SelectItem key={p} value={p}>{p}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="space-y-2">
                  <Label>Region</Label>
                  <MultiSelectCheckbox
                    options={regions.map((r) => ({ label: r.name, value: r.code || r.name }))}
                    selected={regionIds}
                    onChange={setRegionIds}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Vertical</Label>
                  <MultiSelectCheckbox
                    options={verticals.map((v) => ({ label: v.name, value: v.name }))}
                    selected={verticalFilter}
                    onChange={setVerticalFilter}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Source</Label>
                  <MultiSelectCheckbox
                    options={sources.map((s) => ({ label: s.name, value: s.name }))}
                    selected={sourceFilter}
                    onChange={setSourceFilter}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Assigned To</Label>
                  <MultiSelectCheckbox
                    options={assignedTos.map((a) => ({ label: a.name, value: a.name }))}
                    selected={assignedFilter}
                    onChange={setAssignedFilter}
                  />
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
            {(["all", ...ENQUIRY_STATUSES] as const).map((s) => {
              const count = s === "all" ? baseFiltered.length : baseFiltered.filter((e) => e.status === s).length;
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
                    <TableHead>Enquiry No</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Subject</TableHead>
                    <TableHead>Region</TableHead>
                    <TableHead className="text-right">Est. Value</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Source</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Assigned To</TableHead>
                    <TableHead>Response Due</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredEnquiries.map((enquiry) => {
                    const due = daysUntil(enquiry.responseDue);
                    const isOpen = OPEN_STATUSES.includes(enquiry.status);
                    return (
                      <TableRow key={enquiry.id} className="cursor-pointer" onClick={() => handleView(enquiry.id)}>
                        <TableCell>
                          <p className="font-medium text-xs whitespace-nowrap">{enquiry.enquiryNo}</p>
                          <p className="text-[11px] text-muted-foreground">{formatDate(enquiry.date)}</p>
                        </TableCell>
                        <TableCell>
                          <p className="text-xs font-medium">{enquiry.customerName}</p>
                          <p className="text-[11px] text-muted-foreground">{enquiry.contactPerson}</p>
                        </TableCell>
                        <TableCell className="max-w-[240px]">
                          <p className="text-xs truncate" title={enquiry.subject}>{enquiry.subject}</p>
                          <p className="text-[11px] text-muted-foreground">{enquiry.vertical} · {enquiry.disciplines.join(", ")}</p>
                        </TableCell>
                        <TableCell className="text-xs">{enquiry.regionId}</TableCell>
                        <TableCell className="text-right text-xs">{formatCurrency(enquiry.estimatedValue)}</TableCell>
                        <TableCell><StatusBadge label={enquiry.priority} colors={PRIORITY_COLORS[enquiry.priority]} /></TableCell>
                        <TableCell className="text-xs">{enquiry.source}</TableCell>
                        <TableCell>
                          <StatusBadge label={enquiry.status} colors={ENQUIRY_STATUS_COLORS[enquiry.status]} />
                          {enquiry.quotationNo && (
                            <p className="mt-0.5 text-[10px] text-muted-foreground whitespace-nowrap">{enquiry.quotationNo}</p>
                          )}
                        </TableCell>
                        <TableCell className="text-xs">{enquiry.assignedTo}</TableCell>
                        <TableCell className="text-xs whitespace-nowrap">
                          <p>{formatDate(enquiry.responseDue)}</p>
                          {isOpen && (
                            <p className={cn("text-[11px]", due < 0 ? "text-red-600 font-medium" : due <= 2 ? "text-amber-600" : "text-muted-foreground")}>
                              {due < 0 ? `${Math.abs(due)}d overdue` : due === 0 ? "Due today" : `in ${due}d`}
                            </p>
                          )}
                        </TableCell>
                        <TableCell onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center gap-1">
                            <Button variant="ghost" size="icon" className="h-7 w-7" title="View" onClick={() => handleView(enquiry.id)}>
                              <Eye className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              variant="ghost" size="icon" className="h-7 w-7" title="Create quotation"
                              disabled={!!enquiry.quotationNo || enquiry.status === "Closed"}
                              onClick={() => handleCreateQuotation(enquiry.enquiryNo)}
                            >
                              <FileText className="h-3.5 w-3.5" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" title="Delete" onClick={() => handleDelete(enquiry.id)}>
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {filteredEnquiries.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={11} className="text-center py-8 text-muted-foreground">
                        No enquiries found matching the criteria
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
        <EnquiryDetailSheet
          enquiryId={selectedId}
          open={detailOpen}
          onOpenChange={setDetailOpen}
          onCreateQuotation={handleCreateQuotation}
        />
      )}

      <EnquiryFormDialog open={createOpen} onOpenChange={setCreateOpen} />
    </div>
  );
}
