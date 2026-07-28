"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Clock, User } from "lucide-react";
import { formatDateTime } from "@/lib/bay53crm/constants";
import { StageBadge } from "./StageBadge";
import type { CRMFollowUp, LeadStage } from "@/lib/bay53crm/types";

interface FollowUpLogProps {
  followUps: CRMFollowUp[];
  onAdd: (data: { notes: string; stage?: LeadStage; date: string }) => void;
  stages?: LeadStage[];
  showStage?: boolean;
  isAdding?: boolean;
}

export function FollowUpLog({ followUps, onAdd, stages, showStage = true, isAdding }: FollowUpLogProps) {
  const [showForm, setShowForm] = useState(false);
  const [notes, setNotes] = useState("");
  const [stage, setStage] = useState<string>("");
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 16));

  const handleSubmit = () => {
    if (!notes.trim()) return;
    onAdd({
      notes: notes.trim(),
      stage: stage ? (stage as LeadStage) : undefined,
      date: new Date(date).toISOString(),
    });
    setNotes("");
    setStage("");
    setShowForm(false);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold text-muted-foreground">Follow-Up History</h4>
        <Button variant="outline" size="sm" onClick={() => setShowForm(!showForm)}>
          <Plus className="h-3.5 w-3.5 mr-1" />
          Add Note
        </Button>
      </div>

      {showForm && (
        <Card className="border-dashed">
          <CardContent className="p-3 space-y-2">
            <Input
              type="datetime-local"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="h-8 text-xs"
            />
            {showStage && stages && (
              <Select value={stage} onValueChange={setStage}>
                <SelectTrigger className="h-8">
                  <SelectValue placeholder="Stage (optional)" />
                </SelectTrigger>
                <SelectContent>
                  {stages.map((s) => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Enter follow-up notes..."
              className="min-h-[60px] text-sm"
            />
            <div className="flex gap-2 justify-end">
              <Button variant="ghost" size="sm" onClick={() => setShowForm(false)}>Cancel</Button>
              <Button size="sm" onClick={handleSubmit} disabled={!notes.trim() || isAdding}>
                {isAdding ? "Saving..." : "Save"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="space-y-2 max-h-[300px] overflow-y-auto">
        {followUps.length === 0 && (
          <p className="text-xs text-muted-foreground text-center py-4">No follow-ups yet</p>
        )}
        {followUps.map((fu) => (
          <div key={fu.id} className="border rounded-lg p-3 space-y-1">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Clock className="h-3 w-3" />
                {formatDateTime(fu.date)}
              </div>
              {fu.stage && <StageBadge stage={fu.stage} />}
            </div>
            <p className="text-sm">{fu.notes}</p>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <User className="h-3 w-3" />
              {fu.createdBy}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
