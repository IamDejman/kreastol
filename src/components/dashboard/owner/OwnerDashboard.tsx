"use client";

import { useBookings } from "@/hooks/useBookings";
import { SummaryCards } from "./SummaryCards";

export function OwnerDashboard() {
  const { bookings } = useBookings();

  return (
    <div className="space-y-8">
      <h1 className="font-heading text-2xl font-semibold text-primary">
        Overview
      </h1>
      <SummaryCards bookings={bookings} />
    </div>
  );
}
