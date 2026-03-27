import LedgerOutstandingSummaryTable from "@/components/reports/LedgerOutstandingSummaryTable";

export default function LedgerOutstandingSummaryPage() {
  return (
    <div className="flex flex-col gap-6 p-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Ledger Outstanding Summary</h1>
        <p className="text-sm text-muted-foreground">View summary of outstanding balances by ledger</p>
      </div>
      <LedgerOutstandingSummaryTable />
    </div>
  );
}
