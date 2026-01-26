"use client";

import { useState } from "react";
import { format, addMonths, parseISO, isBefore } from "date-fns";
import type { DateSelection } from "@/types";
import { useCalendarSync } from "@/hooks/useCalendarSync";
import { useBookingStore } from "@/store/bookingStore";
import { RoomSelector } from "./RoomSelector";
import { Button } from "@/components/ui/Button";

interface MobileCalendarProps {
  onDateSelect: (selection: DateSelection) => void;
  initialRoom?: number;
}

export function MobileCalendar({
  onDateSelect,
  initialRoom = 1,
}: MobileCalendarProps) {
  const [selectedRoom, setSelectedRoom] = useState(initialRoom);
  const [checkIn, setCheckIn] = useState<string | null>(null);
  const [checkOut, setCheckOut] = useState<string | null>(null);
  const [viewYear, setViewYear] = useState(() => new Date().getFullYear());
  const [viewMonth, setViewMonth] = useState(() => new Date().getMonth() + 1);

  useCalendarSync();
  const bookedDates = useBookingStore((s) => s.bookedDates);

  const handleDateTap = (date: string) => {
    const roomDates = bookedDates[selectedRoom] ?? [];
    if (roomDates.includes(date)) return;

    if (!checkIn) {
      setCheckIn(date);
    } else if (!checkOut) {
      const d = parseISO(date);
      const ci = parseISO(checkIn);
      if (isBefore(d, ci) || date === checkIn) {
        setCheckIn(date);
        setCheckOut(null);
      } else {
        setCheckOut(date);
        onDateSelect({
          roomNumber: selectedRoom,
          checkIn,
          checkOut: date,
        });
      }
    } else {
      setCheckIn(date);
      setCheckOut(null);
    }
  };

  const start = new Date(viewYear, viewMonth - 1, 1);
  const end = new Date(viewYear, viewMonth, 0);
  const today = format(new Date(), "yyyy-MM-dd");
  const allDays: string[] = [];
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    allDays.push(format(d, "yyyy-MM-dd"));
  }
  const days = allDays.filter((date) => date >= today);

  const roomDates = bookedDates[selectedRoom] ?? [];

  return (
    <div className="flex flex-col">
      <div className="sticky top-0 z-10 border-b bg-white">
        <RoomSelector selectedRoom={selectedRoom} onSelect={setSelectedRoom} />
      </div>

      {checkIn && !checkOut && (
        <div className="border-b bg-blue-50 px-4 py-3">
          <p className="text-sm font-medium text-blue-900">
            Select check-out date
          </p>
        </div>
      )}
      {checkIn && checkOut && (
        <div className="border-b bg-blue-50 px-4 py-3">
          <p className="text-sm font-medium text-blue-900">
            {format(parseISO(checkIn), "MMM dd")} –{" "}
            {format(parseISO(checkOut), "MMM dd")}
          </p>
        </div>
      )}

      <div className="flex gap-2 px-4 py-2">
        <button
          type="button"
          onClick={() => {
            if (viewMonth === 1) {
              setViewYear((y) => y - 1);
              setViewMonth(12);
            } else setViewMonth((m) => m - 1);
          }}
          className="min-h-touch min-w-touch rounded-lg bg-gray-100 px-3 text-sm font-medium"
        >
          ← Prev
        </button>
        <span className="flex flex-1 items-center justify-center text-sm font-medium">
          {format(new Date(viewYear, viewMonth - 1), "MMMM yyyy")}
        </span>
        <button
          type="button"
          onClick={() => {
            if (viewMonth === 12) {
              setViewYear((y) => y + 1);
              setViewMonth(1);
            } else setViewMonth((m) => m + 1);
          }}
          className="min-h-touch min-w-touch rounded-lg bg-gray-100 px-3 text-sm font-medium"
        >
          Next →
        </button>
      </div>

      <div className="max-h-[40vh] overflow-y-auto px-4 pb-4">
        <div className="grid grid-cols-7 gap-2">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
            <div
              key={d}
              className="py-1 text-center text-xs font-medium text-gray-500"
            >
              {d}
            </div>
          ))}
          {days.map((date) => {
            const dayNum = date.slice(-2);
            const isBooked = roomDates.includes(date);
            const isSelected =
              date === checkIn ||
              date === checkOut ||
              (checkIn && checkOut && date >= checkIn && date <= checkOut);

            return (
              <button
                key={date}
                type="button"
                disabled={isBooked}
                onClick={() => handleDateTap(date)}
                className={`calendar-cell ${
                  isBooked
                    ? "calendar-cell-booked"
                    : isSelected
                      ? "calendar-cell-selected"
                      : "calendar-cell-available"
                }`}
              >
                {dayNum}
              </button>
            );
          })}
        </div>
      </div>

      {checkIn && checkOut && (
        <div className="sticky bottom-0 border-t bg-white p-4">
          <Button
            fullWidth
            size="lg"
            onClick={() =>
              onDateSelect({
                roomNumber: selectedRoom,
                checkIn,
                checkOut,
              })
            }
          >
            Continue to Booking
          </Button>
        </div>
      )}
    </div>
  );
}
