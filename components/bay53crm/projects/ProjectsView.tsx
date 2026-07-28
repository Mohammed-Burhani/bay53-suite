"use client";

import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Plus, Eye, Trash2, Search, List } from "lucide-react";
import { useCRMProjects, useCreateCRMProject, useDeleteCRMProject, useCRMMasterValues } from "@/lib/hooks/useCRM";
import { useCRMFiltersStore } from "@/lib/stores/crm-filters-store";
import { ProjectDetailSheet } from "./ProjectDetailSheet";
import { formatDate } from "@/lib/bay53crm/constants";
import type { CRMProject, BrandApprovalStatus, MakeListAvailability } from "@/lib/bay53crm/types";

const STATUS_OPTIONS = ["Awarded", "Not Awarded"];
const BRAND_DISCIPLINES = ["HVAC", "Plumbing", "Fire Fighting", "Electrical", "BMS", "ELV", "Structural", "Civil"];

export function ProjectsView() {
  const { data: projects = [], isLoading } = useCRMProjects();
  const { data: regions = [] } = useCRMMasterValues("region");
  const { data: assignedTos = [] } = useCRMMasterValues("assigned_to");
  const createMutation = useCreateCRMProject();
  const deleteMutation = useDeleteCRMProject();

  const { projectsFilters, setProjectsFilters, resetProjectsFilters } = useCRMFiltersStore();

  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);

  // Create form state
  const [newName, setNewName] = useState("");
  const [newRegionId, setNewRegionId] = useState("");
  const [newConsultantName, setNewConsultantName] = useState("");
  const [newAssignedTo, setNewAssignedTo] = useState("");
  const [newStatus, setNewStatus] = useState<string>("Not Awarded");
  const [newMakeListAvailability, setNewMakeListAvailability] = useState<string>("Available");
  const [newContractorName, setNewContractorName] = useState("");
  const [newContractorScope, setNewContractorScope] = useState("");
  const [contractors, setContractors] = useState<{ name: string; scope: string }[]>([]);
  const [brandApprovals, setBrandApprovals] = useState<{ discipline: string; status: BrandApprovalStatus }[]>([]);

  const filteredProjects = useMemo(() => {
    return projects.filter((p) => {
      if (projectsFilters.search && !p.name.toLowerCase().includes(projectsFilters.search.toLowerCase()) && !p.consultantName.toLowerCase().includes(projectsFilters.search.toLowerCase())) return false;
      if (projectsFilters.assignedTo && p.assignedTo !== projectsFilters.assignedTo) return false;
      if (projectsFilters.status && p.status !== projectsFilters.status) return false;
      if (projectsFilters.regionId && p.regionId !== projectsFilters.regionId) return false;
      if (!projectsFilters.archived && p.archived) return false;
      return true;
    });
  }, [projects, projectsFilters]);

  const handleCreate = () => {
    if (!newName.trim() || !newRegionId) return;
    createMutation.mutate({
      regionId: newRegionId,
      name: newName.trim(),
      consultantName: newConsultantName.trim(),
      contractorDetails: contractors,
      brandApproval: brandApprovals.map((b) => ({ status: b.status, discipline: b.discipline })),
      status: newStatus as any,
      makeListAvailability: newMakeListAvailability as MakeListAvailability,
      assignedTo: newAssignedTo,
      notes: [],
      archived: false,
    });
    setCreateOpen(false);
    resetForm();
  };

  const resetForm = () => {
    setNewName("");
    setNewRegionId("");
    setNewConsultantName("");
    setNewAssignedTo("");
    setNewStatus("Not Awarded");
    setNewMakeListAvailability("Available");
    setContractors([]);
    setBrandApprovals([]);
  };

  const addContractor = () => {
    if (!newContractorName.trim()) return;
    setContractors([...contractors, { name: newContractorName.trim(), scope: newContractorScope.trim() }]);
    setNewContractorName("");
    setNewContractorScope("");
  };

  const toggleBrand = (discipline: string) => {
    if (brandApprovals.find((b) => b.discipline === discipline)) {
      setBrandApprovals(brandApprovals.filter((b) => b.discipline !== discipline));
    } else {
      setBrandApprovals([...brandApprovals, { discipline, status: "Pending" as const }]);
    }
  };

  const handleDelete = (id: string) => {
    if (confirm("Delete this project?")) deleteMutation.mutate(id);
  };

  const handleView = (id: string) => {
    setSelectedProjectId(id);
    setDetailOpen(true);
  };

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Projects</h1>
          <p className="text-sm text-muted-foreground">{filteredProjects.length} projects</p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="h-4 w-4 mr-1" />
          New Project
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-3">
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search projects..."
                className="pl-8 h-8"
                value={projectsFilters.search}
                onChange={(e) => setProjectsFilters({ search: e.target.value })}
              />
            </div>
            <Select value={projectsFilters.assignedTo} onValueChange={(v) => setProjectsFilters({ assignedTo: v })}>
              <SelectTrigger className="h-8 w-[150px]">
                <SelectValue placeholder="Assign To" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                {assignedTos.map((a) => (
                  <SelectItem key={a.id} value={a.name}>{a.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={projectsFilters.status} onValueChange={(v) => setProjectsFilters({ status: v })}>
              <SelectTrigger className="h-8 w-[130px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                {STATUS_OPTIONS.map((s) => (
                  <SelectItem key={s} value={s}>{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={projectsFilters.regionId} onValueChange={(v) => setProjectsFilters({ regionId: v })}>
              <SelectTrigger className="h-8 w-[130px]">
                <SelectValue placeholder="Region" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                {regions.map((r) => (
                  <SelectItem key={r.id} value={r.code || r.name}>{r.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex items-center gap-2 text-xs">
              <Checkbox
                id="archived"
                checked={projectsFilters.archived}
                onCheckedChange={(v) => setProjectsFilters({ archived: v as boolean })}
              />
              <Label htmlFor="archived">Archive</Label>
            </div>
            <Button variant="ghost" size="sm" className="h-8" onClick={resetProjectsFilters}>Clear</Button>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <div className="overflow-auto max-h-[60vh]">
          <Table>
            <TableHeader>
              <TableRow className="sticky top-0 bg-background z-10">
                <TableHead>Region</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Consultant</TableHead>
                <TableHead>Contractors</TableHead>
                <TableHead>Brand Approval</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Make List</TableHead>
                <TableHead>Assigned To</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProjects.map((project) => (
                <TableRow key={project.id}>
                  <TableCell className="text-xs">{project.regionId}</TableCell>
                  <TableCell className="font-medium text-xs max-w-[200px] truncate">{project.name}</TableCell>
                  <TableCell className="text-xs">{project.consultantName}</TableCell>
                  <TableCell className="text-xs">
                    {project.contractorDetails.map((c, i) => (
                      <div key={i} className="truncate max-w-[150px]" title={`${c.name} - ${c.scope}`}>
                        {c.name}
                      </div>
                    ))}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1 flex-wrap">
                      {project.brandApproval.map((ba, i) => (
                        <Badge key={i} variant="outline" className={`text-[10px] ${ba.status === "Approved" ? "border-green-500 text-green-600" : ba.status === "Rejected" ? "border-red-500 text-red-600" : "border-amber-500 text-amber-600"}`}>
                          {ba.discipline}: {ba.status}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell className="text-xs">
                    <Badge variant="outline" className={project.status === "Awarded" ? "border-green-500 text-green-600" : "border-gray-400 text-gray-500"}>
                      {project.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs">{project.makeListAvailability}</TableCell>
                  <TableCell className="text-xs">{project.assignedTo}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleView(project.id)}>
                        <Eye className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleDelete(project.id)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {filteredProjects.length === 0 && (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                    No projects found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* Detail Sheet */}
      {selectedProjectId && (
        <ProjectDetailSheet
          projectId={selectedProjectId}
          open={detailOpen}
          onOpenChange={setDetailOpen}
        />
      )}

      {/* Create Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Create Project</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
            <div className="space-y-2">
              <Label>Project Name *</Label>
              <Input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Project name" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Region *</Label>
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
                <Label>Status</Label>
                <Select value={newStatus} onValueChange={setNewStatus}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {STATUS_OPTIONS.map((s) => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Consultant</Label>
                <Input value={newConsultantName} onChange={(e) => setNewConsultantName(e.target.value)} placeholder="Consultant name" />
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
            <div className="space-y-2">
              <Label>Make List Availability</Label>
              <Select value={newMakeListAvailability} onValueChange={setNewMakeListAvailability}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Available">Available</SelectItem>
                  <SelectItem value="Not Available">Not Available</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Contractor Details */}
            <div className="space-y-2">
              <Label>Contractor Details</Label>
              <div className="flex gap-2">
                <Input value={newContractorName} onChange={(e) => setNewContractorName(e.target.value)} placeholder="Contractor name" className="flex-1" />
                <Input value={newContractorScope} onChange={(e) => setNewContractorScope(e.target.value)} placeholder="Scope" className="flex-1" />
                <Button type="button" variant="outline" size="sm" onClick={addContractor}>Add</Button>
              </div>
              {contractors.map((c, i) => (
                <div key={i} className="flex items-center justify-between rounded border px-3 py-1.5 text-xs">
                  <span><strong>{c.name}</strong> — {c.scope}</span>
                  <Button variant="ghost" size="sm" className="h-6 text-destructive" onClick={() => setContractors(contractors.filter((_, j) => j !== i))}>×</Button>
                </div>
              ))}
            </div>

            {/* Brand Approvals */}
            <div className="space-y-2">
              <Label>Brand Approvals</Label>
              <div className="grid grid-cols-2 gap-2">
                {BRAND_DISCIPLINES.map((d) => {
                  const selected = brandApprovals.find((b) => b.discipline === d);
                  return (
                    <div key={d} className="flex items-center gap-2 text-sm">
                      <Checkbox checked={!!selected} onCheckedChange={() => toggleBrand(d)} />
                      <span>{d}</span>
                      {selected && (
                        <Select value={selected.status} onValueChange={(v) => setBrandApprovals(brandApprovals.map((b) => b.discipline === d ? { ...b, status: v as BrandApprovalStatus } : b))}>
                          <SelectTrigger className="h-6 text-xs w-24"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Pending">Pending</SelectItem>
                            <SelectItem value="Approved">Approved</SelectItem>
                            <SelectItem value="Rejected">Rejected</SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={!newName.trim() || !newRegionId || createMutation.isPending}>
              {createMutation.isPending ? "Creating..." : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
