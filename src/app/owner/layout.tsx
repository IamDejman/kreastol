"use client";

import { usePathname } from "next/navigation";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { Sidebar } from "@/components/layout/Sidebar";
import { MobileHeader } from "@/components/layout/MobileHeader";
import { Header } from "@/components/layout/Header";
import { useAuthStore } from "@/store/authStore";

export default function OwnerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = useAuthStore((s) => s.user);
  const pathname = usePathname();

  const isGuestsPage = pathname === "/owner/guests";
  const isAuditLogPage = pathname === "/owner/audit-log";
  const isUsersPage = pathname === "/owner/users";
  const useLandingLayout = isGuestsPage || isAuditLogPage || isUsersPage;

  return (
    <ProtectedRoute>
      {useLandingLayout ? (
        <>
          <div className="md:hidden">
            <MobileHeader />
          </div>
          <div className="hidden md:block">
            <Header />
          </div>
          <main className="bg-gray-50 px-4 py-4 md:px-6 md:py-6 lg:px-8 lg:py-8 min-h-screen">
            {children}
          </main>
        </>
      ) : (
        <>
          <div className="md:hidden">
            <MobileHeader />
          </div>
          <div className="flex min-h-screen bg-gray-50">
            {user?.role === "owner" && <Sidebar role="owner" />}
            <main className="flex-1 overflow-auto p-4 md:p-6 lg:p-8">
              {children}
            </main>
          </div>
        </>
      )}
    </ProtectedRoute>
  );
}
