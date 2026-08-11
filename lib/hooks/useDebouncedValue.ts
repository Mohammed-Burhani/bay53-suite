"use client";

import { useEffect, useState } from "react";

/**
 * Debounce any changing value (e.g. a search input) and return the latest
 * value only after it has been stable for `delayMs`. Used to avoid firing
 * an API call on every keystroke.
 */
export function useDebouncedValue<T>(value: T, delayMs = 400): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(id);
  }, [value, delayMs]);

  return debounced;
}
