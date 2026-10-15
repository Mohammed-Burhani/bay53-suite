import type { ActivityUser } from "../activity-types";

export const ORG_ID = "org_bay53_demo";

export const USERS: ActivityUser[] = [
  { id: "u_admin", name: "Ananya Iyer", role: "admin" },
  { id: "u_acc1", name: "Rohit Menon", role: "accountant" },
  { id: "u_acc2", name: "Farah Sheikh", role: "accountant" },
  { id: "u_sal1", name: "Karan Bhatia", role: "sales" },
  { id: "u_sal2", name: "Meera Pillai", role: "sales" },
  { id: "u_system", name: "Bay53 System", role: "system" },
];

export const USERS_BY_ID: Record<string, ActivityUser> = Object.fromEntries(
  USERS.map((u) => [u.id, u]),
);

/** Humans who can log in. Replaced by the Supabase auth session later. */
export const PERSONAS = USERS.filter((u) => u.role !== "system");
