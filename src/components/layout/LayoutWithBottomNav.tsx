"use client";

import { usePathname } from "next/navigation";
import { BottomNav } from "@/components/layout/BottomNav";
import { cn } from "@/lib/utils/cn";

const CUSTOMER_PATHS = ["/", "/book", "/my-bookings"];
const CUSTOMER_PREFIX = "/booking/";

function isCustomerPath(pathname: string): boolean {
  if (CUSTOMER_PATHS.includes(pathname)) return true;
  if (pathname.startsWith(CUSTOMER_PREFIX)) return true;
  return false;
}

function isStaffOrAuthPath(pathname: string): boolean {
  return (
    pathname.startsWith("/staff") ||
    pathname.startsWith("/owner") ||
    pathname.startsWith("/receptionist") ||
    pathname.startsWith("/login")
  );
}

export function LayoutWithBottomNav({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const showBottomNav = isCustomerPath(pathname) && !isStaffOrAuthPath(pathname);

  return (
    <>
      <div className={cn(showBottomNav && "pb-16 md:pb-0")}>{children}</div>
      {showBottomNav && <BottomNav />}
    </>
  );
}
