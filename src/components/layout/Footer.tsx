"use client";

import { HOTEL_INFO } from "@/lib/constants/config";

export function Footer() {
  const { name } = HOTEL_INFO;
  return (
    <footer className="border-t bg-gray-50 px-4 py-12 md:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="mt-2 pt-2">
          <p className="text-center text-sm text-gray-500">
            © {new Date().getFullYear()} {name}. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
