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
  const isPublicRoute = 
    pathname.startsWith("/book") ||
    pathname.startsWith("/booking");
  const isProtected =
    pathname === "/" ||
    pathname.startsWith("/owner") ||
    pathname.startsWith("/receptionist");

  // Protect landing page and dashboard routes
  if (isProtected && !isPublicRoute && !currentUser) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Redirect authenticated users away from login page
  if (isAuthPage && currentUser) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/",
    "/owner/:path*",
    "/receptionist/:path*",
    "/login",
    "/book",
    "/book/:path*",
    "/booking/:path*",
  ],
};
