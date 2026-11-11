"use client";

import { Clock, User } from "lucide-react";
import { StageBadge } from "@/components/bay53crm/shared/StageBadge";
import { EmptyRecords, RecordHeader } from "@/components/bay53crm/shared/RecordParts";
import { useLeadHistory } from "@/lib/bay53crm/api/queries";
import { formatDateTime } from "@/lib/bay53crm/constants";
import { stageLabel } from "@/lib/bay53crm/leads";

interface LeadHistoryProps {
  leadId: number;
  users: { userName: string; fullName: string }[];
}

/** Every stage change of the lead, newest first. Read-only: the API only records it. */
export function LeadHistory({ leadId, users }: LeadHistoryProps) {
  const { data = [], isLoading } = useLeadHistory(leadId);
  const userName = (id?: string) => users.find((u) => u.userName === id)?.fullName ?? id ?? "";
  const sorted = [...data].sort((a, b) => b.updatedOn.localeCompare(a.updatedOn));

  return (
    <div className="space-y-3">
      <RecordHeader title="Stage history" count={data.length} />
      {isLoading && <EmptyRecords>Loading history...</EmptyRecords>}
      {!isLoading && data.length === 0 && <EmptyRecords>No changes recorded</EmptyRecords>}
      <div className="space-y-2">
        {sorted.map((entry) => (
          <div key={entry.id} className="flex items-center justify-between gap-2 rounded-lg border p-2.5">
            <div className="min-w-0 space-y-1">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Clock className="h-3 w-3" />
                {formatDateTime(entry.updatedOn)}
              </div>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <User className="h-3 w-3" />
                {userName(entry.updatedBy)}
              </div>
            </div>
            <StageBadge stage={stageLabel(entry.stage)} />
          </div>
        ))}
      </div>
    </div>
  );
}
