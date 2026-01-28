"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useIsMobile, useIsTablet } from "@/hooks/useMediaQuery";
import { useBookings } from "@/hooks/useBookings";
import { MobileCalendar } from "@/components/booking/calendar/MobileCalendar";
import { DesktopCalendar } from "@/components/booking/calendar/DesktopCalendar";
import { Spinner } from "@/components/ui/Spinner";

export function CalendarSection() {
  const isMobile = useIsMobile();
  const isTablet = useIsTablet();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isLoading, hasLoadedBookings } = useBookings();

  const focusDate = searchParams.get("focusDate") || undefined;

  const handleDateSelect = (selection: {
    roomNumber: number;
    checkIn: string;
    checkOut: string;
  }) => {
    const params = new URLSearchParams({
      room: String(selection.roomNumber),
      checkIn: selection.checkIn,
      checkOut: selection.checkOut,
    });
    router.push(`/book?${params.toString()}`);
  };

  const calendarContent = !hasLoadedBookings || isLoading ? (
    <div className="flex items-center gap-3 rounded-2xl border border-dashed border-gray-200 bg-gray-50 px-4 py-6 text-sm text-gray-600">
      <Spinner size="sm" />
      <span>Loading availability…</span>
    </div>
  ) : isMobile || isTablet ? (
    <MobileCalendar
      onDateSelect={handleDateSelect}
      maxHeight="70vh"
      initialFocusDate={focusDate}
    />
  ) : (
    <DesktopCalendar
      onDateSelect={handleDateSelect}
      maxHeight="60vh"
      initialFocusDate={focusDate}
    />
  );

  return (
    <section id="book" className="bg-white px-4 pt-16 pb-12 md:pt-20 md:pb-16">
      <div className="mx-auto max-w-5xl">
        <h2 className="font-heading text-2xl font-semibold text-primary md:text-3xl">
          Check availability
        </h2>
        <p className="mt-2 text-gray-600">
          Select your dates and room to book.
        </p>
        <div className="mt-8">{calendarContent}</div>
      </div>
    </section>
  );
}
