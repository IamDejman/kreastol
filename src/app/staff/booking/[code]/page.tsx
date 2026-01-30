"use client";

import { Suspense } from "react";
import { BookingStatusPageContent } from "@/components/booking/BookingStatusPageContent";

export default function StaffBookingStatusPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-4">
          <p className="text-gray-600">Loading…</p>
        </div>
      }
    >
      <BookingStatusPageContent basePath="/staff" />
    </Suspense>
  );
}
