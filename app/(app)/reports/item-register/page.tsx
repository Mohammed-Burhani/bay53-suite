import ItemRegisterTable from "@/components/reports/ItemRegisterTable";

export default function ItemRegisterPage() {
  // Fetch data here using server-side methods
  // const data = await fetchItemRegisterData();

  return (
    <div className="flex flex-col gap-6 p-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Item Register</h1>
        <p className="text-sm text-muted-foreground">Item-wise stock movement register</p>
      </div>

      <ItemRegisterTable />
    </div>
  );
}
