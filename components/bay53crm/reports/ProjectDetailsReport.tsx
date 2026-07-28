"use client";

import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { SlidersHorizontal, FileDown, FileText, Printer, List } from "lucide-react";
import { MultiSelectCheckbox } from "@/components/bay53crm/shared/MultiSelectCheckbox";
import { useCRMProjects, useCRMMasterValues } from "@/lib/hooks/useCRM";
import { formatDate } from "@/lib/bay53crm/constants";
import { exportToExcel, exportToPDF, printTable } from "@/lib/utils/report-export";

export function ProjectDetailsReport() {
  const { data: projects = [] } = useCRMProjects();
  const { data: regions = [] } = useCRMMasterValues("region");
  const { data: assignedTos = [] } = useCRMMasterValues("assigned_to");

  const [activeTab, setActiveTab] = useState("criteria");
  const [regionIds, setRegionIds] = useState<string[]>([]);
  const [statuses, setStatuses] = useState<string[]>([]);
  const [assignedTosFilter, setAssignedTosFilter] = useState<string[]>([]);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const filteredProjects = useMemo(() => {
    return projects.filter((p) => {
      if (regionIds.length > 0 && !regionIds.includes(p.regionId)) return false;
      if (statuses.length > 0 && !statuses.includes(p.status)) return false;
      if (assignedTosFilter.length > 0 && !assignedTosFilter.includes(p.assignedTo)) return false;
      if (fromDate && p.createdAt < fromDate) return false;
      if (toDate && p.createdAt > toDate) return false;
      return true;
    });
  }, [projects, regionIds, statuses, assignedTosFilter, fromDate, toDate]);

  const handleExportCSV = () => {
    exportToExcel(
      filteredProjects.map((p) => ({
        regionId: p.regionId,
        name: p.name,
        consultantName: p.consultantName,
        contractors: p.contractorDetails.map((c) => `${c.name} (${c.scope})`).join("; "),
        brandApprovals: p.brandApproval.map((ba) => `${ba.discipline}:${ba.status}`).join("; "),
        status: p.status,
        makeListAvailability: p.makeListAvailability,
        assignedTo: p.assignedTo,
      })),
      [
        { key: "regionId", label: "Region" },
        { key: "name", label: "Name" },
        { key: "consultantName", label: "Consultant" },
        { key: "contractors", label: "Contractors" },
        { key: "status", label: "Status" },
        { key: "assignedTo", label: "Assigned To" },
      ],
      "project-details-report"
    );
  };

  const handleExportPDF = () => {
    exportToPDF(
      filteredProjects.map((p) => ({
        regionId: p.regionId,
        name: p.name,
        consultantName: p.consultantName,
        status: p.status,
        assignedTo: p.assignedTo,
      })),
      [
        { key: "regionId", label: "Region" },
        { key: "name", label: "Name" },
        { key: "consultantName", label: "Consultant" },
        { key: "status", label: "Status" },
        { key: "assignedTo", label: "Assigned To" },
      ],
      "Project Details Report",
      "project-details-report"
    );
  };

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Project Details Report</h1>
          <p className="text-sm text-muted-foreground">{filteredProjects.length} projects</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleExportCSV}><FileDown className="h-4 w-4 mr-1" />CSV</Button>
          <Button variant="outline" size="sm" onClick={handleExportPDF}><FileText className="h-4 w-4 mr-1" />PDF</Button>
          <Button variant="outline" size="sm" onClick={() => printTable(filteredProjects as any, [{ key: "name", label: "Name" }, { key: "regionId", label: "Region" }, { key: "status", label: "Status" }], "Project Details Report")}><Printer className="h-4 w-4 mr-1" />Print</Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="criteria"><SlidersHorizontal className="h-4 w-4 mr-1" />Criteria</TabsTrigger>
          <TabsTrigger value="report"><List className="h-4 w-4 mr-1" />Report ({filteredProjects.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="criteria">
          <Card>
            <CardContent className="p-4 space-y-4">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="space-y-2">
                  <Label>Region</Label>
                  <MultiSelectCheckbox options={regions.map((r) => ({ label: r.name, value: r.code || r.name }))} selected={regionIds} onChange={setRegionIds} />
                </div>
                <div className="space-y-2">
                  <Label>Status</Label>
                  <MultiSelectCheckbox options={[{ label: "Awarded", value: "Awarded" }, { label: "Not Awarded", value: "Not Awarded" }]} selected={statuses} onChange={setStatuses} />
                </div>
                <div className="space-y-2">
                  <Label>Assigned To</Label>
                  <MultiSelectCheckbox options={assignedTos.map((a) => ({ label: a.name, value: a.name }))} selected={assignedTosFilter} onChange={setAssignedTosFilter} />
                </div>
                <div className="space-y-2">
                  <Label>Date From</Label>
                  <Input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
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
                    <TableHead>Region</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Consultant</TableHead>
                    <TableHead>Contractors</TableHead>
                    <TableHead>Brand Approval</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Make List</TableHead>
                    <TableHead>Assigned To</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProjects.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell className="text-xs">{p.regionId}</TableCell>
                      <TableCell className="font-medium text-xs max-w-[180px] truncate">{p.name}</TableCell>
                      <TableCell className="text-xs">{p.consultantName}</TableCell>
                      <TableCell className="text-xs max-w-[150px]">
                        {p.contractorDetails.map((c, i) => (
                          <div key={i} className="truncate" title={`${c.name} - ${c.scope}`}>{c.name}</div>
                        ))}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1 flex-wrap">
                          {p.brandApproval.map((ba, i) => (
                            <Badge key={i} variant="outline" className={`text-[10px] ${ba.status === "Approved" ? "border-green-500 text-green-600" : ba.status === "Rejected" ? "border-red-500 text-red-600" : "border-amber-500 text-amber-600"}`}>
                              {ba.discipline}: {ba.status}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell className="text-xs">
                        <Badge variant="outline" className={p.status === "Awarded" ? "border-green-500 text-green-600" : "border-gray-400 text-gray-500"}>
                          {p.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs">{p.makeListAvailability}</TableCell>
                      <TableCell className="text-xs">{p.assignedTo}</TableCell>
                    </TableRow>
                  ))}
                  {filteredProjects.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                        No projects match the criteria
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
