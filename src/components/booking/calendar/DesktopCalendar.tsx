"use client";

import { useState, Fragment, useRef } from "react";
import {
  format,
  subMonths,
  addMonths,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  parseISO,
  isBefore,
  isWithinInterval,
} from "date-fns";
import type { DateSelection } from "@/types";
import { useCalendarSync } from "@/hooks/useCalendarSync";
import { useBookingStore } from "@/store/bookingStore";
import { ROOM_CONFIG } from "@/lib/constants/config";
import { cn } from "@/lib/utils/cn";

const MIN_DAY_ROW_WIDTH = 80;
const ROOM_COLUMN_WIDTH = 160;

// Helper function to format ordinal dates (1st, 2nd, 3rd, etc.)
function getOrdinalSuffix(day: number): string {
  if (day > 3 && day < 21) return "th";
  switch (day % 10) {
    case 1:
      return "st";
    case 2:
      return "nd";
    case 3:
      return "rd";
    default:
      return "th";
  }
}

function formatOrdinalDate(date: Date): string {
  const day = date.getDate();
  return `${day}${getOrdinalSuffix(day)}`;
}

interface DesktopCalendarProps {
  onDateSelect: (selection: DateSelection) => void;
}

export function DesktopCalendar({ onDateSelect }: DesktopCalendarProps) {
  const [base, setBase] = useState(() => new Date());
  const [checkIn, setCheckIn] = useState<string | null>(null);
  const [checkOut, setCheckOut] = useState<string | null>(null);
  const [selectingRoom, setSelectingRoom] = useState<number | null>(null);
  const [hoveredDate, setHoveredDate] = useState<string | null>(null);
  const [visibleDaysCount, setVisibleDaysCount] = useState(6);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useCalendarSync();
  const bookedDates = useBookingStore((s) => s.bookedDates);

  const start = startOfMonth(base);
  const end = endOfMonth(base);
  const today = format(new Date(), "yyyy-MM-dd");
  const allDays = eachDayOfInterval({ start, end });
  const allAvailableDays = allDays.filter((d) => format(d, "yyyy-MM-dd") >= today);
  const days = allAvailableDays.slice(0, visibleDaysCount);
  
  const hasMoreDays = visibleDaysCount < allAvailableDays.length;
  const canCollapse = visibleDaysCount > 6;


  const isRangeAvailable = (roomNumber: number, from: string, to: string) => {
    const roomDates = bookedDates[roomNumber] ?? [];
    const range = eachDayOfInterval({
      start: parseISO(from),
      end: parseISO(to),
    });
    return range.every((d) => {
      const str = format(d, "yyyy-MM-dd");
      return !roomDates.includes(str);
    });
  };

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
      setHoveredDate(null);
    } else {
      setCheckOut(date);
      setHoveredDate(null);
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

  const isInHoverRange = (roomNumber: number, date: string) => {
    if (
      !checkIn ||
      checkOut ||
      !hoveredDate ||
      selectingRoom !== roomNumber ||
      date < checkIn ||
      date > hoveredDate
    )
      return false;
    return isRangeAvailable(roomNumber, checkIn, hoveredDate);
  };

  const handleCellMouseEnter = (roomNumber: number, date: string) => {
    if (
      !checkIn ||
      checkOut ||
      selectingRoom !== roomNumber ||
      date <= checkIn ||
      bookedDates[roomNumber]?.includes(date) ||
      date < today
    )
      return;
    if (!isRangeAvailable(roomNumber, checkIn, date)) return;
    setHoveredDate(date);
  };

  const handleGridMouseLeave = () => setHoveredDate(null);

  const gridWidth = MIN_DAY_ROW_WIDTH + ROOM_CONFIG.rooms.length * ROOM_COLUMN_WIDTH;

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
      {/* Header with month nav */}
      <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setBase((b) => subMonths(b, 1))}
            className="flex h-10 w-10 items-center justify-center rounded-lg text-gray-500 transition-colors hover:bg-gray-100 hover:text-foreground"
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
          <h3 className="min-w-[180px] text-center font-heading text-xl font-semibold text-foreground">
            {format(base, "MMMM yyyy")}
          </h3>
          <button
            type="button"
            onClick={() => setBase((b) => addMonths(b, 1))}
            className="flex h-10 w-10 items-center justify-center rounded-lg text-gray-500 transition-colors hover:bg-gray-100 hover:text-foreground"
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
        <div className="flex items-center gap-4 text-xs text-gray-500">
          <span className="flex items-center gap-2">
            <span className="h-4 w-4 rounded border border-gray-300 bg-white" />
            Available
          </span>
          <span className="flex items-center gap-2">
            <span className="h-4 w-4 rounded border border-red-200 bg-red-50" />
            Booked
          </span>
          <span className="flex items-center gap-2">
            <span className="h-4 w-4 rounded border-2 border-primary bg-primary/15" />
            Selected
          </span>
        </div>
      </div>

      {/* Grid */}
      <div
        ref={scrollContainerRef}
        className="overflow-x-auto overflow-y-auto"
        onMouseLeave={handleGridMouseLeave}
      >
        <div
          className="grid border-t border-gray-200 w-fit"
          style={{
            gridTemplateColumns: `${MIN_DAY_ROW_WIDTH}px repeat(${ROOM_CONFIG.rooms.length}, ${ROOM_COLUMN_WIDTH}px)`,
            gridTemplateRows: `48px repeat(${days.length}, 48px)`,
          }}
        >
          {/* Top-left corner */}
          <div className="sticky left-0 top-0 z-20 h-12 border-b border-r border-gray-200 bg-gray-50" />

          {/* Room headers */}
          {ROOM_CONFIG.rooms.map((room, roomIndex) => (
            <div
              key={room.number}
              className={cn(
                "sticky top-0 z-10 flex h-12 flex-col justify-center border-b border-r border-gray-200 bg-gray-50 px-4",
                roomIndex === ROOM_CONFIG.rooms.length - 1 && "border-r-0"
              )}
            >
              <span className="font-medium text-foreground">{room.name}</span>
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
                    "sticky left-0 z-10 flex h-12 items-center justify-center border-b border-r border-gray-200 bg-white px-3",
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
                      {format(d, "EEE").toUpperCase()}
                    </span>
                    <span className="text-sm font-semibold text-foreground">
                      {formatOrdinalDate(d)}
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
                  const inHover = isInHoverRange(room.number, dateStr);
                  const isHoverEnd =
                    !!hoveredDate &&
                    !checkOut &&
                    selectingRoom === room.number &&
                    dateStr === hoveredDate;
                  const isLastCol = roomIndex === ROOM_CONFIG.rooms.length - 1;

                  return (
                    <button
                      key={room.number}
                      type="button"
                      disabled={status === "booked"}
                      onClick={() => handleCellClick(room.number, dateStr)}
                      onMouseEnter={() =>
                        handleCellMouseEnter(room.number, dateStr)
                      }
                      className={cn(
                        "flex h-12 items-center justify-center border-b border-r border-gray-200 text-sm font-medium transition-colors",
                        isLastRow && "border-b-0",
                        isLastCol && "border-r-0",
                        status === "booked" &&
                          "cursor-not-allowed bg-red-100",
                        status === "available" &&
                          "bg-green-100 text-green-700 hover:bg-green-200 hover:border-green-300",
                        (status === "selecting" ||
                          status === "selected" ||
                          isInRange) &&
                          "bg-primary/15 text-primary border-primary/40",
                        inHover &&
                          !isCheckIn &&
                          !isHoverEnd &&
                          "bg-primary/10 text-primary border-primary/30",
                        isHoverEnd &&
                          "bg-primary/20 text-primary border-primary/40 rounded-b-md",
                        isCheckIn && "rounded-t-md bg-primary/20",
                        isCheckOut && "rounded-b-md bg-primary/20"
                      )}
                    >
                    </button>
                  );
                })}
              </Fragment>
            );
          })}
        </div>
      </div>

      <div className="border-t border-gray-200 px-6 py-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <p className="text-xs text-gray-500">
        Click a date to set check-in, then click a later date to set check-out.
        You’ll be taken to the booking page to complete your details.
      </p>
          {(hasMoreDays || canCollapse) && (
            <div className="flex items-center gap-3 flex-shrink-0">
              {hasMoreDays && (
                <button
                  type="button"
                  onClick={() => setVisibleDaysCount(allAvailableDays.length)}
                  className="text-xs font-medium text-primary hover:text-primary/80 transition-colors whitespace-nowrap"
                >
                  See more dates ({visibleDaysCount}/{allAvailableDays.length})
                </button>
              )}
              {canCollapse && (
                <button
                  type="button"
                  onClick={() => {
                    setVisibleDaysCount(6);
                    // Scroll back to top of grid when collapsing
                    setTimeout(() => {
                      if (scrollContainerRef.current) {
                        scrollContainerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
                        scrollContainerRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                      }
                    }, 100);
                  }}
                  className="text-xs font-medium text-gray-600 hover:text-gray-800 transition-colors whitespace-nowrap"
                >
                  Collapse
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
