"use client";

import { useEffect } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { format, startOfMonth, endOfMonth } from "date-fns";

export type DateFilterType = "today" | "current_month" | "range" | "monthly" | "quarterly" | "half_yearly" | "yearly" | "none";

interface DateRangeFilterProps {
  dateType: DateFilterType;
  selectedMonth: string;
  selectedQuarter: string;
  selectedHalfYear: string;
  selectedYear: string;
  fromDate: string | null;
  toDate: string | null;
  onDateTypeChange: (type: DateFilterType) => void;
  onSelectedMonthChange: (month: string) => void;
  onSelectedQuarterChange: (quarter: string) => void;
  onSelectedHalfYearChange: (halfYear: string) => void;
  onSelectedYearChange: (year: string) => void;
  onFromDateChange: (date: string) => void;
  onToDateChange: (date: string) => void;
  onDateChange: (fromDate: string | null, toDate: string | null) => void;
  label?: string;
  className?: string;
  financialYearStart?: number;
}

export function DateRangeFilter({
  dateType,
  selectedMonth,
  selectedQuarter,
  selectedHalfYear,
  selectedYear,
  fromDate,
  toDate,
  onDateTypeChange,
  onSelectedMonthChange,
  onSelectedQuarterChange,
  onSelectedHalfYearChange,
  onSelectedYearChange,
  onFromDateChange,
  onToDateChange,
  onDateChange,
  label = "Date",
  className = "",
  financialYearStart = 4,
}: DateRangeFilterProps) {

  // Get current financial year
  const getCurrentFinancialYear = () => {
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();
    
    if (currentMonth >= financialYearStart) {
      return { start: currentYear, end: currentYear + 1 };
    } else {
      return { start: currentYear - 1, end: currentYear };
    }
  };

  const currentFY = getCurrentFinancialYear();

  // Generate financial years (current + 2 previous)
  const financialYears = [
    { start: currentFY.start, end: currentFY.end },
    { start: currentFY.start - 1, end: currentFY.end - 1 },
    { start: currentFY.start - 2, end: currentFY.end - 2 },
  ];

  // Generate months for the selected financial year
  const getMonthsForFY = (fyStart: number) => {
    const months = [];
    for (let i = 0; i < 12; i++) {
      const monthIndex = (financialYearStart - 1 + i) % 12;
      const year = fyStart + (financialYearStart - 1 + i >= 12 ? 1 : 0);
      const monthDate = new Date(year, monthIndex, 1);
      months.push({
        value: format(monthDate, "yyyy-MM"),
        label: format(monthDate, "MMMM yyyy"),
      });
    }
    return months;
  };

  // Get quarters for financial year
  const getQuartersForFY = () => {
    return [
      { value: "Q1", label: "Quarter 1", months: [0, 1, 2] },
      { value: "Q2", label: "Quarter 2", months: [3, 4, 5] },
      { value: "Q3", label: "Quarter 3", months: [6, 7, 8] },
      { value: "Q4", label: "Quarter 4", months: [9, 10, 11] },
    ];
  };

  // Get half years for financial year
  const getHalfYearsForFY = () => {
    return [
      { value: "H1", label: "Half Year 1 (Apr-Sep)", months: [0, 1, 2, 3, 4, 5] },
      { value: "H2", label: "Half Year 2 (Oct-Mar)", months: [6, 7, 8, 9, 10, 11] },
    ];
  };

  // Calculate date range based on selection
  const calculateDateRange = () => {
    // Return null for both dates when "none" is selected
    if (dateType === "none") {
      return {
        from: null,
        to: null,
      };
    }

    const now = new Date();
    let from: Date | null = null;
    let to: Date | null = null;

    switch (dateType) {
      case "today":
        from = new Date(now.setHours(0, 0, 0, 0));
        to = new Date();
        break;

      case "current_month":
        from = startOfMonth(now);
        to = endOfMonth(now);
        break;

      case "monthly":
        if (selectedMonth) {
          const [year, month] = selectedMonth.split("-").map(Number);
          from = new Date(year, month - 1, 1);
          to = endOfMonth(from);
        } else {
          from = startOfMonth(now);
          to = endOfMonth(now);
        }
        break;

      case "quarterly":
        if (selectedQuarter && selectedYear) {
          const fyStart = parseInt(selectedYear);
          const quarterIndex = parseInt(selectedQuarter.replace("Q", "")) - 1;
          const startMonthIndex = (financialYearStart - 1 + quarterIndex * 3) % 12;
          const startYear = fyStart + Math.floor((financialYearStart - 1 + quarterIndex * 3) / 12);
          
          from = new Date(startYear, startMonthIndex, 1);
          to = endOfMonth(new Date(startYear, startMonthIndex + 2, 1));
        } else {
          from = startOfMonth(now);
          to = endOfMonth(now);
        }
        break;

      case "half_yearly":
        if (selectedHalfYear && selectedYear) {
          const fyStart = parseInt(selectedYear);
          const isH2 = selectedHalfYear === "H2";
          const startMonthIndex = isH2 ? (financialYearStart - 1 + 6) % 12 : financialYearStart - 1;
          const startYear = fyStart + (isH2 && financialYearStart > 6 ? 1 : 0);
          
          from = new Date(startYear, startMonthIndex, 1);
          to = endOfMonth(new Date(startYear, startMonthIndex + 5, 1));
        } else {
          from = startOfMonth(now);
          to = endOfMonth(now);
        }
        break;

      case "yearly":
        if (selectedYear) {
          const fyStart = parseInt(selectedYear);
          from = new Date(fyStart, financialYearStart - 1, 1);
          to = endOfMonth(new Date(fyStart + 1, financialYearStart - 2, 1));
        } else {
          from = new Date(currentFY.start, financialYearStart - 1, 1);
          to = endOfMonth(new Date(currentFY.end, financialYearStart - 2, 1));
        }
        break;

      case "range":
        if (fromDate && toDate) {
          from = new Date(fromDate);
          to = new Date(toDate);
        } else {
          // If range is selected but dates are not provided, return null
          return {
            from: null,
            to: null,
          };
        }
        break;

      default:
        from = new Date(currentFY.start, financialYearStart - 1, 1);
        to = new Date();
        break;
    }

    // Only format if dates are not null and are valid
    if (!from || !to || isNaN(from.getTime()) || isNaN(to.getTime())) {
      return {
        from: null,
        to: null,
      };
    }

    return {
      from: format(from, "dd/MM/yyyy HH:mm:ss"),
      to: format(to, "dd/MM/yyyy HH:mm:ss"),
    };
  };

  // Update dates when selection changes
  useEffect(() => {
    const { from, to } = calculateDateRange();
    onDateChange(from, to);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dateType, selectedMonth, selectedQuarter, selectedHalfYear, selectedYear]);

  // Update dates when range inputs change (only for range mode)
  useEffect(() => {
    if (dateType === "range" && fromDate && toDate) {
      const { from, to } = calculateDateRange();
      onDateChange(from, to);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fromDate, toDate]);

  return (
    <div className={`space-y-3 ${className}`}>
      <div className="space-y-1.5">
        <Label className="text-xs font-medium flex items-center gap-1.5 text-muted-foreground">
          <span className="w-1.5 h-1.5 rounded-full bg-[var(--report-accent)]" />
          {label}
        </Label>
        <Select value={dateType} onValueChange={onDateTypeChange}>
          <SelectTrigger className="h-9 w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="today">Today</SelectItem>
            <SelectItem value="current_month">Current Month</SelectItem>
            <SelectItem value="range">Range</SelectItem>
            <SelectItem value="monthly">Monthly</SelectItem>
            <SelectItem value="quarterly">Quarterly</SelectItem>
            <SelectItem value="half_yearly">Half Yearly</SelectItem>
            <SelectItem value="yearly">Yearly</SelectItem>
            <SelectItem value="none">None</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Monthly Selection */}
      {dateType === "monthly" && (
        <div className="space-y-1.5">
          <Label className="text-xs font-medium text-muted-foreground">Select Month</Label>
          <Select value={selectedMonth} onValueChange={onSelectedMonthChange}>
            <SelectTrigger className="h-9 w-full">
              <SelectValue placeholder="Select month" />
            </SelectTrigger>
            <SelectContent>
              {getMonthsForFY(currentFY.start).map((month) => (
                <SelectItem key={month.value} value={month.value}>
                  {month.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Quarterly Selection */}
      {dateType === "quarterly" && (
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-muted-foreground">Financial Year</Label>
            <Select value={selectedYear} onValueChange={onSelectedYearChange}>
              <SelectTrigger className="h-9 w-full">
                <SelectValue placeholder="Select FY" />
              </SelectTrigger>
              <SelectContent>
                {financialYears.map((fy) => (
                  <SelectItem key={fy.start} value={String(fy.start)}>
                    FY {fy.start}-{String(fy.end).slice(-2)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-muted-foreground">Quarter</Label>
            <Select value={selectedQuarter} onValueChange={onSelectedQuarterChange}>
              <SelectTrigger className="h-9 w-full">
                <SelectValue placeholder="Select quarter" />
              </SelectTrigger>
              <SelectContent>
                {getQuartersForFY().map((quarter) => (
                  <SelectItem key={quarter.value} value={quarter.value}>
                    {quarter.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      )}

      {/* Half Yearly Selection */}
      {dateType === "half_yearly" && (
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-muted-foreground">Financial Year</Label>
            <Select value={selectedYear} onValueChange={onSelectedYearChange}>
              <SelectTrigger className="h-9 w-full">
                <SelectValue placeholder="Select FY" />
              </SelectTrigger>
              <SelectContent>
                {financialYears.map((fy) => (
                  <SelectItem key={fy.start} value={String(fy.start)}>
                    FY {fy.start}-{String(fy.end).slice(-2)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-muted-foreground">Half Year</Label>
            <Select value={selectedHalfYear} onValueChange={onSelectedHalfYearChange}>
              <SelectTrigger className="h-9 w-full">
                <SelectValue placeholder="Select half" />
              </SelectTrigger>
              <SelectContent>
                {getHalfYearsForFY().map((half) => (
                  <SelectItem key={half.value} value={half.value}>
                    {half.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      )}

      {/* Yearly Selection */}
      {dateType === "yearly" && (
        <div className="space-y-1.5">
          <Label className="text-xs font-medium text-muted-foreground">Financial Year</Label>
          <Select value={selectedYear} onValueChange={onSelectedYearChange}>
            <SelectTrigger className="h-9 w-full">
              <SelectValue placeholder="Select FY" />
            </SelectTrigger>
            <SelectContent>
              {financialYears.map((fy) => (
                <SelectItem key={fy.start} value={String(fy.start)}>
                  FY {fy.start}-{String(fy.end).slice(-2)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Custom Range */}
      {dateType === "range" && (
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-muted-foreground">From Date</Label>
            <Input
              type="date"
              className="h-9"
              value={fromDate || ""}
              onChange={(e) => onFromDateChange(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-muted-foreground">To Date</Label>
            <Input
              type="date"
              className="h-9"
              value={toDate || ""}
              onChange={(e) => onToDateChange(e.target.value)}
            />
          </div>
        </div>
      )}
    </div>
  );
}
