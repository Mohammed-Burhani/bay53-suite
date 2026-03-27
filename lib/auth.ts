// ==================== Centralized Auth Management ====================
// Simple, reliable auth with localStorage persistence

import type { AuthSession } from "@/lib/types/auth.types";

const AUTH_KEY = "auth_session";

export const auth = {
  // Get current session
  getSession(): AuthSession | null {
    if (typeof window === "undefined") return null;
    try {
      const raw = localStorage.getItem(AUTH_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  },

  // Get session ID for API calls
  getSessionId(): string | null {
    const session = this.getSession();
    return session?.user?.currentSessionId || null;
  },

  // Store session after login
  setSession(session: AuthSession): void {
    if (typeof window === "undefined") return;
    localStorage.setItem(AUTH_KEY, JSON.stringify(session));
  },

  // Clear session on logout
  clearSession(): void {
    if (typeof window === "undefined") return;
    localStorage.removeItem(AUTH_KEY);
  },

  // Check if user is authenticated
  isAuthenticated(): boolean {
    return !!this.getSessionId();
  },
};
