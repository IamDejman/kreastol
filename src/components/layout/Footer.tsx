"use client";

import Link from "next/link";
import { HOTEL_INFO } from "@/lib/constants/config";

export function Footer() {
  const { name } = HOTEL_INFO;
  return (
    <footer className="border-t bg-gray-50 px-4 py-12 md:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center sm:gap-6">
          <Link
            href="/my-bookings"
            className="text-sm font-medium text-primary hover:underline"
          >
            My Bookings
          </Link>
        </div>
        <div className="mt-2 pt-2">
          <p className="text-center text-sm text-gray-500">
            © {new Date().getFullYear()} {name}. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
