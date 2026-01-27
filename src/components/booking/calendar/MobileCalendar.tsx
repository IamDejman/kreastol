"use client";

import { useState, Fragment, useRef, useEffect } from "react";
import {
  format,
  addMonths,
  subMonths,
  subDays,
  parseISO,
  isBefore,
  isWithinInterval,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
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

const MIN_DAY_ROW_WIDTH = 70; // Width for day label column
const ROOM_COLUMN_WIDTH = 120; // Smaller for mobile

function formatOrdinalDate(date: Date): string {
  const day = date.getDate();
  return `${day}`;
}

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
  const [hoveredCell, setHoveredCell] = useState<{ room: number; date: string } | null>(null);
  const [visibleDaysCount, setVisibleDaysCount] = useState(6);
  const [showPastDates, setShowPastDates] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useCalendarSync();
  const toast = useToast();
  const bookedDates = useBookingStore((s) => s.bookedDates);
  const bookings = useBookingStore((s) => s.bookings);
  const fetchBookings = useBookingStore((s) => s.fetchBookings);
  const isRoomBlocked = useBookingStore((s) => s.isRoomBlocked);
  const unblockRoom = useBookingStore((s) => s.unblockRoom);
  const user = useAuthStore((s) => s.user);
  const isStaff = user && (user.role === "owner" || user.role === "receptionist");

  // Ensure bookings are loaded
  useEffect(() => {
    if (bookings.length === 0) {
      fetchBookings();
    }
  }, [bookings.length, fetchBookings]);

  const start = startOfMonth(base);
  const end = endOfMonth(base);
  const today = format(new Date(), "yyyy-MM-dd");
  const allDays = eachDayOfInterval({ start, end });
  // Filter days based on showPastDates: if false, only show future dates; if true, show all
  const allAvailableDays = showPastDates 
    ? allDays 
    : allDays.filter((d) => format(d, "yyyy-MM-dd") >= today);
  const days = allAvailableDays.slice(0, visibleDaysCount);
  
  const hasMoreDays = visibleDaysCount < allAvailableDays.length;
  const canCollapse = visibleDaysCount > 6;
  const hasPastDates = allDays.some((d) => format(d, "yyyy-MM-dd") < today);

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
    // If staff clicks on a blocked cell, allow unblocking
    if (isRoomBlocked(roomNumber, date) && isStaff) {
      if (confirm(`Unblock Room ${roomNumber} on ${format(new Date(date), "MMM dd, yyyy")}?`)) {
        unblockRoom(roomNumber, [date]).then(() => fetchBookings());
      }
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

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm w-fit">
      {/* Header with month nav */}
      <div 
        className="flex items-center justify-between border-b border-gray-200 py-3 relative"
        style={{ width: gridWidth }}
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
          className="flex items-center gap-3 text-xs text-gray-500 px-3"
          style={{ position: 'absolute', right: 0 }}
        >
          <span className="flex items-center gap-1.5">
            <span className="h-3.5 w-3.5 rounded border border-gray-300 bg-green-100" />
            <span className="hidden sm:inline">Available</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-3.5 w-3.5 rounded border border-red-200 bg-red-50" />
            <span className="hidden sm:inline">Booked</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-3.5 w-3.5 rounded border border-gray-300 bg-primary/15" />
            <span className="hidden sm:inline">Selected</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-3.5 w-3.5 rounded border border-orange-300 bg-orange-200" />
            <span className="hidden sm:inline">Blocked</span>
          </span>
        </div>
      </div>

      {/* Selection status */}
      {checkIn && !checkOut && selectingRoom && (
        <div 
          className="border-b bg-blue-50 px-4 py-2"
          style={{ width: gridWidth }}
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

            return (
              <Fragment key={dateStr}>
                {/* Day label */}
                <div
                  className={cn(
                    "sticky left-0 z-10 flex h-14 items-center justify-center border-b border-r border-gray-200 bg-white px-2",
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
                  
                  // Add visual connector for multi-night bookings
                  const showConnector = bookingPos.booking && (bookingPos.isMiddle || bookingPos.isCheckOut);

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
                      {/* Multi-night booking connector line */}
                      {showConnector && (
                        <div className="absolute left-0 top-1/2 -translate-y-1/2 h-0.5 w-full bg-primary/30 -z-0" />
                      )}
                      
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
                              bookingPos.booking.paymentStatus === "paid" && "bg-green-500",
                              bookingPos.booking.paymentStatus === "credit" && "bg-yellow-500",
                              bookingPos.booking.paymentStatus === "unpaid" && "bg-red-500"
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
          
          {/* Total Revenue Row */}
          <>
            {/* Total label */}
            <div className="sticky left-0 z-10 flex h-14 items-center justify-center border-b border-r border-gray-200 bg-gray-100 px-2">
              <span className="text-sm font-semibold text-foreground">
                TOTAL
              </span>
            </div>
            
            {/* Empty cells for rooms */}
            {ROOM_CONFIG.rooms.map((room) => (
              <div
                key={room.number}
                className="flex h-14 items-center justify-center border-b border-r border-gray-200 bg-gray-100"
              />
            ))}
            
            {/* Total revenue cell */}
            <div className="flex h-14 items-center justify-center border-b border-r border-gray-200 bg-gray-100 px-2">
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

      {/* Instructions and expand/collapse */}
      <div 
        className="border-t border-gray-200 px-4 py-3 space-y-2"
        style={{ width: gridWidth }}
      >
        <p className="text-xs text-gray-500">
          Tap a date to set check-in, then tap a later date to set check-out.
        </p>
        <div className="flex gap-2 flex-wrap">
          {hasPastDates && !showPastDates && (
            <button
              type="button"
              onClick={() => {
                setShowPastDates(true);
                setVisibleDaysCount(allDays.length);
              }}
              className="text-xs font-medium text-primary hover:text-primary/80 transition-colors min-h-touch min-w-touch"
            >
              Show past dates
            </button>
          )}
          {hasMoreDays && (
            <button
              type="button"
              onClick={() => setVisibleDaysCount(allAvailableDays.length)}
              className="text-xs font-medium text-primary hover:text-primary/80 transition-colors min-h-touch min-w-touch"
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
              className="text-xs font-medium text-gray-600 hover:text-gray-800 transition-colors min-h-touch min-w-touch"
            >
              Collapse
            </button>
          )}
          {showPastDates && (
            <button
              type="button"
              onClick={() => {
                setShowPastDates(false);
                const futureDays = allDays.filter((d) => format(d, "yyyy-MM-dd") >= today);
                setVisibleDaysCount(Math.min(6, futureDays.length));
              }}
              className="text-xs font-medium text-gray-600 hover:text-gray-800 transition-colors min-h-touch min-w-touch"
            >
              Hide past dates
            </button>
          )}
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
                      const newStatus = e.target.value as "paid" | "credit" | "unpaid";
                      try {
                        const { storageService } = await import("@/lib/services/storageService");
                        await storageService.updateBooking(selectedBooking.bookingCode, {
                          paymentStatus: newStatus,
                          paymentDate: newStatus === "paid" || newStatus === "credit" ? new Date().toISOString() : null,
                        });
                        await fetchBookings();
                        // Update local state
                        setSelectedBooking({ ...selectedBooking, paymentStatus: newStatus });
                        toast.success(`Payment status updated to ${newStatus.charAt(0).toUpperCase() + newStatus.slice(1)}`);
                      } catch (error: any) {
                        toast.error(error.message || "Failed to update payment status");
                      }
                    }}
                    className="rounded-lg border border-gray-300 bg-white pl-3 pr-8 py-1.5 text-sm font-medium text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 min-h-touch appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20fill%3D%22none%22%20viewBox%3D%220%200%2024%2024%22%20stroke%3D%22%236b7280%22%3E%3Cpath%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%20stroke-width%3D%222%22%20d%3D%22M19%209l-7%207-7-7%22%2F%3E%3C%2Fsvg%3E')] bg-[length:1rem] bg-[right_0.5rem_center] bg-no-repeat"
                  >
                    <option value="paid">Paid</option>
                    <option value="credit">Credit</option>
                    <option value="unpaid">Unpaid</option>
                  </select>
                ) : (
                  <Badge
                    variant={
                      selectedBooking.paymentStatus === "paid"
                        ? "confirmed"
                        : selectedBooking.paymentStatus === "credit"
                          ? "pending"
                          : "cancelled"
                    }
                  >
                    {selectedBooking.paymentStatus.charAt(0).toUpperCase() + selectedBooking.paymentStatus.slice(1)}
                  </Badge>
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
    </div>
  );
}
