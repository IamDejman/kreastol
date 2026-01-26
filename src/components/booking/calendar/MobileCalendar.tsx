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

const MIN_DAY_ROW_WIDTH = 70; // Width for day label column
const ROOM_COLUMN_WIDTH = 120; // Smaller for mobile

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

  const gridWidth = MIN_DAY_ROW_WIDTH + ROOM_CONFIG.rooms.length * ROOM_COLUMN_WIDTH;

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
      {/* Header with month nav */}
      <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setBase((b) => subMonths(b, 1))}
            className="flex h-10 w-10 items-center justify-center rounded-lg text-gray-500 transition-colors active:bg-gray-100 min-h-touch min-w-touch"
            aria-label="Previous month"
          >
            <svg
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button>
          <h3 className="min-w-[140px] text-center font-heading text-lg font-semibold text-foreground">
            {format(base, "MMMM yyyy")}
          </h3>
          <button
            type="button"
            onClick={() => setBase((b) => addMonths(b, 1))}
            className="flex h-10 w-10 items-center justify-center rounded-lg text-gray-500 transition-colors active:bg-gray-100 min-h-touch min-w-touch"
            aria-label="Next month"
          >
            <svg
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </button>
        </div>
      </div>

      {/* Selection status */}
      {checkIn && !checkOut && selectingRoom && (
        <div className="border-b bg-blue-50 px-4 py-2">
          <p className="text-xs font-medium text-blue-900">
            Select check-out date for {ROOM_CONFIG.rooms.find((r) => r.number === selectingRoom)?.name}
          </p>
        </div>
      )}

      {/* Grid - transposed structure */}
      <div className="overflow-x-auto overflow-y-auto">
        <div
          className="grid border-t border-gray-200"
          style={{
            width: gridWidth,
            gridTemplateColumns: `${MIN_DAY_ROW_WIDTH}px repeat(${ROOM_CONFIG.rooms.length}, ${ROOM_COLUMN_WIDTH}px)`,
            gridTemplateRows: `auto repeat(${days.length}, 1fr)`,
          }}
        >
          {/* Top-left corner */}
          <div className="sticky left-0 top-0 z-20 border-b border-r border-gray-200 bg-gray-50" />

          {/* Room headers */}
          {ROOM_CONFIG.rooms.map((room, roomIndex) => (
            <div
              key={room.number}
              className={cn(
                "sticky top-0 z-10 flex flex-col justify-center border-b border-r border-gray-200 bg-gray-50 px-3 py-2",
                roomIndex === ROOM_CONFIG.rooms.length - 1 && "border-r-0"
              )}
            >
              <span className="text-sm font-medium text-foreground">
                {room.name}
              </span>
              <span className="text-xs text-gray-500">
                ₦{room.rate.toLocaleString()}/night
              </span>
            </div>
          ))}

          {/* Day rows */}
          {days.map((d, dayIndex) => {
            const dateStr = format(d, "yyyy-MM-dd");
            const isLastRow = dayIndex === days.length - 1;

            return (
              <Fragment key={dateStr}>
                {/* Day label */}
                <div
                  className={cn(
                    "sticky left-0 z-10 flex items-center justify-center border-b border-r border-gray-200 bg-white px-2 py-2",
                    isLastRow && "border-b-0"
                  )}
                >
                  <div className="flex flex-col items-center">
                    <span
                      className={cn(
                        "text-xs font-medium uppercase",
                        dateStr === today ? "text-primary" : "text-gray-500"
                      )}
                    >
                      {format(d, "EEE")}
                    </span>
                    <span className="text-sm font-semibold text-foreground">
                      {format(d, "d")}
                    </span>
                  </div>
                </div>

                {/* Room cells for this day */}
                {ROOM_CONFIG.rooms.map((room, roomIndex) => {
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
                  const isLastCol = roomIndex === ROOM_CONFIG.rooms.length - 1;

                  return (
                    <button
                      key={room.number}
                      type="button"
                      disabled={status === "booked"}
                      onClick={() => handleCellClick(room.number, dateStr)}
                      className={cn(
                        "flex h-14 items-center justify-center border-b border-r border-gray-200 text-sm font-medium transition-colors min-h-touch",
                        isLastRow && "border-b-0",
                        isLastCol && "border-r-0",
                        status === "booked" &&
                          "cursor-not-allowed bg-red-50/80 text-red-400",
                        status === "available" &&
                          "bg-white text-foreground active:bg-primary/10",
                        (status === "selecting" ||
                          status === "selected" ||
                          isInRange) &&
                          "bg-primary/15 text-primary border-primary/40",
                        isCheckIn && "rounded-t-md bg-primary/20",
                        isCheckOut && "rounded-b-md bg-primary/20"
                      )}
                    >
                      {format(d, "d")}
                    </button>
                  );
                })}
              </Fragment>
            );
          })}
        </div>
      </div>

      {/* Instructions */}
      <div className="border-t border-gray-200 px-4 py-3">
        <p className="text-xs text-gray-500">
          Tap a date to set check-in, then tap a later date to set check-out.
        </p>
      </div>
    </div>
  );
}
