"use client";

import { forwardRef } from "react";
import { cn } from "@/lib/utils/cn";

interface DateRangeFilterProps {
  startDate: string;
  endDate: string;
  onStartDateChange: (date: string) => void;
  onEndDateChange: (date: string) => void;
  className?: string;
}

export function DateRangeFilter({
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
  className,
}: DateRangeFilterProps) {
  return (
    <div className={cn("flex gap-1.5 min-w-0", className)}>
      <div className="flex-1 min-w-0">
        <label className="mb-1 block text-xs font-medium text-foreground">
          From
        </label>
        <input
          type="date"
          value={startDate}
          onChange={(e) => onStartDateChange(e.target.value)}
          className="w-full rounded-lg border border-gray-300 bg-white px-2 py-1.5 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 min-h-touch"
        />
      </div>
      <div className="flex-1 min-w-0">
        <label className="mb-1 block text-xs font-medium text-foreground">
          To
        </label>
        <input
          type="date"
          value={endDate}
          onChange={(e) => onEndDateChange(e.target.value)}
          className="w-full rounded-lg border border-gray-300 bg-white px-2 py-1.5 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 min-h-touch"
        />
      </div>
    </div>
  );
}
