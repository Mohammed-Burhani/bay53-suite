"use client";

import { useEffect } from "react";
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

  return (
    <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 p-4">
      <LoginForm />
    </div>
  );
}
