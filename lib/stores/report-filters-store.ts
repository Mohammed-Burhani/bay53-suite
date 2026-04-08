import { create } from "zustand";
import { persist } from "zustand/middleware";

export type DateFilterType = "today" | "current_month" | "range" | "monthly" | "quarterly" | "half_yearly" | "yearly" | "none";

interface DateFilterState {
  dateType: DateFilterType;
  selectedMonth: string;
  selectedQuarter: string;
  selectedHalfYear: string;
  selectedYear: string;
  fromDate: string | null;
  toDate: string | null;
}

interface LedgerOutstandingFilters extends DateFilterState {
  selectedLedgerIds: number[];
  detailed: boolean;
  selectedLedgers: Array<{ ledger_id: number; name: string; group: string | null }>;
}

interface LedgerBalancesFilters extends DateFilterState {
  selectedLedgerIds: number[];
  selectedGroupId: string;
  selectedLedgers: Array<{ ledger_id: number; name: string; group: string | null }>;
}

interface LedgerRegisterFilters extends DateFilterState {
  selectedLedgerIds: number[];
  selectedLedgerName: string;
  runningBalance: boolean;
  openingBalance: boolean;
  billDetails: boolean;
  bankDetails: boolean;
  selectedLedgers: Array<{ ledger_id: number; name: string; group: string | null }>;
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
        selectedLedgers: [],
        dateType: "current_month",
        selectedMonth: "",
        selectedQuarter: "",
        selectedHalfYear: "",
        selectedYear: "",
        fromDate: null,
        toDate: null,
      },
      ledgerBalances: {
        selectedLedgerIds: [],
        selectedGroupId: "",
        selectedLedgers: [],
        dateType: "current_month",
        selectedMonth: "",
        selectedQuarter: "",
        selectedHalfYear: "",
        selectedYear: "",
        fromDate: null,
        toDate: null,
      },
      ledgerRegister: {
        selectedLedgerIds: [],
        selectedLedgerName: "",
        runningBalance: false,
        openingBalance: false,
        billDetails: false,
        bankDetails: false,
        selectedLedgers: [],
        dateType: "current_month",
        selectedMonth: "",
        selectedQuarter: "",
        selectedHalfYear: "",
        selectedYear: "",
        fromDate: null,
        toDate: null,
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
