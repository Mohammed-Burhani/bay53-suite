// ==================== Reports Service ====================
// All report-related API calls

import { apiClient } from "./client";
import type {
  Ledger,
  LedgerSearchPayload,
  LedgerSearchResponse,
  LedgerOutstandingPayload,
  LedgerOutstandingItem,
  LedgerOutstandingSummaryPayload,
  LedgerOutstandingSummaryItem,
  ItemRegisterPayload,
  ItemRegisterItem,
  LedgerRegisterPayload,
  LedgerRegisterItem,
  Group,
  GroupSearchPayload,
  StockPlace,
  StockPlaceSearchPayload,
  Item,
  ItemSearchPayload,
  CurrentStockPayload,
  CurrentStockItem,
  InventoryReportPayload,
  InventoryReportItem,
  InvoiceType,
  InvoiceTypeSearchPayload,
  PendingItemsPayload,
  PendingItemsItem,
} from "@/lib/types/reports.types";

export const reportsService = {
  searchLedgers: async (payload: LedgerSearchPayload): Promise<Ledger[]> => {
    const response = await apiClient.post<LedgerSearchResponse>("/Ledger/Search", payload);
    return response.list || [];
  },

  searchGroups: async (payload: GroupSearchPayload): Promise<Group[]> => {
    const response = await apiClient.post<{ list: Group[] }>("/Group/Search", payload);
    return response.list || [];
  },

  getLedgerOutstanding: (payload: LedgerOutstandingPayload) =>
    apiClient.post<LedgerOutstandingItem[]>("/Report/LedgerOutstanding", payload),

  getLedgerOutstandingSummary: (payload: LedgerOutstandingSummaryPayload) =>
    apiClient.post<LedgerOutstandingSummaryItem[]>("/Report/LedgerOutstandingSummary", payload),

  getItemRegister: (payload: ItemRegisterPayload) =>
    apiClient.post<ItemRegisterItem[]>("/Report/ItemRegister", payload),

  getLedgerRegister: (payload: LedgerRegisterPayload) =>
    apiClient.post<{ list: LedgerRegisterItem[] }>("/Report/LedgerRegister", payload),

  // Current Stock APIs
  searchStockPlaces: async (payload: StockPlaceSearchPayload): Promise<StockPlace[]> => {
    const response = await apiClient.post<{ list: StockPlace[] } | StockPlace[]>("/StockPlace/Search", payload);
    return Array.isArray(response) ? response : (response.list || []);
  },

  searchItems: async (payload: ItemSearchPayload): Promise<Item[]> => {
    const response = await apiClient.post<{ list: Item[] } | Item[]>("/Item/Search", payload);
    return Array.isArray(response) ? response : (response.list || []);
  },

  getCurrentStock: (payload: CurrentStockPayload) =>
    apiClient.post<CurrentStockItem[]>("/Report/CurrentStock", payload),

  // Inventory Report API
  getInventoryReport: (payload: InventoryReportPayload) =>
    apiClient.post<InventoryReportItem[]>("/Report/InventoryReport", payload),

  // Invoice Type API
  searchInvoiceTypes: async (payload: InvoiceTypeSearchPayload): Promise<InvoiceType[]> => {
    return apiClient.post<InvoiceType[]>("/InvoiceType/Search", payload);
  },

  // Pending Items API
  getPendingItems: (payload: PendingItemsPayload) =>
    apiClient.post<PendingItemsItem[]>("/Report/PendingItems", payload),
};
