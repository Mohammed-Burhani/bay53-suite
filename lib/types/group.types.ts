// ==================== Group Types ====================

export interface Group {
  id: number;
  name: string;
  parent: string | null;
  parentId: number;
  nature: string;
  isCr: string;
  modifiedDate: string;
}

export interface GroupSearchPayload {
  sessionId: string;
  pageSize: number;
  pageNumber: number;
  isSync: boolean;
  lastModifiedDate: string;
  name: string | null;
  nature: number | null;
}

export interface GroupSearchResponse {
  list: Group[];
}

export interface GroupCreateUpdatePayload {
  id: number;
  sessionId: string;
  name: string;
  parentId: number;
}

export interface GroupGetByIdPayload {
  id: number;
  sessionId: string;
}

export interface GroupDeletePayload {
  id: number;
  sessionId: string;
}

export const GROUP_NATURE_OPTIONS = [
  { value: 0, label: "All Natures" },
  { value: 1, label: "Assets" },
  { value: 2, label: "Liabilities" },
  { value: 3, label: "Income" },
  { value: 4, label: "Expenses" },
] as const;
