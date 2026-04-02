import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface Tab {
  id: string;
  path: string;
  title: string;
  icon?: string;
  isActive: boolean;
}

interface TabStore {
  tabs: Tab[];
  activeTabId: string | null;
  maxTabs: number;
  
  // Actions
  addTab: (tab: Omit<Tab, "isActive">) => void;
  removeTab: (tabId: string) => void;
  setActiveTab: (tabId: string) => void;
  updateTab: (tabId: string, updates: Partial<Tab>) => void;
  clearAllTabs: () => void;
  reorderTabs: (fromIndex: number, toIndex: number) => void;
}

export const useTabStore = create<TabStore>()(
  persist(
    (set, get) => ({
      tabs: [],
      activeTabId: null,
      maxTabs: 20,

      addTab: (newTab) => {
        const { tabs, maxTabs, activeTabId } = get();
        
        // Check if tab already exists
        const existingTab = tabs.find((t) => t.path === newTab.path);
        if (existingTab) {
          set({
            tabs: tabs.map((t) => ({
              ...t,
              isActive: t.id === existingTab.id,
            })),
            activeTabId: existingTab.id,
          });
          return;
        }

        // Remove oldest tab if at max capacity
        let updatedTabs = [...tabs];
        if (tabs.length >= maxTabs) {
          // Remove the first non-active tab
          const oldestInactiveIndex = updatedTabs.findIndex((t) => t.id !== activeTabId);
          if (oldestInactiveIndex !== -1) {
            updatedTabs.splice(oldestInactiveIndex, 1);
          }
        }

        // Add new tab and set as active
        const tabWithActive = { ...newTab, isActive: true };
        updatedTabs = updatedTabs.map((t) => ({ ...t, isActive: false }));
        updatedTabs.push(tabWithActive);

        set({
          tabs: updatedTabs,
          activeTabId: newTab.id,
        });
      },

      removeTab: (tabId) => {
        const { tabs, activeTabId } = get();
        const tabIndex = tabs.findIndex((t) => t.id === tabId);
        
        if (tabIndex === -1) return;

        const newTabs = tabs.filter((t) => t.id !== tabId);
        
        // If removing active tab, activate adjacent tab
        let newActiveTabId = activeTabId;
        if (tabId === activeTabId && newTabs.length > 0) {
          const newActiveIndex = Math.min(tabIndex, newTabs.length - 1);
          newActiveTabId = newTabs[newActiveIndex].id;
          newTabs[newActiveIndex].isActive = true;
        }

        set({
          tabs: newTabs,
          activeTabId: newTabs.length > 0 ? newActiveTabId : null,
        });
      },

      setActiveTab: (tabId) => {
        set((state) => ({
          tabs: state.tabs.map((t) => ({
            ...t,
            isActive: t.id === tabId,
          })),
          activeTabId: tabId,
        }));
      },

      updateTab: (tabId, updates) => {
        set((state) => ({
          tabs: state.tabs.map((t) =>
            t.id === tabId ? { ...t, ...updates } : t
          ),
        }));
      },

      clearAllTabs: () => {
        set({ tabs: [], activeTabId: null });
      },

      reorderTabs: (fromIndex, toIndex) => {
        set((state) => {
          const newTabs = [...state.tabs];
          const [movedTab] = newTabs.splice(fromIndex, 1);
          newTabs.splice(toIndex, 0, movedTab);
          return { tabs: newTabs };
        });
      },
    }),
    {
      name: "tab-storage",
      partialize: (state) => ({
        tabs: state.tabs,
        activeTabId: state.activeTabId,
      }),
    }
  )
);
