import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search } from "lucide-react";

interface SalesFiltersProps {
  search: string;
  onSearchChange: (value: string) => void;
  activeTab: string;
  onTabChange: (value: string) => void;
}

export function SalesFilters({
  search,
  onSearchChange,
  activeTab,
  onTabChange,
}: SalesFiltersProps) {
  return (
    <div className="space-y-4">
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search by invoice no. or customer..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-9 bg-white"
        />
      </div>

      <Tabs value={activeTab} onValueChange={onTabChange} className="w-full">
        <TabsList className="flex w-full max-w-sm rounded-xl bg-slate-100 p-1 gap-0.5 border border-slate-200">
          {[
            { value: "all", label: "All" },
            { value: "pending-ready", label: "Pending / Ready" },
            { value: "tax-invoice", label: "Tax Invoice" },
          ].map((tab) => (
            <TabsTrigger
              key={tab.value}
              value={tab.value}
              className={`
                relative flex-1 rounded-lg px-4 py-2 text-sm font-medium transition-all duration-200 ease-out
                text-slate-500 hover:text-slate-700 hover:bg-white/60
                data-[state=active]:bg-white
                data-[state=active]:text-indigo-600
                data-[state=active]:shadow-sm
                data-[state=active]:shadow-slate-200
                data-[state=active]:border
                data-[state=active]:border-indigo-100
                focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400
              `}
            >
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>
    </div>
  );
}
