"use client";

import { useState, useEffect } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCRMLead, useUpdateCRMLead, useCRMFollowUps, useAddCRMFollowUp, useCRMMasterValues } from "@/lib/hooks/useCRM";
import { StageBadge } from "@/components/bay53crm/shared/StageBadge";
import { FollowUpLog } from "@/components/bay53crm/shared/FollowUpLog";
import { formatCurrency } from "@/lib/bay53crm/constants";
import type { LeadStage } from "@/lib/bay53crm/types";

const ALL_STAGES: LeadStage[] = ["Cold Lead", "Hot Lead", "Tender", "Tender Won", "Tender Lost", "Won", "Lost"];

interface LeadDetailSheetProps {
  leadId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function LeadDetailSheet({ leadId, open, onOpenChange }: LeadDetailSheetProps) {
  const { data: lead, isLoading } = useCRMLead(leadId);
  const { data: followUps = [] } = useCRMFollowUps(leadId);
  const { data: regions = [] } = useCRMMasterValues("region");
  const { data: verticals = [] } = useCRMMasterValues("vertical");
  const { data: sources = [] } = useCRMMasterValues("lead_source");
  const { data: assignedTos = [] } = useCRMMasterValues("assigned_to");
  const updateMutation = useUpdateCRMLead();
  const addFollowUpMutation = useAddCRMFollowUp();

  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [contactPerson, setContactPerson] = useState("");
  const [regionId, setRegionId] = useState("");
  const [vertical, setVertical] = useState("");
  const [value, setValue] = useState("");
  const [stage, setStage] = useState<LeadStage>("Cold Lead");
  const [source, setSource] = useState("");
  const [assignedTo, setAssignedTo] = useState("");
  const [customerState, setCustomerState] = useState("");
  const [lastFollowUp, setLastFollowUp] = useState("");

  useEffect(() => {
    if (lead) {
      setTitle(lead.title);
      setCustomerName(lead.customerName);
      setContactPerson(lead.contactPerson);
      setRegionId(lead.regionId);
      setVertical(lead.vertical);
      setValue(String(lead.value));
      setStage(lead.stage);
      setSource(lead.source);
      setAssignedTo(lead.assignedTo);
      setCustomerState(lead.customerState);
      setLastFollowUp(lead.lastFollowUp);
    }
  }, [lead]);

  const handleSave = () => {
    if (!lead) return;
    updateMutation.mutate({
      id: lead.id,
      data: {
        title,
        customerName,
        contactPerson,
        regionId,
        vertical,
        value: Number(value) || 0,
        source,
        assignedTo,
        customerState,
        lastFollowUp,
        stage,
      },
    });
    setIsEditing(false);
  };

  const handleAddFollowUp = (data: { notes: string; stage?: LeadStage; date: string }) => {
    addFollowUpMutation.mutate({
      leadId,
      ...data,
      createdBy: assignedTo || "User",
    });
    if (data.stage) {
      setStage(data.stage);
      updateMutation.mutate({ id: leadId, data: { stage: data.stage } });
    }
  };

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
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{isEditing ? "Edit Lead" : lead.title}</SheetTitle>
        </SheetHeader>

        <div className="space-y-4 py-4">
          {/* Stage Badge */}
          <div className="flex items-center justify-between">
            <StageBadge stage={lead.stage} className="text-sm px-3 py-1" />
            {!isEditing && (
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>Edit</Button>
              </div>
            )}
          </div>

          {/* Editable Fields */}
          {isEditing ? (
            <div className="space-y-3">
              <div className="space-y-1">
                <Label>Title</Label>
                <Input value={title} onChange={(e) => setTitle(e.target.value)} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label>Customer</Label>
                  <Input value={customerName} onChange={(e) => setCustomerName(e.target.value)} />
                </div>
                <div className="space-y-1">
                  <Label>Contact</Label>
                  <Input value={contactPerson} onChange={(e) => setContactPerson(e.target.value)} />
                </div>
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
                  <Label>Vertical</Label>
                  <Select value={vertical} onValueChange={setVertical}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {verticals.map((v) => (
                        <SelectItem key={v.id} value={v.name}>{v.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label>Value (₹)</Label>
                  <Input type="number" value={value} onChange={(e) => setValue(e.target.value)} />
                </div>
                <div className="space-y-1">
                  <Label>Stage</Label>
                  <Select value={stage} onValueChange={(v) => setStage(v as LeadStage)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {ALL_STAGES.map((s) => (
                        <SelectItem key={s} value={s}>{s}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label>Source</Label>
                  <Select value={source} onValueChange={setSource}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {sources.map((s) => (
                        <SelectItem key={s.id} value={s.name}>{s.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
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
              </div>
              <div className="space-y-1">
                <Label>Customer State</Label>
                <Input value={customerState} onChange={(e) => setCustomerState(e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label>Last Follow Up</Label>
                <Textarea value={lastFollowUp} onChange={(e) => setLastFollowUp(e.target.value)} />
              </div>
              <div className="flex gap-2 pt-2">
                <Button variant="outline" onClick={() => setIsEditing(false)}>Cancel</Button>
                <Button onClick={handleSave} disabled={updateMutation.isPending}>Save</Button>
              </div>
            </div>
          ) : (
            /* Read-only Fields */
            <div className="space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <span className="text-muted-foreground text-xs">Customer</span>
                  <p className="font-medium">{lead.customerName}</p>
                </div>
                <div>
                  <span className="text-muted-foreground text-xs">Contact</span>
                  <p className="font-medium">{lead.contactPerson}</p>
                </div>
              </div>
              <div>
                <span className="text-muted-foreground text-xs">Value</span>
                <p className="font-medium">{formatCurrency(lead.value)}</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <span className="text-muted-foreground text-xs">Region</span>
                  <p>{lead.regionId}</p>
                </div>
                <div>
                  <span className="text-muted-foreground text-xs">Vertical</span>
                  <p>{lead.vertical}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <span className="text-muted-foreground text-xs">Source</span>
                  <p>{lead.source}</p>
                </div>
                <div>
                  <span className="text-muted-foreground text-xs">Assigned To</span>
                  <p>{lead.assignedTo}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <span className="text-muted-foreground text-xs">Customer State</span>
                  <p>{lead.customerState}</p>
                </div>
                <div>
                  <span className="text-muted-foreground text-xs">Date</span>
                  <p>{new Date(lead.date).toLocaleDateString("en-IN")}</p>
                </div>
              </div>
              {lead.lastFollowUp && (
                <div>
                  <span className="text-muted-foreground text-xs">Last Follow Up</span>
                  <p>{lead.lastFollowUp}</p>
                </div>
              )}
              <div className="flex gap-2">
                <div>
                  <span className="text-muted-foreground text-xs">Status</span>
                  <p className="capitalize">{lead.status}</p>
                </div>
              </div>
            </div>
          )}

          {/* Follow Up Log */}
          <div className="border-t pt-4">
            <FollowUpLog
              followUps={followUps}
              onAdd={handleAddFollowUp}
              stages={ALL_STAGES}
              isAdding={addFollowUpMutation.isPending}
            />
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
