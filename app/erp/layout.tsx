import ErpAppShell from "@/components/ErpAppShell";
import AuthGuard from "@/components/auth/AuthGuard";
import { TabNavigationProvider } from "@/components/TabNavigationProvider";

export default function ErpLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <TabNavigationProvider>
        <ErpAppShell>{children}</ErpAppShell>
      </TabNavigationProvider>
    </AuthGuard>
  );
}
