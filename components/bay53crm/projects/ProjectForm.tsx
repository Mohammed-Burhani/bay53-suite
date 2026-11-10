"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { CrmMasterValue, CrmUserRef } from "@/lib/bay53crm/api";
import { DEFAULT_NEW_PROJECT_STATUS_ID, MAKE_LIST_OPTIONS, PROJECT_STATUSES, type ProjectInput } from "@/lib/bay53crm/projects";

const MAKE_LIST_NOT_SET = "0";

export const emptyProject = (approvals: CrmMasterValue[]): ProjectInput => ({
  name: "",
  consultant: "",
  // "Not Approved" is the usual starting point; fall back to the first segment while the list loads.
  campaignTypeId: approvals.find((a) => a.text === "Not Approved")?.id ?? approvals[0]?.id ?? 0,
  statusId: DEFAULT_NEW_PROJECT_STATUS_ID,
  makeListId: 0,
  assignedTo: "",
  contractorDetails: "",
  note: "",
  startDate: "",
  endDate: "",
});

interface ProjectFormProps {
  initial: ProjectInput;
  approvals: CrmMasterValue[];
  users: CrmUserRef[];
  isSaving: boolean;
  submitLabel: string;
  onSubmit: (input: ProjectInput) => void;
  onCancel: () => void;
}

/** Fields of a project, for both the create dialog and the edit sheet. */
export function ProjectForm({ initial, approvals, users, isSaving, submitLabel, onSubmit, onCancel }: ProjectFormProps) {
  const [value, setValue] = useState(initial);
  const set = <K extends keyof ProjectInput>(key: K, next: ProjectInput[K]) => setValue((v) => ({ ...v, [key]: next }));

  const canSubmit = !!value.name.trim() && value.campaignTypeId > 0 && !!value.assignedTo;

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="project-name">Project name *</Label>
        <Input id="project-name" value={value.name} onChange={(e) => set("name", e.target.value)} placeholder="Project name" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="project-consultant">Consultant</Label>
        <Input
          id="project-consultant"
          value={value.consultant}
          onChange={(e) => set("consultant", e.target.value)}
          placeholder="Consultant name"
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Brand approval *</Label>
          <Select value={String(value.campaignTypeId)} onValueChange={(v) => set("campaignTypeId", Number(v))}>
            <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
            <SelectContent>
              {approvals.map((a) => (
                <SelectItem key={a.id} value={String(a.id)}>{a.text}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Status</Label>
          <Select value={String(value.statusId)} onValueChange={(v) => set("statusId", Number(v))}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {PROJECT_STATUSES.map((s) => (
                <SelectItem key={s.id} value={String(s.id)}>{s.label}</SelectItem>
              ))}
              {!PROJECT_STATUSES.some((s) => s.id === value.statusId) && (
                <SelectItem value={String(value.statusId)}>Status {value.statusId}</SelectItem>
              )}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Assigned to *</Label>
          <Select value={value.assignedTo} onValueChange={(v) => set("assignedTo", v)}>
            <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
            <SelectContent>
              {users.map((u) => (
                <SelectItem key={u.userName} value={u.userName}>{u.fullName}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Make list</Label>
          <Select value={String(value.makeListId)} onValueChange={(v) => set("makeListId", Number(v))}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value={MAKE_LIST_NOT_SET}>Not set</SelectItem>
              {MAKE_LIST_OPTIONS.map((o) => (
                <SelectItem key={o.id} value={String(o.id)}>{o.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="project-start">Start date</Label>
          <Input id="project-start" type="date" value={value.startDate} onChange={(e) => set("startDate", e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="project-end">End date</Label>
          <Input id="project-end" type="date" value={value.endDate} onChange={(e) => set("endDate", e.target.value)} />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="project-contractors">Contractor details</Label>
        <Textarea
          id="project-contractors"
          rows={2}
          value={value.contractorDetails}
          onChange={(e) => set("contractorDetails", e.target.value)}
          placeholder="Contractor names and scope"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="project-note">Notes</Label>
        <Textarea id="project-note" rows={3} value={value.note} onChange={(e) => set("note", e.target.value)} />
      </div>
      <div className="flex justify-end gap-2 pt-2">
        <Button variant="outline" onClick={onCancel}>Cancel</Button>
        <Button disabled={!canSubmit || isSaving} onClick={() => onSubmit({ ...value, name: value.name.trim() })}>
          {isSaving ? "Saving..." : submitLabel}
        </Button>
      </div>
    </div>
  );
}
