"use client";

import { useEffect } from "react";
import { useBookingStore } from "@/store/bookingStore";

export function useBookings() {
  const fetchBookings = useBookingStore((s) => s.fetchBookings);
  const bookings = useBookingStore((s) => s.bookings);
  const bookedDates = useBookingStore((s) => s.bookedDates);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  return { bookings, bookedDates, refresh: fetchBookings };
}
