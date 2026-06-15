"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
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
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Search,
  Loader2,
  X,
  SlidersHorizontal,
  Plus,
  Pencil,
  Trash2,
  FolderTree,
  Download,
  RefreshCw,
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { TablePagination, usePagination } from "@/components/ui/table-pagination";
import { ModuleAIAssistant } from "@/components/ModuleAIAssistant";
import { useGroupSearch, useGroupSync, useGroupExport, useGroupDelete } from "@/lib/hooks/useGroups";
import { GROUP_NATURE_OPTIONS } from "@/lib/types/group.types";
import { exportToExcel } from "@/lib/utils/report-export";

export function GroupListTable() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const [nameFilter, setNameFilter] = useState("");
  const [natureFilter, setNatureFilter] = useState<number>(0);
  const [isSync, setIsSync] = useState(false);
  const [lastModifiedDate, setLastModifiedDate] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [deleteName, setDeleteName] = useState("");

  const { currentPage, pageSize, setCurrentPage, setPageSize } = usePagination(50);

  const { mutate: searchGroups, data: groupData, isPending: isSearching } = useGroupSearch();
  const { mutate: syncGroups, isPending: isSyncing } = useGroupSync();
  const { mutate: exportGroups, isPending: isExporting } = useGroupExport();
  const { mutate: deleteGroup, isPending: isDeleting } = useGroupDelete();

  const buildFilters = (syncOverride?: boolean) => ({
    pageSize: 0,
    pageNumber: 0,
    isSync: syncOverride ?? isSync,
    lastModifiedDate: lastModifiedDate.trim() || new Date().toISOString().split("T")[0],
    name: nameFilter.trim() || null,
    nature: natureFilter === 0 ? null : natureFilter,
  });

  const handleSearch = () => {
    searchGroups(buildFilters(), {
      onSuccess: (data) => {
        toast.success(`Loaded ${data.list?.length ?? 0} groups`);
        setCurrentPage(1);
      },
      onError: (error) => {
        toast.error("Failed to load groups");
        console.error(error);
      },
    });
  };

  const handleSync = () => {
    syncGroups(
      { ...buildFilters(), isSync: true },
      {
        onSuccess: (data) => {
          toast.success(`Synced ${data.list?.length ?? 0} groups`);
          setCurrentPage(1);
        },
        onError: (error) => {
          toast.error("Failed to sync groups");
          console.error(error);
        },
      }
    );
  };

  const handleExport = () => {
    exportGroups(buildFilters(), {
      onSuccess: (data) => {
        const list = data.list || [];
        if (list.length === 0) {
          toast.error("No data to export");
          return;
        }
        exportToExcel(
          list as unknown as Record<string, unknown>[],
          [
            { key: "name", label: "Name" },
            { key: "parent", label: "Parent" },
            { key: "nature", label: "Nature" },
            { key: "isCr", label: "Is Cr" },
            { key: "modifiedDate", label: "Modified Date" },
          ],
          "groups-export"
        );
        toast.success(`Exported ${list.length} groups`);
      },
      onError: (error) => {
        toast.error("Failed to export groups");
        console.error(error);
      },
    });
  };

  const handleClear = () => {
    setNameFilter("");
    setNatureFilter(0);
    setIsSync(false);
    setLastModifiedDate("");
    setSearchTerm("");
  };

  const handleDelete = () => {
    if (!deleteId) return;

    deleteGroup(
      { id: deleteId },
      {
        onSuccess: () => {
          toast.success(`Group "${deleteName}" deleted`);
          queryClient.invalidateQueries({ queryKey: ["parent-groups"] });
          setDeleteId(null);
          setDeleteName("");
          if (groupData) {
            searchGroups(buildFilters());
          }
        },
        onError: (error) => {
          toast.error("Failed to delete group");
          console.error(error);
        },
      }
    );
  };

  const filteredGroups = useMemo(() => {
    const groups = groupData?.list || [];
    if (!searchTerm) return groups;

    const search = searchTerm.toLowerCase();
    return groups.filter(
      (g) =>
        g.name?.toLowerCase().includes(search) ||
        g.parent?.toLowerCase().includes(search) ||
        g.nature?.toLowerCase().includes(search)
    );
  }, [groupData?.list, searchTerm]);

  const startIndex = (currentPage - 1) * pageSize;
  const paginatedGroups = filteredGroups.slice(startIndex, startIndex + pageSize);

  const advancedFilterCount = [isSync, lastModifiedDate].filter(Boolean).length;
  const isLoading = isSearching || isSyncing || isExporting;

  return (
    <div className="flex flex-col gap-6">
      {filteredGroups.length > 0 && (
        <Card className="relative overflow-hidden border-0 bg-linear-to-br from-amber-500 to-amber-600 text-white shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium opacity-90">Total Groups</p>
                <p className="text-3xl font-bold mt-1">{filteredGroups.length}</p>
              </div>
              <FolderTree className="h-12 w-12 opacity-80" />
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="border shadow-sm">
        <CardContent className="p-4 space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Quick search by name, parent, nature..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 h-9"
            />
          </div>

          <div className="flex flex-wrap items-end gap-2">
            <div className="w-[200px] space-y-1">
              <Label className="text-xs text-muted-foreground">Name</Label>
              <Input
                placeholder="Group name"
                value={nameFilter}
                onChange={(e) => setNameFilter(e.target.value)}
                className="h-9"
              />
            </div>

            <div className="w-[180px] space-y-1">
              <Label className="text-xs text-muted-foreground">Nature</Label>
              <Select
                value={natureFilter.toString()}
                onValueChange={(value) => setNatureFilter(Number(value))}
              >
                <SelectTrigger className="h-9 w-full">
                  <SelectValue placeholder="Select nature" />
                </SelectTrigger>
                <SelectContent>
                  {GROUP_NATURE_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value.toString()}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" size="sm" className="h-9">
                  <SlidersHorizontal className="h-4 w-4 mr-2" />
                  Filters
                  {advancedFilterCount > 0 && (
                    <Badge variant="secondary" className="ml-2">{advancedFilterCount}</Badge>
                  )}
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[400px] sm:w-[480px] overflow-y-auto">
                <SheetHeader>
                  <SheetTitle>Advanced Filters</SheetTitle>
                  <SheetDescription>Additional filters for group search</SheetDescription>
                </SheetHeader>
                <div className="space-y-5 mt-6">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="isSync"
                      checked={isSync}
                      onCheckedChange={(checked) => setIsSync(checked === true)}
                    />
                    <Label htmlFor="isSync" className="text-sm font-medium cursor-pointer">
                      Sync Mode
                    </Label>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Last Modified Date</Label>
                    <Input
                      type="date"
                      value={lastModifiedDate}
                      onChange={(e) => setLastModifiedDate(e.target.value)}
                      className="h-9"
                    />
                  </div>
                </div>
              </SheetContent>
            </Sheet>

            <Button onClick={handleSearch} disabled={isLoading} size="sm" className="h-9">
              {isSearching ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Search className="h-4 w-4 mr-2" />}
              Search
            </Button>
            <Button variant="outline" onClick={handleClear} size="sm" className="h-9">
              <X className="h-4 w-4 mr-2" />
              Clear
            </Button>
            <Button variant="outline" onClick={handleSync} disabled={isLoading} size="sm" className="h-9">
              {isSyncing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-2" />}
              Sync
            </Button>
            <Button variant="outline" onClick={handleExport} disabled={isLoading} size="sm" className="h-9">
              {isExporting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Download className="h-4 w-4 mr-2" />}
              Export
            </Button>
            <Button asChild size="sm" className="h-9 ml-auto">
              <Link href="/master/groups/create">
                <Plus className="h-4 w-4 mr-2" />
                Add Group
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Groups</CardTitle>
          <CardDescription>
            {filteredGroups.length > 0
              ? `Showing ${paginatedGroups.length} of ${filteredGroups.length} groups`
              : "Search to load groups"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isSearching ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : filteredGroups.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <FolderTree className="h-12 w-12 mx-auto mb-3 opacity-40" />
              <p>No groups found. Use the filters above and click Search.</p>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Parent</TableHead>
                    <TableHead>Nature</TableHead>
                    <TableHead>Is Cr</TableHead>
                    <TableHead>Modified</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedGroups.map((group) => (
                    <TableRow key={group.id}>
                      <TableCell className="font-medium">{group.name}</TableCell>
                      <TableCell>{group.parent || "—"}</TableCell>
                      <TableCell>{group.nature || "—"}</TableCell>
                      <TableCell>{group.isCr || "—"}</TableCell>
                      <TableCell>
                        {group.modifiedDate
                          ? format(new Date(group.modifiedDate), "dd MMM yyyy")
                          : "—"}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 w-8"
                            onClick={() => router.push(`/master/groups/${group.id}/edit`)}
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 w-8 text-destructive hover:text-destructive hover:bg-red-50"
                            onClick={() => {
                              setDeleteId(group.id);
                              setDeleteName(group.name);
                            }}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              <TablePagination
                currentPage={currentPage}
                pageSize={pageSize}
                totalItems={filteredGroups.length}
                onPageChange={setCurrentPage}
                onPageSizeChange={setPageSize}
              />
            </>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Group</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{deleteName}&quot;? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <ModuleAIAssistant moduleName="Groups" moduleData={{ groups: filteredGroups }} />
    </div>
  );
}
