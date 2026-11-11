"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Plus, Pencil, Trash2 } from "lucide-react";
import {
  useAddMasterValue,
  useDeleteMasterValue,
  useMasterValues,
  useUpdateMasterValue,
} from "@/lib/bay53crm/api/queries";
import type { CrmMasterValue } from "@/lib/bay53crm/api";
import { ALL_STAGES } from "@/lib/bay53crm/leads";
import { APPROVAL_MASTER_VALUE_TYPE, MAKE_LIST_OPTIONS, PROJECT_STATUSES } from "@/lib/bay53crm/projects";

const NO_VALUES: CrmMasterValue[] = [];

type Tab = "approval" | "stages" | "statuses" | "makeList";

const TABS: { value: Tab; label: string }[] = [
  { value: "approval", label: "Brand Approval" },
  { value: "stages", label: "Lead Stage" },
  { value: "statuses", label: "Project Status" },
  { value: "makeList", label: "Make List" },
];

/** Lists the CRM fixes itself: they have no API, so they are shown but not edited here. */
function FixedList({ title, rows }: { title: string; rows: { id: number; label: string }[] }) {
  return (
    <div>
      <div className="px-4 py-3 border-b">
        <span className="text-sm font-medium">{rows.length} values</span>
        <p className="text-xs text-muted-foreground">{title} are fixed by the CRM and cannot be changed here.</p>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-20">Id</TableHead>
            <TableHead>Name</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={row.id}>
              <TableCell className="text-muted-foreground text-xs">{row.id}</TableCell>
              <TableCell className="font-medium">{row.label}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

export function MasterValuesView() {
  const [activeTab, setActiveTab] = useState<Tab>("approval");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<CrmMasterValue | null>(null);

  const { data: approvals = NO_VALUES, isLoading, isError, error } = useMasterValues({ type: APPROVAL_MASTER_VALUE_TYPE });
  const addMutation = useAddMasterValue();
  const updateMutation = useUpdateMasterValue();
  const deleteMutation = useDeleteMasterValue();

  const [text, setText] = useState("");
  const [description, setDescription] = useState("");
  const [isPublished, setIsPublished] = useState(true);

  const openAddDialog = () => {
    setEditing(null);
    setText("");
    setDescription("");
    setIsPublished(true);
    setDialogOpen(true);
  };

  const openEditDialog = (item: CrmMasterValue) => {
    setEditing(item);
    setText(item.text);
    setDescription(item.description ?? "");
    setIsPublished(item.isPublished);
    setDialogOpen(true);
  };

  const toModel = (item: CrmMasterValue, changes: Partial<CrmMasterValue> = {}) => ({
    id: item.id,
    text: item.text,
    description: item.description ?? "",
    type: item.type,
    isPublished: item.isPublished,
    ...changes,
  });

  const handleSave = async () => {
    const name = text.trim();
    if (!name) return;
    try {
      if (editing) {
        await updateMutation.mutateAsync(toModel(editing, { text: name, description: description.trim(), isPublished }));
        toast.success("Value updated");
      } else {
        await addMutation.mutateAsync({
          id: 0,
          text: name,
          description: description.trim(),
          type: APPROVAL_MASTER_VALUE_TYPE,
          isPublished,
        });
        toast.success("Value added");
      }
      setDialogOpen(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not save the value");
    }
  };

  const handleDelete = async (item: CrmMasterValue) => {
    if (!confirm(`Delete "${item.text}"? A value that projects already use may not be deletable; unpublish it instead.`)) return;
    try {
      await deleteMutation.mutateAsync(item.id);
      toast.success("Value deleted");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not delete the value");
    }
  };

  const togglePublished = async (item: CrmMasterValue) => {
    try {
      await updateMutation.mutateAsync(toModel(item, { isPublished: !item.isPublished }));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not update the value");
    }
  };

  const isSaving = addMutation.isPending || updateMutation.isPending;

  return (
    <div className="flex flex-col gap-6 p-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Master Values</h1>
        <p className="text-sm text-muted-foreground">Manage lookup values for CRM module</p>
      </div>

      <Card>
        <CardContent className="p-0">
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as Tab)}>
            <div className="border-b px-4">
              <TabsList className="h-auto flex-wrap gap-1 bg-transparent p-0 py-2">
                {TABS.map((tab) => (
                  <TabsTrigger key={tab.value} value={tab.value} className="text-xs">
                    {tab.label}
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>

            <TabsContent value="approval" className="m-0">
              <div className="flex items-center justify-between px-4 py-3 border-b">
                <span className="text-sm font-medium">{approvals.length} values</span>
                <Button size="sm" onClick={openAddDialog}>
                  <Plus className="h-4 w-4 mr-1" />
                  Add Value
                </Button>
              </div>

              <div className="overflow-auto max-h-[60vh]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-16">Id</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead className="w-24">Published</TableHead>
                      <TableHead className="w-24">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {approvals.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="text-muted-foreground text-xs">{item.id}</TableCell>
                        <TableCell className="font-medium">
                          {item.text}
                          {!item.isPublished && <Badge variant="outline" className="ml-2 text-[10px]">Hidden</Badge>}
                        </TableCell>
                        <TableCell className="text-muted-foreground">{item.description || "—"}</TableCell>
                        <TableCell>
                          <Switch
                            aria-label={`Publish ${item.text}`}
                            checked={item.isPublished}
                            disabled={updateMutation.isPending}
                            onCheckedChange={() => togglePublished(item)}
                          />
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Button variant="ghost" size="icon" className="h-7 w-7" aria-label={`Edit ${item.text}`} onClick={() => openEditDialog(item)}>
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-destructive"
                              aria-label={`Delete ${item.text}`}
                              onClick={() => handleDelete(item)}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                    {(isLoading || isError || approvals.length === 0) && (
                      <TableRow>
                        <TableCell colSpan={5} className={`text-center py-8 ${isError ? "text-destructive" : "text-muted-foreground"}`}>
                          {isLoading
                            ? "Loading values..."
                            : isError
                              ? `Could not load the values: ${error instanceof Error ? error.message : "unknown error"}`
                              : 'No values found. Click "Add Value" to create one.'}
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>

            <TabsContent value="stages" className="m-0">
              <FixedList title="Lead stages" rows={ALL_STAGES.map((s) => ({ id: s.id, label: s.label }))} />
            </TabsContent>
            <TabsContent value="statuses" className="m-0">
              <FixedList title="Project statuses" rows={PROJECT_STATUSES.map((s) => ({ id: s.id, label: s.label }))} />
            </TabsContent>
            <TabsContent value="makeList" className="m-0">
              <FixedList title="Make list options" rows={MAKE_LIST_OPTIONS.map((o) => ({ id: o.id, label: o.label }))} />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Value" : "Add Value"}</DialogTitle>
            <DialogDescription>A brand approval segment that projects can be tagged with.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="mv-name">Name *</Label>
              <Input id="mv-name" value={text} onChange={(e) => setText(e.target.value)} placeholder="e.g. Approved - PHE" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="mv-description">Description</Label>
              <Input id="mv-description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Optional" />
            </div>
            <div className="flex items-center gap-2">
              <Switch id="mv-published" checked={isPublished} onCheckedChange={setIsPublished} />
              <Label htmlFor="mv-published">Published</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={!text.trim() || isSaving}>
              {editing ? "Update" : "Add"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
