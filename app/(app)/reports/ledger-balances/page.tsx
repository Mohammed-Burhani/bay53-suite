import LedgerOutstandingSummaryTable from "@/components/reports/LedgerOutstandingSummaryTable";

export default function LedgerBalancesPage() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Ledger Balances</h1>
        <p className="text-muted-foreground">View summary of outstanding balances by ledger</p>
      </div>
      <LedgerOutstandingSummaryTable />
    </div>
  );
}
