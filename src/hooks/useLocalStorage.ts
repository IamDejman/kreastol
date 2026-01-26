"use client";

import { useState, useEffect, useCallback } from "react";

export function useLocalStorage<T>(
  key: string,
  initial: T
): [T, (value: T | ((prev: T) => T)) => void] {
  const [stored, setStored] = useState<T>(initial);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = localStorage.getItem(key);
      if (raw) setStored(JSON.parse(raw) as T);
    } catch {
      setStored(initial);
    }
  }, [key, initial]);

  const setValue = useCallback(
    (value: T | ((prev: T) => T)) => {
      setStored((prev) => {
        const next = value instanceof Function ? value(prev) : value;
        if (typeof window !== "undefined") {
          try {
            localStorage.setItem(key, JSON.stringify(next));
          } catch {
            /* ignore */
          }
        }
        return next;
      });
    },
    [key]
  );

  return [stored, setValue];
}
