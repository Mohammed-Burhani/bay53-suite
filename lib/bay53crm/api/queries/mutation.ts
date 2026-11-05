"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

/** A mutation that refetches the given query roots (see crmKeys) once it succeeds. */
export function useCrmMutation<TVars, TData = unknown>(
  mutationFn: (vars: TVars) => Promise<TData>,
  invalidate: readonly (readonly unknown[])[]
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn,
    // Returned so mutateAsync resolves after the refetch.
    onSuccess: () =>
      Promise.all(invalidate.map((queryKey) => queryClient.invalidateQueries({ queryKey: [...queryKey] }))),
  });
}
