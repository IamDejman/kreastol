import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase/server";
import type { User, UserStatus } from "@/types";
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
    role: dbUser.role,
    status: (dbUser.status as UserStatus) || "active",
  };
}

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("email", email)
      .maybeSingle();

    if (error) {
      console.error("Error fetching user for login:", error);
      return NextResponse.json(
        { error: "Failed to login. Please try again." },
        { status: 500 }
      );
    }

    if (!data) {
      return NextResponse.json(
        { error: "Invalid email or password." },
        { status: 401 }
      );
    }

    const dbUser = data as DbUser;

    if ((dbUser.status as UserStatus | null) === "inactive") {
      return NextResponse.json(
        { error: "Your account is inactive. Please contact the owner." },
        { status: 403 }
      );
    }

    const isValid = await bcrypt.compare(password, dbUser.password);

    if (!isValid) {
      return NextResponse.json(
        { error: "Invalid email or password." },
        { status: 401 }
      );
    }

    const user = dbUserToUser(dbUser);
    return NextResponse.json({ user }, { status: 200 });
  } catch (error: any) {
    console.error("Error in POST /api/auth/login:", error);
    return NextResponse.json(
      { error: error?.message || "Internal server error" },
      { status: 500 }
    );
  }
}

