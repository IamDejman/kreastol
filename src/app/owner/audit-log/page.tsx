"use client";

import { useEffect } from "react";
import { OwnerAuditLogPage } from "@/components/dashboard/owner/OwnerAuditLogPage";
import { useAuthStore } from "@/store/authStore";
import { supabaseService } from "@/lib/services/supabaseService";

export default function OwnerAuditLogRoute() {
  const currentUser = useAuthStore((s) => s.user);

  // Audit: owner viewed audit log
  useEffect(() => {
    if (!currentUser) return;
    supabaseService
      .createAuditLog({
        actorId: currentUser.dbId,
        actorName: currentUser.name,
        actorRole: currentUser.role,
        action: "view_owner_audit_log",
        context: "/owner/audit-log",
      })
      .catch((error) => {
        console.error("Failed to write audit log (view_owner_audit_log):", error);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser?.dbId]);

  return <OwnerAuditLogPage />;
}

