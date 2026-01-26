"use client";

import { useEffect } from "react";
import { storageService } from "@/lib/services/storageService";
import { useAuthStore } from "@/store/authStore";
import { seedDefaultUsers } from "@/lib/services/seedService";

export function Providers({ children }: { children: React.ReactNode }) {
  const checkAuth = useAuthStore((state) => state.checkAuth);

  useEffect(() => {
    const initialize = async () => {
      try {
        if (typeof window !== "undefined") {
          await storageService.initializeStorage();
          // Seed default users if they don't exist
          await seedDefaultUsers();
          checkAuth();
        }
      } catch (error) {
        console.error("Error initializing app:", error);
      }
    };
    initialize();
  }, [checkAuth]);

  return <>{children}</>;
}
