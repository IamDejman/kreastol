"use client";

import { cn } from "@/lib/utils/cn";

type BadgeVariant = "pending" | "confirmed" | "cancelled" | "default";

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
}

export function Badge({
  className,
  variant = "default",
  children,
  ...props
}: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-3 py-1 text-sm font-medium",
        variant === "pending" && "bg-yellow-100 text-yellow-800",
        variant === "confirmed" && "bg-green-100 text-green-800",
        variant === "cancelled" && "bg-red-100 text-red-800",
        variant === "default" && "bg-gray-100 text-gray-800",
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}
