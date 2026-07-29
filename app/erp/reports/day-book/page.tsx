import DayBookTable from "@/components/reports/DayBookTable";

export default function DayBookPage() {
  // Fetch data here using server-side methods
  // const data = await fetchDayBookData();

  return (
    <div className="flex flex-col gap-6 p-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Day Book</h1>
        <p className="text-sm text-muted-foreground">Daily transaction register</p>
      </div>

      <DayBookTable />
    </div>
  );
}
