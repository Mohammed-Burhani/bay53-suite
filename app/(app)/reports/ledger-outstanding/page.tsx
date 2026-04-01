import LedgerOutstandingTable from "@/components/reports/LedgerOutstandingTable";

export default function LedgerBalancesPage() {
  return (
    <div className="flex flex-col gap-6 p-6">
      <LedgerOutstandingTable />
    </div>
  );
}
