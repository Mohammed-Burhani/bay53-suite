"use client";

import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { SlidersHorizontal, FileDown, FileText, Printer, List } from "lucide-react";
import { MultiSelectCheckbox } from "@/components/bay53crm/shared/MultiSelectCheckbox";
import { StageBadge } from "@/components/bay53crm/shared/StageBadge";
import { useCRMLeads, useCRMMasterValues } from "@/lib/hooks/useCRM";
import { formatCurrency, formatDate } from "@/lib/bay53crm/constants";
import { exportToExcel, exportToPDF, printTable } from "@/lib/utils/report-export";
import type { LeadStage, CRMLead } from "@/lib/bay53crm/types";

const ALL_STAGES: LeadStage[] = ["Cold Lead", "Hot Lead", "Tender", "Tender Won", "Tender Lost", "Won", "Lost"];

export function LeadDetailsReport() {
  const { data: leads = [] } = useCRMLeads();
  const { data: regions = [] } = useCRMMasterValues("region");
  const { data: sources = [] } = useCRMMasterValues("lead_source");
  const { data: assignedTos = [] } = useCRMMasterValues("assigned_to");
  const { data: customerStates = [] } = useCRMMasterValues("customer_state");

  const [activeTab, setActiveTab] = useState("criteria");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [worthMin, setWorthMin] = useState("");
  const [worthMax, setWorthMax] = useState("");
  const [customer, setCustomer] = useState("");
  const [regionIds, setRegionIds] = useState<string[]>([]);
  const [customerStatesFilter, setCustomerStatesFilter] = useState<string[]>([]);
  const [stages, setStages] = useState<LeadStage[]>([]);
  const [assignedTosFilter, setAssignedTosFilter] = useState<string[]>([]);
  const [sourcesFilter, setSourcesFilter] = useState<string[]>([]);
  const [statuses, setStatuses] = useState<string[]>([]);
  const [stateRegion, setStateRegion] = useState("");

  const filteredLeads = useMemo(() => {
    return leads.filter((lead) => {
      if (fromDate && lead.date < fromDate) return false;
      if (toDate && lead.date > toDate) return false;
      if (worthMin && lead.value < Number(worthMin)) return false;
      if (worthMax && lead.value > Number(worthMax)) return false;
      if (customer && !lead.customerName.toLowerCase().includes(customer.toLowerCase())) return false;
      if (regionIds.length > 0 && !regionIds.includes(lead.regionId)) return false;
      if (customerStatesFilter.length > 0 && !customerStatesFilter.includes(lead.customerState)) return false;
      if (stages.length > 0 && !stages.includes(lead.stage)) return false;
      if (assignedTosFilter.length > 0 && !assignedTosFilter.includes(lead.assignedTo)) return false;
      if (sourcesFilter.length > 0 && !sourcesFilter.includes(lead.source)) return false;
      if (statuses.length > 0 && !statuses.includes(lead.status)) return false;
      if (stateRegion && lead.customerState !== stateRegion) return false;
      return true;
    });
  }, [leads, fromDate, toDate, worthMin, worthMax, customer, regionIds, customerStatesFilter, stages, assignedTosFilter, sourcesFilter, statuses, stateRegion]);

  const handleExportCSV = () => {
    const headers = [
      { key: "regionId", label: "Region" },
      { key: "title", label: "Title" },
      { key: "customerState", label: "State" },
      { key: "vertical", label: "Vertical" },
      { key: "value", label: "Value" },
      { key: "customerName", label: "Customer" },
      { key: "contactPerson", label: "Contact" },
      { key: "stage", label: "Stage" },
      { key: "source", label: "Source" },
      { key: "date", label: "Date" },
      { key: "assignedTo", label: "Assigned To" },
      { key: "status", label: "Status" },
    ];
    exportToExcel(filteredLeads as any, headers, "lead-details-report");
  };

  const handleExportPDF = () => {
    const headers = [
      { key: "regionId", label: "Region" },
      { key: "title", label: "Title" },
      { key: "value", label: "Value" },
      { key: "customerName", label: "Customer" },
      { key: "stage", label: "Stage" },
      { key: "date", label: "Date" },
      { key: "assignedTo", label: "Assigned To" },
    ];
    exportToPDF(filteredLeads as any, headers, "Lead Details Report", "lead-details-report");
  };

  const handlePrint = () => {
    const headers = [
      { key: "regionId", label: "Region" },
      { key: "title", label: "Title" },
      { key: "customerName", label: "Customer" },
      { key: "stage", label: "Stage" },
      { key: "value", label: "Value" },
      { key: "date", label: "Date" },
    ];
    printTable(filteredLeads as any, headers, "Lead Details Report");
  };

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Lead Details Report</h1>
          <p className="text-sm text-muted-foreground">{filteredLeads.length} leads</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleExportCSV}><FileDown className="h-4 w-4 mr-1" />CSV</Button>
          <Button variant="outline" size="sm" onClick={handleExportPDF}><FileText className="h-4 w-4 mr-1" />PDF</Button>
          <Button variant="outline" size="sm" onClick={handlePrint}><Printer className="h-4 w-4 mr-1" />Print</Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="criteria"><SlidersHorizontal className="h-4 w-4 mr-1" />Criteria</TabsTrigger>
          <TabsTrigger value="report"><List className="h-4 w-4 mr-1" />Report ({filteredLeads.length})</TabsTrigger>
        </TabsList>

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
                  <Label>Customer</Label>
                  <Input value={customer} onChange={(e) => setCustomer(e.target.value)} placeholder="Search customer..." />
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <div className="space-y-2">
                  <Label>Region</Label>
                  <MultiSelectCheckbox options={regions.map((r) => ({ label: r.name, value: r.code || r.name }))} selected={regionIds} onChange={setRegionIds} />
                </div>
                <div className="space-y-2">
                  <Label>Customer State</Label>
                  <MultiSelectCheckbox options={customerStates.map((s) => ({ label: s.name, value: s.name }))} selected={customerStatesFilter} onChange={setCustomerStatesFilter} />
                </div>
                <div className="space-y-2">
                  <Label>Stage</Label>
                  <MultiSelectCheckbox options={ALL_STAGES.map((s) => ({ label: s, value: s }))} selected={stages} onChange={(v) => setStages(v as LeadStage[])} />
                </div>
                <div className="space-y-2">
                  <Label>Assigned To</Label>
                  <MultiSelectCheckbox options={assignedTos.map((a) => ({ label: a.name, value: a.name }))} selected={assignedTosFilter} onChange={setAssignedTosFilter} />
                </div>
                <div className="space-y-2">
                  <Label>Source</Label>
                  <MultiSelectCheckbox options={sources.map((s) => ({ label: s.name, value: s.name }))} selected={sourcesFilter} onChange={setSourcesFilter} />
                </div>
                <div className="space-y-2">
                  <Label>Status</Label>
                  <MultiSelectCheckbox options={[{ label: "Active", value: "active" }, { label: "Closed", value: "closed" }]} selected={statuses} onChange={setStatuses} />
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-2">
                  <Label>Worth Min</Label>
                  <Input type="number" value={worthMin} onChange={(e) => setWorthMin(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Worth Max</Label>
                  <Input type="number" value={worthMax} onChange={(e) => setWorthMax(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>State Region</Label>
                  <Select value={stateRegion} onValueChange={setStateRegion}>
                    <SelectTrigger><SelectValue placeholder="All" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      {customerStates.map((s) => (
                        <SelectItem key={s.id} value={s.name}>{s.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex justify-end">
                <Button onClick={() => setActiveTab("report")}>View Report</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="report">
          <Card>
            <div className="overflow-auto max-h-[65vh]">
              <Table>
                <TableHeader>
                  <TableRow className="sticky top-0 bg-background z-10">
                    <TableHead>Region</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Stage</TableHead>
                    <TableHead className="text-right">Value</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Assigned To</TableHead>
                    <TableHead>Source</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLeads.map((lead) => (
                    <TableRow key={lead.id}>
                      <TableCell className="text-xs">{lead.regionId}</TableCell>
                      <TableCell className="font-medium text-xs max-w-[200px] truncate">{lead.title}</TableCell>
                      <TableCell className="text-xs">{lead.customerName}</TableCell>
                      <TableCell><StageBadge stage={lead.stage} /></TableCell>
                      <TableCell className="text-right text-xs">{formatCurrency(lead.value)}</TableCell>
                      <TableCell className="text-xs">{formatDate(lead.date)}</TableCell>
                      <TableCell className="text-xs">{lead.assignedTo}</TableCell>
                      <TableCell className="text-xs">{lead.source}</TableCell>
                      <TableCell className="text-xs capitalize">{lead.status}</TableCell>
                    </TableRow>
                  ))}
                  {filteredLeads.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                        No leads match the criteria
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
