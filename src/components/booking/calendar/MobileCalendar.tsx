"use client";

import { useState, Fragment, useRef, useEffect } from "react";
import {
  format,
  addMonths,
  subMonths,
  subDays,
  addDays,
  parseISO,
  isBefore,
  isWithinInterval,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  startOfWeek,
} from "date-fns";
import { getDatesInRange } from "@/lib/utils/dateUtils";
import type { DateSelection, Booking } from "@/types";
import { useCalendarSync } from "@/hooks/useCalendarSync";
import { useBookingStore } from "@/store/bookingStore";
import { ROOM_CONFIG } from "@/lib/constants/config";
import { cn } from "@/lib/utils/cn";
import { Modal } from "@/components/ui/Modal";
import { formatCurrency } from "@/lib/utils/formatters";
import { Badge } from "@/components/ui/Badge";
import { useAuthStore } from "@/store/authStore";
import { useToast } from "@/components/ui/Toast";
import { supabaseService } from "@/lib/services/supabaseService";

const MIN_DAY_ROW_WIDTH = 70; // Width for day label column
const ROOM_COLUMN_WIDTH = 120; // Smaller for mobile
const DAYS_PER_VIEW = 7; // Always show full weeks (Sun-Sat)

function formatOrdinalDate(date: Date): string {
  const day = date.getDate();
  return `${day}`;
}

interface MobileCalendarProps {
  onDateSelect: (selection: DateSelection) => void;
  initialRoom?: number;
  /**
   * Optional max height for the scrollable grid container (e.g. "70vh" or 400).
   * When provided, the calendar body becomes vertically scrollable while headers stay sticky.
   */
  maxHeight?: string | number;
}

export function MobileCalendar({
  onDateSelect,
  initialRoom = 1,
  maxHeight,
}: MobileCalendarProps) {
  const [base, setBase] = useState(() => new Date());
  const [checkIn, setCheckIn] = useState<string | null>(null);
  const [checkOut, setCheckOut] = useState<string | null>(null);
  const [selectingRoom, setSelectingRoom] = useState<number | null>(null);
  const [hoveredCell, setHoveredCell] = useState<{ room: number; date: string } | null>(null);
  const [viewMode, setViewMode] = useState<"week" | "all">("week");
  const [selectedWeekKey, setSelectedWeekKey] = useState<string | null>(null);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [blockedOverlay, setBlockedOverlay] = useState<{
    roomNumber: number;
    dates: string[];
    reason: string | null;
  } | null>(null);
  const [isBlockedOverlayLoading, setIsBlockedOverlayLoading] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const weekAnchorRef = useRef<HTMLDivElement | null>(null);
  const [activeLegend, setActiveLegend] = useState<
    "available" | "booked" | "selected" | "blocked" | null
  >(null);

  useCalendarSync();
  const toast = useToast();
  const bookedDates = useBookingStore((s) => s.bookedDates);
  const bookings = useBookingStore((s) => s.bookings);
  const isRoomBlocked = useBookingStore((s) => s.isRoomBlocked);
  const unblockRoom = useBookingStore((s) => s.unblockRoom);
  const user = useAuthStore((s) => s.user);
  const isStaff = user && (user.role === "owner" || user.role === "receptionist");

  const start = startOfMonth(base);
  const end = endOfMonth(base);
  const todayDate = new Date();
  const today = format(todayDate, "yyyy-MM-dd");
  const allDays = eachDayOfInterval({ start, end });

  // Audit: staff viewed calendar
  const hasLoggedViewRef = useRef(false);
  useEffect(() => {
    if (!isStaff || !user || hasLoggedViewRef.current) return;
    hasLoggedViewRef.current = true;
    supabaseService
      .createAuditLog({
        actorId: user.dbId,
        actorName: user.name,
        actorRole: user.role,
        action: "view_calendar",
        context: "mobile",
      })
      .catch((error) => {
        console.error("Failed to write audit log (view_calendar mobile):", error);
      });
  }, [isStaff, user]);

  // Build Sunday–Saturday weeks for the month (clamped to month boundaries)
  const firstWeekStart = startOfWeek(start, { weekStartsOn: 0 });
  type WeekSegment = { start: Date; end: Date; key: string };
  const weeks: WeekSegment[] = [];
  let cursor = firstWeekStart;

  while (cursor <= end) {
    const weekStart = cursor < start ? start : cursor;
    const weekEndCandidate = addDays(cursor, 6);
    const weekEnd = weekEndCandidate > end ? end : weekEndCandidate;
    weeks.push({
      start: weekStart,
      end: weekEnd,
      key: `${format(weekStart, "yyyy-MM-dd")}_${format(weekEnd, "yyyy-MM-dd")}`,
    });
    cursor = addDays(cursor, 7);
  }

  // Determine active week: either user-selected, or the one containing today, or the first week
  const findWeekByKey = (key: string | null): WeekSegment | null => {
    if (!key) return null;
    return weeks.find((w) => w.key === key) ?? null;
  };

  const selectedWeek = findWeekByKey(selectedWeekKey);

  const weekContainingToday =
    base.getFullYear() === todayDate.getFullYear() &&
    base.getMonth() === todayDate.getMonth()
      ? weeks.find(
          (w) => todayDate >= w.start && todayDate <= w.end
        ) ?? null
      : null;

  const anchorWeekForAll: WeekSegment | null =
    selectedWeek || weekContainingToday || weeks[0] || null;

  const activeWeek: WeekSegment | null =
    viewMode === "week"
      ? selectedWeek || weekContainingToday || weeks[0] || null
      : null;

  const anchorDateForAll = anchorWeekForAll?.start ?? null;

  const days =
    viewMode === "all" || !activeWeek
      ? allDays
      : eachDayOfInterval({ start: activeWeek.start, end: activeWeek.end });

  // Find booking for a specific room and date
  const findBookingForDate = (roomNumber: number, dateStr: string): Booking | null => {
    const date = parseISO(dateStr);
    return bookings.find((booking) => {
      if (booking.roomNumber !== roomNumber) return false;
      const checkIn = parseISO(booking.checkIn);
      const checkOut = parseISO(booking.checkOut);
      // Date is within booking range (inclusive of check-in, exclusive of check-out)
      return date >= checkIn && date < checkOut;
    }) || null;
  };

  const handleCellClick = (roomNumber: number, date: string) => {
    // If staff clicks on a blocked cell, show overlay with details
    if (isRoomBlocked(roomNumber, date) && isStaff) {
      openBlockedOverlay(roomNumber, date);
      return;
    }
    
    // Don't allow interaction with blocked rooms for non-staff
    if (isRoomBlocked(roomNumber, date)) return;
    
    const roomDates = bookedDates[roomNumber] ?? [];
    
    // If cell is booked, show booking details
    if (roomDates.includes(date) || date < today) {
      const booking = findBookingForDate(roomNumber, date);
      if (booking) {
        setSelectedBooking(booking);
      }
      return;
    }

    if (!selectingRoom) {
      setSelectingRoom(roomNumber);
      setCheckIn(date);
      setCheckOut(null);
      return;
    }

    if (selectingRoom !== roomNumber) return;

    const d = parseISO(date);
    const ci = parseISO(checkIn!);

    // Allow deselection: clicking on check-out deselects it
    if (checkOut && date === checkOut) {
      setCheckOut(null);
      setHoveredCell(null);
      return;
    }

    // Allow deselection: clicking on check-in deselects everything
    if (date === checkIn) {
      setSelectingRoom(null);
      setCheckIn(null);
      setCheckOut(null);
      setHoveredCell(null);
      return;
    }

    if (isBefore(d, ci)) {
      setCheckIn(date);
      setCheckOut(null);
    } else {
      // Validate that the selected range doesn't conflict with existing bookings
      // Bookings are tied to nights, so check-in 26th and check-out 28th means occupying nights of 26th and 27th
      // But check-in 26th and check-out 27th only occupies the night of 26th (no conflict with 27th booking)
      const range = getDatesInRange(checkIn!, date);
      const roomDates = bookedDates[selectingRoom] ?? [];
      const conflictingDates = range.filter((d) => roomDates.includes(d));
      
      if (conflictingDates.length > 0) {
        // Find the first conflicting date to suggest the latest valid checkout
        const firstConflict = conflictingDates[0];
        const conflictDate = parseISO(firstConflict);
        // The latest checkout is the conflict date itself (since checkout date is not occupied)
        const latestCheckout = format(conflictDate, "MMM dd, yyyy");
        toast.error(`Cannot select checkout date. Check-out on ${format(new Date(date), "MMM dd")} would require occupying the night of ${format(conflictDate, "MMM dd")}, which is already booked. Latest available check-out: ${latestCheckout}.`);
        return;
      }
      
      // Also check blocked dates
      const blockedDates = useBookingStore.getState().blockedRooms[selectingRoom] || [];
      const blockedInRange = range.filter((d) => blockedDates.includes(d));
      
      if (blockedInRange.length > 0) {
        const firstBlocked = parseISO(blockedInRange[0]);
        // The latest checkout is the blocked date itself (since checkout date is not occupied)
        const latestCheckout = format(firstBlocked, "MMM dd, yyyy");
        toast.error(`Cannot select checkout date. Check-out on ${format(new Date(date), "MMM dd")} would require occupying the night of ${format(firstBlocked, "MMM dd")}, which is blocked. Latest available check-out: ${latestCheckout}.`);
        return;
      }
      
      setCheckOut(date);
      setHoveredCell(null); // Clear hover cue when booking is completed
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
  ): "available" | "booked" | "selecting" | "selected" | "blocked" | "past" => {
    // Check if room is blocked first
    if (isRoomBlocked(roomNumber, date)) return "blocked";
    
    const roomDates = bookedDates[roomNumber] ?? [];
    // Only show as booked if there is an actual booking
    if (roomDates.includes(date)) return "booked";
    // Past dates without bookings should be non-selectable and neutral
    if (date < today) return "past";
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

  const openBlockedOverlay = async (roomNumber: number, date: string) => {
    try {
      setIsBlockedOverlayLoading(true);

      const response = await fetch(
        `/api/blocked-rooms?roomNumber=${encodeURIComponent(roomNumber)}`
      );

      if (!response.ok) {
        const error = await response.json();
        toast.error(error.error || "Failed to load blocked room details");
        return;
      }

      const data = await response.json();
      const details =
        (data.blockedRoomDetails?.[roomNumber] as
          | { date: string; reason: string | null }[]
          | undefined) || [];

      if (!details.length) {
        toast.error("No blocked dates found for this room");
        return;
      }

      const sorted = [...details].sort((a, b) => a.date.localeCompare(b.date));
      const targetIndex = sorted.findIndex((d) => d.date === date);

      if (targetIndex === -1) {
        toast.error("Blocked date details not found");
        return;
      }

      const baseReason = sorted[targetIndex].reason ?? null;
      const group: { date: string; reason: string | null }[] = [sorted[targetIndex]];

      // Expand backwards
      for (let i = targetIndex - 1; i >= 0; i--) {
        const current = sorted[i];
        const next = sorted[i + 1];
        const currentDate = parseISO(current.date);
        const nextDate = parseISO(next.date);
        const diffDays =
          (nextDate.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24);
        if (diffDays !== 1 || current.reason !== baseReason) break;
        group.unshift(current);
      }

      // Expand forwards
      for (let i = targetIndex + 1; i < sorted.length; i++) {
        const prev = sorted[i - 1];
        const current = sorted[i];
        const prevDate = parseISO(prev.date);
        const currentDate = parseISO(current.date);
        const diffDays =
          (currentDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24);
        if (diffDays !== 1 || current.reason !== baseReason) break;
        group.push(current);
      }

      const groupDates = group.map((g) => g.date);

      setBlockedOverlay({
        roomNumber,
        dates: groupDates,
        reason: baseReason,
      });

      // Audit: staff viewed blocked-room detail from calendar
      if (isStaff && user) {
        const first = groupDates[0];
        const last = groupDates[groupDates.length - 1];
        const rangeLabel =
          groupDates.length === 1 ? first : `${first} - ${last}`;
        supabaseService
          .createAuditLog({
            actorId: user.dbId,
            actorName: user.name,
            actorRole: user.role,
            action: "view_blocked_room_detail",
            context: `room ${roomNumber}: ${rangeLabel}`,
          })
          .catch((error) => {
            console.error(
              "Failed to write audit log (view_blocked_room_detail mobile):",
              error
            );
          });
      }
    } catch (error: any) {
      console.error("Error loading blocked room details:", error);
      toast.error(error?.message || "Failed to load blocked room details");
    } finally {
      setIsBlockedOverlayLoading(false);
    }
  };

  const handleUnblockFromOverlay = async (roomNumber: number, dates: string[]) => {
    if (!dates.length) return;
    try {
      const actor = user
        ? { id: user.dbId, name: user.name, role: user.role }
        : undefined;
      await unblockRoom(roomNumber, dates, actor);
      await useBookingStore.getState().fetchBookings();
      setBlockedOverlay(null);
      toast.success("Room unblocked successfully");
    } catch (error: any) {
      console.error("Error unblocking room from overlay:", error);
      toast.error(error?.message || "Failed to unblock room");
    }
  };

  // Helper to find booking for a date and determine if it's check-in, check-out, or middle
  const getBookingPosition = (roomNumber: number, dateStr: string): {
    booking: Booking | null;
    isCheckIn: boolean;
    isCheckOut: boolean;
    isMiddle: boolean;
  } => {
    const booking = findBookingForDate(roomNumber, dateStr);
    if (!booking) {
      return { booking: null, isCheckIn: false, isCheckOut: false, isMiddle: false };
    }
    const date = parseISO(dateStr);
    const checkIn = parseISO(booking.checkIn);
    const checkOut = parseISO(booking.checkOut);
    const isCheckIn = format(date, "yyyy-MM-dd") === format(checkIn, "yyyy-MM-dd");
    const isCheckOut = format(date, "yyyy-MM-dd") === format(checkOut, "yyyy-MM-dd");
    const isMiddle = !isCheckIn && !isCheckOut && date > checkIn && date < checkOut;
    return { booking, isCheckIn, isCheckOut, isMiddle };
  };

  const REVENUE_COLUMN_WIDTH = 100;
  const gridWidth = MIN_DAY_ROW_WIDTH + ROOM_CONFIG.rooms.length * ROOM_COLUMN_WIDTH + REVENUE_COLUMN_WIDTH;

  // Calculate daily revenue
  const getDailyRevenue = (dateStr: string): number => {
    return bookings
      .filter((booking) => {
        // Check if date falls within booking range (excluding checkout date)
        const date = parseISO(dateStr);
        const checkIn = parseISO(booking.checkIn);
        const checkOut = parseISO(booking.checkOut);
        // Include check-in date, exclude check-out date
        return date >= checkIn && date < checkOut;
      })
      .reduce((sum, booking) => {
        // Calculate daily portion of booking amount
        const dailyAmount = booking.nights > 0 ? booking.totalAmount / booking.nights : 0;
        return sum + dailyAmount;
      }, 0);
  };

  // Calculate total monthly revenue for all days in the month
  const getTotalRevenue = (): number => {
    return allDays.reduce((sum, day) => {
      const dateStr = format(day, "yyyy-MM-dd");
      return sum + getDailyRevenue(dateStr);
    }, 0);
  };

  const handleCellMouseEnter = (roomNumber: number, date: string) => {
    // Track hovered cell for showing cues - set immediately for all cells
    setHoveredCell({ room: roomNumber, date });
  };

  const handleCellTouchStart = (e: React.TouchEvent, roomNumber: number, date: string) => {
    // Track touched cell for showing cues on mobile
    setHoveredCell({ room: roomNumber, date });
  };

  const handleGridMouseLeave = () => {
    setHoveredCell(null);
  };

  const handleCellTouchEnd = () => {
    // Keep cue visible briefly after touch ends
    setTimeout(() => {
      setHoveredCell(null);
    }, 500);
  };

  // UI helpers for week selection and scrolling
  const isTodayInWeek = (week: { start: Date; end: Date }) =>
    todayDate >= week.start && todayDate <= week.end;

  // Audit: staff viewed booking details from calendar
  useEffect(() => {
    if (!isStaff || !user || !selectedBooking) return;
    supabaseService
      .createAuditLog({
        actorId: user.dbId,
        actorName: user.name,
        actorRole: user.role,
        action: "view_booking_from_calendar",
        context: selectedBooking.bookingCode,
      })
      .catch((error) => {
        console.error(
          "Failed to write audit log (view_booking_from_calendar mobile):",
          error
        );
      });
  }, [isStaff, user, selectedBooking]);

  useEffect(() => {
    if (viewMode === "all" && weekAnchorRef.current && scrollContainerRef.current) {
      // Keep the anchor week (current/selected) in view when showing all days
      weekAnchorRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [viewMode, base, selectedWeekKey]);

  const legendDescriptions: Record<NonNullable<typeof activeLegend>, string> = {
    available: "Available",
    booked: "Not available",
    selected: "Selected",
    blocked: "Blocked",
  };

  return (
    <div className="rounded-2xl border border-gray-200 bg-white shadow-sm w-full overflow-hidden">
      <div className="overflow-x-auto">
        <div
          className="inline-block align-top"
          style={{ minWidth: gridWidth }}
        >
          {/* Header with month nav */}
          <div 
        className="flex items-center justify-between border-b border-gray-200 py-3 relative"
      >
        <div className="flex items-center gap-2 px-4">
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
        <div 
          className="flex flex-col items-end gap-1 text-xs text-gray-500 px-3"
          style={{ position: "absolute", right: 0 }}
        >
          <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() =>
              setActiveLegend((prev) =>
                prev === "available" ? null : "available"
              )
            }
            className={cn(
              "flex items-center gap-1.5 rounded-full px-1.5 py-0.5 transition-colors",
              activeLegend === "available"
                ? "bg-green-100/70"
                : "bg-transparent"
            )}
          >
            <span className="h-3.5 w-3.5 rounded border border-gray-300 bg-green-100" />
            <span className="hidden sm:inline">Available</span>
          </button>
          <button
            type="button"
            onClick={() =>
              setActiveLegend((prev) => (prev === "booked" ? null : "booked"))
            }
            className={cn(
              "flex items-center gap-1.5 rounded-full px-1.5 py-0.5 transition-colors",
              activeLegend === "booked"
                ? "bg-red-100/80"
                : "bg-transparent"
            )}
          >
            <span className="h-3.5 w-3.5 rounded border border-red-200 bg-red-50" />
            <span className="hidden sm:inline">Booked</span>
          </button>
          <button
            type="button"
            onClick={() =>
              setActiveLegend((prev) =>
                prev === "selected" ? null : "selected"
              )
            }
            className={cn(
              "flex items-center gap-1.5 rounded-full px-1.5 py-0.5 transition-colors",
              activeLegend === "selected"
                ? "bg-primary/10"
                : "bg-transparent"
            )}
          >
            <span className="h-3.5 w-3.5 rounded border border-gray-300 bg-primary/15" />
            <span className="hidden sm:inline">Selected</span>
          </button>
          <button
            type="button"
            onClick={() =>
              setActiveLegend((prev) =>
                prev === "blocked" ? null : "blocked"
              )
            }
            className={cn(
              "flex items-center gap-1.5 rounded-full px-1.5 py-0.5 transition-colors",
              activeLegend === "blocked"
                ? "bg-orange-200/80"
                : "bg-transparent"
            )}
          >
            <span className="h-3.5 w-3.5 rounded border border-orange-300 bg-orange-200" />
            <span className="hidden sm:inline">Blocked</span>
          </button>
          </div>
          {activeLegend && (
            <p className="max-w-[11rem] text-[11px] leading-snug text-gray-500 sm:hidden text-right">
              {legendDescriptions[activeLegend]}
            </p>
          )}
        </div>
          </div>

          {/* Selection status */}
          {checkIn && !checkOut && selectingRoom && (
        <div 
          className="border-b bg-blue-50 px-4 py-2"
        >
          <p className="text-xs font-medium text-blue-900">
            Select check-out date for {ROOM_CONFIG.rooms.find((r) => r.number === selectingRoom)?.name}
          </p>
        </div>
          )}

          {/* Grid - transposed structure */}
          <div 
        ref={scrollContainerRef} 
        className="overflow-x-auto overflow-y-auto"
        style={maxHeight ? { maxHeight } : undefined}
        onMouseLeave={handleGridMouseLeave}
      >
        <div
          className="grid border-t border-gray-200"
          style={{
            width: gridWidth,
            gridTemplateColumns: `${MIN_DAY_ROW_WIDTH}px repeat(${ROOM_CONFIG.rooms.length}, ${ROOM_COLUMN_WIDTH}px) ${REVENUE_COLUMN_WIDTH}px`,
            gridTemplateRows: `56px repeat(${days.length + 1}, 56px)`,
          }}
        >
          {/* Top-left corner */}
          <div className="sticky left-0 top-0 z-20 flex h-14 items-center justify-center border-b border-r border-gray-200 bg-gray-50">
            <span className="text-sm font-medium text-foreground">DAY</span>
          </div>

          {/* Room headers */}
          {ROOM_CONFIG.rooms.map((room, roomIndex) => (
            <div
              key={room.number}
              className="sticky top-0 z-10 flex h-14 flex-col justify-center border-b border-r border-gray-200 bg-gray-50 px-3"
            >
              <span className="text-sm font-medium text-foreground">
                {room.name}
              </span>
              <span className="text-xs text-gray-500">
                ₦{room.rate.toLocaleString()}/night
              </span>
            </div>
          ))}
          
          {/* Revenue header */}
          <div className="sticky top-0 z-10 flex h-14 flex-col justify-center border-b border-r border-gray-200 bg-gray-50 px-3">
            <span className="text-sm font-medium text-foreground">
              Revenue
            </span>
            <span className="text-xs text-gray-500">
              Daily
            </span>
          </div>

          {/* Day rows */}
          {days.map((d, dayIndex) => {
            const dateStr = format(d, "yyyy-MM-dd");
            const isLastRow = dayIndex === days.length - 1;
            const isAnchorDay =
              viewMode === "all" &&
              anchorDateForAll &&
              d.getTime() === anchorDateForAll.getTime();

            return (
              <Fragment key={dateStr}>
                {/* Day label */}
                <div
                  className={cn(
                    "sticky left-0 z-10 flex h-14 items-center justify-center border-b border-r border-gray-200 bg-white px-2",
                    isLastRow && "border-b-0"
                  )}
                  ref={isAnchorDay ? weekAnchorRef : undefined}
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
                  const bookingPos = getBookingPosition(room.number, dateStr);
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
                  const isHovered = hoveredCell?.room === room.number && hoveredCell?.date === dateStr;
                  // Show "check-in" cue when hovering before any selection
                  const showCheckInCue = isHovered && !checkIn && status === "available";
                  // Show "check-out" cue when hovering after check-in is selected (same room, date after check-in)
                  const showCheckOutCue = isHovered && !!checkIn && !checkOut && selectingRoom === room.number && dateStr > checkIn && status === "available";
                  
                  // Determine border classes for multi-night booking connections
                  const bookingBorderClasses = bookingPos.booking
                    ? cn(
                        bookingPos.isCheckIn && "border-l-2 border-l-primary",
                        bookingPos.isMiddle && "border-l-0 border-r-0",
                        bookingPos.isCheckOut && "border-r-2 border-r-primary"
                      )
                    : "";
                  
                  return (
                    <button
                      key={room.number}
                      type="button"
                      onClick={() => handleCellClick(room.number, dateStr)}
                      onMouseEnter={() => handleCellMouseEnter(room.number, dateStr)}
                      onTouchStart={(e) => handleCellTouchStart(e, room.number, dateStr)}
                      onTouchEnd={handleCellTouchEnd}
                      disabled={(status === "blocked" && !isStaff) || status === "past"}
                      className={cn(
                        "relative flex h-14 items-center justify-center border-b border-r border-gray-200 text-sm font-medium transition-colors min-h-touch",
                        isLastRow && "border-b-0",
                        bookingBorderClasses,
                        status === "blocked" &&
                          "cursor-not-allowed bg-orange-200 text-orange-800 border-orange-300",
                        status === "booked" &&
                          "cursor-pointer bg-red-100 hover:bg-red-200 active:bg-red-300",
                        status === "available" &&
                          "bg-green-100 text-green-700 active:bg-green-200",
                        status === "past" &&
                          "bg-white text-gray-300 cursor-default",
                        (status === "selecting" ||
                          status === "selected" ||
                          isInRange) &&
                          "bg-primary/15 text-primary border-primary/40",
                        isCheckIn && "rounded-t-md bg-primary/20",
                        isCheckOut && "rounded-b-md bg-primary/20"
                      )}
                    >
                      {/* Booking code indicator for multi-night bookings */}
                      {status === "booked" && bookingPos.booking && bookingPos.isCheckIn && (
                        <div className="absolute top-0.5 left-0.5 px-1 py-0.5 bg-primary/20 rounded text-[8px] font-mono font-semibold text-primary leading-none z-10">
                          {bookingPos.booking.bookingCode.slice(-4)}
                        </div>
                      )}
                      
                      {/* Payment status indicator for booked cells */}
                      {status === "booked" && bookingPos.booking && (
                        <div className="absolute top-1 right-1 z-10">
                          <div
                            className={cn(
                              "h-2 w-2 rounded-full",
                              bookingPos.booking.paymentStatus === "paid" ? "bg-green-500" : "bg-red-500"
                            )}
                            title={`Payment: ${bookingPos.booking.paymentStatus}`}
                          />
                        </div>
                      )}
                      {(showCheckInCue || showCheckOutCue) && (
                        <span className="text-xs font-medium text-foreground whitespace-nowrap pointer-events-none">
                          {showCheckInCue ? "Check-in" : "Check-out"}
                        </span>
                      )}
                    </button>
                  );
                })}
                
                {/* Revenue cell for this day */}
                <div
                  className={cn(
                    "flex h-14 items-center justify-center border-b border-r border-gray-200 bg-gray-50 px-2",
                    isLastRow && "border-b-0"
                  )}
                >
                  <span className="text-sm font-semibold text-foreground">
                    ₦{getDailyRevenue(dateStr).toLocaleString(undefined, {
                      minimumFractionDigits: 0,
                      maximumFractionDigits: 0,
                    })}
                  </span>
                </div>
              </Fragment>
            );
          })}
          
          {/* Total Revenue Row (sticky at bottom) */}
          <>
            {/* Total label */}
            <div className="sticky left-0 bottom-0 z-20 flex h-14 items-center justify-center border-b border-r border-gray-200 bg-gray-100 px-2">
              <span className="text-sm font-semibold text-foreground">
                TOTAL
              </span>
            </div>
            
            {/* Empty cells for rooms */}
            {ROOM_CONFIG.rooms.map((room) => (
              <div
                key={room.number}
                className="sticky bottom-0 z-10 flex h-14 items-center justify-center border-b border-r border-gray-200 bg-gray-100"
              />
            ))}
            
            {/* Total revenue cell */}
            <div className="sticky bottom-0 z-10 flex h-14 items-center justify-center border-b border-r border-gray-200 bg-gray-100 px-2">
              <span className="text-sm font-bold text-foreground">
                ₦{getTotalRevenue().toLocaleString(undefined, {
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 0,
                })}
              </span>
            </div>
          </>
        </div>
          </div>

          {/* Instructions and week selector */}
          <div 
        className="border-t border-gray-200 px-4 py-3 space-y-3"
      >
        <p className="text-xs text-gray-500">
          Tap a date to set check-in, then tap a later date to set check-out.
        </p>
        <div className="flex flex-wrap gap-2">
          {weeks.map((week) => {
            const label = `${format(week.start, "d")}-${format(week.end, "d")}`;
            const isActive =
              viewMode === "week" &&
              activeWeek &&
              week.key === activeWeek.key;
            const isCurrent = isTodayInWeek(week);
            return (
              <button
                key={week.key}
                type="button"
                onClick={() => {
                  setViewMode("week");
                  setSelectedWeekKey(week.key);
                }}
                className={cn(
                  "px-2.5 py-1 text-xs rounded-full border transition-colors min-h-touch",
                  isActive
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50",
                  isCurrent && "font-semibold"
                )}
              >
                {label}
                {isCurrent && " (This week)"}
              </button>
            );
          })}
          <button
            type="button"
            onClick={() => setViewMode("all")}
            className={cn(
              "px-2.5 py-1 text-xs rounded-full border transition-colors min-h-touch",
              viewMode === "all"
                ? "border-primary bg-primary/10 text-primary"
                : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
            )}
          >
            View all days
          </button>
        </div>
          </div>
        </div>
      </div>

      {/* Booking Details Modal */}
      <Modal
        isOpen={!!selectedBooking}
        onClose={() => setSelectedBooking(null)}
        title="Booking Details"
      >
        {selectedBooking && (
          <div className="p-4 sm:p-6 space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Booking Code</span>
                <span className="text-sm font-mono font-semibold">{selectedBooking.bookingCode}</span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Room</span>
                <span className="text-sm font-medium">Room {selectedBooking.roomNumber}</span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Guest</span>
                <span className="text-sm font-medium">{selectedBooking.guestName}</span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Check-in</span>
                <span className="text-sm font-medium">
                  {format(new Date(selectedBooking.checkIn), "MMM dd, yyyy")}
                </span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Check-out</span>
                <span className="text-sm font-medium">
                  {format(new Date(selectedBooking.checkOut), "MMM dd, yyyy")}
                </span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Nights</span>
                <span className="text-sm font-medium">{selectedBooking.nights} night{selectedBooking.nights !== 1 ? 's' : ''}</span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Rate per night</span>
                <span className="text-sm font-medium">{formatCurrency(selectedBooking.roomRate)}</span>
              </div>
              
              <div className="border-t pt-3 flex items-center justify-between">
                <span className="text-sm font-semibold text-foreground">Total Amount</span>
                <span className="text-sm font-bold text-primary">{formatCurrency(selectedBooking.totalAmount)}</span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Payment Status</span>
                {isStaff ? (
                  <select
                    value={selectedBooking.paymentStatus}
                    onChange={async (e) => {
                      const newStatus = e.target.value as "paid" | "unpaid";
                      try {
                        const { supabaseService } = await import("@/lib/services/supabaseService");
                        const actorUser = useAuthStore.getState().user;
                        const isPaid = newStatus === "paid";
                        const updates = {
                          paymentStatus: newStatus,
                          paymentDate: isPaid ? new Date().toISOString() : null,
                          paymentMethod: isPaid
                            ? selectedBooking.paymentMethod ?? "transfer"
                            : undefined,
                        };

                        await supabaseService.updateBooking(
                          selectedBooking.bookingCode,
                          updates,
                          actorUser
                            ? {
                                id: actorUser.dbId,
                                name: actorUser.name,
                                role: actorUser.role,
                              }
                            : undefined
                        );
                        await useBookingStore.getState().fetchBookings();
                        setSelectedBooking({
                          ...selectedBooking,
                          paymentStatus: newStatus,
                          paymentDate: updates.paymentDate,
                          paymentMethod: updates.paymentMethod,
                        });
                        toast.success(
                          `Payment status updated to ${
                            newStatus.charAt(0).toUpperCase() + newStatus.slice(1)
                          }`
                        );
                      } catch (error: any) {
                        toast.error(
                          error?.message || "Failed to update payment status"
                        );
                      }
                    }}
                    className="rounded-lg border border-gray-300 bg-white pl-3 pr-8 py-1.5 text-sm font-medium text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 min-h-touch appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20fill%3D%22none%22%20viewBox%3D%220%200%2024%2024%22%20stroke%3D%22%236b7280%22%3E%3Cpath%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%20stroke-width%3D%222%22%20d%3D%22M19%209l-7%207-7-7%22%2F%3E%3C%2Fsvg%3E')] bg-[length:1rem] bg-[right_0.5rem_center] bg-no-repeat"
                  >
                    <option value="paid">Paid</option>
                    <option value="unpaid">Unpaid</option>
                  </select>
                ) : (
                  <Badge
                    variant={
                      selectedBooking.paymentStatus === "paid"
                        ? "confirmed"
                        : "cancelled"
                    }
                  >
                    {selectedBooking.paymentStatus
                      .charAt(0)
                      .toUpperCase() + selectedBooking.paymentStatus.slice(1)}
                  </Badge>
                )}
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Payment Method</span>
                {isStaff ? (
                  <select
                    value={selectedBooking.paymentMethod ?? ""}
                    disabled={selectedBooking.paymentStatus !== "paid"}
                    onChange={async (e) => {
                      const newMethod = e.target.value as "card" | "transfer";
                      if (selectedBooking.paymentStatus !== "paid") {
                        toast.error(
                          "Payment method can only be set when status is Paid"
                        );
                        return;
                      }

                      try {
                        const { supabaseService } = await import("@/lib/services/supabaseService");
                        const actorUser = useAuthStore.getState().user;

                        await supabaseService.updateBooking(
                          selectedBooking.bookingCode,
                          { paymentMethod: newMethod },
                          actorUser
                            ? {
                                id: actorUser.dbId,
                                name: actorUser.name,
                                role: actorUser.role,
                              }
                            : undefined
                        );
                        await useBookingStore.getState().fetchBookings();
                        setSelectedBooking({
                          ...selectedBooking,
                          paymentMethod: newMethod,
                        });
                        toast.success("Payment method updated");
                      } catch (error: any) {
                        toast.error(
                          error?.message || "Failed to update payment method"
                        );
                      }
                    }}
                    className="rounded-lg border border-gray-300 bg-white pl-3 pr-8 py-1.5 text-sm font-medium text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 min-h-touch appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20fill%3D%22none%22%20viewBox%3D%220%200%2024%2024%22%20stroke%3D%22%236b7280%22%3E%3Cpath%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%20stroke-width%3D%222%22%20d%3D%22M19%209l-7%207-7-7%22%2F%3E%3C%2Fsvg%3E')] bg-[length:1rem] bg-[right_0.5rem_center] bg-no-repeat"
                  >
                    <option value="">Select method</option>
                    <option value="transfer">Transfer</option>
                    <option value="card">Card</option>
                  </select>
                ) : selectedBooking.paymentStatus === "paid" &&
                  selectedBooking.paymentMethod ? (
                  <span className="text-sm font-medium capitalize">
                    {selectedBooking.paymentMethod}
                  </span>
                ) : (
                  <span className="text-xs text-gray-400">Not set</span>
                )}
              </div>
              
              {selectedBooking.guestPhone && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Phone</span>
                  <span className="text-sm font-medium">{selectedBooking.guestPhone}</span>
                </div>
              )}
              
              {selectedBooking.guestEmail && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Email</span>
                  <span className="text-sm font-medium">{selectedBooking.guestEmail}</span>
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* Blocked Room Details Modal (staff only) */}
      <Modal
        isOpen={!!blockedOverlay}
        onClose={() => setBlockedOverlay(null)}
        title="Blocked Room Details"
      >
        {blockedOverlay && (
          <div className="p-4 sm:p-6 space-y-4">
            <div className="space-y-2">
              <p className="text-sm text-gray-600">
                Room{" "}
                <span className="font-semibold">
                  {blockedOverlay.roomNumber}
                </span>{" "}
                is blocked for{" "}
                <span className="font-semibold">
                  {blockedOverlay.dates.length} night
                  {blockedOverlay.dates.length !== 1 ? "s" : ""}
                </span>
                .
              </p>
              <p className="text-sm text-gray-600">
                Reason:{" "}
                <span className="font-semibold">
                  {blockedOverlay.reason || "Not specified"}
                </span>
              </p>
            </div>

            <div className="space-y-2">
              <p className="text-xs font-semibold text-gray-500">
                Blocked nights
              </p>
              <ul className="max-h-40 overflow-y-auto space-y-1 text-sm text-gray-700">
                {blockedOverlay.dates.map((d) => (
                  <li key={d} className="flex items-center justify-between">
                    <span>{format(new Date(d), "MMM dd, yyyy")}</span>
                    <button
                      type="button"
                      className="text-xs font-medium text-primary hover:text-primary/80 disabled:opacity-50"
                      disabled={isBlockedOverlayLoading}
                      onClick={() =>
                        handleUnblockFromOverlay(
                          blockedOverlay.roomNumber,
                          [d]
                        )
                      }
                    >
                      Unblock this night
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row gap-2">
              <button
                type="button"
                className="inline-flex justify-center rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                onClick={() => setBlockedOverlay(null)}
                disabled={isBlockedOverlayLoading}
              >
                Close
              </button>
              <button
                type="button"
                className="inline-flex justify-center rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90 disabled:opacity-50"
                disabled={isBlockedOverlayLoading}
                onClick={() =>
                  blockedOverlay &&
                  handleUnblockFromOverlay(
                    blockedOverlay.roomNumber,
                    blockedOverlay.dates
                  )
                }
              >
                Unblock all nights
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
