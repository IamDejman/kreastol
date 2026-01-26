"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { useAuthStore } from "@/store/authStore";
import { HOTEL_INFO } from "@/lib/constants/config";
import { useLocalStorage } from "@/hooks/useLocalStorage";

type Role = "owner" | "receptionist";

interface SidebarProps {
  role: Role;
}

const ownerLinks = [
  { href: "/owner/bookings", label: "Bookings" },
  { href: "/owner/revenue", label: "Revenue" },
];

const receptionistLinks = [
  { href: "/receptionist", label: "Bookings" },
];

export function Sidebar({ role }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const logout = useAuthStore((s) => s.logout);
  const links = role === "owner" ? ownerLinks : receptionistLinks;
  const [isCollapsed, setIsCollapsed] = useLocalStorage("sidebar-collapsed", false);

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  const toggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
  };

  return (
    <aside
      className={cn(
        "hidden flex-shrink-0 border-r bg-white md:block transition-all duration-300",
        isCollapsed ? "w-16" : "w-56"
      )}
    >
      <div className="flex h-screen flex-col sticky top-0">
        <div className="border-b p-4 flex-shrink-0 relative">
          {!isCollapsed && (
            <>
              <h2 className="font-heading text-lg font-semibold text-primary">
                {HOTEL_INFO.name}
              </h2>
              <p className="text-xs text-gray-500">{role}</p>
            </>
          )}
          <button
            type="button"
            onClick={toggleCollapse}
            className={cn(
              "absolute top-4 rounded-lg p-1.5 text-gray-500 hover:bg-gray-100 hover:text-foreground transition-colors min-w-touch min-h-touch flex items-center justify-center",
              isCollapsed ? "right-2" : "right-2"
            )}
            aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {isCollapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </button>
        </div>
        <nav className="flex-1 space-y-1 p-2 overflow-y-auto">
          {links.map(({ href, label }) => {
            // Check if this link is active
            // For root dashboard paths (like /owner), only match exactly
            // For nested paths (like /owner/bookings), match exactly or sub-paths
            const isRootPath = href === "/owner" || href === "/receptionist";
            const isActive = isRootPath
              ? pathname === href
              : pathname === href || pathname.startsWith(href + "/");
            
            return (
              <Link
                key={href}
                href={href}
                title={isCollapsed ? label : undefined}
                className={cn(
                  "flex min-h-touch items-center rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  isCollapsed ? "justify-center" : "",
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-gray-600 hover:bg-gray-100 hover:text-foreground"
                )}
              >
                {isCollapsed ? (
                  <span className="text-lg font-semibold">{label.charAt(0)}</span>
                ) : (
                  label
                )}
              </Link>
            );
          })}
        </nav>
        <div className="border-t p-2 flex-shrink-0">
          {!isCollapsed && (
            <Link
              href="/"
              className="flex min-h-touch items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100"
            >
              ← Back to site
            </Link>
          )}
          <button
            type="button"
            onClick={handleLogout}
            title={isCollapsed ? "Log out" : undefined}
            className={cn(
              "flex w-full min-h-touch items-center rounded-lg px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100",
              isCollapsed ? "justify-center" : ""
            )}
          >
            {isCollapsed ? "↪" : "Log out"}
          </button>
        </div>
      </div>
    </aside>
  );
}
