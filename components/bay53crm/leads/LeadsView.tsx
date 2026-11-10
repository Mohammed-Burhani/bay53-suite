"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { TablePagination } from "@/components/ui/table-pagination";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Plus, Eye, Trash2, SlidersHorizontal } from "lucide-react";
import { useAddLead, useAllCrmUsers, useDeleteLead, useLeads } from "@/lib/bay53crm/api/queries";
import type { CrmContact, CrmLeadListItem } from "@/lib/bay53crm/api";
import { useCRMFiltersStore } from "@/lib/stores/crm-filters-store";
import { MultiSelectCheckbox } from "@/components/bay53crm/shared/MultiSelectCheckbox";
import { StageBadge } from "@/components/bay53crm/shared/StageBadge";
import { ContactPicker } from "./ContactPicker";
import { LeadDetailSheet } from "./LeadDetailSheet";
import { formatCurrency, formatDate } from "@/lib/bay53crm/constants";
import { tolerateNotification } from "@/lib/bay53crm/save";
import {
  DEFAULT_NEW_LEAD_STAGE_ID,
  LEAD_STAGES,
  distinct,
  filterLeads,
  listStageLabel,
  toLeadCreateModel,
  toLeadSearchParams,
} from "@/lib/bay53crm/leads";

// A stable default, so memoised values below do not change on every render while loading.
const NO_LEADS: CrmLeadListItem[] = [];

const today = () => new Date().toISOString().slice(0, 10);

export function LeadsView() {
  const { leadsFilters, setLeadsFilters, resetLeadsFilters } = useCRMFiltersStore();

  const { data: leads = NO_LEADS, isLoading, isError, error } = useLeads(toLeadSearchParams(leadsFilters));
  const { data: users = [] } = useAllCrmUsers();
  const addLead = useAddLead();
  const deleteLead = useDeleteLead();

  const [filtersOpen, setFiltersOpen] = useState(false);
  const [selectedLeadId, setSelectedLeadId] = useState<number | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);

  // New lead form state
  const [newTitle, setNewTitle] = useState("");
  const [newContact, setNewContact] = useState<CrmContact | null>(null);
  const [newStageId, setNewStageId] = useState(String(DEFAULT_NEW_LEAD_STAGE_ID));
  const [newAssignedTo, setNewAssignedTo] = useState("");
  const [newValue, setNewValue] = useState("");
  const [newDate, setNewDate] = useState(today);
  const [newCustomerState, setNewCustomerState] = useState("");
  const [newRegion, setNewRegion] = useState("");

  const filteredLeads = useMemo(() => filterLeads(leads, leadsFilters), [leads, leadsFilters]);
  const pagedLeads = useMemo(
    () => filteredLeads.slice((page - 1) * pageSize, page * pageSize),
    [filteredLeads, page, pageSize]
  );

  // Back to the first page whenever the result set changes.
  const [shownLeads, setShownLeads] = useState(filteredLeads);
  if (shownLeads !== filteredLeads) {
    setShownLeads(filteredLeads);
    setPage(1);
  }

  const regionOptions = useMemo(() => distinct(leads.map((l) => l.companyRegion)), [leads]);
  const stateOptions = useMemo(() => distinct(leads.map((l) => l.customerState)), [leads]);
  const activeFilterCount =
    [leadsFilters.stages, leadsFilters.regions, leadsFilters.customerStates, leadsFilters.assignedTos].filter(
      (selected) => selected.length > 0
    ).length + (leadsFilters.valueMin || leadsFilters.valueMax ? 1 : 0);
  const userOptions = users.map((u) => ({ label: u.fullName, value: u.userName }));

  const resetForm = () => {
    setNewTitle("");
    setNewContact(null);
    setNewStageId(String(DEFAULT_NEW_LEAD_STAGE_ID));
    setNewAssignedTo("");
    setNewValue("");
    setNewDate(today());
    setNewCustomerState("");
    setNewRegion("");
  };

  const canCreate = !!newTitle.trim() && !!newContact && !!newAssignedTo;

  const handleCreateLead = async () => {
    if (!newContact || !canCreate) return;
    try {
      await tolerateNotification(
        addLead.mutateAsync(
          toLeadCreateModel({
            title: newTitle.trim(),
            contact: newContact,
            assignTo: newAssignedTo,
            stageId: Number(newStageId),
            value: Number(newValue) || 0,
            date: newDate,
            customerState: newCustomerState.trim(),
            companyRegion: newRegion.trim(),
          })
        )
      );
      toast.success("Lead created");
      setCreateOpen(false);
      resetForm();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not create the lead");
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this lead?")) return;
    try {
      await deleteLead.mutateAsync(id);
      toast.success("Lead deleted");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not delete the lead");
    }
  };

  const handleView = (id: number) => {
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
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setFiltersOpen(true)}>
            <SlidersHorizontal className="h-4 w-4 mr-1" />
            Filters
            {activeFilterCount > 0 && <Badge className="ml-2 h-5 px-1.5">{activeFilterCount}</Badge>}
          </Button>
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4 mr-1" />
            New Lead
          </Button>
        </div>
      </div>

      <Card>
        <div className="overflow-auto max-h-[70vh]">
          <Table>
            <TableHeader>
              <TableRow className="sticky top-0 bg-background z-10">
                <TableHead>Region</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>State</TableHead>
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
              {pagedLeads.map((lead) => (
                <TableRow key={lead.id}>
                  <TableCell className="text-xs">{lead.companyRegion}</TableCell>
                  <TableCell className="font-medium text-xs max-w-[200px] truncate" title={lead.title}>{lead.title}</TableCell>
                  <TableCell className="text-xs">{lead.customerState}</TableCell>
                  <TableCell className="text-right text-xs">{formatCurrency(lead.value)}</TableCell>
                  <TableCell className="text-xs">{lead.customer}</TableCell>
                  <TableCell className="text-xs">{lead.contactName}</TableCell>
                  <TableCell><StageBadge stage={listStageLabel(lead.stage)} /></TableCell>
                  <TableCell className="text-xs">{formatDate(lead.leadDate)}</TableCell>
                  <TableCell className="text-xs">{lead.assignTo}</TableCell>
                  <TableCell className="text-xs max-w-[150px] truncate" title={lead.lastActivityDescription}>
                    {lead.lastActivityDescription || "—"}
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
              {(isLoading || isError || filteredLeads.length === 0) && (
                <TableRow>
                  <TableCell colSpan={11} className="text-center py-8 text-muted-foreground">
                    {isLoading
                      ? "Loading leads..."
                      : isError
                        ? `Could not load leads: ${error instanceof Error ? error.message : "unknown error"}`
                        : "No leads found matching the criteria"}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
        <TablePagination
          totalItems={filteredLeads.length}
          pageSize={pageSize}
          currentPage={page}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
        />
      </Card>

      {/* Detail Sheet */}
      {selectedLeadId !== null && (
        <LeadDetailSheet
          leadId={selectedLeadId}
          open={detailOpen}
          onOpenChange={setDetailOpen}
        />
      )}

      {/* Filters drawer */}
      <Sheet open={filtersOpen} onOpenChange={setFiltersOpen}>
        <SheetContent side="left" className="w-full sm:max-w-sm overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Filters</SheetTitle>
            <SheetDescription>Changes apply to the list right away.</SheetDescription>
          </SheetHeader>
          <div className="space-y-4 px-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Date From</Label>
                <Input type="date" value={leadsFilters.fromDate} onChange={(e) => setLeadsFilters({ fromDate: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Date To</Label>
                <Input type="date" value={leadsFilters.toDate} onChange={(e) => setLeadsFilters({ toDate: e.target.value })} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Stage</Label>
              <MultiSelectCheckbox
                options={LEAD_STAGES.map((s) => ({ label: s.label, value: s.label }))}
                selected={leadsFilters.stages}
                onChange={(v) => setLeadsFilters({ stages: v })}
              />
            </div>
            <div className="space-y-2">
              <Label>Assigned To</Label>
              <MultiSelectCheckbox
                options={userOptions}
                selected={leadsFilters.assignedTos}
                onChange={(v) => setLeadsFilters({ assignedTos: v })}
              />
            </div>
            <div className="space-y-2">
              <Label>Region</Label>
              <MultiSelectCheckbox
                options={regionOptions.map((r) => ({ label: r, value: r }))}
                selected={leadsFilters.regions}
                onChange={(v) => setLeadsFilters({ regions: v })}
              />
            </div>
            <div className="space-y-2">
              <Label>Customer State</Label>
              <MultiSelectCheckbox
                options={stateOptions.map((s) => ({ label: s, value: s }))}
                selected={leadsFilters.customerStates}
                onChange={(v) => setLeadsFilters({ customerStates: v })}
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
          <SheetFooter className="flex-row justify-end gap-2">
            <Button variant="outline" onClick={resetLeadsFilters}>Clear</Button>
            <Button onClick={() => setFiltersOpen(false)}>Done</Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

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
            <div className="space-y-2">
              <Label>Customer *</Label>
              <ContactPicker value={newContact} onChange={setNewContact} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Stage</Label>
                <Select value={newStageId} onValueChange={setNewStageId}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {LEAD_STAGES.map((s) => (
                      <SelectItem key={s.id} value={String(s.id)}>{s.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Assigned To *</Label>
                <Select value={newAssignedTo} onValueChange={setNewAssignedTo}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    {users.map((u) => (
                      <SelectItem key={u.userName} value={u.userName}>{u.fullName}</SelectItem>
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
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Customer State</Label>
                <Input value={newCustomerState} onChange={(e) => setNewCustomerState(e.target.value)} placeholder="e.g. Karnataka" />
              </div>
              <div className="space-y-2">
                <Label>Region</Label>
                <Input value={newRegion} onChange={(e) => setNewRegion(e.target.value)} placeholder="e.g. LIV-BNG | Bangalore" />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button onClick={handleCreateLead} disabled={!canCreate || addLead.isPending}>
              {addLead.isPending ? "Creating..." : "Create Lead"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
