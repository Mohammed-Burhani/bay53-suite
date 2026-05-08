"use client";

import { useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "@/lib/hooks/useAuth";
import OTPForm from "@/components/auth/OTPForm";

function VerifyOTPContent() {
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

  return <OTPForm userName={userName} devOtp={devOtp} />;
}

export default function VerifyOTPPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: "var(--bay-teal)" }} />
      </div>
    }>
      <VerifyOTPContent />
    </Suspense>
  );
}
