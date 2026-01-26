"use client";

import { useRouter } from "next/navigation";
import { useIsMobile } from "@/hooks/useMediaQuery";
import { MobileCalendar } from "@/components/booking/calendar/MobileCalendar";
import { DesktopCalendar } from "@/components/booking/calendar/DesktopCalendar";

export function CalendarSection() {
  const isMobile = useIsMobile();
  const router = useRouter();

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

  return (
    <section id="book" className="bg-white px-4 pt-16 pb-12 md:pt-20 md:pb-16">
      <div className="mx-auto max-w-5xl">
        <h2 className="font-heading text-2xl font-semibold text-primary md:text-3xl">
          Check availability
        </h2>
        <p className="mt-2 text-gray-600">
          Select your dates and room to book.
        </p>
        <div className="mt-8">
          {isMobile ? (
            <MobileCalendar onDateSelect={handleDateSelect} />
          ) : (
            <DesktopCalendar onDateSelect={handleDateSelect} />
          )}
        </div>
      </div>
    </section>
  );
}
