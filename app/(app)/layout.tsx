import AppShell from "@/components/AppShell";
import AuthGuard from "@/components/auth/AuthGuard";
import { TabNavigationProvider } from "@/components/TabNavigationProvider";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <TabNavigationProvider>
        <AppShell>{children}</AppShell>
      </TabNavigationProvider>
    </AuthGuard>
  );
}
