"use client";

import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useNotifications } from "@/lib/bay53crm/api/queries";
import type { CrmNotification } from "@/lib/bay53crm/api";

const NO_RULES: CrmNotification[] = [];
const ALL_RULES = {};

/** "11:00" from the rule's time of day, or empty when it has none. */
const runsAt = (rule: CrmNotification): string => {
  const time = rule.repeatsAt?.hasValue ? rule.repeatsAt.value : undefined;
  if (!time) return "";
  return `${String(time.hours ?? 0).padStart(2, "0")}:${String(time.minutes ?? 0).padStart(2, "0")}`;
};

// The rules are read-only on purpose: Notification/Get does not return a rule's query (sqlText) or its recipients, so a
// rule cannot be saved back from this screen without erasing them.
export function NotificationMasterView() {
  const { data, isLoading, isError, error } = useNotifications(ALL_RULES);
  const rules = data?.list ?? NO_RULES;

  return (
    <div className="flex flex-col gap-6 p-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Notification Master</h1>
        <p className="text-sm text-muted-foreground">
          The rules behind the notifications users see. Each rule runs a query on the CRM server, so they are managed there.
        </p>
      </div>

      <Card>
        <div className="overflow-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Rule</TableHead>
                <TableHead>Subject</TableHead>
                <TableHead>Runs at</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rules.map((rule) => (
                <TableRow key={rule.id ?? rule.listName}>
                  <TableCell>
                    <div className="font-medium text-xs">{rule.listName}</div>
                    <div className="text-xs text-muted-foreground max-w-[360px]">{rule.fullName}</div>
                  </TableCell>
                  <TableCell className="text-xs max-w-[220px] truncate" title={rule.dSubject}>{rule.dSubject}</TableCell>
                  <TableCell className="text-xs">{runsAt(rule)}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-xs">{rule.isSystem ? "System" : "Custom"}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={rule.currentStatus ? "border-green-500 text-green-600" : "border-gray-400 text-gray-500"}
                    >
                      {rule.currentStatus ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
              {(isLoading || isError || rules.length === 0) && (
                <TableRow>
                  <TableCell colSpan={5} className={`text-center py-8 ${isError ? "text-destructive" : "text-muted-foreground"}`}>
                    {isLoading
                      ? "Loading notifications..."
                      : isError
                        ? `Could not load the notifications: ${error instanceof Error ? error.message : "unknown error"}`
                        : "No notifications configured"}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
}
