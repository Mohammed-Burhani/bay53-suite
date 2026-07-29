import PosAppShell from "@/components/PosAppShell";
import AuthGuard from "@/components/auth/AuthGuard";
import { TabNavigationProvider } from "@/components/TabNavigationProvider";

export default function PosLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <TabNavigationProvider>
        <PosAppShell>{children}</PosAppShell>
      </TabNavigationProvider>
    </AuthGuard>
  );
}
