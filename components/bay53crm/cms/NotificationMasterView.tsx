"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { useCRMNotifications, useAddCRMNotification, useUpdateCRMNotification, useDeleteCRMNotification } from "@/lib/hooks/useCRM";
import { formatDateTime } from "@/lib/bay53crm/constants";

export function NotificationMasterView() {
  const { data: notifications = [] } = useCRMNotifications();
  const addMutation = useAddCRMNotification();
  const updateMutation = useUpdateCRMNotification();
  const deleteMutation = useDeleteCRMNotification();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [type, setType] = useState("lead_assignment");
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [targetRole, setTargetRole] = useState("Sales Executive");
  const [isActive, setIsActive] = useState(true);

  const openAddDialog = () => {
    setEditingId(null);
    setType("lead_assignment");
    setTitle("");
    setMessage("");
    setTargetRole("Sales Executive");
    setIsActive(true);
    setDialogOpen(true);
  };

  const openEditDialog = (item: typeof notifications[0]) => {
    setEditingId(item.id);
    setType(item.type);
    setTitle(item.title);
    setMessage(item.message);
    setTargetRole(item.targetRole);
    setIsActive(item.isActive);
    setDialogOpen(true);
  };

  const handleSave = () => {
    if (!title.trim() || !message.trim()) return;
    const data = { type, title: title.trim(), message: message.trim(), targetRole, isActive };
    if (editingId) {
      updateMutation.mutate({ id: editingId, data });
    } else {
      addMutation.mutate(data);
    }
    setDialogOpen(false);
  };

  const handleDelete = (id: string) => {
    if (confirm("Delete this notification?")) deleteMutation.mutate(id);
  };

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Notification Master</h1>
          <p className="text-sm text-muted-foreground">Manage notification templates and rules</p>
        </div>
        <Button onClick={openAddDialog}>
          <Plus className="h-4 w-4 mr-1" />
          Add Notification
        </Button>
      </div>

      <Card>
        <div className="overflow-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Type</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Message</TableHead>
                <TableHead>Target Role</TableHead>
                <TableHead>Active</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="w-20">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {notifications.map((n) => (
                <TableRow key={n.id}>
                  <TableCell>
                    <Badge variant="outline" className="text-xs">{n.type.replace(/_/g, " ")}</Badge>
                  </TableCell>
                  <TableCell className="font-medium text-xs">{n.title}</TableCell>
                  <TableCell className="text-xs max-w-[300px] truncate">{n.message}</TableCell>
                  <TableCell className="text-xs">{n.targetRole}</TableCell>
                  <TableCell>
                    <Switch checked={n.isActive} onCheckedChange={() => updateMutation.mutate({ id: n.id, data: { isActive: !n.isActive } })} />
                  </TableCell>
                  <TableCell className="text-xs">{formatDateTime(n.createdAt)}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEditDialog(n)}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleDelete(n.id)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {notifications.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    No notifications configured
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit Notification" : "Add Notification"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Type</Label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="lead_assignment">Lead Assignment</SelectItem>
                  <SelectItem value="follow_up_reminder">Follow-up Reminder</SelectItem>
                  <SelectItem value="tender_deadline">Tender Deadline</SelectItem>
                  <SelectItem value="project_update">Project Update</SelectItem>
                  <SelectItem value="lead_won">Lead Won</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Title *</Label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Notification title" />
            </div>
            <div className="space-y-2">
              <Label>Message *</Label>
              <Textarea value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Notification message" />
            </div>
            <div className="space-y-2">
              <Label>Target Role</Label>
              <Select value={targetRole} onValueChange={setTargetRole}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Sales Executive">Sales Executive</SelectItem>
                  <SelectItem value="Sales Manager">Sales Manager</SelectItem>
                  <SelectItem value="Project Manager">Project Manager</SelectItem>
                  <SelectItem value="All">All</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={isActive} onCheckedChange={setIsActive} />
              <Label>Active</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={!title.trim() || !message.trim() || addMutation.isPending}>
              {editingId ? "Update" : "Add"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
