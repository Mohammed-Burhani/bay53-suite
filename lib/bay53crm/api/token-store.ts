// ==================== CRM Token Store ====================
// The CRM API issues its own JWT (separate from the ERP session in lib/auth.ts).

const TOKEN_KEY = "crm_jwt";

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
    notify();
  },

  /** For useSyncExternalStore: re-render when the token is set or cleared (e.g. a 401 clears it). */
  subscribe(listener: () => void): () => void {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
};
