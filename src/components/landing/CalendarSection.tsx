"use client";

import { useState } from "react";
import { format, parseISO } from "date-fns";
import { useRouter, useSearchParams } from "next/navigation";
import { useIsMobile, useIsTablet } from "@/hooks/useMediaQuery";
import { useBookings } from "@/hooks/useBookings";
import { MobileCalendar } from "@/components/booking/calendar/MobileCalendar";
import { DesktopCalendar } from "@/components/booking/calendar/DesktopCalendar";
import { Spinner } from "@/components/ui/Spinner";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { BookingSummary } from "@/components/booking/BookingSummary";
import type { DateSelection } from "@/types";

interface CalendarSectionProps {
  /** Base path for booking flow (e.g. "" for customer, "/staff" for staff). "Complete booking" goes to ${bookingBasePath}/book */
  bookingBasePath?: string;
}

export function CalendarSection({ bookingBasePath = "" }: CalendarSectionProps) {
  const isMobile = useIsMobile();
  const isTablet = useIsTablet();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isLoading, hasLoadedBookings } = useBookings();
  const [selectionForModal, setSelectionForModal] = useState<DateSelection | null>(null);
  const isSelectionModalOpen = selectionForModal !== null;

  const focusDate = searchParams.get("focusDate") || undefined;

  const handleDateSelect = (selection: DateSelection) => {
    setSelectionForModal(selection);
  };

  const closeSelectionModal = () => {
    setSelectionForModal(null);
  };

  const handleCompleteBooking = () => {
    if (!selectionForModal) return;
    const params = new URLSearchParams({
      room: String(selectionForModal.roomNumber),
      checkIn: selectionForModal.checkIn,
      checkOut: selectionForModal.checkOut,
    });
    closeSelectionModal();
    router.push(`${bookingBasePath}/book?${params.toString()}`);
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

      <Modal
        isOpen={isSelectionModalOpen}
        onClose={closeSelectionModal}
        title="Your selection"
      >
        {selectionForModal && (
          <div className="p-4 sm:p-6 space-y-6">
            <p className="text-sm font-medium text-foreground">
              Check-in: {format(parseISO(selectionForModal.checkIn), "MMM dd, yyyy")} — Check-out: {format(parseISO(selectionForModal.checkOut), "MMM dd, yyyy")}
            </p>
            <BookingSummary selection={selectionForModal} />
            <div className="flex flex-col-reverse sm:flex-row gap-3 sm:justify-end">
              <Button variant="secondary" onClick={closeSelectionModal}>
                Change dates
              </Button>
              <Button onClick={handleCompleteBooking} fullWidth>
                Complete booking
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </section>
  );
}
