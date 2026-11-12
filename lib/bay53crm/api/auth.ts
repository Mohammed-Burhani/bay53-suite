// ==================== CRM Auth ====================

import { accountsApi } from "./services/accounts.service";
import { crmProfileStore, crmTokenStore } from "./token-store";
import type { CrmAuthenticateResponse } from "./types";

export const crmAuth = {
  async login(email: string, password: string): Promise<CrmAuthenticateResponse> {
    const user = await accountsApi.authenticate<CrmAuthenticateResponse>({ email, password });
    if (user.jwtToken) {
      // The profile is saved first: setting the token is what swaps the login screen for the CRM.
      crmProfileStore.set({
        fullName: user.fullName || user.userName || email,
        userName: user.userName || email,
        role: user.role || "",
      });
      crmTokenStore.set(user.jwtToken);
    }
    return user;
  },

  logout: () => crmTokenStore.clear(),

  isAuthenticated: () => !!crmTokenStore.get(),
};
