"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { auth } from "@/lib/auth";
import { Loader2 } from "lucide-react";

export default function AuthSuccessPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const sessionData = searchParams.get("session");
    const isNew = searchParams.get("isNew") === "true";

    if (sessionData) {
      try {
        const session = JSON.parse(decodeURIComponent(sessionData));
        auth.setSession(session);
        
        // Redirect based on whether user is new
        if (isNew) {
          router.push("/onboarding");
        } else {
          router.push("/dashboard");
        }
      } catch (err) {
        console.error("Failed to parse session:", err);
        router.push("/login?error=session_failed");
      }
    } else {
      router.push("/login?error=no_session");
    }
  }, [searchParams, router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center space-y-4">
        <Loader2 className="w-8 h-8 animate-spin mx-auto text-gray-600" />
        <p className="text-gray-600">Completing sign in...</p>
      </div>
    </div>
  );
}
