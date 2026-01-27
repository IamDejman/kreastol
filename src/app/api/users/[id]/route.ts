import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase/server";
import type { User, UserStatus } from "@/types";

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
    password: dbUser.password,
    role: dbUser.role,
    status: (dbUser.status as UserStatus) || "active",
  };
}

// PATCH /api/users/[id] - Update user (name, password, status)
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body: Partial<Pick<User, "name" | "password" | "status">> =
      await request.json();

    const updateData: Partial<DbUser> = {};

    if (body.name !== undefined) updateData.name = body.name;
    if (body.password !== undefined) updateData.password = body.password;
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
    return NextResponse.json({ user });
  } catch (error: any) {
    console.error("Error in PATCH /api/users/[id]:", error);
    return NextResponse.json(
      { error: error?.message || "Internal server error" },
      { status: 500 }
    );
  }
}

