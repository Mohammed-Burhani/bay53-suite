"use client";

import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Plus, Eye, Trash2, SlidersHorizontal, List } from "lucide-react";
import { useCRMLeads, useCreateCRMLead, useDeleteCRMLead, useCRMMasterValues } from "@/lib/hooks/useCRM";
import { useCRMFiltersStore } from "@/lib/stores/crm-filters-store";
import { MultiSelectCheckbox } from "@/components/bay53crm/shared/MultiSelectCheckbox";
import { StageBadge } from "@/components/bay53crm/shared/StageBadge";
import { LeadDetailSheet } from "./LeadDetailSheet";
import { formatCurrency, formatDate } from "@/lib/bay53crm/constants";
import type { CRMLead, LeadStage } from "@/lib/bay53crm/types";

const ALL_STAGES: LeadStage[] = ["Cold Lead", "Hot Lead", "Tender", "Tender Won", "Tender Lost", "Won", "Lost"];

export function LeadsView() {
  const { data: leads = [], isLoading } = useCRMLeads();
  const { data: regions = [] } = useCRMMasterValues("region");
  const { data: verticals = [] } = useCRMMasterValues("vertical");
  const { data: sources = [] } = useCRMMasterValues("lead_source");
  const { data: assignedTos = [] } = useCRMMasterValues("assigned_to");
  const createMutation = useCreateCRMLead();
  const deleteMutation = useDeleteCRMLead();

  const { leadsFilters, setLeadsFilters, resetLeadsFilters } = useCRMFiltersStore();

  const [activeTab, setActiveTab] = useState("list");
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);

  // New lead form state
  const [newTitle, setNewTitle] = useState("");
  const [newCustomerName, setNewCustomerName] = useState("");
  const [newContactPerson, setNewContactPerson] = useState("");
  const [newRegionId, setNewRegionId] = useState("");
  const [newVertical, setNewVertical] = useState("");
  const [newSource, setNewSource] = useState("");
  const [newAssignedTo, setNewAssignedTo] = useState("");
  const [newCustomerState, setNewCustomerState] = useState("");
  const [newValue, setNewValue] = useState("");
  const [newDate, setNewDate] = useState(new Date().toISOString().slice(0, 10));
  const [newLastFollowUp, setNewLastFollowUp] = useState("");

  const filteredLeads = useMemo(() => {
    return leads.filter((lead) => {
      if (leadsFilters.fromDate && lead.date < leadsFilters.fromDate) return false;
      if (leadsFilters.toDate && lead.date > leadsFilters.toDate) return false;
      if (leadsFilters.regionIds.length > 0 && !leadsFilters.regionIds.includes(lead.regionId)) return false;
      if (leadsFilters.verticals.length > 0 && !leadsFilters.verticals.includes(lead.vertical)) return false;
      if (leadsFilters.stages.length > 0 && !leadsFilters.stages.includes(lead.stage)) return false;
      if (leadsFilters.assignedTos.length > 0 && !leadsFilters.assignedTos.includes(lead.assignedTo)) return false;
      if (leadsFilters.sources.length > 0 && !leadsFilters.sources.includes(lead.source)) return false;
      if (leadsFilters.status !== "all" && lead.status !== leadsFilters.status) return false;
      if (leadsFilters.valueMin && lead.value < Number(leadsFilters.valueMin)) return false;
      if (leadsFilters.valueMax && lead.value > Number(leadsFilters.valueMax)) return false;
      return true;
    });
  }, [leads, leadsFilters]);

  const handleCreateLead = () => {
    if (!newTitle.trim() || !newCustomerName.trim()) return;
    createMutation.mutate({
      regionId: newRegionId,
      title: newTitle.trim(),
      customerState: newCustomerState,
      vertical: newVertical,
      value: Number(newValue) || 0,
      customerName: newCustomerName.trim(),
      contactPerson: newContactPerson.trim(),
      stage: "Cold Lead",
      source: newSource,
      date: newDate,
      assignedTo: newAssignedTo,
      lastFollowUp: newLastFollowUp.trim(),
      lastFollowUpDate: newLastFollowUp ? new Date().toISOString() : "",
      status: "active",
      archived: false,
    });
    setCreateOpen(false);
    resetForm();
  };

  const resetForm = () => {
    setNewTitle("");
    setNewCustomerName("");
    setNewContactPerson("");
    setNewRegionId("");
    setNewVertical("");
    setNewSource("");
    setNewAssignedTo("");
    setNewCustomerState("");
    setNewValue("");
    setNewDate(new Date().toISOString().slice(0, 10));
    setNewLastFollowUp("");
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this lead?")) {
      deleteMutation.mutate(id);
    }
  };

  const handleView = (id: string) => {
    setSelectedLeadId(id);
    setDetailOpen(true);
  };

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Leads</h1>
          <p className="text-sm text-muted-foreground">
            {leadsFilters.fromDate && leadsFilters.toDate
              ? `${formatDate(leadsFilters.fromDate)} to ${formatDate(leadsFilters.toDate)}`
              : "All leads"}
            {" · "}{filteredLeads.length} leads
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="h-4 w-4 mr-1" />
          New Lead
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="criteria"><SlidersHorizontal className="h-4 w-4 mr-1" />Criteria</TabsTrigger>
          <TabsTrigger value="list"><List className="h-4 w-4 mr-1" />List ({filteredLeads.length})</TabsTrigger>
        </TabsList>

        {/* Criteria Tab */}
        <TabsContent value="criteria">
          <Card>
            <CardContent className="p-4 space-y-4">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <div className="space-y-2">
                  <Label>Date From</Label>
                  <Input type="date" value={leadsFilters.fromDate} onChange={(e) => setLeadsFilters({ fromDate: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Date To</Label>
                  <Input type="date" value={leadsFilters.toDate} onChange={(e) => setLeadsFilters({ toDate: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select value={leadsFilters.status} onValueChange={(v) => setLeadsFilters({ status: v as any })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="closed">Closed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <div className="space-y-2">
                  <Label>Region</Label>
                  <MultiSelectCheckbox
                    options={regions.map((r) => ({ label: r.name, value: r.code || r.name }))}
                    selected={leadsFilters.regionIds}
                    onChange={(v) => setLeadsFilters({ regionIds: v })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Vertical</Label>
                  <MultiSelectCheckbox
                    options={verticals.map((v) => ({ label: v.name, value: v.name }))}
                    selected={leadsFilters.verticals}
                    onChange={(v) => setLeadsFilters({ verticals: v })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Stage</Label>
                  <MultiSelectCheckbox
                    options={ALL_STAGES.map((s) => ({ label: s, value: s }))}
                    selected={leadsFilters.stages}
                    onChange={(v) => setLeadsFilters({ stages: v as LeadStage[] })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Assigned To</Label>
                  <MultiSelectCheckbox
                    options={assignedTos.map((a) => ({ label: a.name, value: a.name }))}
                    selected={leadsFilters.assignedTos}
                    onChange={(v) => setLeadsFilters({ assignedTos: v })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Source</Label>
                  <MultiSelectCheckbox
                    options={sources.map((s) => ({ label: s.name, value: s.name }))}
                    selected={leadsFilters.sources}
                    onChange={(v) => setLeadsFilters({ sources: v })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Value Range</Label>
                  <div className="flex gap-2">
                    <Input placeholder="Min" type="number" value={leadsFilters.valueMin} onChange={(e) => setLeadsFilters({ valueMin: e.target.value })} />
                    <Input placeholder="Max" type="number" value={leadsFilters.valueMax} onChange={(e) => setLeadsFilters({ valueMax: e.target.value })} />
                  </div>
                </div>
              </div>

              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={resetLeadsFilters}>Clear</Button>
                <Button onClick={() => setActiveTab("list")}>Apply & View</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* List Tab */}
        <TabsContent value="list">
          <Card>
            <div className="overflow-auto max-h-[70vh]">
              <Table>
                <TableHeader>
                  <TableRow className="sticky top-0 bg-background z-10">
                    <TableHead>Region</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>State</TableHead>
                    <TableHead>Vertical</TableHead>
                    <TableHead className="text-right">Value</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Stage</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Assigned To</TableHead>
                    <TableHead>Last Follow Up</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLeads.map((lead) => (
                    <TableRow key={lead.id}>
                      <TableCell className="text-xs">{lead.regionId}</TableCell>
                      <TableCell className="font-medium text-xs max-w-[200px] truncate">{lead.title}</TableCell>
                      <TableCell className="text-xs">{lead.customerState}</TableCell>
                      <TableCell className="text-xs">{lead.vertical}</TableCell>
                      <TableCell className="text-right text-xs">{formatCurrency(lead.value)}</TableCell>
                      <TableCell className="text-xs">{lead.customerName}</TableCell>
                      <TableCell className="text-xs">{lead.contactPerson}</TableCell>
                      <TableCell><StageBadge stage={lead.stage} /></TableCell>
                      <TableCell className="text-xs">{formatDate(lead.date)}</TableCell>
                      <TableCell className="text-xs">{lead.assignedTo}</TableCell>
                      <TableCell className="text-xs max-w-[150px] truncate" title={lead.lastFollowUp}>
                        {lead.lastFollowUp || "—"}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleView(lead.id)}>
                            <Eye className="h-3.5 w-3.5" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleDelete(lead.id)}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {filteredLeads.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={12} className="text-center py-8 text-muted-foreground">
                        No leads found matching the criteria
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
      {selectedLeadId && (
        <LeadDetailSheet
          leadId={selectedLeadId}
          open={detailOpen}
          onOpenChange={setDetailOpen}
        />
      )}

      {/* Create Lead Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Create New Lead</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
            <div className="space-y-2">
              <Label>Title *</Label>
              <Input value={newTitle} onChange={(e) => setNewTitle(e.target.value)} placeholder="Lead title" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Customer Name *</Label>
                <Input value={newCustomerName} onChange={(e) => setNewCustomerName(e.target.value)} placeholder="Company name" />
              </div>
              <div className="space-y-2">
                <Label>Contact Person</Label>
                <Input value={newContactPerson} onChange={(e) => setNewContactPerson(e.target.value)} placeholder="Contact name" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Region</Label>
                <Select value={newRegionId} onValueChange={setNewRegionId}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    {regions.map((r) => (
                      <SelectItem key={r.id} value={r.code || r.name}>{r.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Vertical</Label>
                <Select value={newVertical} onValueChange={setNewVertical}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    {verticals.map((v) => (
                      <SelectItem key={v.id} value={v.name}>{v.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Source</Label>
                <Select value={newSource} onValueChange={setNewSource}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    {sources.map((s) => (
                      <SelectItem key={s.id} value={s.name}>{s.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Assigned To</Label>
                <Select value={newAssignedTo} onValueChange={setNewAssignedTo}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    {assignedTos.map((a) => (
                      <SelectItem key={a.id} value={a.name}>{a.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Value (₹)</Label>
                <Input type="number" value={newValue} onChange={(e) => setNewValue(e.target.value)} placeholder="0" />
              </div>
              <div className="space-y-2">
                <Label>Date</Label>
                <Input type="date" value={newDate} onChange={(e) => setNewDate(e.target.value)} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Customer State</Label>
              <Input value={newCustomerState} onChange={(e) => setNewCustomerState(e.target.value)} placeholder="e.g. Karnataka" />
            </div>
            <div className="space-y-2">
              <Label>Last Follow Up</Label>
              <Textarea value={newLastFollowUp} onChange={(e) => setNewLastFollowUp(e.target.value)} placeholder="Notes about last follow up" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button onClick={handleCreateLead} disabled={!newTitle.trim() || !newCustomerName.trim() || createMutation.isPending}>
              {createMutation.isPending ? "Creating..." : "Create Lead"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
