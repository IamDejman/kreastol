import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase/server";
import type { User, UserStatus, UserRole } from "@/types";
import bcrypt from "bcryptjs";

interface DbUser {
  id: string;
  name: string;
  email: string;
  password: string;
  role: "owner" | "receptionist";
  created_at: string;
  updated_at: string;
  status?: UserStatus | null;
}

function dbUserToUser(dbUser: DbUser): User {
  const numericId =
    parseInt(dbUser.id.replace(/-/g, "").substring(0, 8), 16) % 1000000;

  return {
    id: numericId,
    dbId: dbUser.id,
    name: dbUser.name,
    email: dbUser.email,
    // Do not expose password hashes
    role: dbUser.role,
    status: (dbUser.status as UserStatus) || "active",
  };
}

async function logAuditAction(params: {
  actorId?: string;
  actorName?: string;
  actorRole?: UserRole;
  action: string;
  context?: string;
}) {
  const { actorId, actorName, actorRole, action, context } = params;
  if (!actorId || !actorName || !actorRole) return;

  const { error } = await supabase.from("audit_logs").insert({
    actor_id: actorId,
    actor_name: actorName,
    actor_role: actorRole,
    action,
    context: context ?? null,
  });

  if (error) {
    console.error("Failed to write audit log (users/id/[id]):", error);
  }
}

// PATCH /api/users/id/[id] - Update user (name, password, status) by UUID
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const rawBody = await request.json();
    const body: Partial<Pick<User, "name" | "password" | "status">> =
      rawBody.user ?? rawBody;
    const actor = rawBody.actor as
      | { id: string; name: string; role: UserRole }
      | undefined;

    const updateData: Partial<DbUser> = {};

    if (body.name !== undefined) updateData.name = body.name;
    if (body.password !== undefined) {
      // Hash new password before storing
      updateData.password = await bcrypt.hash(body.password, 10);
    }
    if (body.status !== undefined) updateData.status = body.status;

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: "No fields to update" },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("users")
      .update(updateData)
      .eq("id", params.id)
      .select("*")
      .maybeSingle();

    if (error) {
      console.error("Error updating user:", error);
      return NextResponse.json(
        { error: `Failed to update user: ${error.message}` },
        { status: 500 }
      );
    }

    if (!data) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    const user = dbUserToUser(data as DbUser);

    if (actor && user.role === "receptionist") {
      let action: string | null = null;
      if (body.status === "inactive") {
        action = "deactivate_receptionist";
      } else if (body.status === "active") {
        action = "activate_receptionist";
      } else if (body.name !== undefined || body.password !== undefined) {
        action = "update_receptionist";
      }

      if (action) {
        await logAuditAction({
          actorId: actor.id,
          actorName: actor.name,
          actorRole: actor.role,
          action,
          context: user.email,
        });
      }
    }

    return NextResponse.json({ user });
  } catch (error: any) {
    console.error("Error in PATCH /api/users/id/[id]:", error);
    return NextResponse.json(
      { error: error?.message || "Internal server error" },
      { status: 500 }
    );
  }
}

