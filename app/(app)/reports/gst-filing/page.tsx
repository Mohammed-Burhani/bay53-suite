import GSTFilingTable from "@/components/reports/GSTFilingTable";

export default function GSTFilingPage() {
  // Fetch data here using server-side methods
  // const data = await fetchGSTFilingData();

  return (
    <div className="flex flex-col gap-6 p-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">GST Filing</h1>
        <p className="text-sm text-muted-foreground">Generate GST-ready reports for filing</p>
      </div>

      <GSTFilingTable />
    </div>
  );
}
