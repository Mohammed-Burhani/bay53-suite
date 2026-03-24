"use client";

// AuthGuard — wraps protected routes, redirects to /login if no session
// Uses query cache (seeded from sessionStorage in QueryProvider) — zero extra API calls

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/lib/hooks/useAuth";

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const session = useSession();
  const router = useRouter();

  useEffect(() => {
    if (!session) {
      router.replace("/login");
    }
  }, [session, router]);

  if (!session) return null;

  return <>{children}</>;
}
