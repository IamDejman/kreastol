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

  return (
    <header className="sticky top-0 z-30 hidden border-b bg-white md:block">
      <div className="mx-auto flex h-[72px] max-w-6xl items-center justify-between px-4 lg:px-8">
        <Link href="/">
          <span className="font-heading text-xl font-semibold text-primary">
            {HOTEL_INFO.name}
          </span>
        </Link>
        <nav className="flex items-center gap-6">
          <Link
            href="/my-bookings"
            className={cn(
              "text-sm font-medium transition-colors",
              pathname === "/my-bookings"
                ? "text-primary"
                : "text-gray-600 hover:text-primary"
            )}
          >
            My Bookings
          </Link>
          {user && (
            <button
              type="button"
              onClick={handleLogout}
              className="flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-primary transition-colors"
            >
              <LogOut className="h-4 w-4" />
              Log out
            </button>
          )}
        </nav>
      </div>
    </header>
  );
}
