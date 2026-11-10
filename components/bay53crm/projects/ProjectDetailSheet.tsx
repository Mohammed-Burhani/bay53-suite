"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAllCrmUsers, useCampaign, useMasterValues, useUpdateCampaign } from "@/lib/bay53crm/api/queries";
import type { CrmCampaign, CrmMasterValue } from "@/lib/bay53crm/api";
import { formatDate } from "@/lib/bay53crm/constants";
import {
  APPROVAL_MASTER_VALUE_TYPE,
  makeListLabel,
  projectStatusColors,
  projectStatusLabel,
  toCampaignModel,
  toDateInput,
  type ProjectInput,
} from "@/lib/bay53crm/projects";
import { tolerateNotification } from "@/lib/bay53crm/save";
import { ProjectForm } from "./ProjectForm";

const NO_APPROVALS: CrmMasterValue[] = [];

interface ProjectDetailSheetProps {
  projectId: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const toProjectInput = (project: CrmCampaign): ProjectInput => ({
  name: project.name,
  consultant: project.description ?? "",
  campaignTypeId: project.campaignType.id,
  statusId: project.currentStatus,
  makeListId: project.availabilityStatus ?? 0,
  assignedTo: project.assignedTo ?? "",
  contractorDetails: project.contractorDetails ?? "",
  note: project.note ?? "",
  startDate: toDateInput(project.startdate),
  endDate: toDateInput(project.enddate),
});

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <span className="text-muted-foreground text-xs">{label}</span>
      <div className="whitespace-pre-wrap break-words">{children || "-"}</div>
    </div>
  );
}

export function ProjectDetailSheet({ projectId, open, onOpenChange }: ProjectDetailSheetProps) {
  const { data: project, isLoading, isError, error } = useCampaign(projectId);
  const { data: users = [] } = useAllCrmUsers();
  const { data: masterValues = NO_APPROVALS } = useMasterValues({ type: APPROVAL_MASTER_VALUE_TYPE });
  const updateProject = useUpdateCampaign();

  const [isEditing, setIsEditing] = useState(false);

  const userName = (userId?: string) => users.find((u) => u.userName === userId)?.fullName ?? userId ?? "";

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{project ? (isEditing ? "Edit Project" : project.name) : isError ? "Project" : "Loading..."}</SheetTitle>
          <SheetDescription className="sr-only">Project details</SheetDescription>
        </SheetHeader>

        <div className="space-y-4 px-4 pb-4">
          {isError && (
            <p className="text-sm text-destructive">
              Could not load the project: {error instanceof Error ? error.message : "unknown error"}
            </p>
          )}
          {isLoading && <p className="text-sm text-muted-foreground">Loading project...</p>}

          {project && isEditing && (
            <ProjectForm
              initial={toProjectInput(project)}
              approvals={masterValues.filter((m) => m.isPublished)}
              users={users}
              isSaving={updateProject.isPending}
              submitLabel="Save"
              onCancel={() => setIsEditing(false)}
              onSubmit={async (input) => {
                try {
                  await tolerateNotification(updateProject.mutateAsync(toCampaignModel(input, project.id)));
                  toast.success("Project updated");
                  setIsEditing(false);
                } catch (e) {
                  toast.error(e instanceof Error ? e.message : "Could not update the project");
                }
              }}
            />
          )}

          {project && !isEditing && (
            <div className="space-y-4 text-sm">
              <div className="flex items-center justify-between">
                <Badge variant="outline" className={projectStatusColors(project.currentStatus)}>
                  {projectStatusLabel(project.currentStatus)}
                </Badge>
                <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>Edit</Button>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Consultant">{project.description}</Field>
                <Field label="Brand approval">{project.campaignType.text}</Field>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Assigned to">{userName(project.assignedTo)}</Field>
                <Field label="Make list">{makeListLabel(project.availabilityStatus)}</Field>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Start date">{project.startdate ? formatDate(project.startdate) : ""}</Field>
                <Field label="End date">{project.enddate ? formatDate(project.enddate) : ""}</Field>
              </div>
              <Field label="Contractor details">{project.contractorDetails}</Field>
              <Field label="Notes">{project.note}</Field>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
