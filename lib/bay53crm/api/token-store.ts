// ==================== CRM Token Store ====================
// The CRM API issues its own JWT (separate from the ERP session in lib/auth.ts).

const TOKEN_KEY = "crm_jwt";

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
  },

  clear(): void {
    if (typeof window === "undefined") return;
    localStorage.removeItem(TOKEN_KEY);
  },
};
