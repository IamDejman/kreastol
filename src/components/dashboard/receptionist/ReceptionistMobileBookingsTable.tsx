"use client";

import type { Booking } from "@/types";
import { BookingCard } from "./BookingCard";

interface ReceptionistMobileBookingsTableProps {
  bookings: Booking[];
  onRefresh?: () => Promise<void>;
}

export function ReceptionistMobileBookingsTable({ bookings, onRefresh }: ReceptionistMobileBookingsTableProps) {
  if (bookings.length === 0) {
    return (
      <div className="rounded-xl border bg-gray-50 p-8 text-center text-gray-500">
        No bookings match your filters.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {bookings.map((b) => (
        <BookingCard key={b.bookingCode} booking={b} onRefresh={onRefresh} />
      ))}
    </div>
  );
}
