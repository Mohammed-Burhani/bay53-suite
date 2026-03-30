"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { auth } from "@/lib/auth";
import { useSessionChecker } from "@/lib/hooks/useSessionChecker";

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  
  // Periodically check session validity
  useSessionChecker();

  useEffect(() => {
    if (!auth.isAuthenticated()) {
      router.replace("/login");
    }
  }, [router]);

  if (!auth.isAuthenticated()) return null;

  return <>{children}</>;
}
