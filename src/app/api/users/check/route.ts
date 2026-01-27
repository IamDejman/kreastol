import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase/server";

// GET /api/users/check?email=... - Check if user exists
export async function GET(request: NextRequest) {
  try {
    const email = request.nextUrl.searchParams.get("email");
    
    if (!email) {
      return NextResponse.json(
        { error: "Email parameter is required" },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("users")
      .select("id")
      .eq("email", email)
      .maybeSingle();

    if (error) {
      console.error("Error checking user existence:", error);
      return NextResponse.json({ exists: false }, { status: 200 });
    }

    return NextResponse.json({ exists: !!data });
  } catch (error: any) {
    console.error("Error in GET /api/users/check:", error);
    return NextResponse.json({ exists: false }, { status: 200 });
  }
}
