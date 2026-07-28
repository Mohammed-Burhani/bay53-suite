"use client";

import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { SlidersHorizontal, FileDown, FileText, Printer, List } from "lucide-react";
import { MultiSelectCheckbox } from "@/components/bay53crm/shared/MultiSelectCheckbox";
import { StageBadge } from "@/components/bay53crm/shared/StageBadge";
import { useCRMLeads, useCRMMasterValues } from "@/lib/hooks/useCRM";
import { formatDateTime } from "@/lib/bay53crm/constants";
import { exportToExcel, exportToPDF, printTable } from "@/lib/utils/report-export";

export function LeadActivityReport() {
  const { data: leads = [] } = useCRMLeads();
  const { data: assignedTos = [] } = useCRMMasterValues("assigned_to");

  const [activeTab, setActiveTab] = useState("criteria");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [assignedTosFilter, setAssignedTosFilter] = useState<string[]>([]);

  const activities = useMemo(() => {
    return leads
      .filter((l) => {
        if (assignedTosFilter.length > 0 && !assignedTosFilter.includes(l.assignedTo)) return false;
        return true;
      })
      .filter((l) => l.lastFollowUpDate)
      .filter((l) => {
        if (fromDate && l.lastFollowUpDate < fromDate) return false;
        if (toDate && l.lastFollowUpDate > toDate) return false;
        return true;
      })
      .map((l) => ({
        date: formatDateTime(l.lastFollowUpDate),
        leadTitle: l.title,
        stage: l.stage,
        notes: l.lastFollowUp,
        createdBy: l.assignedTo,
        rawDate: l.lastFollowUpDate,
      }))
      .sort((a, b) => new Date(b.rawDate).getTime() - new Date(a.rawDate).getTime());
  }, [leads, assignedTosFilter, fromDate, toDate]);

  const handleExportCSV = () => {
    exportToExcel(
      activities.map((a) => ({ ...a, stage: a.stage })),
      [
        { key: "date", label: "Date" },
        { key: "leadTitle", label: "Lead Title" },
        { key: "stage", label: "Stage" },
        { key: "notes", label: "Notes" },
        { key: "createdBy", label: "Created By" },
      ],
      "lead-activity-report"
    );
  };

  const handleExportPDF = () => {
    exportToPDF(
      activities.map((a) => ({ ...a, stage: a.stage })),
      [
        { key: "date", label: "Date" },
        { key: "leadTitle", label: "Lead Title" },
        { key: "stage", label: "Stage" },
        { key: "notes", label: "Notes" },
        { key: "createdBy", label: "Created By" },
      ],
      "Lead Activity Report",
      "lead-activity-report"
    );
  };

  const handlePrint = () => {
    printTable(
      activities.map((a) => ({ date: a.date, leadTitle: a.leadTitle, notes: a.notes, createdBy: a.createdBy })),
      [
        { key: "date", label: "Date" },
        { key: "leadTitle", label: "Lead Title" },
        { key: "notes", label: "Notes" },
        { key: "createdBy", label: "Created By" },
      ],
      "Lead Activity Report"
    );
  };

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Lead Activity Report</h1>
          <p className="text-sm text-muted-foreground">{activities.length} activities</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleExportCSV}><FileDown className="h-4 w-4 mr-1" />CSV</Button>
          <Button variant="outline" size="sm" onClick={handleExportPDF}><FileText className="h-4 w-4 mr-1" />PDF</Button>
          <Button variant="outline" size="sm" onClick={handlePrint}><Printer className="h-4 w-4 mr-1" />Print</Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="criteria"><SlidersHorizontal className="h-4 w-4 mr-1" />Criteria</TabsTrigger>
          <TabsTrigger value="report"><List className="h-4 w-4 mr-1" />Report ({activities.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="criteria">
          <Card>
            <CardContent className="p-4 space-y-4">
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-2">
                  <Label>Date From</Label>
                  <Input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Date To</Label>
                  <Input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Assigned To</Label>
                  <MultiSelectCheckbox
                    options={assignedTos.map((a) => ({ label: a.name, value: a.name }))}
                    selected={assignedTosFilter}
                    onChange={setAssignedTosFilter}
                  />
                </div>
              </div>
              <div className="flex justify-end">
                <Button onClick={() => setActiveTab("report")}>View Report</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="report">
          <Card>
            <div className="overflow-auto max-h-[65vh]">
              <Table>
                <TableHeader>
                  <TableRow className="sticky top-0 bg-background z-10">
                    <TableHead>Date</TableHead>
                    <TableHead>Lead Title</TableHead>
                    <TableHead>Stage</TableHead>
                    <TableHead>Notes</TableHead>
                    <TableHead>Created By</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {activities.map((a, i) => (
                    <TableRow key={i}>
                      <TableCell className="text-xs">{a.date}</TableCell>
                      <TableCell className="font-medium text-xs">{a.leadTitle}</TableCell>
                      <TableCell><StageBadge stage={a.stage} /></TableCell>
                      <TableCell className="text-xs max-w-[300px]">{a.notes}</TableCell>
                      <TableCell className="text-xs">{a.createdBy}</TableCell>
                    </TableRow>
                  ))}
                  {activities.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                        No activities match the criteria
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
