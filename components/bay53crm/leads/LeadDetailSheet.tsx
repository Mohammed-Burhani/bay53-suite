"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAllCrmUsers, useLead, useUpdateLeadFields, useUpdateLeadTitle } from "@/lib/bay53crm/api/queries";
import type { CrmLead } from "@/lib/bay53crm/api";
import { StageBadge } from "@/components/bay53crm/shared/StageBadge";
import { formatCurrency } from "@/lib/bay53crm/constants";
import { tolerateNotification } from "@/lib/bay53crm/save";
import { LEAD_STAGES, stageLabel } from "@/lib/bay53crm/leads";
import { LeadRecords } from "./LeadRecords";

interface LeadDetailSheetProps {
  leadId: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function LeadDetailSheet({ leadId, open, onOpenChange }: LeadDetailSheetProps) {
  const { data: lead, isLoading } = useLead(leadId);
  const { data: users = [] } = useAllCrmUsers();
  const updateFields = useUpdateLeadFields();
  const updateTitle = useUpdateLeadTitle();

  const [isEditing, setIsEditing] = useState(false);

  const userName = (userId?: string) => users.find((u) => u.userName === userId)?.fullName ?? userId ?? "";

  if (isLoading || !lead) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Loading...</SheetTitle>
          </SheetHeader>
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{isEditing ? "Edit Lead" : lead.title}</SheetTitle>
        </SheetHeader>

        <div className="space-y-4 py-4">
          <div className="flex items-center justify-between">
            <StageBadge stage={stageLabel(lead.stage)} className="text-sm px-3 py-1" />
            {!isEditing && (
              <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>Edit</Button>
            )}
          </div>

          {isEditing ? (
            <LeadEditForm
              lead={lead}
              users={users}
              isSaving={updateFields.isPending || updateTitle.isPending}
              onCancel={() => setIsEditing(false)}
              onSave={async (changes) => {
                try {
                  await tolerateNotification(
                    updateFields.mutateAsync({
                      id: lead.id,
                      stage: changes.stageId,
                      status: lead.status,
                      campaignId: lead.campaign?.id,
                      title: lead.title,
                      owner: lead.owner,
                      vertical: lead.vertical,
                      valueCurrency: lead.valueCurrency,
                      companyRegion: changes.companyRegion,
                      assignTo: changes.assignTo,
                      customerState: changes.customerState,
                    })
                  );
                  if (changes.title !== lead.title) {
                    await tolerateNotification(
                      updateTitle.mutateAsync({
                        id: lead.id,
                        title: changes.title,
                        stage: changes.stageId,
                        status: lead.status,
                      })
                    );
                  }
                  toast.success("Lead updated");
                  setIsEditing(false);
                } catch (e) {
                  toast.error(e instanceof Error ? e.message : "Could not update the lead");
                }
              }}
            />
          ) : (
            <div className="space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <span className="text-muted-foreground text-xs">Customer</span>
                  <p className="font-medium">{lead.customer}</p>
                </div>
                <div>
                  <span className="text-muted-foreground text-xs">Contact</span>
                  <p className="font-medium">{lead.contact.firstName}</p>
                  <p className="text-xs text-muted-foreground">{lead.contact.mobile1 || lead.contact.email}</p>
                </div>
              </div>
              <div>
                <span className="text-muted-foreground text-xs">Value</span>
                <p className="font-medium">{formatCurrency(lead.value)}</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <span className="text-muted-foreground text-xs">Region</span>
                  <p>{lead.companyRegion || "—"}</p>
                </div>
                <div>
                  <span className="text-muted-foreground text-xs">Customer State</span>
                  <p>{lead.customerState || "—"}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <span className="text-muted-foreground text-xs">Assigned To</span>
                  <p>{userName(lead.assignTo) || "—"}</p>
                </div>
                <div>
                  <span className="text-muted-foreground text-xs">Date</span>
                  <p>{new Date(lead.leadDate).toLocaleDateString("en-IN")}</p>
                </div>
              </div>
              {lead.campaign && (
                <div>
                  <span className="text-muted-foreground text-xs">Project</span>
                  <p>{lead.campaign.name}</p>
                </div>
              )}
            </div>
          )}

          <div className="border-t pt-4">
            <LeadRecords lead={lead} users={users} />
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

interface LeadChanges {
  title: string;
  stageId: number;
  assignTo: string;
  customerState: string;
  companyRegion: string;
}

interface LeadEditFormProps {
  lead: CrmLead;
  users: { userName: string; fullName: string }[];
  isSaving: boolean;
  onSave: (changes: LeadChanges) => void;
  onCancel: () => void;
}

function LeadEditForm({ lead, users, isSaving, onSave, onCancel }: LeadEditFormProps) {
  const [title, setTitle] = useState(lead.title);
  const [stageId, setStageId] = useState(String(lead.stage));
  const [assignTo, setAssignTo] = useState(lead.assignTo ?? "");
  const [customerState, setCustomerState] = useState(lead.customerState ?? "");
  const [companyRegion, setCompanyRegion] = useState(lead.companyRegion ?? "");

  // A lead whose stage is not in the offered list (e.g. "No stage") keeps it as an extra option.
  const stageKnown = LEAD_STAGES.some((s) => s.id === lead.stage);

  return (
    <div className="space-y-3">
      <div className="space-y-1">
        <Label>Title</Label>
        <Input value={title} onChange={(e) => setTitle(e.target.value)} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label>Stage</Label>
          <Select value={stageId} onValueChange={setStageId}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {!stageKnown && <SelectItem value={String(lead.stage)}>{stageLabel(lead.stage)}</SelectItem>}
              {LEAD_STAGES.map((s) => (
                <SelectItem key={s.id} value={String(s.id)}>{s.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label>Assigned To</Label>
          <Select value={assignTo} onValueChange={setAssignTo}>
            <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
            <SelectContent>
              {users.map((u) => (
                <SelectItem key={u.userName} value={u.userName}>{u.fullName}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label>Customer State</Label>
          <Input value={customerState} onChange={(e) => setCustomerState(e.target.value)} />
        </div>
        <div className="space-y-1">
          <Label>Region</Label>
          <Input value={companyRegion} onChange={(e) => setCompanyRegion(e.target.value)} />
        </div>
      </div>
      <div className="flex gap-2 pt-2">
        <Button variant="outline" onClick={onCancel}>Cancel</Button>
        <Button
          disabled={isSaving || !title.trim()}
          onClick={() =>
            onSave({
              title: title.trim(),
              stageId: Number(stageId),
              assignTo,
              customerState: customerState.trim(),
              companyRegion: companyRegion.trim(),
            })
          }
        >
          {isSaving ? "Saving..." : "Save"}
        </Button>
      </div>
    </div>
  );
}
