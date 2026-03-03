import InventoryReportTable from "@/components/reports/InventoryReportTable";

export default function InventoryReportPage() {
  // Fetch data here using server-side methods
  // const data = await fetchInventoryReportData();

  return (
    <div className="flex flex-col gap-6 p-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Inventory Report</h1>
        <p className="text-sm text-muted-foreground">Detailed item transaction report</p>
      </div>

      <InventoryReportTable />
    </div>
  );
}
