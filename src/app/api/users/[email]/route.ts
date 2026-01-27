import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase/server";
import type { User } from "@/types";

// Database types
interface DbUser {
  id: string;
  name: string;
  email: string;
  password: string;
  role: "owner" | "receptionist";
  created_at: string;
  updated_at: string;
}

function dbUserToUser(dbUser: DbUser): User {
  const numericId = parseInt(dbUser.id.replace(/-/g, "").substring(0, 8), 16) % 1000000;
  return {
    id: numericId,
    name: dbUser.name,
    email: dbUser.email,
    password: dbUser.password,
    role: dbUser.role,
  };
}

// GET /api/users/[email] - Get user by email
export async function GET(
  request: NextRequest,
  { params }: { params: { email: string } }
) {
  try {
    const email = decodeURIComponent(params.email);
    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("email", email)
      .maybeSingle();

    if (error) {
      console.error("Error fetching user:", error);
      return NextResponse.json(
        { error: `Failed to fetch user: ${error.message}` },
        { status: 500 }
      );
    }

    if (!data) {
      return NextResponse.json({ user: null }, { status: 200 });
    }

    const user = dbUserToUser(data as DbUser);
    return NextResponse.json({ user });
  } catch (error: any) {
    console.error("Error in GET /api/users/[email]:", error);
    return NextResponse.json(
      { error: error?.message || "Internal server error" },
      { status: 500 }
    );
  }
}
