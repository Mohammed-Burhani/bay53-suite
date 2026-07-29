import CurrentStockReport from "@/components/reports/CurrentStockReport";

export default function CurrentStockPage() {
  // Fetch data here using server-side methods
  // const data = await fetchCurrentStockData();

  return (
    <div className="flex flex-col gap-6 p-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Current Stock</h1>
        <p className="text-sm text-muted-foreground">View current stock levels</p>
      </div>

      <CurrentStockReport />
    </div>
  );
}
