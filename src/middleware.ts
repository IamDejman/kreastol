import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const AUTH_COOKIE = "kreastol_current_user";

export function middleware(request: NextRequest) {
  const raw = request.cookies.get(AUTH_COOKIE)?.value;
  let currentUser: { role?: string } | null = null;
  if (raw) {
    try {
      currentUser = JSON.parse(decodeURIComponent(raw)) as { role?: string };
    } catch {
      currentUser = null;
    }
  }

  const isAuthPage = request.nextUrl.pathname.startsWith("/login");
  const isProtected =
    request.nextUrl.pathname.startsWith("/owner") ||
    request.nextUrl.pathname.startsWith("/receptionist");

  if (isProtected && !currentUser) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (isAuthPage && currentUser) {
    const path = currentUser.role === "owner" ? "/owner" : "/receptionist";
    return NextResponse.redirect(new URL(path, request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/owner/:path*", "/receptionist/:path*", "/login"],
};
