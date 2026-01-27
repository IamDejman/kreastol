"use client";

import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { ROOM_CONFIG } from "@/lib/constants/config";
import { BackButton } from "@/components/layout/BackButton";
import { BookingSummary } from "@/components/booking/BookingSummary";
import { BookingForm } from "@/components/booking/BookingForm";
import { useBookingStore } from "@/store/bookingStore";
import { useToast } from "@/components/ui/Toast";
import type { BookingFormValues } from "@/lib/utils/validation";
import type { DateSelection } from "@/types";

function isValidDate(s: string) {
  const d = new Date(s);
  return !isNaN(d.getTime()) && s.match(/^\d{4}-\d{2}-\d{2}$/);
}

function parseSelection(
  room: string | null,
  checkIn: string | null,
  checkOut: string | null
): DateSelection | null {
  if (!room || !checkIn || !checkOut) return null;
  const r = parseInt(room, 10);
  if (![1, 2, 3, 4].includes(r)) return null;
  if (!isValidDate(checkIn) || !isValidDate(checkOut)) return null;
  if (checkOut <= checkIn) return null;
  const exists = ROOM_CONFIG.rooms.some((x) => x.number === r);
  if (!exists) return null;
  return { roomNumber: r, checkIn, checkOut };
}

function BookPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [selection, setSelection] = useState<DateSelection | null>(null);
  const [checked, setChecked] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const createBooking = useBookingStore((s) => s.createBooking);
  const toast = useToast();

  useEffect(() => {
    const room = searchParams.get("room");
    const checkIn = searchParams.get("checkIn");
    const checkOut = searchParams.get("checkOut");
    const s = parseSelection(room, checkIn, checkOut);
    setSelection(s);
    setChecked(true);
    if (!s) router.replace("/");
  }, [searchParams, router]);

  const handleSubmit = async (data: BookingFormValues) => {
    if (!selection) return;
    setIsSubmitting(true);
    try {
      const booking = await createBooking(selection, data);
      toast.success("Booking confirmed successfully!");
      router.push(`/booking/${booking.bookingCode}`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Booking failed.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!checked || !selection) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <p className="text-gray-600">Loading…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-lg px-4 py-8">
        <BackButton href="/" className="mb-6" />
        <h1 className="font-heading text-2xl font-semibold text-primary">
          Complete your booking
        </h1>
        <p className="mt-2 text-gray-600">Enter your details to confirm.</p>
        <div className="mt-8 space-y-6">
          <BookingSummary selection={selection} />
          <BookingForm
            selection={selection}
            onSubmit={handleSubmit}
            isLoading={isSubmitting}
          />
        </div>
      </div>
    </div>
  );
}

export default function BookPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-gray-50">
          <p className="text-gray-600">Loading…</p>
        </div>
      }
    >
      <BookPageContent />
    </Suspense>
  );
}
