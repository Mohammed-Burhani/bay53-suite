"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Pencil, Trash2 } from "lucide-react";
import {
  useCRMMasterValues,
  useAddCRMMasterValue,
  useUpdateCRMMasterValue,
  useDeleteCRMMasterValue,
} from "@/lib/hooks/useCRM";
import type { MasterLookupType } from "@/lib/bay53crm/types";

const TAB_TYPES: { value: MasterLookupType; label: string }[] = [
  { value: "region", label: "Region" },
  { value: "vertical", label: "Vertical" },
  { value: "lead_source", label: "Source" },
  { value: "lead_stage", label: "Stage" },
  { value: "project_status", label: "Project Status" },
  { value: "brand_approval_discipline", label: "Brand Approval" },
  { value: "customer_state", label: "State" },
  { value: "assigned_to", label: "Assigned To" },
];

export function MasterValuesView() {
  const [activeTab, setActiveTab] = useState<MasterLookupType>("region");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const { data: masterValues = [] } = useCRMMasterValues();
  const addMutation = useAddCRMMasterValue();
  const updateMutation = useUpdateCRMMasterValue();
  const deleteMutation = useDeleteCRMMasterValue();

  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [color, setColor] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [sortOrder, setSortOrder] = useState(0);

  const filteredValues = masterValues.filter((m) => m.type === activeTab);

  const openAddDialog = () => {
    setEditingId(null);
    setName("");
    setCode("");
    setColor("");
    setIsActive(true);
    setSortOrder(filteredValues.length + 1);
    setDialogOpen(true);
  };

  const openEditDialog = (item: typeof filteredValues[0]) => {
    setEditingId(item.id);
    setName(item.name);
    setCode(item.code || "");
    setColor(item.color || "");
    setIsActive(item.isActive);
    setSortOrder(item.sortOrder);
    setDialogOpen(true);
  };

  const handleSave = () => {
    if (!name.trim()) return;

    const data = {
      type: activeTab,
      name: name.trim(),
      code: code.trim() || undefined,
      color: color.trim() || undefined,
      isActive,
      sortOrder,
    };

    if (editingId) {
      updateMutation.mutate({ id: editingId, data });
    } else {
      addMutation.mutate(data);
    }
    setDialogOpen(false);
  };

  const handleDelete = (id: string) => {
    if (confirm("Delete this value?")) {
      deleteMutation.mutate(id);
    }
  };

  const toggleActive = (id: string, current: boolean) => {
    updateMutation.mutate({ id, data: { isActive: !current } });
  };

  return (
    <div className="flex flex-col gap-6 p-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Master Values</h1>
        <p className="text-sm text-muted-foreground">Manage lookup values for CRM module</p>
      </div>

      <Card>
        <CardContent className="p-0">
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as MasterLookupType)}>
            <div className="border-b px-4">
              <TabsList className="h-auto flex-wrap gap-1 bg-transparent p-0 py-2">
                {TAB_TYPES.map((tab) => (
                  <TabsTrigger key={tab.value} value={tab.value} className="text-xs">
                    {tab.label}
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>

            <TabsContent value={activeTab} className="m-0">
              <div className="flex items-center justify-between px-4 py-3 border-b">
                <span className="text-sm font-medium">
                  {filteredValues.length} values
                </span>
                <Button size="sm" onClick={openAddDialog}>
                  <Plus className="h-4 w-4 mr-1" />
                  Add Value
                </Button>
              </div>

              <div className="overflow-auto max-h-[60vh]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">Sort</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Code</TableHead>
                      {(activeTab === "lead_stage") && <TableHead>Color</TableHead>}
                      <TableHead className="w-20">Active</TableHead>
                      <TableHead className="w-24">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredValues.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="text-muted-foreground text-xs">{item.sortOrder}</TableCell>
                        <TableCell className="font-medium">{item.name}</TableCell>
                        <TableCell className="text-muted-foreground">{item.code || "—"}</TableCell>
                        {activeTab === "lead_stage" && (
                          <TableCell>
                            {item.color && (
                              <div className="flex items-center gap-2">
                                <div className="w-4 h-4 rounded-full border" style={{ backgroundColor: item.color }} />
                                <span className="text-xs text-muted-foreground">{item.color}</span>
                              </div>
                            )}
                          </TableCell>
                        )}
                        <TableCell>
                          <Switch
                            checked={item.isActive}
                            onCheckedChange={() => toggleActive(item.id, item.isActive)}
                          />
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEditDialog(item)}>
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleDelete(item.id)}>
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                    {filteredValues.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                          No values found. Click "Add Value" to create one.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit Value" : "Add Value"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Name *</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Enter name" />
            </div>
            <div className="space-y-2">
              <Label>Code</Label>
              <Input value={code} onChange={(e) => setCode(e.target.value)} placeholder="Optional code" />
            </div>
            {activeTab === "lead_stage" && (
              <div className="space-y-2">
                <Label>Color (hex)</Label>
                <div className="flex gap-2">
                  <Input value={color} onChange={(e) => setColor(e.target.value)} placeholder="#3b82f6" />
                  {color && <div className="w-9 h-9 rounded border" style={{ backgroundColor: color }} />}
                </div>
              </div>
            )}
            <div className="space-y-2">
              <Label>Sort Order</Label>
              <Input type="number" value={sortOrder} onChange={(e) => setSortOrder(Number(e.target.value))} />
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={isActive} onCheckedChange={setIsActive} />
              <Label>Active</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={!name.trim() || addMutation.isPending || updateMutation.isPending}>
              {editingId ? "Update" : "Add"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
