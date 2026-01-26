"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Search } from "lucide-react";
import { cn } from "@/lib/utils/cn";

const navItems = [
  { icon: Home, label: "Home", href: "/" },
  { icon: Search, label: "My Bookings", href: "/my-bookings" },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 border-t bg-white md:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="flex h-16 justify-around">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.label}
              href={item.href}
              className="flex flex-1 flex-col items-center justify-center min-w-touch min-h-touch"
            >
              <Icon
                className={cn(
                  "h-6 w-6",
                  isActive ? "text-primary" : "text-gray-500"
                )}
              />
              <span
                className={cn(
                  "mt-1 text-xs",
                  isActive ? "font-medium text-primary" : "text-gray-500"
                )}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
