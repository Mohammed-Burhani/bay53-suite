"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Edit, Mail, Shield } from "lucide-react";

export default function UserManagementSettings() {
  const users = [
    { id: 1, name: "Admin User", email: "admin@example.com", role: "admin", status: "active" },
    { id: 2, name: "Sales Manager", email: "sales@example.com", role: "manager", status: "active" },
    { id: 3, name: "Cashier", email: "cashier@example.com", role: "cashier", status: "active" },
  ];

  return (
    <div className="space-y-6">
      <Card className="py-4">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>User Management</CardTitle>
              <CardDescription>
                Manage users and their access permissions
              </CardDescription>
            </div>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add User
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {users.map((user) => (
              <div key={user.id} className="flex items-center justify-between rounded-lg border p-4">
                <div className="flex items-center gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                    <span className="text-sm font-medium">
                      {user.name.split(" ").map(n => n[0]).join("")}
                    </span>
                  </div>
                  <div>
                    <div className="font-medium">{user.name}</div>
                    <div className="text-sm text-muted-foreground">{user.email}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant={user.role === "admin" ? "default" : "secondary"}>
                    {user.role}
                  </Badge>
                  <Badge variant={user.status === "active" ? "default" : "secondary"}>
                    {user.status}
                  </Badge>
                  <Button size="icon" variant="ghost">
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button size="icon" variant="ghost">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="py-4">
        <CardHeader>
          <CardTitle>Roles & Permissions</CardTitle>
          <CardDescription>
            Configure role-based access control
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-4">
            <div className="rounded-lg border p-4">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <div className="font-medium">Administrator</div>
                  <div className="text-sm text-muted-foreground">Full system access</div>
                </div>
                <Badge>Full Access</Badge>
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="flex items-center gap-2">
                  <Shield className="h-3 w-3 text-green-500" />
                  <span>Manage Users</span>
                </div>
                <div className="flex items-center gap-2">
                  <Shield className="h-3 w-3 text-green-500" />
                  <span>View Reports</span>
                </div>
                <div className="flex items-center gap-2">
                  <Shield className="h-3 w-3 text-green-500" />
                  <span>Manage Inventory</span>
                </div>
                <div className="flex items-center gap-2">
                  <Shield className="h-3 w-3 text-green-500" />
                  <span>Process Sales</span>
                </div>
                <div className="flex items-center gap-2">
                  <Shield className="h-3 w-3 text-green-500" />
                  <span>Manage Settings</span>
                </div>
                <div className="flex items-center gap-2">
                  <Shield className="h-3 w-3 text-green-500" />
                  <span>Delete Records</span>
                </div>
              </div>
            </div>

            <div className="rounded-lg border p-4">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <div className="font-medium">Manager</div>
                  <div className="text-sm text-muted-foreground">Manage operations</div>
                </div>
                <Badge variant="secondary">Limited Access</Badge>
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="flex items-center gap-2">
                  <Shield className="h-3 w-3 text-red-500" />
                  <span>Manage Users</span>
                </div>
                <div className="flex items-center gap-2">
                  <Shield className="h-3 w-3 text-green-500" />
                  <span>View Reports</span>
                </div>
                <div className="flex items-center gap-2">
                  <Shield className="h-3 w-3 text-green-500" />
                  <span>Manage Inventory</span>
                </div>
                <div className="flex items-center gap-2">
                  <Shield className="h-3 w-3 text-green-500" />
                  <span>Process Sales</span>
                </div>
                <div className="flex items-center gap-2">
                  <Shield className="h-3 w-3 text-red-500" />
                  <span>Manage Settings</span>
                </div>
                <div className="flex items-center gap-2">
                  <Shield className="h-3 w-3 text-red-500" />
                  <span>Delete Records</span>
                </div>
              </div>
            </div>

            <div className="rounded-lg border p-4">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <div className="font-medium">Cashier</div>
                  <div className="text-sm text-muted-foreground">Basic sales operations</div>
                </div>
                <Badge variant="secondary">Basic Access</Badge>
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="flex items-center gap-2">
                  <Shield className="h-3 w-3 text-red-500" />
                  <span>Manage Users</span>
                </div>
                <div className="flex items-center gap-2">
                  <Shield className="h-3 w-3 text-red-500" />
                  <span>View Reports</span>
                </div>
                <div className="flex items-center gap-2">
                  <Shield className="h-3 w-3 text-red-500" />
                  <span>Manage Inventory</span>
                </div>
                <div className="flex items-center gap-2">
                  <Shield className="h-3 w-3 text-green-500" />
                  <span>Process Sales</span>
                </div>
                <div className="flex items-center gap-2">
                  <Shield className="h-3 w-3 text-red-500" />
                  <span>Manage Settings</span>
                </div>
                <div className="flex items-center gap-2">
                  <Shield className="h-3 w-3 text-red-500" />
                  <span>Delete Records</span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <Button variant="outline">
              <Plus className="mr-2 h-4 w-4" />
              Create Custom Role
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="py-4">
        <CardHeader>
          <CardTitle>Invite Users</CardTitle>
          <CardDescription>
            Send invitation emails to new users
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="invite-email">Email Address</Label>
              <Input id="invite-email" type="email" placeholder="user@example.com" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="invite-role">Role</Label>
              <Select defaultValue="cashier">
                <SelectTrigger id="invite-role">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Administrator</SelectItem>
                  <SelectItem value="manager">Manager</SelectItem>
                  <SelectItem value="cashier">Cashier</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex justify-end">
            <Button>
              <Mail className="mr-2 h-4 w-4" />
              Send Invitation
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="py-4">
        <CardHeader>
          <CardTitle>Activity Log</CardTitle>
          <CardDescription>
            Recent user activities and changes
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[
              { user: "Admin User", action: "Updated business settings", time: "2 hours ago" },
              { user: "Sales Manager", action: "Created new invoice #INV-2025-045", time: "3 hours ago" },
              { user: "Cashier", action: "Processed payment", time: "5 hours ago" },
              { user: "Admin User", action: "Added new product", time: "1 day ago" },
            ].map((log, i) => (
              <div key={i} className="flex items-center justify-between rounded-lg border p-3">
                <div>
                  <div className="text-sm font-medium">{log.user}</div>
                  <div className="text-xs text-muted-foreground">{log.action}</div>
                </div>
                <div className="text-xs text-muted-foreground">{log.time}</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
