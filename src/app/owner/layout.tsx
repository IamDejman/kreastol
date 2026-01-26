"use client";

import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { Sidebar } from "@/components/layout/Sidebar";
import { MobileHeader } from "@/components/layout/MobileHeader";
import { useAuthStore } from "@/store/authStore";

export default function OwnerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = useAuthStore((s) => s.user);

  return (
    <ProtectedRoute>
      <div className="md:hidden">
        <MobileHeader />
      </div>
      <div className="flex min-h-screen bg-gray-50">
        {user?.role === "owner" && <Sidebar role="owner" />}
        <main className="flex-1 overflow-auto p-4 md:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </ProtectedRoute>
  );
}
