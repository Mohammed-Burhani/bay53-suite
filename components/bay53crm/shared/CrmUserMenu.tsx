"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { crmAuth, crmProfileStore } from "@/lib/bay53crm/api";

/** Who is signed in to the CRM, with a sign-out. Sits at the foot of the CRM sidebar. */
export function CrmUserMenu({ collapsed = false }: { collapsed?: boolean }) {
  const queryClient = useQueryClient();
  // Only rendered after the CRM gate has mounted on the client, so localStorage can be read directly.
  const [profile] = useState(() => crmProfileStore.get());
  const name = profile?.fullName || "CRM user";

  const signOut = () => {
    crmAuth.logout();
    // Drop what the last user loaded, so the next sign-in starts clean.
    queryClient.clear();
  };

  const avatar = (
    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-lime-500/20 text-sm font-semibold text-lime-300">
      {name[0]?.toUpperCase() ?? "U"}
    </div>
  );

  if (collapsed) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="w-full text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-white"
            onClick={signOut}
            aria-label="Sign out"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="right">Sign out ({name})</TooltipContent>
      </Tooltip>
    );
  }

  return (
    <div className="flex items-center gap-2 rounded-md px-2 py-1.5">
      {avatar}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-white">{name}</p>
        {profile?.role && <p className="truncate text-[11px] text-sidebar-foreground/60">{profile.role}</p>}
      </div>
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 shrink-0 text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-white"
        onClick={signOut}
        aria-label="Sign out"
        title="Sign out"
      >
        <LogOut className="h-4 w-4" />
      </Button>
    </div>
  );
}
