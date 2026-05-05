"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "@/lib/hooks/useAuth";
import OTPForm from "@/components/auth/OTPForm";

export default function VerifyOTPPage() {
  const session = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const userName = searchParams.get("userName");
  const devOtp = searchParams.get("otp"); // OTP from API in dev mode

  useEffect(() => {
    // If already logged in, redirect to dashboard
    if (session) {
      router.replace("/dashboard");
    }
    // If no userName param, redirect to login
    if (!userName) {
      router.replace("/login");
    }
  }, [session, userName, router]);

  // Don't render if already authenticated or no userName
  if (session || !userName) return null;

  return (
    <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 p-4">
      <OTPForm userName={userName} devOtp={devOtp} />
    </div>
  );
}
