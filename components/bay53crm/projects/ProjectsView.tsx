"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { TablePagination } from "@/components/ui/table-pagination";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Plus, Eye, Trash2, Search } from "lucide-react";
import { useAddCampaign, useAllCrmUsers, useCampaigns, useDeleteCampaign, useMasterValues } from "@/lib/bay53crm/api/queries";
import type { CrmCampaignListItem, CrmMasterValue } from "@/lib/bay53crm/api";
import { useCRMFiltersStore } from "@/lib/stores/crm-filters-store";
import { formatDate } from "@/lib/bay53crm/constants";
import {
  APPROVAL_MASTER_VALUE_TYPE,
  filterProjects,
  makeListLabel,
  PROJECT_STATUSES,
  projectStatusColors,
  projectStatusLabel,
  toCampaignModel,
  toProjectSearchParams,
} from "@/lib/bay53crm/projects";
import { tolerateNotification } from "@/lib/bay53crm/save";
import { emptyProject, ProjectForm } from "./ProjectForm";
import { ProjectDetailSheet } from "./ProjectDetailSheet";

const ALL = "all";

// Stable defaults, so memoised values below do not change on every render while loading.
const NO_PROJECTS: CrmCampaignListItem[] = [];
const NO_APPROVALS: CrmMasterValue[] = [];

export function ProjectsView() {
  const { projectsFilters, setProjectsFilters, resetProjectsFilters } = useCRMFiltersStore();

  const { data: projects = NO_PROJECTS, isLoading, isError, error } = useCampaigns(toProjectSearchParams(projectsFilters));
  const { data: users = [] } = useAllCrmUsers();
  const { data: masterValues = NO_APPROVALS } = useMasterValues({ type: APPROVAL_MASTER_VALUE_TYPE });
  const addProject = useAddCampaign();
  const deleteProject = useDeleteCampaign();

  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);

  const approvals = useMemo(() => masterValues.filter((m) => m.isPublished), [masterValues]);
  const filteredProjects = useMemo(() => filterProjects(projects, projectsFilters), [projects, projectsFilters]);
  const pagedProjects = useMemo(
    () => filteredProjects.slice((page - 1) * pageSize, page * pageSize),
    [filteredProjects, page, pageSize]
  );

  // Back to the first page whenever the result set changes.
  const [shownProjects, setShownProjects] = useState(filteredProjects);
  if (shownProjects !== filteredProjects) {
    setShownProjects(filteredProjects);
    setPage(1);
  }

  const userName = (userId?: string) => users.find((u) => u.userName === userId)?.fullName ?? userId ?? "";

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this project?")) return;
    try {
      await deleteProject.mutateAsync(id);
      toast.success("Project deleted");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not delete the project");
    }
  };

  const handleView = (id: number) => {
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
                aria-label="Search projects"
                placeholder="Search by project or consultant"
                className="pl-8 h-8"
                value={projectsFilters.search}
                onChange={(e) => setProjectsFilters({ search: e.target.value })}
              />
            </div>
            <Select
              value={projectsFilters.assignedTo || ALL}
              onValueChange={(v) => setProjectsFilters({ assignedTo: v === ALL ? "" : v })}
            >
              <SelectTrigger aria-label="Assigned to" className="h-8 w-[160px]">
                <SelectValue placeholder="Assigned to" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>All users</SelectItem>
                {users.map((u) => (
                  <SelectItem key={u.userName} value={u.userName}>{u.fullName}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={projectsFilters.status || ALL}
              onValueChange={(v) => setProjectsFilters({ status: v === ALL ? "" : v })}
            >
              <SelectTrigger aria-label="Status" className="h-8 w-[160px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>All statuses</SelectItem>
                {PROJECT_STATUSES.map((s) => (
                  <SelectItem key={s.id} value={String(s.id)}>{s.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex items-center gap-2 text-xs">
              <Checkbox
                id="archived"
                checked={projectsFilters.archived}
                onCheckedChange={(v) => setProjectsFilters({ archived: v === true })}
              />
              <Label htmlFor="archived">Archived</Label>
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
                <TableHead>Name</TableHead>
                <TableHead>Consultant</TableHead>
                <TableHead>Brand Approval</TableHead>
                <TableHead>Contractors</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Make List</TableHead>
                <TableHead>Assigned To</TableHead>
                <TableHead>Start</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pagedProjects.map((project) => (
                <TableRow key={project.id}>
                  <TableCell className="font-medium text-xs max-w-[240px] truncate" title={project.name}>{project.name}</TableCell>
                  <TableCell className="text-xs max-w-[180px] truncate" title={project.description}>{project.description}</TableCell>
                  <TableCell className="text-xs">
                    <Badge variant="outline" className="text-[10px]">{project.campaignType.text}</Badge>
                  </TableCell>
                  <TableCell className="text-xs max-w-[160px] truncate" title={project.contractorDetails}>
                    {project.contractorDetails}
                  </TableCell>
                  <TableCell className="text-xs">
                    <Badge variant="outline" className={projectStatusColors(project.currentStatus)}>
                      {projectStatusLabel(project.currentStatus)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs">{makeListLabel(project.availabilityStatus)}</TableCell>
                  <TableCell className="text-xs">{userName(project.assignedTo)}</TableCell>
                  <TableCell className="text-xs">{project.startdate ? formatDate(project.startdate) : ""}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" className="h-7 w-7" aria-label="View project" onClick={() => handleView(project.id)}>
                        <Eye className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-destructive"
                        aria-label="Delete project"
                        onClick={() => handleDelete(project.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {(isLoading || isError || filteredProjects.length === 0) && (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                    {isLoading
                      ? "Loading projects..."
                      : isError
                        ? `Could not load projects: ${error instanceof Error ? error.message : "unknown error"}`
                        : "No projects found matching the criteria"}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
        <TablePagination
          totalItems={filteredProjects.length}
          pageSize={pageSize}
          currentPage={page}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
        />
      </Card>

      {/* Detail Sheet */}
      {selectedProjectId !== null && (
        <ProjectDetailSheet projectId={selectedProjectId} open={detailOpen} onOpenChange={setDetailOpen} />
      )}

      {/* Create Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Create Project</DialogTitle>
            <DialogDescription>Track the consultant, the brand approval and who is bidding on the project.</DialogDescription>
          </DialogHeader>
          <div className="max-h-[65vh] overflow-y-auto pr-2">
            {/* Mounted only while open, so the form starts empty each time. */}
            {createOpen && (
              <ProjectForm
                // Remount once the approval list arrives, so the default approval is picked.
                key={approvals.length}
                initial={emptyProject(approvals)}
                approvals={approvals}
                users={users}
                isSaving={addProject.isPending}
                submitLabel="Create Project"
                onCancel={() => setCreateOpen(false)}
                onSubmit={async (input) => {
                  try {
                    await tolerateNotification(addProject.mutateAsync(toCampaignModel(input)));
                    toast.success("Project created");
                    setCreateOpen(false);
                  } catch (e) {
                    toast.error(e instanceof Error ? e.message : "Could not create the project");
                  }
                }}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
