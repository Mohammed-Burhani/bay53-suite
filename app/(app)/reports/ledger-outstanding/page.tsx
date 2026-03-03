import LedgerOutstandingTable from "@/components/reports/LedgerOutstandingTable";

export default function LedgerOutstandingPage() {
  // Fetch data here using server-side methods
  // const data = await fetchLedgerOutstandingData();

  return (
    <div className="flex flex-col gap-6 p-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Ledger Outstanding</h1>
        <p className="text-sm text-muted-foreground">View outstanding balances by ledger</p>
      </div>

      <LedgerOutstandingTable />
    </div>
  );
}
