import CrmAppShell from "@/components/CrmAppShell";
import AuthGuard from "@/components/auth/AuthGuard";
import { TabNavigationProvider } from "@/components/TabNavigationProvider";

export default function CrmLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <TabNavigationProvider>
        <CrmAppShell>{children}</CrmAppShell>
      </TabNavigationProvider>
    </AuthGuard>
  );
}
