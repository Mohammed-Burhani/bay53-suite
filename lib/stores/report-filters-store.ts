import { create } from "zustand";
import { persist } from "zustand/middleware";

export type DateFilterType = "today" | "current_month" | "range" | "monthly" | "quarterly" | "half_yearly" | "yearly" | "none";

interface DateFilterState {
  dateType: DateFilterType;
  selectedMonth: string;
  selectedQuarter: string;
  selectedHalfYear: string;
  selectedYear: string;
  fromDate: string;
  toDate: string;
}

interface LedgerOutstandingFilters extends DateFilterState {
  selectedLedgerIds: number[];
  detailed: boolean;
}

interface LedgerBalancesFilters extends DateFilterState {
  selectedLedgerIds: number[];
  selectedGroupId: string;
}

interface LedgerRegisterFilters extends DateFilterState {
  selectedLedgerIds: number[];
  selectedLedgerName: string;
  runningBalance: boolean;
  openingBalance: boolean;
  billDetails: boolean;
  bankDetails: boolean;
}

interface ReportFiltersState {
  ledgerOutstanding: LedgerOutstandingFilters;
  ledgerBalances: LedgerBalancesFilters;
  ledgerRegister: LedgerRegisterFilters;
  
  setLedgerOutstandingFilters: (filters: Partial<LedgerOutstandingFilters>) => void;
  setLedgerBalancesFilters: (filters: Partial<LedgerBalancesFilters>) => void;
  setLedgerRegisterFilters: (filters: Partial<LedgerRegisterFilters>) => void;
}

export const useReportFiltersStore = create<ReportFiltersState>()(
  persist(
    (set) => ({
      ledgerOutstanding: {
        selectedLedgerIds: [],
        detailed: false,
        dateType: "current_month",
        selectedMonth: "",
        selectedQuarter: "",
        selectedHalfYear: "",
        selectedYear: "",
        fromDate: "",
        toDate: "",
      },
      ledgerBalances: {
        selectedLedgerIds: [],
        selectedGroupId: "",
        dateType: "current_month",
        selectedMonth: "",
        selectedQuarter: "",
        selectedHalfYear: "",
        selectedYear: "",
        fromDate: "",
        toDate: "",
      },
      ledgerRegister: {
        selectedLedgerIds: [],
        selectedLedgerName: "",
        runningBalance: true,
        openingBalance: true,
        billDetails: true,
        bankDetails: true,
        dateType: "current_month",
        selectedMonth: "",
        selectedQuarter: "",
        selectedHalfYear: "",
        selectedYear: "",
        fromDate: "",
        toDate: "",
      },
      
      setLedgerOutstandingFilters: (filters) =>
        set((state) => ({
          ledgerOutstanding: { ...state.ledgerOutstanding, ...filters },
        })),
      
      setLedgerBalancesFilters: (filters) =>
        set((state) => ({
          ledgerBalances: { ...state.ledgerBalances, ...filters },
        })),
      
      setLedgerRegisterFilters: (filters) =>
        set((state) => ({
          ledgerRegister: { ...state.ledgerRegister, ...filters },
        })),
    }),
    {
      name: "report-filters-storage",
    }
  )
);
