"use client";

import { useEffect } from "react";
import { OwnerUsersPage } from "@/components/dashboard/owner/OwnerUsersPage";
import { useAuthStore } from "@/store/authStore";
import { supabaseService } from "@/lib/services/supabaseService";

export default function OwnerUsersRoute() {
  const currentUser = useAuthStore((s) => s.user);

  // Audit: owner viewed team page
  useEffect(() => {
    if (!currentUser) return;
    supabaseService
      .createAuditLog({
        actorId: currentUser.dbId,
        actorName: currentUser.name,
        actorRole: currentUser.role,
        action: "view_owner_team",
        context: "/owner/users",
      })
      .catch((error) => {
        console.error("Failed to write audit log (view_owner_team):", error);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser?.dbId]);

  return <OwnerUsersPage />;
}

