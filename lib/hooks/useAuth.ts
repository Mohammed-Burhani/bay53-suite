"use client";

// ==================== Auth Hook ====================
// Manages auth state using TanStack Query mutation + sessionStorage
// No useEffect needed — mutation callbacks handle side effects

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { authService } from "@/lib/api/auth.service";
import type { AuthSession, LoginPayload } from "@/lib/types/auth.types";

const AUTH_SESSION_KEY = "auth_session";
const AUTH_QUERY_KEY = ["auth", "session"] as const;

// Read session from sessionStorage (synchronous, no API call)
export function getStoredSession(): AuthSession | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(AUTH_SESSION_KEY);
    return raw ? (JSON.parse(raw) as AuthSession) : null;
  } catch {
    return null;
  }
}

function storeSession(session: AuthSession) {
  sessionStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(session));
}

function clearSession() {
  sessionStorage.removeItem(AUTH_SESSION_KEY);
}

export function useLogin() {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: (payload: LoginPayload) => authService.login(payload),
    onSuccess: (data) => {
      const session: AuthSession = {
        user: data.user,
        company: data.company,
        roles: data.roles,
        rights: data.rights,
      };
      storeSession(session);
      // Seed the query cache so any component reading auth session gets it instantly
      queryClient.setQueryData(AUTH_QUERY_KEY, session);
      router.push("/dashboard");
    },
  });
}

export function useLogout() {
  const queryClient = useQueryClient();
  const router = useRouter();

  return () => {
    clearSession();
    queryClient.removeQueries({ queryKey: AUTH_QUERY_KEY });
    router.push("/login");
  };
}

export function useSession(): AuthSession | null {
  // Reads from cache first (set on login), falls back to sessionStorage
  // This is intentionally NOT a useQuery to avoid unnecessary network calls
  const queryClient = useQueryClient();
  const cached = queryClient.getQueryData<AuthSession>(AUTH_QUERY_KEY);
  return cached ?? getStoredSession();
}
