import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase/server";
import type { UserStatus } from "@/types";
import { sendPasswordResetOtpEmail } from "@/lib/services/emailService";

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

function generateOtp(length = 6): string {
  const digits = "0123456789";
  let otp = "";
  for (let i = 0; i < length; i++) {
    otp += digits[Math.floor(Math.random() * digits.length)];
  }
  return otp;
}

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    const { data: user, error: userError } = await supabase
      .from("users")
      .select("*")
      .eq("email", email)
      .maybeSingle();

    if (userError) {
      console.error("Error fetching user for forgot-password:", userError);
      // Return generic success to avoid leaking existence of accounts
      return NextResponse.json(
        { message: "If that email exists, an OTP has been sent." },
        { status: 200 }
      );
    }

    if (!user) {
      // Same generic response for non-existing users
      return NextResponse.json(
        { message: "If that email exists, an OTP has been sent." },
        { status: 200 }
      );
    }

    const dbUser = user as DbUser;

    if ((dbUser.status as UserStatus | null) === "inactive") {
      return NextResponse.json(
        {
          error:
            "This account is inactive. Please contact the owner to reactivate it.",
        },
        { status: 403 }
      );
    }

    const otp = generateOtp(6);
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();

    const { error: insertError } = await supabase
      .from("password_resets")
      .insert({
        user_id: dbUser.id,
        otp_code: otp,
        expires_at: expiresAt,
      });

    if (insertError) {
      console.error("Error inserting password reset record:", insertError);
      return NextResponse.json(
        { error: "Failed to create password reset. Please try again." },
        { status: 500 }
      );
    }

    await sendPasswordResetOtpEmail({
      to: dbUser.email,
      name: dbUser.name,
      otp,
    });

    return NextResponse.json(
      { message: "If that email exists, an OTP has been sent." },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Error in POST /api/auth/forgot-password:", error);
    return NextResponse.json(
      { error: error?.message || "Internal server error" },
      { status: 500 }
    );
  }
}

