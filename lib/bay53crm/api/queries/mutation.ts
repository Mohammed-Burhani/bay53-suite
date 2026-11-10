"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

/** A mutation that refetches the given query roots (see crmKeys) once it finishes. */
export function useCrmMutation<TVars, TData = unknown>(
  mutationFn: (vars: TVars) => Promise<TData>,
  invalidate: readonly (readonly unknown[])[]
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn,
    // On error too: the server may have saved part of the change (e.g. a save that fails while sending a notification).
    // Returned so mutateAsync settles after the refetch.
    onSettled: () =>
      Promise.all(invalidate.map((queryKey) => queryClient.invalidateQueries({ queryKey: [...queryKey] }))),
  });
}
