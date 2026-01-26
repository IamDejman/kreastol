"use client";

import { useState, Fragment } from "react";
import {
  format,
  addMonths,
  subMonths,
  parseISO,
  isBefore,
  isWithinInterval,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
} from "date-fns";
import type { DateSelection } from "@/types";
import { useCalendarSync } from "@/hooks/useCalendarSync";
import { useBookingStore } from "@/store/bookingStore";
import { ROOM_CONFIG } from "@/lib/constants/config";
import { cn } from "@/lib/utils/cn";

interface MobileCalendarProps {
  onDateSelect: (selection: DateSelection) => void;
  initialRoom?: number;
}

export function MobileCalendar({
  onDateSelect,
  initialRoom = 1,
}: MobileCalendarProps) {
  const [base, setBase] = useState(() => new Date());
  const [checkIn, setCheckIn] = useState<string | null>(null);
  const [checkOut, setCheckOut] = useState<string | null>(null);
  const [selectingRoom, setSelectingRoom] = useState<number | null>(null);

  useCalendarSync();
  const bookedDates = useBookingStore((s) => s.bookedDates);

  const start = startOfMonth(base);
  const end = endOfMonth(base);
  const today = format(new Date(), "yyyy-MM-dd");
  const allDays = eachDayOfInterval({ start, end });
  const days = allDays.filter((d) => format(d, "yyyy-MM-dd") >= today);

  const handleCellClick = (roomNumber: number, date: string) => {
    const roomDates = bookedDates[roomNumber] ?? [];
    if (roomDates.includes(date) || date < today) return;

    if (!selectingRoom) {
      setSelectingRoom(roomNumber);
      setCheckIn(date);
      setCheckOut(null);
      return;
    }

    if (selectingRoom !== roomNumber) return;

    const d = parseISO(date);
    const ci = parseISO(checkIn!);

    if (isBefore(d, ci) || date === checkIn!) {
      setCheckIn(date);
      setCheckOut(null);
    } else {
      setCheckOut(date);
      onDateSelect({
        roomNumber: selectingRoom,
        checkIn: checkIn!,
        checkOut: date,
      });
      setSelectingRoom(null);
      setCheckIn(null);
      setCheckOut(null);
    }
  };

  const getStatus = (
    roomNumber: number,
    date: string
  ): "available" | "booked" | "selecting" | "selected" => {
    const roomDates = bookedDates[roomNumber] ?? [];
    if (roomDates.includes(date) || date < today) return "booked";
    if (selectingRoom !== roomNumber) return "available";

    if (date === checkIn) return "selected";
    if (checkOut && date === checkOut) return "selected";
    if (
      checkIn &&
      checkOut &&
      isWithinInterval(parseISO(date), {
        start: parseISO(checkIn),
        end: parseISO(checkOut),
      })
    )
      return "selecting";

    return "available";
  };

  return (
    <div className="flex flex-col">
      {/* Month navigation */}
      <div className="flex items-center justify-between border-b bg-white px-4 py-3">
        <button
          type="button"
          onClick={() => setBase((b) => subMonths(b, 1))}
          className="min-h-touch min-w-touch rounded-lg bg-gray-100 px-3 text-sm font-medium"
        >
          ← Prev
        </button>
        <span className="flex flex-1 items-center justify-center text-sm font-medium">
          {format(base, "MMMM yyyy")}
        </span>
        <button
          type="button"
          onClick={() => setBase((b) => addMonths(b, 1))}
          className="min-h-touch min-w-touch rounded-lg bg-gray-100 px-3 text-sm font-medium"
        >
          Next →
        </button>
      </div>

      {/* Selection status */}
      {checkIn && !checkOut && selectingRoom && (
        <div className="border-b bg-blue-50 px-4 py-3">
          <p className="text-sm font-medium text-blue-900">
            Select check-out date for {ROOM_CONFIG.rooms.find((r) => r.number === selectingRoom)?.name}
          </p>
        </div>
      )}
      {checkIn && checkOut && selectingRoom && (
        <div className="border-b bg-blue-50 px-4 py-3">
          <p className="text-sm font-medium text-blue-900">
            {format(parseISO(checkIn), "MMM dd")} –{" "}
            {format(parseISO(checkOut), "MMM dd")} •{" "}
            {ROOM_CONFIG.rooms.find((r) => r.number === selectingRoom)?.name}
          </p>
        </div>
      )}

      {/* All rooms calendar */}
      <div className="max-h-[60vh] overflow-y-auto">
        {ROOM_CONFIG.rooms.map((room) => {
          const roomDates = bookedDates[room.number] ?? [];
          const isSelecting = selectingRoom === room.number;

          return (
            <Fragment key={room.number}>
              {/* Room header */}
              <div className="sticky top-0 z-10 border-b border-t bg-gray-50 px-4 py-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-medium text-foreground">
                      {room.name}
                    </span>
                    <span className="ml-2 text-xs text-gray-500">
                      ₦{room.rate.toLocaleString()}/night
                    </span>
                  </div>
                  {isSelecting && (
                    <span className="text-xs font-medium text-primary">
                      Selecting...
                    </span>
                  )}
                </div>
              </div>

              {/* Calendar grid for this room */}
              <div className="px-4 py-4">
                <div className="grid grid-cols-7 gap-2">
                  {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(
                    (d) => (
                      <div
                        key={d}
                        className="py-1 text-center text-xs font-medium text-gray-500"
                      >
                        {d}
                      </div>
                    )
                  )}
                  {days.map((d) => {
                    const dateStr = format(d, "yyyy-MM-dd");
                    const status = getStatus(room.number, dateStr);
                    const isCheckIn =
                      selectingRoom === room.number && dateStr === checkIn;
                    const isCheckOut =
                      selectingRoom === room.number && dateStr === checkOut;
                    const isInRange =
                      !!checkIn &&
                      !!checkOut &&
                      selectingRoom === room.number &&
                      dateStr > checkIn &&
                      dateStr < checkOut;

                    return (
                      <button
                        key={dateStr}
                        type="button"
                        disabled={status === "booked"}
                        onClick={() => handleCellClick(room.number, dateStr)}
                        className={cn(
                          "calendar-cell",
                          status === "booked" && "calendar-cell-booked",
                          status === "available" && "calendar-cell-available",
                          (status === "selecting" ||
                            status === "selected" ||
                            isInRange) && "calendar-cell-selected",
                          isCheckIn && "rounded-l-lg",
                          isCheckOut && "rounded-r-lg"
                        )}
                      >
                        {format(d, "d")}
                      </button>
                    );
                  })}
                </div>
              </div>
            </Fragment>
          );
        })}
      </div>

      {/* Instructions */}
      <div className="border-t bg-white px-4 py-3">
        <p className="text-xs text-gray-500">
          Tap a date to set check-in, then tap a later date to set check-out.
        </p>
      </div>
    </div>
  );
}
