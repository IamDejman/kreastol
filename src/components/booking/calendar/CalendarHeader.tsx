"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { format } from "date-fns";

interface CalendarHeaderProps {
  year: number;
  month: number;
  onPrev: () => void;
  onNext: () => void;
  canGoPrev?: boolean;
  canGoNext?: boolean;
}

export function CalendarHeader({
  year,
  month,
  onPrev,
  onNext,
  canGoPrev = true,
  canGoNext = true,
}: CalendarHeaderProps) {
  const d = new Date(year, month - 1);

  return (
    <div className="flex items-center justify-between border-b pb-3">
      <button
        type="button"
        onClick={onPrev}
        disabled={!canGoPrev}
        className="flex min-h-touch min-w-touch items-center justify-center rounded-lg text-gray-600 hover:bg-gray-100 disabled:opacity-40"
        aria-label="Previous month"
      >
        <ChevronLeft className="h-5 w-5" />
      </button>
      <h3 className="font-heading text-lg font-semibold text-foreground">
        {format(d, "MMMM yyyy")}
      </h3>
      <button
        type="button"
        onClick={onNext}
        disabled={!canGoNext}
        className="flex min-h-touch min-w-touch items-center justify-center rounded-lg text-gray-600 hover:bg-gray-100 disabled:opacity-40"
        aria-label="Next month"
      >
        <ChevronRight className="h-5 w-5" />
      </button>
    </div>
  );
}
