import CrmAppShell from "@/components/CrmAppShell";
import { CrmLoginGate } from "@/components/bay53crm/shared/CrmLoginGate";
import { TabNavigationProvider } from "@/components/TabNavigationProvider";

// The CRM is signed in with the CRM's own login, not the ERP one: the gate is outermost, so the sidebar and tabs only
// appear after sign-in.
export default function CrmLayout({ children }: { children: React.ReactNode }) {
  return (
    <CrmLoginGate>
      <TabNavigationProvider>
        <CrmAppShell>{children}</CrmAppShell>
      </TabNavigationProvider>
    </CrmLoginGate>
  );
}
