"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { format, parseISO } from "date-fns";
import { ROOM_CONFIG } from "@/lib/constants/config";
import { useBookingStore } from "@/store/bookingStore";
import { useIsMobile } from "@/hooks/useMediaQuery";
import { RoomCard } from "@/components/booking/RoomCard";
import { CustomerCalendar, type CalendarMode } from "@/components/booking/CustomerCalendar";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Drawer } from "@/components/ui/Drawer";
import { Spinner } from "@/components/ui/Spinner";

type Step = 1 | 2;

export function CustomerBookingWidget() {
  const router = useRouter();
  const isMobile = useIsMobile();
  const fetchBookings = useBookingStore((s) => s.fetchBookings);
  const { isLoading, hasLoadedBookings } = useBookingStore((s) => ({
    isLoading: s.isLoading,
    hasLoadedBookings: s.hasLoadedBookings,
  }));

  const [step, setStep] = useState<Step>(1);
  const [selectedRoom, setSelectedRoom] = useState<number | null>(null);
  const [checkIn, setCheckIn] = useState<string | null>(null);
  const [checkOut, setCheckOut] = useState<string | null>(null);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [calendarMode, setCalendarMode] = useState<CalendarMode>("check-in");

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  function openCheckInCalendar() {
    setCalendarMode("check-in");
    setCalendarOpen(true);
  }

  function openCheckOutCalendar() {
    if (!checkIn) return;
    setCalendarMode("check-out");
    setCalendarOpen(true);
  }

  function handleSelectCheckIn(date: string) {
    setCheckIn(date);
    setCheckOut(null);
  }

  function handleSelectCheckOut(date: string) {
    setCheckOut(date);
  }

  function handleContinueToBook() {
    if (!selectedRoom || !checkIn || !checkOut) return;
    const params = new URLSearchParams({
      room: String(selectedRoom),
      checkIn,
      checkOut,
    });
    router.push(`/book?${params.toString()}`);
  }

  const calendarContent = (
    <CustomerCalendar
      roomNumber={selectedRoom!}
      mode={calendarMode}
      checkIn={checkIn}
      checkOut={checkOut}
      onSelectCheckIn={handleSelectCheckIn}
      onSelectCheckOut={handleSelectCheckOut}
      onClose={() => setCalendarOpen(false)}
    />
  );

  if (!hasLoadedBookings || isLoading) {
    return (
      <section id="book" className="bg-white px-4 pt-16 pb-12 md:pt-20 md:pb-16">
        <div className="mx-auto max-w-5xl">
          <div className="flex items-center gap-3 rounded-2xl border border-dashed border-gray-200 bg-gray-50 px-4 py-6 text-sm text-gray-600">
            <Spinner size="sm" />
            <span>Loading availability…</span>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="book" className="bg-white px-4 pt-16 pb-12 md:pt-20 md:pb-16">
      <div className="mx-auto max-w-5xl">
        <h2 className="font-heading text-2xl font-semibold text-primary md:text-3xl">
          Book your stay
        </h2>
        <p className="mt-2 text-gray-600">
          {step === 1
            ? "Choose a room, then select your dates."
            : "Select your check-in and check-out dates."}
        </p>

        {step === 1 && (
          <div className="mt-8">
            <p className="mb-4 text-sm font-medium text-foreground">Step 1: Select a room</p>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {ROOM_CONFIG.rooms.map((room) => (
                <RoomCard
                  key={room.number}
                  room={room}
                  selected={selectedRoom === room.number}
                  onSelect={() => setSelectedRoom(room.number)}
                />
              ))}
            </div>
            {selectedRoom !== null && (
              <div className="mt-6">
                <Button onClick={() => setStep(2)} fullWidth>
                  Continue
                </Button>
              </div>
            )}
          </div>
        )}

        {step === 2 && selectedRoom !== null && (
          <div className="mt-8">
            <p className="mb-4 text-sm font-medium text-foreground">Step 2: Select dates</p>
            <div className="space-y-4">
              <button
                type="button"
                onClick={openCheckInCalendar}
                className="flex min-h-touch w-full items-center justify-between rounded-lg border border-gray-200 bg-white px-4 py-3 text-left transition-colors hover:border-primary hover:bg-gray-50"
              >
                <span className="text-sm text-gray-600">Check-in date</span>
                <span className="font-medium text-foreground">
                  {checkIn ? format(parseISO(checkIn), "MMM dd, yyyy") : "Select"}
                </span>
              </button>
              <button
                type="button"
                onClick={openCheckOutCalendar}
                disabled={!checkIn}
                className="flex min-h-touch w-full items-center justify-between rounded-lg border border-gray-200 bg-white px-4 py-3 text-left transition-colors hover:border-primary hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <span className="text-sm text-gray-600">Check-out date</span>
                <span className="font-medium text-foreground">
                  {checkOut ? format(parseISO(checkOut), "MMM dd, yyyy") : "Select"}
                </span>
              </button>
            </div>
            {checkIn && checkOut && (
              <div className="mt-6 flex flex-col gap-3">
                <Button onClick={handleContinueToBook} fullWidth>
                  Continue to booking details
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => {
                    setCheckIn(null);
                    setCheckOut(null);
                    setStep(1);
                    setSelectedRoom(null);
                  }}
                >
                  Change room
                </Button>
              </div>
            )}
          </div>
        )}

        {calendarOpen && selectedRoom !== null && (
          <>
            {isMobile ? (
              <Drawer
                isOpen={calendarOpen}
                onClose={() => setCalendarOpen(false)}
                title={calendarMode === "check-in" ? "Select check-in date" : "Select check-out date"}
              >
                {calendarContent}
              </Drawer>
            ) : (
              <Modal
                isOpen={calendarOpen}
                onClose={() => setCalendarOpen(false)}
                title={calendarMode === "check-in" ? "Select check-in date" : "Select check-out date"}
              >
                {calendarContent}
              </Modal>
            )}
          </>
        )}
      </div>
    </section>
  );
}
