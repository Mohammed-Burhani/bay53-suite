import { GroupListTable } from "@/components/master/groups/GroupListTable";

export default function GroupsPage() {
  return (
    <div className="flex flex-col gap-6 p-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Groups</h1>
        <p className="text-sm text-muted-foreground">
          Manage account groups and hierarchies
        </p>
      </div>

      <GroupListTable />
    </div>
  );
}
