"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { HOTEL_INFO } from "@/lib/constants/config";
import { useAuthStore } from "@/store/authStore";
import { cn } from "@/lib/utils/cn";

export function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  const handleLogout = () => {
    logout("user_logout");
    router.push("/login");
  };

  const isOwner = user?.role === "owner";

  return (
    <header className="sticky top-0 z-30 hidden border-b bg-white md:block">
      <div className="mx-auto flex h-[72px] max-w-6xl items-center justify-between px-4 lg:px-8">
        <Link href={pathname.startsWith("/staff") ? "/staff" : "/"}>
          <span className="font-heading text-xl font-semibold text-primary">
            {HOTEL_INFO.name}
          </span>
        </Link>
        <nav className="flex items-center gap-6">
          {isOwner && (
            <>
              <Link
                href="/owner/guests"
                className={cn(
                  "text-sm font-medium transition-colors",
                  pathname.startsWith("/owner/guests")
                    ? "text-primary"
                    : "text-gray-600 hover:text-primary"
                )}
              >
                Guests
              </Link>
              <Link
                href="/owner/users"
                className={cn(
                  "text-sm font-medium transition-colors",
                  pathname.startsWith("/owner/users")
                    ? "text-primary"
                    : "text-gray-600 hover:text-primary"
                )}
              >
                Users
              </Link>
              <Link
                href="/owner/audit-log"
                className={cn(
                  "text-sm font-medium transition-colors",
                  pathname.startsWith("/owner/audit-log")
                    ? "text-primary"
                    : "text-gray-600 hover:text-primary"
                )}
              >
                Audit logs
              </Link>
            </>
          )}
          {user && (
            <button
              type="button"
              onClick={handleLogout}
              className="flex min-h-touch min-w-touch items-center justify-center rounded-lg p-2 text-gray-600 hover:bg-gray-100 hover:text-primary transition-colors"
              aria-label="Log out"
            >
              <LogOut className="h-4 w-4" />
            </button>
          )}
        </nav>
      </div>
    </header>
  );
}
