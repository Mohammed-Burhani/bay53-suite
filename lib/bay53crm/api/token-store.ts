// ==================== CRM Token Store ====================
// The CRM API issues its own JWT (separate from the ERP session in lib/auth.ts).

const TOKEN_KEY = "crm_jwt";
const PROFILE_KEY = "crm_profile";

/** Who is signed in, for display only (the sidebar). Not a secret: the token is what grants access. */
export interface CrmProfile {
  fullName: string;
  userName: string;
  role: string;
}

export const crmProfileStore = {
  get(): CrmProfile | null {
    if (typeof window === "undefined") return null;
    try {
      const raw = localStorage.getItem(PROFILE_KEY);
      return raw ? (JSON.parse(raw) as CrmProfile) : null;
    } catch {
      return null;
    }
  },

  set(profile: CrmProfile): void {
    if (typeof window === "undefined") return;
    try {
      localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
    } catch {
      // The profile is only for display; the sign-in still works without it.
    }
  },
};

const listeners = new Set<() => void>();
const notify = () => listeners.forEach((listener) => listener());

export const crmTokenStore = {
  get(): string | null {
    if (typeof window === "undefined") return null;
    try {
      return localStorage.getItem(TOKEN_KEY);
    } catch {
      return null;
    }
  },

  set(token: string): void {
    if (typeof window === "undefined") return;
    localStorage.setItem(TOKEN_KEY, token);
    notify();
  },

  clear(): void {
    if (typeof window === "undefined") return;
    localStorage.removeItem(TOKEN_KEY);
    // The profile belongs to the token: when a 401 or a sign-out clears one, the other goes too.
    localStorage.removeItem(PROFILE_KEY);
    notify();
  },

  /** For useSyncExternalStore: re-render when the token is set or cleared (e.g. a 401 clears it). */
  subscribe(listener: () => void): () => void {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
};
