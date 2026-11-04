// ==================== CRM Auth ====================

import { accountsApi } from "./services/accounts.service";
import { crmTokenStore } from "./token-store";
import type { CrmAuthenticateResponse } from "./types";

export const crmAuth = {
  async login(email: string, password: string): Promise<CrmAuthenticateResponse> {
    const user = await accountsApi.authenticate<CrmAuthenticateResponse>({ email, password });
    if (user.jwtToken) crmTokenStore.set(user.jwtToken);
    return user;
  },

  logout: () => crmTokenStore.clear(),

  isAuthenticated: () => !!crmTokenStore.get(),
};
