"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { useState } from "react";
import { getStoredSession } from "@/lib/hooks/useAuth";

export default function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => {
    const client = new QueryClient({
      defaultOptions: {
        queries: {
          staleTime: 1000 * 60 * 5,       // 5 min — avoid redundant refetches
          gcTime: 1000 * 60 * 10,          // 10 min cache retention
          refetchOnWindowFocus: false,      // don't hammer the API on tab switch
          retry: 1,
        },
      },
    });

    // Hydrate auth session from sessionStorage into query cache on first render
    // This prevents a flash of unauthenticated state on page refresh
    const session = getStoredSession();
    if (session) {
      client.setQueryData(["auth", "session"], session);
    }

    return client;
  });

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {process.env.NODE_ENV === "development" && (
        <ReactQueryDevtools initialIsOpen={false} />
      )}
    </QueryClientProvider>
  );
}
