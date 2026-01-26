"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Menu } from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { useUIStore } from "@/store/uiStore";
import { Drawer } from "@/components/ui/Drawer";
import { HOTEL_INFO } from "@/lib/constants/config";
import { cn } from "@/lib/utils/cn";

const ownerLinks = [
  { href: "/owner/bookings", label: "Bookings" },
  { href: "/owner/revenue", label: "Revenue" },
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

  const isOwnerPage = pathname.startsWith("/owner");
  const isReceptionistPage = pathname.startsWith("/receptionist");
  const isDashboardPage = isOwnerPage || isReceptionistPage;

  const links = user?.role === "owner" ? ownerLinks : receptionistLinks;

  const handleLogout = () => {
    logout();
    toggleMobileMenu();
    router.push("/login");
  };

  return (
    <>
      <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b bg-white px-4 md:hidden">
        <Link href={isDashboardPage ? (user?.role === "owner" ? "/owner" : "/receptionist") : "/"}>
          <span className="font-heading text-lg font-semibold text-primary">
            {isDashboardPage ? HOTEL_INFO.name : "Kreastol"}
          </span>
        </Link>
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
      </header>

      {isDashboardPage && (
        <Drawer
          isOpen={isMobileMenuOpen}
          onClose={toggleMobileMenu}
          title={user?.role === "owner" ? "Owner Menu" : "Receptionist Menu"}
          className="md:hidden"
        >
          <div className="flex flex-col">
            {user && (
              <>
                <div className="px-4 py-3 border-b">
                  <p className="text-sm text-gray-500 capitalize">{user.role}</p>
                  {user.name && (
                    <p className="text-base font-medium text-foreground">{user.name}</p>
                  )}
                </div>
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
                  <Link
                    href="/"
                    onClick={toggleMobileMenu}
                    className="flex min-h-touch items-center rounded-lg px-3 py-3 text-base font-medium text-gray-600 hover:bg-gray-100"
                  >
                    ← Back to site
                  </Link>
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
