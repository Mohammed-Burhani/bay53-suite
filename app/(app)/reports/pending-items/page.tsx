import PendingItemsTable from "@/components/reports/PendingItemsTable";

export default function PendingItemsPage() {
  return (
    <div className="flex flex-col gap-6 p-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Pending Items</h1>
        <p className="text-sm text-muted-foreground">Unfulfilled and partially fulfilled orders</p>
      </div>

      <PendingItemsTable />
    </div>
  );
}
