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

  const pathname = request.nextUrl.pathname;
  const isAuthPage = pathname.startsWith("/login");
  const isProtected =
    pathname.startsWith("/staff") ||
    pathname.startsWith("/owner") ||
    pathname.startsWith("/receptionist");

  // Protect staff and dashboard routes
  if (isProtected && !currentUser) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Redirect authenticated users away from login page to staff landing
  if (isAuthPage && currentUser) {
    return NextResponse.redirect(new URL("/staff", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/",
    "/staff",
    "/staff/:path*",
    "/owner/:path*",
    "/receptionist/:path*",
    "/login",
    "/book",
    "/book/:path*",
    "/booking/:path*",
  ],
};
