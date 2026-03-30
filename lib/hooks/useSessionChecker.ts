"use client";

// ==================== Session Checker Hook ====================
// Periodically validates session and handles expiration

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { authService } from "@/lib/api/auth.service";
import { auth } from "@/lib/auth";

const CHECK_INTERVAL = 5 * 60 * 1000; // Check every 5 minutes

export function useSessionChecker() {
  const router = useRouter();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const checkSession = async () => {
      const session = auth.getSession();
      
      if (!session?.user?.user_ID || !session?.user?.currentSessionId) {
        return;
      }

      try {
        const response = await authService.checkSession({
          id: session.user.user_ID,
          sessionId: session.user.currentSessionId,
        });

        // Session is valid (200 status with "Session is valid" message)
        if (response.message === "Session is valid") {
          return;
        }

        // Any other response means session is invalid
        handleSessionExpired();
      } catch (error) {
        // API returns 400 with "Invalid Session or Session Expired" text
        // or any other error - treat as session expired
        handleSessionExpired();
      }
    };

    const handleSessionExpired = () => {
      auth.clearSession();
      toast.error("Session Expired", {
        description: "Your session has expired. Please login again.",
      });
      router.push("/login");
    };

    // Initial check
    checkSession();

    // Set up periodic checks
    intervalRef.current = setInterval(checkSession, CHECK_INTERVAL);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [router]);
}
