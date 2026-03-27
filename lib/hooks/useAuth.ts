"use client";

// ==================== Auth Hook ====================
// Simple auth management with React Query

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { authService } from "@/lib/api/auth.service";
import { auth } from "@/lib/auth";
import type { AuthSession, LoginPayload } from "@/lib/types/auth.types";

export function useSession(): AuthSession | null {
  return auth.getSession();
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
      
      auth.setSession(session);
      queryClient.setQueryData(["auth", "session"], session);
      router.push("/dashboard");
    },
  });
}

export function useLogout() {
  const queryClient = useQueryClient();
  const router = useRouter();

  return () => {
    auth.clearSession();
    queryClient.clear();
    router.push("/login");
  };
}
