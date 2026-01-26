"use client";

import Link from "next/link";
import { ChevronLeft } from "lucide-react";

interface BackButtonProps {
  href?: string;
  onClick?: () => void;
  label?: string;
  className?: string;
}

export function BackButton({
  href,
  onClick,
  label = "Back",
  className = "",
}: BackButtonProps) {
  const content = (
    <>
      <ChevronLeft className="h-5 w-5" />
      <span>{label}</span>
    </>
  );

  const base =
    "inline-flex min-h-touch min-w-touch items-center gap-1 text-sm font-medium text-gray-600 hover:text-foreground";

  if (href) {
    return (
      <Link href={href} className={`${base} ${className}`}>
        {content}
      </Link>
    );
  }

  return (
    <button type="button" onClick={onClick} className={`${base} ${className}`}>
      {content}
    </button>
  );
}
