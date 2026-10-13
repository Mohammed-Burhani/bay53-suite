"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Copy, Download, Eye, Loader2, Lock, LockOpen, MoreHorizontal, Pencil, RefreshCw, Search, Trash2, UserPlus, X } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Combobox } from "@/components/ui/combobox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { TablePagination } from "@/components/ui/table-pagination";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";
import { useLedgersByGroup } from "@/lib/hooks/useReports";
import { useAllGroups, useLedgerDelete, useLedgerLock } from "@/lib/hooks/useLedgerMaster";
import { exportToExcel } from "@/lib/utils/report-export";
import { getApiErrorMessage } from "@/lib/utils/api-error";
import { EMPTY_LEDGER_FILTERS, filterLedgers, rowValue, type LedgerFilters } from "@/lib/ledgers/ledger-form";
import { PARTY_TYPE_OPTIONS } from "@/lib/types/ledger.types";
import type { Ledger } from "@/lib/types/reports.types";
import { LedgerDetailsSheet } from "./LedgerDetailsSheet";

const dash = (v: unknown) => (v === null || v === undefined || v === "" ? "—" : String(v));

const COLUMN_FIELDS = [
  "area", "city", "pinCode", "partyCode", "shipAddress", "phone_1", "phone_2", "fax", "mobile", "email", "contact_Person", "credit_Limit", "hsnNo", "hsnDescription", "taxPercent",
] as const;

const money = (v: string | number | null) => (v === null || Number.isNaN(Number(v)) ? "—" : Number(v).toFixed(2));

const partyTypeLabel = (t: number) => PARTY_TYPE_OPTIONS.find((o) => o.value === t)?.label ?? "Other";

export function LedgerListTable() {
  const router = useRouter();
  const [groupId, setGroupId] = useState<number | null>(null);
  const { data, isLoading, isFetching, isError, refetch } = useLedgersByGroup(groupId ? [groupId] : undefined);
  const { data: groups = [] } = useAllGroups();
  const allLedgers = useMemo(() => data ?? [], [data]);
  const deleteLedger = useLedgerDelete();
  const lockLedger = useLedgerLock();

  const [filters, setFilters] = useState<LedgerFilters>(EMPTY_LEDGER_FILTERS);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [viewing, setViewing] = useState<Ledger | null>(null);
  const [toDelete, setToDelete] = useState<Ledger | null>(null);

  const groupOptions = useMemo(() => groups.map((g) => ({ value: String(g.id), label: g.name })), [groups]);
  const filtered = useMemo(() => filterLedgers(allLedgers, filters), [allLedgers, filters]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const start = (safePage - 1) * pageSize;
  const rows = filtered.slice(start, start + pageSize);

  const updateFilters = (patch: Partial<LedgerFilters>) => {
    setFilters((f) => ({ ...f, ...patch }));
    setPage(1);
  };
  const activeFilterCount = [filters.name, filters.area, filters.city, filters.partyType, filters.status].filter(Boolean).length + (groupId ? 1 : 0);

  const handleExport = () => {
    exportToExcel(
      filtered.map((l) => ({
        ...l,
        ...Object.fromEntries(COLUMN_FIELDS.map((f) => [f, rowValue(l, f) ?? ""])),
        partyTypeLabel: partyTypeLabel(l.partyType),
        lockFreeze: l.lock_Freeze ? "Yes" : "No",
      })),
      [
        { key: "name", label: "Name" },
        { key: "group", label: "Group" },
        { key: "gstNo", label: "GST No" },
        { key: "address", label: "Address" },
        { key: "shipAddress", label: "Shipping Address" },
        { key: "area", label: "Area" },
        { key: "city", label: "City" },
        { key: "state", label: "State" },
        { key: "pinCode", label: "PinCode" },
        { key: "partyCode", label: "PartyCode" },
        { key: "phone_1", label: "Phone 1" },
        { key: "phone_2", label: "Phone 2" },
        { key: "fax", label: "Fax" },
        { key: "mobile", label: "Mobile" },
        { key: "email", label: "Email" },
        { key: "contact_Person", label: "Contact Person" },
        { key: "contactInfo", label: "Contact Info" },
        { key: "partyTypeLabel", label: "Party Type" },
        { key: "panNo", label: "PAN No" },
        { key: "lockFreeze", label: "LockFreeze" },
        { key: "credit_Limit", label: "Credit Limit" },
        { key: "hsnNo", label: "Hsn No" },
        { key: "hsnDescription", label: "Hsn Description" },
        { key: "taxPercent", label: "Tax %" },
        { key: "ledger_id", label: "LedgerId" },
      ],
      "ledgers-export"
    );
    toast.success(`Exported ${filtered.length} ledgers`);
  };

  const handleDelete = () => {
    if (!toDelete) return;
    const target = toDelete;
    deleteLedger.mutate(target.ledger_id, {
      onSuccess: () => {
        toast.success(`Ledger "${target.name}" deleted`);
        setToDelete(null);
      },
      onError: (error) => {
        setToDelete(null);
        toast.error(getApiErrorMessage(error, "Failed to delete ledger"));
      },
    });
  };

  const handleToggleLock = (ledger: Ledger) => {
    const lock = !ledger.lock_Freeze;
    lockLedger.mutate(
      { id: ledger.ledger_id, lockLedger: lock },
      {
        onSuccess: () => toast.success(`Ledger "${ledger.name}" ${lock ? "locked" : "unlocked"}`),
        onError: (error) => toast.error(getApiErrorMessage(error, `Failed to ${lock ? "lock" : "unlock"} ledger`)),
      }
    );
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="mr-auto">
          <h1 className="text-2xl font-bold tracking-tight">Ledgers</h1>
          <p className="text-sm text-muted-foreground">
            {isLoading
              ? "Loading ledgers…"
              : `${filtered.length.toLocaleString()}${filtered.length !== allLedgers.length ? ` of ${allLedgers.length.toLocaleString()}` : ""} ledgers`}
          </p>
        </div>
        <Button type="button" variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching}>
          <RefreshCw className={cn("mr-2 h-4 w-4", isFetching && "animate-spin")} />
          Refresh
        </Button>
        <Button asChild size="sm">
          <Link href="/erp/master/ledgers/create">
            <UserPlus className="mr-2 h-4 w-4" />
            Add Ledger
          </Link>
        </Button>
      </div>

      <Card className="gap-0 py-0">
        <CardContent className="p-3">
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
            <div>
              <Label className="mb-1 text-xs text-muted-foreground">Group (includes sub-groups)</Label>
              <Combobox
                className="h-8"
                options={groupOptions}
                value={groupId ? String(groupId) : ""}
                onValueChange={(v) => {
                  setGroupId(v ? Number(v) : null);
                  setPage(1);
                }}
                placeholder="All groups"
                searchPlaceholder="Search groups…"
              />
            </div>
            <div>
              <Label className="mb-1 text-xs text-muted-foreground">Name</Label>
              <div className="relative">
                <Search className="absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                <Input className="h-8 pl-7" placeholder="Ledger name…" value={filters.name} onChange={(e) => updateFilters({ name: e.target.value })} />
              </div>
            </div>
            <div>
              <Label className="mb-1 text-xs text-muted-foreground">Area</Label>
              <Input className="h-8" value={filters.area} onChange={(e) => updateFilters({ area: e.target.value })} />
            </div>
            <div>
              <Label className="mb-1 text-xs text-muted-foreground">City</Label>
              <Input className="h-8" value={filters.city} onChange={(e) => updateFilters({ city: e.target.value })} />
            </div>
            <div>
              <Label className="mb-1 text-xs text-muted-foreground">Party type</Label>
              <Select value={filters.partyType || "all"} onValueChange={(v) => updateFilters({ partyType: v === "all" ? "" : v })}>
                <SelectTrigger className="h-8 w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All types</SelectItem>
                  {PARTY_TYPE_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={String(o.value)}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="mb-1 text-xs text-muted-foreground">Status</Label>
              <Select value={filters.status || "all"} onValueChange={(v) => updateFilters({ status: v === "all" ? "" : (v as LedgerFilters["status"]) })}>
                <SelectTrigger className="h-8 w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="locked">Locked</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="mt-2 flex justify-end gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-8 px-2 text-xs"
              disabled={activeFilterCount === 0}
              onClick={() => {
                setFilters(EMPTY_LEDGER_FILTERS);
                setGroupId(null);
                setPage(1);
              }}
            >
              <X className="mr-1.5 h-3.5 w-3.5" />
              Clear{activeFilterCount > 0 && ` (${activeFilterCount})`}
            </Button>
            <Button type="button" variant="outline" size="sm" className="h-8 text-xs" disabled={filtered.length === 0} onClick={handleExport}>
              <Download className="mr-1.5 h-3.5 w-3.5" />
              Export to Excel
            </Button>
          </div>
        </CardContent>
      </Card>

      {isError && (
        <div className="flex items-center justify-between rounded-md border border-destructive/40 bg-destructive/5 px-4 py-3 text-sm">
          <span>Could not load ledgers.</span>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            Retry
          </Button>
        </div>
      )}

      <Card className="gap-0 overflow-hidden py-0">
        <Table className="min-w-[3000px]">
          <TableHeader className="bg-muted/40">
            <TableRow>
              <TableHead className="min-w-56">Name</TableHead>
              <TableHead>Group</TableHead>
              <TableHead>GST No</TableHead>
              <TableHead className="min-w-56">Address</TableHead>
              <TableHead className="min-w-56">Shipping Address</TableHead>
              <TableHead>Area</TableHead>
              <TableHead>City</TableHead>
              <TableHead>State</TableHead>
              <TableHead>PinCode</TableHead>
              <TableHead>PartyCode</TableHead>
              <TableHead>Phone 1</TableHead>
              <TableHead>Phone 2</TableHead>
              <TableHead>Fax</TableHead>
              <TableHead>Mobile</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Contact Person</TableHead>
              <TableHead>Contact Info</TableHead>
              <TableHead>Party Type</TableHead>
              <TableHead>PAN No</TableHead>
              <TableHead>LockFreeze</TableHead>
              <TableHead className="text-right">Credit Limit</TableHead>
              <TableHead>Hsn No</TableHead>
              <TableHead>Hsn Description</TableHead>
              <TableHead className="text-right">Tax %</TableHead>
              <TableHead className="text-right">LedgerId</TableHead>
              <TableHead className="sticky right-0 bg-muted text-right shadow-[-1px_0_0_var(--border)]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading &&
              Array.from({ length: 8 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell colSpan={26}>
                    <Skeleton className="h-6 w-full" />
                  </TableCell>
                </TableRow>
              ))}
            {!isLoading && rows.length === 0 && (
              <TableRow>
                <TableCell colSpan={26} className="py-14 text-center text-muted-foreground">
                  {allLedgers.length === 0 ? "No ledgers yet. Add your first ledger." : "No ledgers match these filters."}
                </TableCell>
              </TableRow>
            )}
            {rows.map((ledger) => (
              <TableRow key={ledger.ledger_id} className="group">
                <TableCell className="font-medium">{ledger.name}</TableCell>
                <TableCell>{dash(ledger.group)}</TableCell>
                <TableCell className="font-mono text-xs">{dash(ledger.gstNo)}</TableCell>
                <TableCell className="max-w-64 truncate" title={ledger.address ?? undefined}>
                  {dash(ledger.address)}
                </TableCell>
                <TableCell className="max-w-64 truncate" title={String(rowValue(ledger, "shipAddress") ?? "")}>
                  {dash(rowValue(ledger, "shipAddress"))}
                </TableCell>
                <TableCell>{dash(rowValue(ledger, "area"))}</TableCell>
                <TableCell>{dash(rowValue(ledger, "city"))}</TableCell>
                <TableCell>{dash(ledger.state)}</TableCell>
                <TableCell>{dash(rowValue(ledger, "pinCode"))}</TableCell>
                <TableCell className="font-mono text-xs">{dash(rowValue(ledger, "partyCode"))}</TableCell>
                <TableCell>{dash(rowValue(ledger, "phone_1"))}</TableCell>
                <TableCell>{dash(rowValue(ledger, "phone_2"))}</TableCell>
                <TableCell>{dash(rowValue(ledger, "fax"))}</TableCell>
                <TableCell>{dash(rowValue(ledger, "mobile"))}</TableCell>
                <TableCell>{dash(rowValue(ledger, "email"))}</TableCell>
                <TableCell>{dash(rowValue(ledger, "contact_Person"))}</TableCell>
                <TableCell className="whitespace-nowrap">{dash(ledger.contactInfo)}</TableCell>
                <TableCell>
                  <Badge variant={ledger.partyType === 1 ? "default" : ledger.partyType === 2 ? "secondary" : "outline"}>{partyTypeLabel(ledger.partyType)}</Badge>
                </TableCell>
                <TableCell className="font-mono text-xs">{dash(ledger.panNo)}</TableCell>
                <TableCell>{ledger.lock_Freeze ? <Badge variant="destructive">Yes</Badge> : <span className="text-muted-foreground">No</span>}</TableCell>
                <TableCell className="text-right tabular-nums">{money(rowValue(ledger, "credit_Limit"))}</TableCell>
                <TableCell>{dash(rowValue(ledger, "hsnNo"))}</TableCell>
                <TableCell>{dash(rowValue(ledger, "hsnDescription"))}</TableCell>
                <TableCell className="text-right tabular-nums">{money(rowValue(ledger, "taxPercent"))}</TableCell>
                <TableCell className="text-right font-mono text-xs text-muted-foreground">{ledger.ledger_id}</TableCell>
                <TableCell className="sticky right-0 bg-card shadow-[-1px_0_0_var(--border)] group-hover:bg-muted">
                  <div className="flex justify-end gap-1">
                    <Button variant="outline" size="icon" className="h-8 w-8" aria-label="View details" title="View details" onClick={() => setViewing(ledger)}>
                      <Eye className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      aria-label="Edit ledger"
                      title="Edit"
                      onClick={() => router.push(`/erp/master/ledgers/${ledger.ledger_id}/edit`)}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:bg-red-50 hover:text-destructive"
                      aria-label="Delete ledger"
                      title="Delete"
                      onClick={() => setToDelete(ledger)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="icon" className="h-8 w-8" aria-label="More actions" title="More">
                          <MoreHorizontal className="h-3.5 w-3.5" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => router.push(`/erp/master/ledgers/create?copyFrom=${ledger.ledger_id}`)}>
                          <Copy className="mr-2 h-4 w-4" />
                          Save as copy
                        </DropdownMenuItem>
                        <DropdownMenuItem disabled={lockLedger.isPending} onClick={() => handleToggleLock(ledger)}>
                          {ledger.lock_Freeze ? <LockOpen className="mr-2 h-4 w-4" /> : <Lock className="mr-2 h-4 w-4" />}
                          {ledger.lock_Freeze ? "Unlock" : "Lock"}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <TablePagination totalItems={filtered.length} pageSize={pageSize} currentPage={safePage} onPageChange={setPage} onPageSizeChange={setPageSize} />
      </Card>

      <LedgerDetailsSheet ledger={viewing} onClose={() => setViewing(null)} onEdit={(id) => router.push(`/erp/master/ledgers/${id}/edit`)} />

      <AlertDialog open={!!toDelete} onOpenChange={(open) => !open && !deleteLedger.isPending && setToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete ledger</AlertDialogTitle>
            <AlertDialogDescription>
              Delete &quot;{toDelete?.name}&quot;? Ledgers with transactions may not be deletable. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteLedger.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleDelete();
              }}
              disabled={deleteLedger.isPending}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              {deleteLedger.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
