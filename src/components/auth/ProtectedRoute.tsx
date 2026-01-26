"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { Spinner } from "@/components/ui/Spinner";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const router = useRouter();
  const [checked, setChecked] = useState(false);
  const user = useAuthStore((s) => s.user);
  const checkAuth = useAuthStore((s) => s.checkAuth);

  useEffect(() => {
    checkAuth();
    setChecked(true);
  }, [checkAuth]);

  useEffect(() => {
    if (!checked || typeof window === "undefined") return;
    const u = useAuthStore.getState().user;
    if (!u) router.replace("/login");
  }, [checked, router]);

  if (!checked || !user) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  return <>{children}</>;
}
