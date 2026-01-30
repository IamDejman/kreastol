"use client";

import { useState, useMemo } from "react";
import {
  format,
  addMonths,
  subMonths,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  parseISO,
  isSameMonth,
} from "date-fns";
import { useBookingStore } from "@/store/bookingStore";
import { getDatesInRange, isPast } from "@/lib/utils/dateUtils";
import { useToast } from "@/components/ui/Toast";
import { cn } from "@/lib/utils/cn";

export type CalendarMode = "check-in" | "check-out";

interface CustomerCalendarProps {
  roomNumber: number;
  mode: CalendarMode;
  checkIn: string | null;
  checkOut: string | null;
  onSelectCheckIn: (date: string) => void;
  onSelectCheckOut: (date: string) => void;
  onClose: () => void;
}

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function CustomerCalendar({
  roomNumber,
  mode,
  checkIn,
  checkOut,
  onSelectCheckIn,
  onSelectCheckOut,
  onClose,
}: CustomerCalendarProps) {
  const [base, setBase] = useState(() => new Date());
  const toast = useToast();
  const bookedDates = useBookingStore((s) => s.bookedDates);
  const blockedRooms = useBookingStore((s) => s.blockedRooms);

  const roomBooked = bookedDates[roomNumber] ?? [];
  const roomBlocked = blockedRooms[roomNumber] ?? [];
  const today = format(new Date(), "yyyy-MM-dd");

  const gridDays = useMemo(() => {
    const start = startOfMonth(base);
    const end = endOfMonth(base);
    const gridStart = startOfWeek(start, { weekStartsOn: 0 });
    const gridEnd = endOfWeek(end, { weekStartsOn: 0 });
    return eachDayOfInterval({ start: gridStart, end: gridEnd });
  }, [base]);

  function isUnavailable(dateStr: string): boolean {
    if (isPast(dateStr)) return true;
    if (roomBooked.includes(dateStr)) return true;
    if (roomBlocked.includes(dateStr)) return true;
    return false;
  }

  function isValidCheckoutDate(dateStr: string): boolean {
    if (!checkIn || dateStr <= checkIn) return false;
    const range = getDatesInRange(checkIn, dateStr);
    return range.every(
      (d) => !roomBooked.includes(d) && !roomBlocked.includes(d)
    );
  }

  function getCellStatus(dateStr: string): "available" | "unavailable" | "past" | "selected" {
    if (isPast(dateStr)) return "past";
    if (roomBooked.includes(dateStr) || roomBlocked.includes(dateStr))
      return "unavailable";
    const isSelected =
      dateStr === checkIn || dateStr === checkOut ||
      (checkIn && checkOut && getDatesInRange(checkIn, checkOut).includes(dateStr));
    if (isSelected) return "selected";
    return "available";
  }

  function handleDateClick(dateStr: string) {
    if (mode === "check-in") {
      if (isUnavailable(dateStr)) return;
      onSelectCheckIn(dateStr);
      onClose();
      return;
    }
    // mode === "check-out"
    if (!checkIn) return;
    if (isPast(dateStr) || dateStr <= checkIn) return;
    if (!isValidCheckoutDate(dateStr)) {
      const range = getDatesInRange(checkIn, dateStr);
      const firstConflict = range.find((d) => roomBooked.includes(d) || roomBlocked.includes(d));
      if (firstConflict) {
        const conflictDate = format(parseISO(firstConflict), "MMM d");
        toast.error(
          `Cannot select this check-out date. The night of ${conflictDate} is already booked.`
        );
      }
      return;
    }
    onSelectCheckOut(dateStr);
    onClose();
  }

  return (
    <div className="p-4">
      <div className="flex items-center justify-between gap-3 pb-4">
        <button
          type="button"
          onClick={() => setBase((b) => subMonths(b, 1))}
          className="flex min-h-touch min-w-touch items-center justify-center rounded-lg text-gray-500 transition-colors hover:bg-gray-100 hover:text-foreground"
          aria-label="Previous month"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h3 className="font-heading text-lg font-semibold text-foreground">
          {format(base, "MMMM yyyy")}
        </h3>
        <button
          type="button"
          onClick={() => setBase((b) => addMonths(b, 1))}
          className="flex min-h-touch min-w-touch items-center justify-center rounded-lg text-gray-500 transition-colors hover:bg-gray-100 hover:text-foreground"
          aria-label="Next month"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center">
        {WEEKDAYS.map((day) => (
          <div key={day} className="py-1 text-xs font-medium text-gray-500">
            {day}
          </div>
        ))}
        {gridDays.map((day) => {
          const dateStr = format(day, "yyyy-MM-dd");
          const status = getCellStatus(dateStr);
          const isCurrentMonth = isSameMonth(day, base);
          const validCheckout =
            mode === "check-out" && checkIn && dateStr > checkIn && isValidCheckoutDate(dateStr);
          const isClickable = status === "available" || validCheckout;

          return (
            <button
              key={dateStr}
              type="button"
              disabled={!isClickable && status !== "selected"}
              onClick={() => handleDateClick(dateStr)}
              className={cn(
                "flex min-h-touch min-w-touch items-center justify-center rounded-lg text-sm font-medium transition-colors",
                !isCurrentMonth && "text-gray-300",
                isCurrentMonth && status === "past" && "cursor-default bg-gray-100 text-gray-400",
                isCurrentMonth && status === "unavailable" && !validCheckout && "cursor-not-allowed bg-gray-100 text-gray-400",
                isCurrentMonth && status === "unavailable" && validCheckout && "ring-2 ring-primary ring-inset hover:bg-primary/10 cursor-pointer bg-gray-100 text-gray-600",
                isCurrentMonth && status === "available" && "hover:bg-primary/10 text-foreground",
                status === "selected" && "bg-primary text-white",
                isClickable && "cursor-pointer"
              )}
            >
              {format(day, "d")}
            </button>
          );
        })}
      </div>
    </div>
  );
}
