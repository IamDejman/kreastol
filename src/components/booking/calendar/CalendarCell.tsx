"use client";

import { cn } from "@/lib/utils/cn";

interface CalendarCellProps {
  date: string;
  status: "available" | "booked" | "selecting" | "selected";
  onClick?: () => void;
  label?: string;
  isCheckIn?: boolean;
  isCheckOut?: boolean;
  isInRange?: boolean;
}

export function CalendarCell({
  date,
  status,
  onClick,
  label,
  isCheckIn,
  isCheckOut,
  isInRange,
}: CalendarCellProps) {
  const disabled = status === "booked";

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "calendar-cell",
        status === "available" && "calendar-cell-available",
        status === "booked" && "calendar-cell-booked",
        (status === "selecting" || status === "selected" || isInRange) &&
          "calendar-cell-selected",
        isCheckIn && "rounded-l-lg",
        isCheckOut && "rounded-r-lg"
      )}
      aria-label={label ?? date}
      aria-pressed={status === "selected" || isInRange}
    >
      {label ?? date.slice(-2)}
    </button>
  );
}
