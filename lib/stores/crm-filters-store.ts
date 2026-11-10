import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { CRMLeadsFilters, CRMProjectsFilters } from "../bay53crm/types";
import { getCurrentFY, getFinancialYears } from "../bay53crm/constants";

interface CRMFiltersState {
  // Leads filters
  leadsFilters: CRMLeadsFilters;
  setLeadsFilters: (filters: Partial<CRMLeadsFilters>) => void;
  resetLeadsFilters: () => void;

  // Projects filters
  projectsFilters: CRMProjectsFilters;
  setProjectsFilters: (filters: Partial<CRMProjectsFilters>) => void;
  resetProjectsFilters: () => void;

  // Dashboard
  selectedFY: string;
  setSelectedFY: (fy: string) => void;
}

const defaultLeadsFilters: CRMLeadsFilters = (() => {
  const fy = getFinancialYears().find((y) => y.value === getCurrentFY());
  return {
    fromDate: fy?.startDate || "",
    toDate: fy?.endDate || "",
    stages: [],
    regions: [],
    customerStates: [],
    assignedTos: [],
    valueMin: "",
    valueMax: "",
  };
})();

const defaultProjectsFilters: CRMProjectsFilters = {
  assignedTo: "",
  status: "",
  archived: false,
  search: "",
};

export const useCRMFiltersStore = create<CRMFiltersState>()(
  persist(
    (set) => ({
      leadsFilters: defaultLeadsFilters,
      setLeadsFilters: (filters) =>
        set((state) => ({
          leadsFilters: { ...state.leadsFilters, ...filters },
        })),
      resetLeadsFilters: () => set({ leadsFilters: defaultLeadsFilters }),

      projectsFilters: defaultProjectsFilters,
      setProjectsFilters: (filters) =>
        set((state) => ({
          projectsFilters: { ...state.projectsFilters, ...filters },
        })),
      resetProjectsFilters: () => set({ projectsFilters: defaultProjectsFilters }),

      selectedFY: getCurrentFY(),
      setSelectedFY: (fy) => set({ selectedFY: fy }),
    }),
    {
      name: "crm-filters-storage",
      // v2: the leads filter shape changed with the API integration; older saved filters are dropped.
      version: 2,
      migrate: (persisted) => ({ ...(persisted as object), leadsFilters: defaultLeadsFilters }) as CRMFiltersState,
    }
  )
);
