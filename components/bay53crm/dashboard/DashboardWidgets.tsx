"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";

export interface CompactStatProps {
  icon: React.ElementType;
  label: string;
  value: string;
  sub?: string;
  trend?: string;
  trendUp?: boolean;
  trendDown?: boolean;
  color: "blue" | "amber" | "green" | "red" | "purple" | "teal";
}

const colorMap: Record<string, { bg: string; icon: string; text: string; ring: string }> = {
  blue: { bg: "bg-[var(--report-accent-bg)]", icon: "text-[var(--report-accent)]", text: "text-[var(--report-accent)]", ring: "ring-[var(--report-accent-border)]" },
  amber: { bg: "bg-amber-50 dark:bg-amber-950/30", icon: "text-amber-500", text: "text-amber-700 dark:text-amber-300", ring: "ring-amber-200 dark:ring-amber-800" },
  green: { bg: "bg-green-50 dark:bg-green-950/30", icon: "text-green-500", text: "text-green-700 dark:text-green-300", ring: "ring-green-200 dark:ring-green-800" },
  red: { bg: "bg-red-50 dark:bg-red-950/30", icon: "text-red-500", text: "text-red-700 dark:text-red-300", ring: "ring-red-200 dark:ring-red-800" },
  purple: { bg: "bg-[var(--report-accent-bg)]", icon: "text-[var(--chart-4)]", text: "text-[var(--report-accent)]", ring: "ring-[var(--report-accent-border)]" },
  teal: { bg: "bg-teal-50 dark:bg-teal-950/30", icon: "text-teal-500", text: "text-teal-700 dark:text-teal-300", ring: "ring-teal-200 dark:ring-teal-800" },
};

export function CompactStat({ icon: Icon, label, value, sub, trend, trendUp, trendDown, color }: CompactStatProps) {
  const c = colorMap[color];
  return (
    <Card className={cn("shadow-sm border-0 ring-1", c.ring)}>
      <CardContent className="p-3">
        <div className="flex items-start justify-between">
          <div className="space-y-0.5 min-w-0">
            <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider truncate">{label}</p>
            <p className={cn("text-lg font-bold", c.text)}>{value}</p>
            {sub && <p className="text-[10px] text-muted-foreground truncate">{sub}</p>}
          </div>
          <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center shrink-0", c.bg)}>
            <Icon className={cn("h-4 w-4", c.icon)} />
          </div>
        </div>
        {(trend || trendDown) && (
          <div className="flex items-center gap-1 mt-1.5">
            {trendUp && <TrendingUp className="h-3 w-3 text-green-500" />}
            {trendDown && <TrendingDown className="h-3 w-3 text-red-400" />}
            {trend && <span className="text-[10px] text-muted-foreground">{trend}</span>}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function QuickStat({ label, value, icon: Icon }: { label: string; value: string; icon: React.ElementType }) {
  return (
    <Card className="bg-muted/20 border-dashed">
      <CardContent className="p-3 flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-background border flex items-center justify-center shrink-0">
          <Icon className="h-4 w-4 text-muted-foreground" />
        </div>
        <div className="min-w-0">
          <p className="text-[10px] text-muted-foreground">{label}</p>
          <p className="text-sm font-semibold">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}

export interface FilterSelectProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { label: string; value: string }[];
}

export function FilterSelect({ label, value, onChange, options }: FilterSelectProps) {
  return (
    <div className="space-y-1">
      <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">{label}</label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="h-8 text-xs">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All</SelectItem>
          {options.map((opt) => (
            <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
