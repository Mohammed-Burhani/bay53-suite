"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/lib/hooks/useAuth";
import SignupForm from "@/components/auth/SignupForm";

export default function SignupPage() {
  const session = useSession();
  const router = useRouter();

  useEffect(() => {
    // If already logged in, redirect to dashboard
    if (session) {
      router.replace("/erp/dashboard");
    }
  }, [session, router]);

  // Don't render signup form if already authenticated
  if (session) return null;

  return <SignupForm />;
}
