import CrmAppShell from "@/components/CrmAppShell";
import AuthGuard from "@/components/auth/AuthGuard";
import { CrmLoginGate } from "@/components/bay53crm/shared/CrmLoginGate";
import { TabNavigationProvider } from "@/components/TabNavigationProvider";

export default function CrmLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <TabNavigationProvider>
        <CrmAppShell>
          <CrmLoginGate>{children}</CrmLoginGate>
        </CrmAppShell>
      </TabNavigationProvider>
    </AuthGuard>
  );
}
