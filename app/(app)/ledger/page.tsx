"use client";

import { useState, useEffect } from "react";
import { useLedgerSearch, useGroupSearch } from "@/lib/hooks/useLedgers";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Users, Search, Loader2, Building2, MapPin, Phone, Edit, Save, FileDown, Printer, Lock } from "lucide-react";
import { toast } from "sonner";
import type { Ledger, Group } from "@/lib/types/reports.types";
import { ContextMenu, ContextMenuItem } from "@/components/ui/context-menu";

export default function LedgerPage() {
  const [selectedGroup, setSelectedGroup] = useState<number | null>(null);
  const [includeChildGroups, setIncludeChildGroups] = useState(true);
  const [search, setSearch] = useState("");
  const [groups, setGroups] = useState<Group[]>([]);
  const [ledgers, setLedgers] = useState<Ledger[]>([]);

  const groupSearch = useGroupSearch();
  const ledgerSearch = useLedgerSearch();

  // Load groups on mount
  useEffect(() => {
    groupSearch.mutate(
      {
        pageSize: 0,
        pageNumber: 0,
        childOf: null,
        name: null,
        nature: null,
      },
      {
        onSuccess: (data) => {
          setGroups(data);
        },
        onError: () => {
          toast.error("Failed to load groups");
        },
      }
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSearch = () => {
    if (!selectedGroup) {
      toast.error("Please select a group first");
      return;
    }

    ledgerSearch.mutate(
      {
        pageSize: 0,
        pageNumber: 0,
        groups: [selectedGroup],
        includeChildGroups,
      },
      {
        onSuccess: (data) => {
          setLedgers(data.list || []);
          toast.success(`Found ${data.list?.length || 0} ledgers`);
        },
        onError: () => {
          toast.error("Failed to search ledgers");
        },
      }
    );
  };

  // Context menu handlers
  const handleEdit = (ledger: Ledger) => {
    toast.info(`Edit: ${ledger.name}`);
  };

  const handleSaveAs = (ledger: Ledger) => {
    toast.info(`Save As: ${ledger.name}`);
  };

  const handleEnvelopePrint = (ledger: Ledger) => {
    toast.info(`Envelope Print: ${ledger.name}`);
  };

  const handleLock = (ledger: Ledger) => {
    toast.info(`${ledger.lock_Freeze ? 'Unlock' : 'Lock'}: ${ledger.name}`);
  };

  const handleDelete = (ledger: Ledger) => {
    toast.warning(`Delete: ${ledger.name}`);
  };

  const getLedgerContextMenu = (ledger: Ledger): ContextMenuItem[] => [
    {
      label: "Edit",
      icon: Edit,
      onClick: () => handleEdit(ledger),
    },
    {
      label: "Save As",
      icon: Save,
      onClick: () => handleSaveAs(ledger),
    },
    {
      label: "Envelope Print",
      icon: Printer,
      onClick: () => handleEnvelopePrint(ledger),
      divider: true,
    },
    {
      label: ledger.lock_Freeze ? "Unlock" : "Lock",
      icon: Lock,
      onClick: () => handleLock(ledger),
      variant: ledger.lock_Freeze ? "success" : "default",
      divider: true,
    },
    {
      label: "Delete",
      icon: FileDown,
      onClick: () => handleDelete(ledger),
      variant: "danger",
    },
  ];

  const filtered = ledgers.filter(
    (l) =>
      l.name.toLowerCase().includes(search.toLowerCase()) ||
      l.group?.toLowerCase().includes(search.toLowerCase()) ||
      l.gstNo?.toLowerCase().includes(search.toLowerCase()) ||
      l.panNo?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Ledger</h1>
          <p className="text-sm text-muted-foreground">
            View customers, suppliers, and other parties
          </p>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-6 space-y-4">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {/* Group Dropdown */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Group</label>
              <Select
                value={selectedGroup?.toString() || ""}
                onValueChange={(v) => setSelectedGroup(Number(v))}
                disabled={groupSearch.isPending}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a group" />
                </SelectTrigger>
                <SelectContent>
                  {groups.map((g) => (
                    <SelectItem key={g.id} value={g.id.toString()}>
                      {g.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Include Child Groups */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Child Groups</label>
              <Select
                value={includeChildGroups ? "yes" : "no"}
                onValueChange={(v) => setIncludeChildGroups(v === "yes")}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="yes">Include</SelectItem>
                  <SelectItem value="no">Exclude</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Search Button */}
            <div className="space-y-2">
              <label className="text-sm font-medium opacity-0">Action</label>
              <Button
                onClick={handleSearch}
                disabled={ledgerSearch.isPending || !selectedGroup}
                className="w-full gap-2"
              >
                {ledgerSearch.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Search className="h-4 w-4" />
                )}
                Search Ledgers
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary */}
      {ledgers.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-3">
          <Card className="card-hover border-l-4 border-l-blue-500">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="rounded-xl bg-blue-100 p-2.5">
                <Users className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider">
                  Total Ledgers
                </p>
                <p className="text-xl font-bold mt-1">{ledgers.length}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="card-hover border-l-4 border-l-green-500">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="rounded-xl bg-green-100 p-2.5">
                <Building2 className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider">
                  Customers
                </p>
                <p className="text-xl font-bold mt-1">
                  {ledgers.filter((l) => l.partyType === 1).length}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="card-hover border-l-4 border-l-purple-500">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="rounded-xl bg-purple-100 p-2.5">
                <Building2 className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider">
                  Suppliers
                </p>
                <p className="text-xl font-bold mt-1">
                  {ledgers.filter((l) => l.partyType === 2).length}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Search Input */}
      {ledgers.length > 0 && (
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by name, group, GST, or PAN..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      )}

      {/* Table */}
      <Card className="py-4">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Group</TableHead>
                <TableHead>Party Type</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>GST No</TableHead>
                <TableHead>PAN No</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="py-12 text-center">
                    <Users className="mx-auto h-8 w-8 text-muted-foreground/40" />
                    <p className="mt-2 text-sm text-muted-foreground">
                      {ledgers.length === 0
                        ? "Select a group and click Search"
                        : "No ledgers match your search"}
                    </p>
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((ledger) => (
                  <ContextMenu key={ledger.ledger_id} items={getLedgerContextMenu(ledger)}>
                    <TableRow className="hover:bg-muted/30 transition-colors cursor-context-menu">
                    <TableCell>
                      <div>
                        <p className="font-medium text-sm">{ledger.name}</p>
                        {ledger.address && (
                          <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                            {ledger.address}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {ledger.group ? (
                        <span className="text-sm">{ledger.group}</span>
                      ) : (
                        <span className="text-xs text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {ledger.partyType === 1 ? (
                        <Badge variant="default" className="text-xs">
                          Customer
                        </Badge>
                      ) : ledger.partyType === 2 ? (
                        <Badge variant="secondary" className="text-xs">
                          Supplier
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-xs">
                          Other
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {ledger.state ? (
                        <span className="flex items-center gap-1 text-sm text-muted-foreground">
                          <MapPin className="h-3 w-3" />
                          {ledger.state}
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {ledger.contactInfo ? (
                        <span className="flex items-center gap-1 text-sm">
                          <Phone className="h-3 w-3 text-muted-foreground" />
                          {ledger.contactInfo}
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {ledger.gstNo ? (
                        <span className="font-mono text-xs">{ledger.gstNo}</span>
                      ) : (
                        <span className="text-xs text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {ledger.panNo ? (
                        <span className="font-mono text-xs">{ledger.panNo}</span>
                      ) : (
                        <span className="text-xs text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {ledger.lock_Freeze ? (
                        <Badge variant="destructive" className="text-xs">
                          Locked
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-xs">
                          Active
                        </Badge>
                      )}
                    </TableCell>
                  </TableRow>
                  </ContextMenu>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
