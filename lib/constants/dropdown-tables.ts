// `table` ids for POST /Common/Dropdown. The backend does not document them, so
// only the ones already in use are filled in. Set the others to enable the
// matching dropdown in the Ledger / Item forms — until then those fields are
// hidden and new records are saved with the default (0).
export const DROPDOWN_TABLES = {
  parentGroups: 10,
  state: null as number | null,
  country: null as number | null,
  unit: null as number | null,
} as const;
