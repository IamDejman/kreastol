"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Menu, LogOut } from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { useUIStore } from "@/store/uiStore";
import { Drawer } from "@/components/ui/Drawer";
import { HOTEL_INFO } from "@/lib/constants/config";
import { cn } from "@/lib/utils/cn";

const ownerLinks = [
  { href: "/owner/guests", label: "Guests" },
  { href: "/owner/audit-log", label: "Audit logs" },
];

const receptionistLinks = [
  { href: "/receptionist", label: "Bookings" },
];

export function MobileHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const isMobileMenuOpen = useUIStore((s) => s.isMobileMenuOpen);
  const toggleMobileMenu = useUIStore((s) => s.toggleMobileMenu);

  const isOwner = user?.role === "owner";
  const isReceptionist = user?.role === "receptionist";

  // Treat home as dashboard entry for owners so they can open the menu there
  const isOwnerPage = pathname.startsWith("/owner") || (isOwner && pathname === "/");
  const isReceptionistPage = pathname.startsWith("/receptionist");
  const isDashboardPage = isOwnerPage || isReceptionistPage;

  const links = user?.role === "owner" ? ownerLinks : receptionistLinks;

  const handleLogout = () => {
    logout("user_logout");
    toggleMobileMenu();
    router.push("/login");
  };

  return (
    <>
      <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b bg-white px-4 md:hidden">
        <Link href="/">
          <span className="font-heading text-sm font-semibold text-primary sm:text-base md:text-lg">
            {HOTEL_INFO.name}
          </span>
        </Link>
        <div className="flex items-center gap-2">
          {user && !isDashboardPage && (
            <button
              type="button"
              onClick={handleLogout}
              className="flex min-h-touch min-w-touch items-center justify-center rounded-lg p-2 text-gray-600 hover:bg-gray-100"
              aria-label="Log out"
            >
              <LogOut className="h-5 w-5" />
            </button>
          )}
          {isDashboardPage && (
            <button
              type="button"
              onClick={toggleMobileMenu}
              className="flex min-h-touch min-w-touch items-center justify-center rounded-lg p-2 text-gray-600 hover:bg-gray-100"
              aria-label="Open menu"
            >
              <Menu className="h-6 w-6" />
            </button>
          )}
        </div>
      </header>

      {isDashboardPage && (
        <Drawer
          isOpen={isMobileMenuOpen}
          onClose={toggleMobileMenu}
          className="md:hidden"
        >
          <div className="flex flex-col">
            {user && (
              <>
                <nav className="flex flex-col p-2">
                  {links.map(({ href, label }) => {
                    const isRootPath = href === "/owner" || href === "/receptionist";
                    const isActive = isRootPath
                      ? pathname === href
                      : pathname === href || pathname.startsWith(href + "/");

                    return (
                      <Link
                        key={href}
                        href={href}
                        onClick={toggleMobileMenu}
                        className={cn(
                          "flex min-h-touch items-center rounded-lg px-3 py-3 text-base font-medium transition-colors",
                          isActive
                            ? "bg-primary/10 text-primary"
                            : "text-gray-600 hover:bg-gray-100"
                        )}
                      >
                        {label}
                      </Link>
                    );
                  })}
                </nav>
                <div className="border-t p-2 mt-auto">
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="flex w-full min-h-touch items-center rounded-lg px-3 py-3 text-base font-medium text-gray-600 hover:bg-gray-100"
                  >
                    Log out
                  </button>
                </div>
              </>
            )}
          </div>
        </Drawer>
      )}
    </>
  );
}
