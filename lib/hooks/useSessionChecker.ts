"use client";

// ==================== Session Checker Hook ====================
// Periodically validates session and handles expiration

import { useEffect, useRef } from "react";
import { authService } from "@/lib/api/auth.service";
import { auth } from "@/lib/auth";

const CHECK_INTERVAL = 5 * 60 * 1000; // Check every 5 minutes

export function useSessionChecker() {
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

        // Any other response means session is invalid — the API client
        // (client.ts) already handles "Invalid Session or Session Expired"
        // by clearing the session and redirecting to /login, so nothing
        // else is needed here.
        console.warn("Session check returned unexpected response:", response);
      } catch (error) {
        // Network errors (ERR_HTTP2_PROTOCOL_ERROR, server down, etc.)
        // should NOT log the user out. The API client already handles
        // true session expiration. Just log and retry in 5 min.
        console.warn("Session check failed (will retry in 5 min):", error);
      }
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
  }, []);
}
