"use client";

import { useEffect, Suspense } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/lib/hooks/useAuth";
import LoginForm from "@/components/auth/LoginForm";

export default function LoginPage() {
  const session = useSession();
  const router = useRouter();

  useEffect(() => {
    // If already logged in, redirect to dashboard
    if (session) {
      router.replace("/dashboard");
    }
  }, [session, router]);

  // Don't render login form if already authenticated
  if (session) return null;

  // LoginForm reads useSearchParams(); wrap it in Suspense so the route can be
  // prerendered without a CSR bailout error during `next build`.
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-white">
          <div
            className="animate-spin rounded-full h-8 w-8 border-b-2"
            style={{ borderColor: "var(--bay-teal)" }}
          />
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
