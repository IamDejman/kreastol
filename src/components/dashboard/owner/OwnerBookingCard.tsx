"use client";

import Link from "next/link";
import type { Booking } from "@/types";
import { format } from "date-fns";
import { formatCurrency } from "@/lib/utils/formatters";

interface OwnerBookingCardProps {
  booking: Booking;
}

export function OwnerBookingCard({ booking }: OwnerBookingCardProps) {
  return (
    <Link
      href={`/booking/${booking.bookingCode}?from=owner`}
      className="card block transition-shadow hover:shadow-lg"
    >
      <div>
        <p className="font-medium text-foreground">{booking.bookingCode}</p>
        <p className="text-sm text-gray-600">
          Room {booking.roomNumber} · {booking.guestName}
        </p>
        <p className="mt-1 text-sm text-gray-500">
          {format(new Date(booking.checkIn), "MMM dd, yyyy")} –{" "}
          {format(new Date(booking.checkOut), "MMM dd, yyyy")}
        </p>
      </div>
      <p className="mt-2 text-sm font-medium text-primary">
        {formatCurrency(booking.totalAmount)}
      </p>
    </Link>
  );
}
