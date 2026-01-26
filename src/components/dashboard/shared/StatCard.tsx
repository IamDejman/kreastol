"use client";

import { cn } from "@/lib/utils/cn";

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  className?: string;
}

export function StatCard({ title, value, subtitle, className }: StatCardProps) {
  return (
    <div
      className={cn(
        "rounded-xl border bg-white p-4 shadow-sm md:p-6",
        className
      )}
    >
      <p className="text-sm font-medium text-gray-500">{title}</p>
      <p className="mt-1 text-2xl font-semibold text-foreground md:text-3xl">
        {value}
      </p>
      {subtitle && <p className="mt-1 text-sm text-gray-500">{subtitle}</p>}
    </div>
  );
}
