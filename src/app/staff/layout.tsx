"use client";

import { ProtectedRoute } from "@/components/auth/ProtectedRoute";

export default function StaffLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <ProtectedRoute>{children}</ProtectedRoute>;
}
