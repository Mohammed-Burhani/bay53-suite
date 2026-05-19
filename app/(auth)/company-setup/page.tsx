"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/lib/hooks/useAuth";
import CompanySetupForm from "@/components/auth/CompanySetupForm";

export default function CompanySetupPage() {
  const session = useSession();
  const router = useRouter();

  useEffect(() => {
    // If already has company setup, redirect to dashboard
    if (session?.company) {
      router.replace("/dashboard");
    }
  }, [session, router]);

  return <CompanySetupForm />;
}
