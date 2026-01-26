"use client";

import Link from "next/link";

export function MobileHeader() {
  return (
    <header className="sticky top-0 z-30 flex h-14 items-center justify-center border-b bg-white px-4 md:hidden">
      <Link href="/">
        <span className="font-heading text-lg font-semibold text-primary">
          Kreastol
        </span>
      </Link>
    </header>
  );
}
