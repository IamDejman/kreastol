import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase/server";
import type { UserStatus } from "@/types";
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

export async function POST(request: NextRequest) {
  try {
    const { email, otp, newPassword } = await request.json();

    if (!email || !otp || !newPassword) {
      return NextResponse.json(
        { error: "Email, OTP, and new password are required" },
        { status: 400 }
      );
    }

    const { data: user, error: userError } = await supabase
      .from("users")
      .select("*")
      .eq("email", email)
      .maybeSingle();

    if (userError || !user) {
      return NextResponse.json(
        { error: "Invalid email or OTP" },
        { status: 400 }
      );
    }

    const dbUser = user as DbUser;

    const { data: resetRecord, error: resetError } = await supabase
      .from("password_resets")
      .select("*")
      .eq("user_id", dbUser.id)
      .eq("otp_code", otp)
      .eq("used", false)
      .gt("expires_at", new Date().toISOString())
      .order("created_at", { ascending: false })
      .maybeSingle();

    if (resetError || !resetRecord) {
      return NextResponse.json(
        { error: "Invalid or expired OTP" },
        { status: 400 }
      );
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    const { error: updateError } = await supabase
      .from("users")
      .update({ password: hashedPassword })
      .eq("id", dbUser.id);

    if (updateError) {
      console.error("Error updating password:", updateError);
      return NextResponse.json(
        { error: "Failed to reset password. Please try again." },
        { status: 500 }
      );
    }

    const { error: markUsedError } = await supabase
      .from("password_resets")
      .update({ used: true })
      .eq("id", resetRecord.id);

    if (markUsedError) {
      console.error("Error marking password reset as used:", markUsedError);
    }

    return NextResponse.json(
      { message: "Password has been reset successfully." },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Error in POST /api/auth/reset-password:", error);
    return NextResponse.json(
      { error: error?.message || "Internal server error" },
      { status: 500 }
    );
  }
}

