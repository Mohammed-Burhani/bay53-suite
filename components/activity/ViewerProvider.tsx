"use client";

import { createContext, useCallback, useContext, useMemo } from "react";
import type { ActivityUser, Viewer } from "@/lib/activity-types";
import { PERSONAS, USERS_BY_ID } from "@/lib/mock/users";
import { useHydrated, useStored } from "./useStored";

const PERSONA_KEY = "bay53.activity.persona";
const LAST_USER_KEY = "bay53.activity.last-user";
const DEFAULT_USER = "u_acc1";

interface ViewerContext {
  viewer: Viewer;
  user: ActivityUser;
  isAdmin: boolean;
  /** False until the saved persona has been read, so no role flashes before it. */
  ready: boolean;
  personas: ActivityUser[];
  setUserId: (id: string) => void;
  switchRole: (role: "admin" | "user") => void;
}

const Ctx = createContext<ViewerContext | null>(null);

const validPersona = (id: string, fallback: string) =>
  PERSONAS.some((p) => p.id === id) ? id : fallback;

export function ViewerProvider({ children }: { children: React.ReactNode }) {
  const ready = useHydrated();
  const [storedId, storeId] = useStored(PERSONA_KEY, "u_admin");
  const [storedLast, storeLast] = useStored(LAST_USER_KEY, DEFAULT_USER);
  const userId = validPersona(storedId, "u_admin");
  const lastUser = validPersona(storedLast, DEFAULT_USER);

  const setUserId = useCallback(
    (id: string) => {
      if (!PERSONAS.some((p) => p.id === id)) return;
      storeId(id);
      if (USERS_BY_ID[id].role !== "admin") storeLast(id);
    },
    [storeId, storeLast],
  );

  const switchRole = useCallback(
    (role: "admin" | "user") => setUserId(role === "admin" ? "u_admin" : lastUser),
    [lastUser, setUserId],
  );

  const value = useMemo<ViewerContext>(() => {
    const user = USERS_BY_ID[userId];
    return {
      viewer: { userId },
      user,
      isAdmin: user.role === "admin",
      ready,
      personas: PERSONAS,
      setUserId,
      switchRole,
    };
  }, [userId, ready, setUserId, switchRole]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useViewer(): ViewerContext {
  const v = useContext(Ctx);
  if (!v) throw new Error("useViewer must be used inside ViewerProvider");
  return v;
}
