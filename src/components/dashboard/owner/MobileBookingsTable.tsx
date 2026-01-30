"use client";

import type { Booking } from "@/types";
import { OwnerBookingCard } from "./OwnerBookingCard";

interface MobileBookingsTableProps {
  bookings: Booking[];
  onRefresh?: () => Promise<void>;
}

export function MobileBookingsTable({ bookings, onRefresh }: MobileBookingsTableProps) {
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
        <OwnerBookingCard key={b.bookingCode} booking={b} onRefresh={onRefresh} />
      ))}
    </div>
  );
}
