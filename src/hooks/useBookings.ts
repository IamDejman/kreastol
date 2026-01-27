"use client";

import { useEffect } from "react";
import { useBookingStore } from "@/store/bookingStore";

export function useBookings() {
  const fetchBookings = useBookingStore((s) => s.fetchBookings);
  const isLoading = useBookingStore((s) => s.isLoading);
  const hasLoadedBookings = useBookingStore((s) => s.hasLoadedBookings);
  const bookings = useBookingStore((s) => s.bookings);
  const bookedDates = useBookingStore((s) => s.bookedDates);

  useEffect(() => {
    if (!hasLoadedBookings && !isLoading) {
      fetchBookings();
    }
  }, [fetchBookings, hasLoadedBookings, isLoading]);

  return { bookings, bookedDates, isLoading, hasLoadedBookings, refresh: fetchBookings };
}
