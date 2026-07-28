"use client";

import { useState, useEffect } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { useCRMProject, useUpdateCRMProject, useCRMMasterValues } from "@/lib/hooks/useCRM";
import { FollowUpLog } from "@/components/bay53crm/shared/FollowUpLog";
import { useAddCRMFollowUp, useCRMFollowUps } from "@/lib/hooks/useCRM";
import type { BrandApprovalStatus, MakeListAvailability } from "@/lib/bay53crm/types";

const STATUS_OPTIONS = ["Awarded", "Not Awarded"];
const BRAND_DISCIPLINES = ["HVAC", "Plumbing", "Fire Fighting", "Electrical", "BMS", "ELV", "Structural", "Civil"];

interface ProjectDetailSheetProps {
  projectId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ProjectDetailSheet({ projectId, open, onOpenChange }: ProjectDetailSheetProps) {
  const { data: project, isLoading } = useCRMProject(projectId);
  const { data: followUps = [] } = useCRMFollowUps(undefined, projectId);
  const { data: regions = [] } = useCRMMasterValues("region");
  const { data: assignedTos = [] } = useCRMMasterValues("assigned_to");
  const updateMutation = useUpdateCRMProject();
  const addFollowUpMutation = useAddCRMFollowUp();

  const [isEditing, setIsEditing] = useState(false);

  // Edit form state
  const [name, setName] = useState("");
  const [regionId, setRegionId] = useState("");
  const [consultantName, setConsultantName] = useState("");
  const [status, setStatus] = useState("Not Awarded");
  const [makeListAvailability, setMakeListAvailability] = useState<string>("Available");
  const [assignedTo, setAssignedTo] = useState("");
  const [contractors, setContractors] = useState<{ name: string; scope: string }[]>([]);
  const [brandApprovals, setBrandApprovals] = useState<{ status: BrandApprovalStatus; discipline: string }[]>([]);
  const [newContractorName, setNewContractorName] = useState("");
  const [newContractorScope, setNewContractorScope] = useState("");

  useEffect(() => {
    if (project) {
      setName(project.name);
      setRegionId(project.regionId);
      setConsultantName(project.consultantName);
      setStatus(project.status);
      setMakeListAvailability(project.makeListAvailability);
      setAssignedTo(project.assignedTo);
      setContractors([...project.contractorDetails]);
      setBrandApprovals([...project.brandApproval]);
    }
  }, [project]);

  const handleSave = () => {
    if (!project) return;
    updateMutation.mutate({
      id: project.id,
      data: { name, regionId, consultantName, status: status as any, makeListAvailability: makeListAvailability as MakeListAvailability, assignedTo, contractorDetails: contractors, brandApproval: brandApprovals },
    });
    setIsEditing(false);
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

  const handleAddFollowUp = (data: { notes: string; date: string }) => {
    addFollowUpMutation.mutate({
      projectId,
      ...data,
      createdBy: assignedTo || "User",
    });
  };

  if (isLoading || !project) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
          <SheetHeader><SheetTitle>Loading...</SheetTitle></SheetHeader>
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{isEditing ? "Edit Project" : project.name}</SheetTitle>
        </SheetHeader>

        <div className="space-y-4 py-4">
          {!isEditing && (
            <div className="flex justify-end">
              <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>Edit</Button>
            </div>
          )}

          {isEditing ? (
            <div className="space-y-3">
              <div className="space-y-1">
                <Label>Name</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label>Region</Label>
                  <Select value={regionId} onValueChange={setRegionId}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {regions.map((r) => (
                        <SelectItem key={r.id} value={r.code || r.name}>{r.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label>Status</Label>
                  <Select value={status} onValueChange={setStatus}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {STATUS_OPTIONS.map((s) => (
                        <SelectItem key={s} value={s}>{s}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-1">
                <Label>Consultant</Label>
                <Input value={consultantName} onChange={(e) => setConsultantName(e.target.value)} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label>Assigned To</Label>
                  <Select value={assignedTo} onValueChange={setAssignedTo}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {assignedTos.map((a) => (
                        <SelectItem key={a.id} value={a.name}>{a.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label>Make List</Label>
                  <Select value={makeListAvailability} onValueChange={setMakeListAvailability}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Available">Available</SelectItem>
                      <SelectItem value="Not Available">Not Available</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Contractors */}
              <div className="space-y-2">
                <Label>Contractors</Label>
                <div className="flex gap-2">
                  <Input value={newContractorName} onChange={(e) => setNewContractorName(e.target.value)} placeholder="Name" className="flex-1" />
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
                    const ba = brandApprovals.find((b) => b.discipline === d);
                    return (
                      <div key={d} className="flex items-center gap-2 text-sm">
                        <Checkbox checked={!!ba} onCheckedChange={() => toggleBrand(d)} />
                        <span>{d}</span>
                        {ba && (
                          <Select value={ba.status} onValueChange={(v) => setBrandApprovals(brandApprovals.map((b) => b.discipline === d ? { ...b, status: v as BrandApprovalStatus } : b))}>
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

              <div className="flex gap-2 pt-2">
                <Button variant="outline" onClick={() => setIsEditing(false)}>Cancel</Button>
                <Button onClick={handleSave} disabled={updateMutation.isPending}>Save</Button>
              </div>
            </div>
          ) : (
            <div className="space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <span className="text-muted-foreground text-xs">Region</span>
                  <p>{project.regionId}</p>
                </div>
                <div>
                  <span className="text-muted-foreground text-xs">Status</span>
                  <Badge variant="outline" className={project.status === "Awarded" ? "border-green-500 text-green-600" : "border-gray-400 text-gray-500"}>
                    {project.status}
                  </Badge>
                </div>
              </div>
              <div>
                <span className="text-muted-foreground text-xs">Consultant</span>
                <p>{project.consultantName}</p>
              </div>
              <div>
                <span className="text-muted-foreground text-xs">Assigned To</span>
                <p>{project.assignedTo}</p>
              </div>
              <div>
                <span className="text-muted-foreground text-xs">Make List</span>
                <p>{project.makeListAvailability}</p>
              </div>
              <div>
                <span className="text-muted-foreground text-xs">Contractors</span>
                {project.contractorDetails.map((c, i) => (
                  <p key={i} className="text-sm">{c.name} — <span className="text-muted-foreground">{c.scope}</span></p>
                ))}
              </div>
              <div>
                <span className="text-muted-foreground text-xs">Brand Approvals</span>
                <div className="flex gap-1 flex-wrap mt-1">
                  {project.brandApproval.map((ba, i) => (
                    <Badge key={i} variant="outline" className={`text-xs ${ba.status === "Approved" ? "border-green-500 text-green-600" : ba.status === "Rejected" ? "border-red-500 text-red-600" : "border-amber-500 text-amber-600"}`}>
                      {ba.discipline}: {ba.status}
                    </Badge>
                  ))}
                </div>
              </div>
              <div>
                <span className="text-muted-foreground text-xs">Created</span>
                <p>{new Date(project.createdAt).toLocaleDateString("en-IN")}</p>
              </div>
            </div>
          )}

          {/* Notes/FollowUps */}
          <div className="border-t pt-4">
            <FollowUpLog
              followUps={followUps}
              onAdd={handleAddFollowUp}
              showStage={false}
              isAdding={addFollowUpMutation.isPending}
            />
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
