"use client";

import { createContext, useContext, ReactNode } from "react";

interface TenantContextValue {
  tenantId: string;
  tenantName?: string;
}

const TenantContext = createContext<TenantContextValue | null>(null);

export function TenantProvider({ 
  children, 
  tenantId,
  tenantName 
}: { 
  children: ReactNode;
  tenantId: string;
  tenantName?: string;
}) {
  return (
    <TenantContext.Provider value={{ tenantId, tenantName }}>
      {children}
    </TenantContext.Provider>
  );
}

export function useTenant() {
  const context = useContext(TenantContext);
  if (!context) {
    // Return seeded demo tenant ID
    return { 
      tenantId: '00000000-0000-0000-0000-000000000001', 
      tenantName: 'Demo Store' 
    };
  }
  return context;
}
