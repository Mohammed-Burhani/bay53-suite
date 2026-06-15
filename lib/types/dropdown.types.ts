// ==================== Dropdown Types ====================

export interface DropdownPayload {
  id: number;
  sessionId: string;
  table: number;
  type: number;
}

export interface DropdownItem {
  id: number;
  name: string;
  field1: string | null;
  field2: string | null;
  field3: string | null;
}
