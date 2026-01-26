"use client";

import { useEffect } from "react";
import { storageService } from "@/lib/services/storageService";
import { useAuthStore } from "@/store/authStore";

export function Providers({ children }: { children: React.ReactNode }) {
  const checkAuth = useAuthStore((state) => state.checkAuth);

  useEffect(() => {
    try {
      if (typeof window !== "undefined") {
        storageService.initializeStorage();
        checkAuth();
      }
    } catch (error) {
      console.error("Error initializing app:", error);
    }
  }, [checkAuth]);

  return <>{children}</>;
}
