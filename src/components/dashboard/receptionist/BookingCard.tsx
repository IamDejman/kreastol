"use client";

import Link from "next/link";
import type { Booking } from "@/types";
import { format } from "date-fns";
import { Badge } from "@/components/ui/Badge";
import { formatCurrency } from "@/lib/utils/formatters";

interface BookingCardProps {
  booking: Booking;
}

export function BookingCard({ booking }: BookingCardProps) {
  return (
    <Link
      href={`/booking/${booking.bookingCode}?from=receptionist`}
      className="card block transition-shadow hover:shadow-lg"
    >
      <div className="flex items-start justify-between">
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
        <Badge
          variant={
            booking.paymentStatus === "paid"
              ? "confirmed"
              : booking.paymentStatus === "credit"
                ? "pending"
                : "cancelled"
          }
        >
          {booking.paymentStatus.charAt(0).toUpperCase() + booking.paymentStatus.slice(1)}
        </Badge>
      </div>
      <p className="mt-2 text-sm font-medium text-primary">
        {formatCurrency(booking.totalAmount)}
      </p>
    </Link>
  );
}
