"use client";

import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { SlidersHorizontal, FileDown, FileText, Printer, List } from "lucide-react";
import { MultiSelectCheckbox } from "@/components/bay53crm/shared/MultiSelectCheckbox";
import { useCRMLeads, useCRMMasterValues } from "@/lib/hooks/useCRM";
import { formatCurrency, formatDate, STAGE_COLORS } from "@/lib/bay53crm/constants";
import { exportToExcel, exportToPDF, printTable } from "@/lib/utils/report-export";
import type { LeadStage, CRMLead } from "@/lib/bay53crm/types";

const ALL_STAGES: LeadStage[] = ["Cold Lead", "Hot Lead", "Tender", "Tender Won", "Tender Lost", "Won", "Lost"];

export function SalesStageReport() {
  const { data: leads = [] } = useCRMLeads();
  const { data: regions = [] } = useCRMMasterValues("region");
  const { data: assignedTos = [] } = useCRMMasterValues("assigned_to");

  const [activeTab, setActiveTab] = useState("criteria");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [regionIds, setRegionIds] = useState<string[]>([]);
  const [assignedTosFilter, setAssignedTosFilter] = useState<string[]>([]);

  const filteredLeads = useMemo(() => {
    return leads.filter((l) => {
      if (fromDate && l.date < fromDate) return false;
      if (toDate && l.date > toDate) return false;
      if (regionIds.length > 0 && !regionIds.includes(l.regionId)) return false;
      if (assignedTosFilter.length > 0 && !assignedTosFilter.includes(l.assignedTo)) return false;
      return true;
    });
  }, [leads, fromDate, toDate, regionIds, assignedTosFilter]);

  const pivotData = useMemo(() => {
    return ALL_STAGES.map((stage) => {
      const stageLeads = filteredLeads.filter((l) => l.stage === stage);
      return {
        stage,
        count: stageLeads.length,
        totalValue: stageLeads.reduce((sum, l) => sum + l.value, 0),
        color: STAGE_COLORS[stage]?.chart || "#9ca3af",
      };
    });
  }, [filteredLeads]);

  const totalCount = pivotData.reduce((sum, d) => sum + d.count, 0);
  const totalValue = pivotData.reduce((sum, d) => sum + d.totalValue, 0);

  const chartData = pivotData.map((d) => ({
    stage: d.stage,
    count: d.count,
    value: d.totalValue,
  }));

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Sales Stage Status Report</h1>
          <p className="text-sm text-muted-foreground">{filteredLeads.length} total leads</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => exportToExcel(pivotData, [{ key: "stage", label: "Stage" }, { key: "count", label: "Count" }, { key: "totalValue", label: "Total Value" }], "sales-stage-report")}>
            <FileDown className="h-4 w-4 mr-1" />CSV
          </Button>
          <Button variant="outline" size="sm" onClick={() => exportToPDF(pivotData, [{ key: "stage", label: "Stage" }, { key: "count", label: "Count" }, { key: "totalValue", label: "Total Value" }], "Sales Stage Report", "sales-stage-report")}>
            <FileText className="h-4 w-4 mr-1" />PDF
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="criteria"><SlidersHorizontal className="h-4 w-4 mr-1" />Criteria</TabsTrigger>
          <TabsTrigger value="report"><List className="h-4 w-4 mr-1" />Report ({filteredLeads.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="criteria">
          <Card>
            <CardContent className="p-4 space-y-4">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="space-y-2">
                  <Label>Date From</Label>
                  <Input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Date To</Label>
                  <Input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Region</Label>
                  <MultiSelectCheckbox options={regions.map((r) => ({ label: r.name, value: r.code || r.name }))} selected={regionIds} onChange={setRegionIds} />
                </div>
                <div className="space-y-2">
                  <Label>Assigned To</Label>
                  <MultiSelectCheckbox options={assignedTos.map((a) => ({ label: a.name, value: a.name }))} selected={assignedTosFilter} onChange={setAssignedTosFilter} />
                </div>
              </div>
              <div className="flex justify-end">
                <Button onClick={() => setActiveTab("report")}>View Report</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="report">
          <div className="space-y-6">
            {/* Bar Chart */}
            <Card>
              <CardContent className="p-4">
                <h3 className="text-sm font-semibold mb-3">Stage Distribution</h3>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="stage" tick={{ fontSize: 11 }} />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Pivot Table */}
            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Stage</TableHead>
                    <TableHead className="text-right">Count</TableHead>
                    <TableHead className="text-right">Total Value</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pivotData.map((row) => (
                    <TableRow key={row.stage}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: STAGE_COLORS[row.stage]?.chart }} />
                          <span className="font-medium">{row.stage}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">{row.count}</TableCell>
                      <TableCell className="text-right">{formatCurrency(row.totalValue)}</TableCell>
                    </TableRow>
                  ))}
                  <TableRow className="font-bold border-t-2">
                    <TableCell>Total</TableCell>
                    <TableCell className="text-right">{totalCount}</TableCell>
                    <TableCell className="text-right">{formatCurrency(totalValue)}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
